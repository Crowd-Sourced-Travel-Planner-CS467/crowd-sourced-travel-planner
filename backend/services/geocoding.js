// Citation
// The code for handling geocoding the address into latitude and longitude coordinates was generated with the help of ChatGPT. 
// These transcripts: https://chatgpt.com/share/6aee540f-e514-83e9-99ca-a8070a4385d7 and https://chatgpt.com/share/6aee54a5-a088-83ea-a22e-1c43db12f8cd
// document the GenAI interaction that led to code in geocoding.js, experiences.js, ExperienceForm.jsx, and experiences.test.js

// Citation
// The code for validating addresses was generated with the help of ChatGPT.
// These transcripts https://chatgpt.com/share/6aff5c7d-c8a8-83ea-acc0-43c74591c29a and https://chatgpt.com/share/6aff3e47-c2c8-83ea-917d-1db944c50533
// document the GenAI interaction that led to code in geocoding.js and geocoding.test.js.

// OpenStreetMap Nominatim Search API endpoint.
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

// Identify our application when making requests to Nominatim.
const USER_AGENT = "CrowdSourcedTravelPlanner/1.0";

// Track the next time a Nominatim request can begin.
let nextRequestTime = 0;

// Queue requests to prevent simultaneous requests from exceeding
// Nominatim's one-request-per-second limit.
let requestQueue = Promise.resolve();

// Address types that represent a street address or geographic locality.
const ACCEPTED_ADDRESS_TYPES = new Set([
    "house",
    "building",
    "road",
    "street",
    "residential",
    "pedestrian",
    "living_street",
    "square",
    "city",
    "town",
    "village",
    "hamlet",
    "suburb",
    "neighbourhood",
    "locality",
    "municipality",
    "district",
    "county",
    "state",
    "province",
    "region",
    "country",
    "island",
]);

// Named landmarks and attractions that can be accepted.
const ACCEPTED_LANDMARK_TYPES = {
    tourism: new Set([
        "attraction",
        "museum",
        "gallery",
        "viewpoint",
        "zoo",
        "aquarium",
        "theme_park",
    ]),
    historic: new Set([
        "monument",
        "memorial",
        "castle",
        "archaeological_site",
        "ruins",
        "fort",
        "battlefield",
    ]),
    leisure: new Set([
        "park",
        "garden",
        "nature_reserve",
        "stadium",
    ]),
    natural: new Set([
        "beach",
        "peak",
        "cave",
        "waterfall",
        "volcano",
        "glacier",
    ]),
    amenity: new Set([
        "place_of_worship",
        "university",
        "college",
        "library",
        "theatre",
        "arts_centre",
        "townhall",
        "courthouse",
    ]),
    man_made: new Set([
        "lighthouse",
        "tower",
        "bridge",
        "windmill",
        "obelisk",
    ]),
};

// Features that should not qualify as street-address matches.
const REJECTED_ADDRESS_FEATURES = {
    amenity: new Set([
        "bench",
        "bicycle_parking",
    ]),
    highway: new Set([
        "bus_stop",
    ]),
};

// Check whether the input contains at least one Unicode letter.
// This rejects numeric-only input without excluding international addresses.
const isValidAddressInput = (address) =>
    typeof address === "string" &&
    /\p{L}/u.test(address);

const normalizeStreetName = (street) => {
    const directionals = {
        n: "north",
        s: "south",
        e: "east",
        w: "west",
        ne: "northeast",
        nw: "northwest",
        se: "southeast",
        sw: "southwest",
    };

    return street
        .toLowerCase()
        .replace(/[.,]/g, " ")
        .trim()
        .split(/\s+/)
        .map((word) => directionals[word] || word)
        .join(" ");
};

// Check whether a Nominatim result matches the requested street address.
const matchesStreetAddress = (result, address) => {
    if (
        !result.address ||
        typeof result.address !== "object" ||
        typeof address !== "string"
    ) {
        return false;
    }

    const inputMatch = address.match(
        /^\s*(\d+[a-zA-Z]?)\s+(.+?)(?:,\s*|$)/
    );

    if (!inputMatch) {
        return false;
    }

    const requestedHouseNumber = inputMatch[1].toLowerCase();
    const requestedStreet = normalizeStreetName(inputMatch[2]);

    const returnedHouseNumber =
        result.address.house_number?.toLowerCase();

    const returnedStreet = result.address.road
        ? normalizeStreetName(result.address.road)
        : "";

    return (
        requestedHouseNumber === returnedHouseNumber &&
        requestedStreet === returnedStreet
    );
};

