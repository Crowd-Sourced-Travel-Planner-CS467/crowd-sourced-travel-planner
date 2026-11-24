// Citation
// The code for validating addresses was generated with the help of ChatGPT.
// These transcripts https://chatgpt.com/share/6aff5c7d-c8a8-83ea-acc0-43c74591c29a, 
// https://chatgpt.com/share/6aff3e47-c2c8-83ea-917d-1db944c50533, and 
// https://chatgpt.com/share/6b03c209-21bc-83ea-bff8-52202ea3ca57
// document the GenAI interaction that led to code in geocoding.js and geocoding.test.js.

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { geocodeAddress } = require("../services/geocoding");

// Create a representative Geoapify street-address result.
const createGeoapifyResult = (overrides = {}) => ({
    street: "Main Street",
    city: "Miami",
    country: "United States",
    lat: 25.7617,
    lon: -80.1918,
    formatted: "Main Street, Miami, United States",
    result_type: "street",
    rank: {
        confidence: 1,
        confidence_street_level: 1,
        match_type: "full_match",
    },
    ...overrides,
});

// Mock Geoapify and Nominatim responses.
const mockFetch = (t, geoapifyResults, nominatimResults = []) => {
    const originalApiKey = process.env.GEOAPIFY_API_KEY;
    process.env.GEOAPIFY_API_KEY = "test-api-key";

    t.after(() => {
        if (originalApiKey === undefined) {
            delete process.env.GEOAPIFY_API_KEY;
        } else {
            process.env.GEOAPIFY_API_KEY = originalApiKey;
        }
    });

    const requests = [];

    const fetchMock = t.mock.method(
        globalThis,
        "fetch",
        async (url) => {
            const parsedUrl = new URL(url);
            requests.push(parsedUrl);

            if (parsedUrl.hostname === "api.geoapify.com") {
                return {
                    ok: true,
                    json: async () => ({
                        results: geoapifyResults,
                    }),
                };
            }

            if (
                parsedUrl.hostname ===
                "nominatim.openstreetmap.org"
            ) {
                return {
                    ok: true,
                    json: async () => nominatimResults,
                };
            }

            throw new Error("Unexpected API request");
        }
    );

    return {
        requests,
        fetchMock,
    };
};

test("accepts a valid street address without a house number", async (t) => {
    const { requests } = mockFetch(
        t,
        [
            createGeoapifyResult({
                result_type: "street",
            }),
        ],
        [
            {
                lat: "25.7617",
                lon: "-80.1918",
            },
        ]
    );

    const result = await geocodeAddress(
        "Main Street, Miami, United States"
    );

    assert.deepEqual(result, {
        latitude: 25.7617,
        longitude: -80.1918,
    });

    assert.equal(requests.length, 2);
    assert.equal(requests[0].hostname, "api.geoapify.com");
    assert.equal(
        requests[1].hostname,
        "nominatim.openstreetmap.org"
    );
});

test("accepts a valid building address", async (t) => {
    mockFetch(
        t,
        [
            createGeoapifyResult({
                street: "Main Street",
                result_type: "building",
                housenumber: "123",
            }),
        ],
        [
            {
                lat: "25.7617",
                lon: "-80.1918",
            },
        ]
    );

    const result = await geocodeAddress(
        "123 Main Street, Miami, United States"
    );

    assert.deepEqual(result, {
        latitude: 25.7617,
        longitude: -80.1918,
    });
});

test("rejects city-only locations", async (t) => {
    const { requests } = mockFetch(
        t,
        [
            createGeoapifyResult({
                street: undefined,
                result_type: "city",
            }),
        ]
    );

    const result = await geocodeAddress("Miami, United States");

    assert.deepEqual(result, {
        latitude: null,
        longitude: null,
    });

    // Nominatim should not be called when Geoapify rejects the address.
    assert.equal(requests.length, 1);
});

test("rejects results without a street name", async (t) => {
    const { requests } = mockFetch(
        t,
        [
            createGeoapifyResult({
                street: "",
            }),
        ]
    );

    const result = await geocodeAddress("Some location");

    assert.deepEqual(result, {
        latitude: null,
        longitude: null,
    });

    assert.equal(requests.length, 1);
});

test("rejects results with low overall confidence", async (t) => {
    const { requests } = mockFetch(
        t,
        [
            createGeoapifyResult({
                rank: {
                    confidence: 0.8,
                    confidence_street_level: 1,
                    match_type: "full_match",
                },
            }),
        ]
    );

    const result = await geocodeAddress("Main Street, Miami");

    assert.deepEqual(result, {
        latitude: null,
        longitude: null,
    });

    assert.equal(requests.length, 1);
});

test("rejects results with low street-level confidence", async (t) => {
    const { requests } = mockFetch(
        t,
        [
            createGeoapifyResult({
                rank: {
                    confidence: 0.99,
                    confidence_street_level: 0.8,
                    match_type: "full_match",
                },
            }),
        ]
    );

    const result = await geocodeAddress("Main Street, Miami");

    assert.deepEqual(result, {
        latitude: null,
        longitude: null,
    });

    assert.equal(requests.length, 1);
});

test("rejects partial matches for test and test1", async (t) => {
    const { requests } = mockFetch(
        t,
        [
            createGeoapifyResult({
                street: "Testveien",
                rank: {
                    confidence: 0.99,
                    confidence_street_level: 0.99,
                    match_type: "inner_part",
                },
            }),
        ]
    );

    for (const address of ["test", "test1"]) {
        const result = await geocodeAddress(address);

        assert.deepEqual(result, {
            latitude: null,
            longitude: null,
        });
    }

    assert.equal(requests.length, 2);
});

test("rejects result types other than buildings and streets", async (t) => {
    const { requests } = mockFetch(
        t,
        [
            createGeoapifyResult({
                result_type: "amenity",
            }),
        ]
    );

    const result = await geocodeAddress("Example location");

    assert.deepEqual(result, {
        latitude: null,
        longitude: null,
    });

    assert.equal(requests.length, 1);
});

test("returns null coordinates when Nominatim finds no results", async (t) => {
    mockFetch(
        t,
        [createGeoapifyResult()],
        []
    );

    const result = await geocodeAddress("Main Street, Miami");

    assert.deepEqual(result, {
        latitude: null,
        longitude: null,
    });
});

test("does not make API requests for empty addresses", async (t) => {
    const { requests } = mockFetch(t, []);

    const result = await geocodeAddress("   ");

    assert.deepEqual(result, {
        latitude: null,
        longitude: null,
    });

    assert.equal(requests.length, 0);
});

test("throws an error when the Geoapify request fails", async (t) => {
    const originalApiKey = process.env.GEOAPIFY_API_KEY;
    process.env.GEOAPIFY_API_KEY = "test-api-key";

    t.after(() => {
        if (originalApiKey === undefined) {
            delete process.env.GEOAPIFY_API_KEY;
        } else {
            process.env.GEOAPIFY_API_KEY = originalApiKey;
        }
    });

    t.mock.method(globalThis, "fetch", async () => ({
        ok: false,
        status: 500,
    }));

    await assert.rejects(
        geocodeAddress("Main Street, Miami"),
        {
            message: "ADDRESS_VALIDATION_REQUEST_FAILED",
        }
    );
});