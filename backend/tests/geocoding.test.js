// Citation
// The code for validating addresses was generated with the help of ChatGPT.
// These transcripts https://chatgpt.com/share/6aff5c7d-c8a8-83ea-acc0-43c74591c29a and https://chatgpt.com/share/6aff3e47-c2c8-83ea-917d-1db944c50533
// document the GenAI interaction that led to code in geocoding.js and geocoding.test.js.

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const { isAcceptableLocation } = require("../services/geocoding");

test("accepts street addresses and buildings", () => {
    const house = {
        addresstype: "house",
    };

    const building = {
        addresstype: "building",
    };

    const road = {
        addresstype: "road",
    };

    assert.equal(isAcceptableLocation(house), true);
    assert.equal(isAcceptableLocation(building), true);
    assert.equal(isAcceptableLocation(road), true);
});

test("accepts cities and other geographic localities", () => {
    const city = {
        addresstype: "city",
    };

    const town = {
        addresstype: "town",
    };

    const village = {
        addresstype: "village",
    };

    const neighbourhood = {
        addresstype: "neighbourhood",
    };

    assert.equal(isAcceptableLocation(city), true);
    assert.equal(isAcceptableLocation(town), true);
    assert.equal(isAcceptableLocation(village), true);
    assert.equal(isAcceptableLocation(neighbourhood), true);
});

test("accepts named landmarks and attractions", () => {
    const museum = {
        name: "Example Museum",
        category: "tourism",
        type: "museum",
    };

    const monument = {
        name: "Example Monument",
        category: "historic",
        type: "monument",
    };

    const park = {
        name: "Example Park",
        category: "leisure",
        type: "park",
    };

    assert.equal(isAcceptableLocation(museum), true);
    assert.equal(isAcceptableLocation(monument), true);
    assert.equal(isAcceptableLocation(park), true);
});

test("rejects unnamed landmarks", () => {
    const unnamedMuseum = {
        category: "tourism",
        type: "museum",
    };

    assert.equal(isAcceptableLocation(unnamedMuseum), false);
});

test("rejects unrelated named places", () => {
    const cafe = {
        name: "Example Cafe",
        category: "amenity",
        type: "cafe",
    };

    const shop = {
        name: "Example Shop",
        category: "shop",
        type: "supermarket",
    };

    assert.equal(isAcceptableLocation(cafe), false);
    assert.equal(isAcceptableLocation(shop), false);
});

test("rejects results without an accepted location type", () => {
    const result = {
        name: "Example Result",
        category: "landuse",
        type: "residential",
        addresstype: "landuse",
    };

    assert.equal(isAcceptableLocation(result), false);
});

test("rejects missing or invalid results", () => {
    assert.equal(isAcceptableLocation(null), false);
    assert.equal(isAcceptableLocation(undefined), false);
    assert.equal(isAcceptableLocation("Miami"), false);
});

const { isValidAddressInput } = require("../services/geocoding");

describe("isValidAddressInput", () => {
    test("accepts addresses containing letters", () => {
        assert.strictEqual(isValidAddressInput("123 Main Street"), true);
        assert.strictEqual(isValidAddressInput("Paris"), true);
        assert.strictEqual(isValidAddressInput("1 Rue de Rivoli"), true);
    });

    test("accepts international characters", () => {
        assert.strictEqual(isValidAddressInput("東京"), true);
        assert.strictEqual(isValidAddressInput("São Paulo"), true);
    });

    test("rejects numeric-only input", () => {
        assert.strictEqual(isValidAddressInput("1"), false);
        assert.strictEqual(isValidAddressInput("12345"), false);
    });

    test("rejects empty or non-string input", () => {
        assert.strictEqual(isValidAddressInput(""), false);
        assert.strictEqual(isValidAddressInput("   "), false);
        assert.strictEqual(isValidAddressInput(null), false);
        assert.strictEqual(isValidAddressInput(undefined), false);
    });
});