// Check whether a Nominatim result represents an accepted location.
const isAcceptableLocation = (result, address) => {
    if (!result || typeof result !== "object") {
        return false;
    }

    // Accept street addresses and geographic localities.
    if (ACCEPTED_ADDRESS_TYPES.has(result.addresstype)) {
        return true;
    }

    // Landmarks and attractions must have a name.
    if (!result.name || typeof result.name !== "string") {
        return false;
    }

    // Check whether the result is a recognized landmark type.
    const acceptedTypes = ACCEPTED_LANDMARK_TYPES[result.category];

    if (acceptedTypes?.has(result.type)) {
        return true;
    }

    // Reject unrelated features even when their address components match.
    const rejectedTypes = REJECTED_ADDRESS_FEATURES[result.category];

    if (rejectedTypes?.has(result.type)) {
        return false;
    }

    // Accept other named features only when their street address matches.
    return matchesStreetAddress(result, address);
};

// Wait for a specified number of milliseconds.
const delay = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds));

// Convert an address into geographic coordinates.
const geocodeAddress = (address) => {
    // Reject empty or numeric-only input without making an API request.
    if (!isValidAddressInput(address)) {
        return Promise.resolve({
            latitude: null,
            longitude: null,
        });
    }

    const request = requestQueue.then(async () => {
        // Wait until at least one second has passed since the last request started.
        const waitTime = Math.max(0, nextRequestTime - Date.now());

        if (waitTime > 0) {
            await delay(waitTime);
        }

        // Reserve the next one-second request interval.
        nextRequestTime = Date.now() + 1000;

        // Build the Nominatim search URL.
        const url = new URL(NOMINATIM_URL);
        url.searchParams.set("q", address);
        url.searchParams.set("format", "jsonv2");
        url.searchParams.set("addressdetails", "1");
        url.searchParams.set("limit", "5");

        let response;

        try {
            // Send the address to Nominatim for geocoding.
            response = await fetch(url, {
                method: "GET",
                headers: {
                    "User-Agent": USER_AGENT,
                    "Accept": "application/json",
                },
                signal: AbortSignal.timeout(10000),
            });
        } catch (error) {
            // Network errors and request timeouts.
            throw new Error("GEOCODING_REQUEST_FAILED");
        }

        // Treat rate limits and other unsuccessful HTTP responses
        // as service errors, not invalid addresses.
        if (!response.ok) {
            throw new Error("GEOCODING_REQUEST_FAILED");
        }

        let results;

        try {
            results = await response.json();
        } catch (error) {
            // An unreadable response is a service error.
            throw new Error("GEOCODING_REQUEST_FAILED");
        }

        // Treat an unexpected response format as a service error.
        if (!Array.isArray(results)) {
            throw new Error("GEOCODING_REQUEST_FAILED");
        }

        // No matching results were found.
        if (results.length === 0) {
            return {
                latitude: null,
                longitude: null,
            };
        }

        // Find the first result that represents an accepted location
        // and contains valid geographic coordinates.
        const matchingResult = results.find((result) => {
            if (!isAcceptableLocation(result, address)) {
                return false;
            }

            return (
                Number.isFinite(Number(result.lat)) &&
                Number.isFinite(Number(result.lon))
            );
        });

        // No acceptable location was found.
        if (!matchingResult) {
            return {
                latitude: null,
                longitude: null,
            };
        }

        return {
            latitude: Number(matchingResult.lat),
            longitude: Number(matchingResult.lon),
        };
    });

    // Allow subsequent requests to continue even if this request fails.
    requestQueue = request.catch(() => {});

    return request;
};

module.exports = {
    geocodeAddress,
    isAcceptableLocation,
    isValidAddressInput,
    matchesStreetAddress,
};
