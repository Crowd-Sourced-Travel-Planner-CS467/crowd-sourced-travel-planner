// Citation
// The code for handling geocoding the address into latitude and longitude coordinates was generated with the help of ChatGPT. 
// These transcripts: https://chatgpt.com/share/6aee540f-e514-83e9-99ca-a8070a4385d7 and https://chatgpt.com/share/6aee54a5-a088-83ea-a22e-1c43db12f8cd
// document the GenAI interaction that led to code in geocoding.js, experiences.js, ExperienceForm.jsx, and experiences.test.js

// Citation
// The code for validating addresses was generated with the help of ChatGPT.
// These transcripts https://chatgpt.com/share/6aff5c7d-c8a8-83ea-acc0-43c74591c29a, https://chatgpt.com/share/6aff3e47-c2c8-83ea-917d-1db944c50533, and 
// https://chatgpt.com/share/6b03c209-21bc-83ea-bff8-52202ea3ca57, and https://chatgpt.com/share/6b03d99d-ad70-83ea-ae82-0fc12d26a4bb
// document the GenAI interaction that led to code in geocoding.js and geocoding.test.js.

const GEOAPIFY_URL = "https://api.geoapify.com/v1/geocode/search";

// Check whether a Geoapify result represents a valid location.
const isValidGeoapifyResult = (result) => {
    if (!result || typeof result !== "object") {
        return false;
    }

    const {
        confidence,
        confidence_street_level,
        confidence_city_level,
        confidence_building_level,
    } = result.rank || {};

    const componentConfidences = [
        confidence_street_level,
        confidence_city_level,
        confidence_building_level,
    ];

    const hasHighComponentConfidence = componentConfidences.some(
        (score) => Number.isFinite(score) && score >= 0.90
    );

    const hasValidCoordinates =
        result.lat != null &&
        result.lon != null &&
        result.lat !== "" &&
        result.lon !== "" &&
        Number.isFinite(Number(result.lat)) &&
        Number.isFinite(Number(result.lon));

    const hasValidCity =
        typeof result.city === "string" &&
        result.city.trim() !== "";

    const hasValidCountry =
        typeof result.country === "string" &&
        result.country.trim() !== "";

    const hasValidFormattedAddress =
        typeof result.formatted === "string" &&
        result.formatted.trim() !== "";

    const hasStreet =
        typeof result.street === "string" &&
        result.street.trim() !== "";

    const hasHouseNumber =
        typeof result.housenumber === "string" &&
        result.housenumber.trim() !== "";

    const hasPostcode =
        typeof result.postcode === "string" &&
        result.postcode.trim() !== "";

    const hasValidPostcodeType =
        ["suburb", "postcode", "district"].includes(result.result_type);

    // Strong street and house-number match.
    const hasStrongStreetMatch =
        hasStreet &&
        hasHouseNumber &&
        Number.isFinite(confidence_street_level) &&
        confidence_street_level >= 0.90;

    // Named amenity with a sufficiently strong match.
    const hasValidAmenity =
        result.result_type === "amenity" &&
        typeof result.name === "string" &&
        result.name.trim() !== "" &&
        (hasStreet || hasPostcode) &&
        Number.isFinite(confidence) &&
        confidence >= 0.80 &&
        hasHighComponentConfidence;

    // Street or postcode result meeting the confidence requirements.
    const hasStandardAddress =
        (hasStreet || (hasPostcode && hasValidPostcodeType)) &&
        Number.isFinite(confidence) &&
        confidence >= 0.80 &&
        hasHighComponentConfidence;

    return (
        (hasStrongStreetMatch || hasValidAmenity || hasStandardAddress) &&
        hasValidCity &&
        hasValidCountry &&
        hasValidFormattedAddress &&
        hasValidCoordinates
    );
};

// Validate the submitted address using Geoapify.
const validateAddress = async (address) => {
    const apiKey = process.env.GEOAPIFY_API_KEY;

    if (!apiKey) {
        throw new Error("ADDRESS_VALIDATION_REQUEST_FAILED");
    }

    const url = new URL(GEOAPIFY_URL);
    url.searchParams.set("text", address);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "5");
    url.searchParams.set("apiKey", apiKey);

    let response;

    try {
        response = await fetch(url, {
            method: "GET",
            headers: {
                "Accept": "application/json",
            },
            signal: AbortSignal.timeout(10000),
        });
    } catch (error) {
        throw new Error("ADDRESS_VALIDATION_REQUEST_FAILED");
    }

    if (!response.ok) {
        throw new Error("ADDRESS_VALIDATION_REQUEST_FAILED");
    }

    let data;

    try {
        data = await response.json();
    } catch (error) {
        throw new Error("ADDRESS_VALIDATION_REQUEST_FAILED");
    }

    if (!data || !Array.isArray(data.results)) {
        throw new Error("ADDRESS_VALIDATION_REQUEST_FAILED");
    }

    // Temporary for debugging.
    console.log(
        "Geoapify results:",
        JSON.stringify(data.results, null, 2)
    );

    // Return the first result that meets the validation rules.
    const matchingResult = data.results.find(isValidGeoapifyResult);

    console.log(
        "Final Geoapify validation:",
        Boolean(matchingResult)
    );

    return matchingResult || null;
};

// Validate the address and retrieve its coordinates from Geoapify.
const geocodeAddress = async (address) => {
    if (typeof address !== "string" || address.trim() === "") {
        return {
            latitude: null,
            longitude: null,
        };
    }

    const normalizedAddress = address.trim();
    const result = await validateAddress(normalizedAddress);

    if (!result) {
        return {
            latitude: null,
            longitude: null,
        };
    }

    return {
        latitude: Number(result.lat),
        longitude: Number(result.lon),
    };
};

module.exports = {
    geocodeAddress,
};