// Citation
// The code for handling geocoding the address into latitude and longitude coordinates was generated with the help of ChatGPT. 
// These transcripts: https://chatgpt.com/share/6aee540f-e514-83e9-99ca-a8070a4385d7 and https://chatgpt.com/share/6aee54a5-a088-83ea-a22e-1c43db12f8cd
// document the GenAI interaction that led to code in geocoding.js, experiences.js, ExperienceForm.jsx, and experiences.test.js


// OpenStreetMap Nominatim Search API endpoint.
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

// Identify our application when making requests to Nominatim.
const USER_AGENT = "CrowdSourcedTravelPlanner/1.0";

// Track the next time a Nominatim request can begin.
let nextRequestTime = 0;

// Queue requests to prevent simultaneous requests from exceeding
// Nominatim's one-request-per-second limit.
let requestQueue = Promise.resolve();

// Wait for a specified number of milliseconds.
const delay = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds));

// Convert an address into geographic coordinates.
const geocodeAddress = (address) => {
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
        url.searchParams.set("limit", "1");

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

        // No matching location was found.
        if (!Array.isArray(results) || results.length === 0) {
            return {
                latitude: null,
                longitude: null,
            };
        }

        // Use the first result returned by Nominatim.
        // The result may be an approximate street or city location.
        const latitude = Number(results[0].lat);
        const longitude = Number(results[0].lon);

        // Return null coordinates if the response contains invalid values.
        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude)
        ) {
            return {
                latitude: null,
                longitude: null,
            };
        }

        return { latitude, longitude };
    });

    // Allow subsequent requests to continue even if this request fails.
    requestQueue = request.catch(() => {});

    return request;
};

module.exports = { geocodeAddress };
