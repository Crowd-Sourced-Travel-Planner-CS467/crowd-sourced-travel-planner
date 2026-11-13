// Citation
// This code was generated with the help of Claude VSCode extension.  
// This transcript https://docs.google.com/document/d/13X01sMsMOhjlLOLURQMMhm94s9a2zac8OnuDPs4kJUc/edit?tab=t.0
// documents the GenAI interaction that led to the code in experiences.js and experiences.test.js.

// Citation
// The code for handling geocoding the address into latitude and longitude coordinates was generated with the help of ChatGPT. 
// These transcripts: https://chatgpt.com/share/6aee540f-e514-83e9-99ca-a8070a4385d7 and https://chatgpt.com/share/6aee54a5-a088-83ea-a22e-1c43db12f8cd
// document the GenAI interaction that led to code in geocoding.js, experiences.js, ExperienceForm.jsx, and experiences.test.js


const { describe, test, before, after, beforeEach, afterEach, mock } = require("node:test");
const assert = require("node:assert");
const express = require("express");
const geocoding = require("../services/geocoding");

const pool = require("../db");
const experienceRoutes = require("../routes/experiences");

// A request body that passes validation; each test overrides only the field it is checking.
const validBody = (overrides = {}) => ({
  userId: 1,
  title: "Sunset Cruise",
  description: "Evening boat tour around the bay",
  address: "Pier 39, San Francisco, CA",
  imageUrl: "https://example.com/cruise.jpg",
  rating: 4,
  keywords: ["boat"],
  ...overrides,
});

// The route tests below replace pool.connect() with a fake client, so they never touch the real database.

// A stand-in for a pg client: records each query and can be told to throw on one of them.
const createFakeClient = ({ failOn, error } = {}) => {
  const client = {
    queries: [],
    released: false,
    releaseError: undefined,

    async query(sql, params = []) {
      const name = sql.match(/BEGIN|COMMIT|ROLLBACK|INSERT INTO public\.\w+/)[0];
      client.queries.push({ name, params });

      if (name === failOn) {
        throw error;
      }

      if (name === "INSERT INTO public.experiences") {
        const [userId, title, description, address, latitude, longitude, imageUrl, keywords] = params;
        return {
          rows: [{
            experience_id: "1",
            user_id: String(userId),
            title,
            description,
            address,
            latitude,
            longitude,
            image_url: imageUrl,
            keywords,
          }],
        };
      }

      if (name === "INSERT INTO public.ratings") {
        const [experienceId, userId, rating] = params;
        return { rows: [{ experience_id: experienceId, user_id: String(userId), rating }] };
      }

      return { rows: [] };
    },

    release(releaseError) {
      client.released = true;
      client.releaseError = releaseError;
    },
  };

  return client;
};

const queryNames = (client) => client.queries.map((query) => query.name);

describe("POST /api/experiences", () => {
  let server;
  let baseUrl;

  // Sends a POST to the experiences route and returns the status and parsed JSON body.
  const postExperience = async (body) => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    return { status: response.status, body: await response.json() };
  };

  // Start a small app with only the experiences route on a random free port
  before(async () => {
    const app = express();
    app.use(express.json());
    app.use("/api/experiences", experienceRoutes);

    await new Promise((resolve) => {
      server = app.listen(0, resolve);
    });

    baseUrl = `http://localhost:${server.address().port}/api/experiences`;
  });

  after(() => server.close());

  afterEach(() => mock.restoreAll());

  // Use mock coordinates so tests never make real Nominatim requests.
  const mockCoordinates = {
    latitude: 37.7749,
    longitude: -122.4194,
  };

  // Give each test a successful geocoding response by default.
  beforeEach(() => {
    mock.method(geocoding, "geocodeAddress", async () => mockCoordinates);
  });

  // A valid request saves the experience and its rating in one transaction (BEGIN, both inserts, COMMIT),
  // links the rating to the new experience_id, and returns the cleaned data with a 201
  test("creates an experience and rating with valid data", async () => {
    const client = createFakeClient();
    mock.method(pool, "connect", async () => client);

    const { status, body } = await postExperience(validBody({ keywords: ["Summer", "summer", "Boat"] }));

    assert.strictEqual(status, 201);
    assert.deepStrictEqual(queryNames(client), [
      "BEGIN",
      "INSERT INTO public.experiences",
      "INSERT INTO public.ratings",
      "COMMIT",
    ]);
    assert.deepStrictEqual(body.experience.keywords, ["summer", "boat"]);
    assert.strictEqual(body.experience.latitude, 37.7749);
    assert.strictEqual(body.experience.longitude, -122.4194);
    assert.deepStrictEqual(client.queries[2].params, ["1", 1, 4]);
    assert.strictEqual(body.rating.rating, 4);
    assert.strictEqual(client.released, true);
    // Correct address was geocoded
    assert.strictEqual(
      geocoding.geocodeAddress.mock.calls[0].arguments[0],
      "Pier 39, San Francisco, CA"
    );
  });

  // A user id that is not in the users table returns 400 and rolls back the transaction
  test("rejects a user id that does not exist", async () => {
    mock.method(console, "error", () => {});
    const foreignKeyError = Object.assign(new Error("violates foreign key constraint"), { code: "23503" });
    const client = createFakeClient({ failOn: "INSERT INTO public.experiences", error: foreignKeyError });
    mock.method(pool, "connect", async () => client);

    const { status, body } = await postExperience(validBody({ userId: 999999 }));

    assert.strictEqual(status, 400);
    assert.strictEqual(body.message, "User does not exist.");
    assert.deepStrictEqual(queryNames(client), [
      "BEGIN",
      "INSERT INTO public.experiences",
      "ROLLBACK",
    ]);
    assert.strictEqual(client.released, true);
  });

  // If the rating insert fails, the experience insert is rolled back so no partial data is saved
  test("rolls back when the rating insert fails", async () => {
    mock.method(console, "error", () => {});
    const client = createFakeClient({ failOn: "INSERT INTO public.ratings", error: new Error("insert failed") });
    mock.method(pool, "connect", async () => client);

    const { status, body } = await postExperience(validBody());

    assert.strictEqual(status, 500);
    assert.strictEqual(body.message, "We couldn't create the experience right now. Please try again.");
    assert.deepStrictEqual(queryNames(client), [
      "BEGIN",
      "INSERT INTO public.experiences",
      "INSERT INTO public.ratings",
      "ROLLBACK",
    ]);
    assert.ok(!queryNames(client).includes("COMMIT"));
    assert.strictEqual(client.released, true);
  });

  // If the database can't be reached, the route returns a JSON error instead of crashing
  test("returns a JSON error when the database is unreachable", async () => {
    mock.method(console, "error", () => {});
    mock.method(pool, "connect", async () => {
      throw new Error("connect ETIMEDOUT");
    });

    const { status, body } = await postExperience(validBody());

    assert.strictEqual(status, 500);
    assert.strictEqual(body.message, "We couldn't create the experience right now. Please try again.");
  });

  // An address with no matching location should not be saved.
  test("returns an error when Nominatim cannot find the address", async () => {
    geocoding.geocodeAddress.mock.mockImplementation(async () => ({
      latitude: null,
      longitude: null,
    }));

    const { status, body } = await postExperience(validBody());

    assert.strictEqual(status, 422);
    assert.strictEqual(body.code, "LOCATION_NOT_FOUND");
    assert.strictEqual(
      body.message,
      "We couldn't find this location. Please check the address and try again."
    );
  });

  // A failed Nominatim request should return a service error.
  test("returns an error when Nominatim cannot verify the location", async () => {
    geocoding.geocodeAddress.mock.mockImplementation(async () => {
      throw new Error("GEOCODING_REQUEST_FAILED");
    });

    mock.method(console, "error", () => {});

    const { status, body } = await postExperience(validBody());

    assert.strictEqual(status, 503);
    assert.strictEqual(body.code, "LOCATION_VERIFICATION_FAILED");
    assert.strictEqual(
      body.message,
      "We couldn't verify the location right now. Please try again."
    );
  });

});

describe("GET /api/experiences/:experienceId", () => {
  let server;
  let baseUrl;

  const fakeExperienceRow = (overrides = {}) => ({
    experience_id: "42",
    user_id: "1",
    title: "Sunset Cruise",
    description: "Evening boat tour around the bay",
    address: "Pier 39, San Francisco, CA",
    latitude: 37.7749,
    longitude: -122.4194,
    image_url: "https://example.com/.jpg",
    keywords: ["boat"],
    ratings: [5, 4, 3],
    ...overrides,
  });

  // Sends a GET for one experience id and returns the status and parsed JSON body.
  const getExperience = async (experienceId) => {
    const response = await fetch(`${baseUrl}/${experienceId}`);

    return { status: response.status, body: await response.json() };
  };

  // Start a small app with only the experiences route on a random free port
  before(async () => {
    const app = express();
    app.use(express.json());
    app.use("/api/experiences", experienceRoutes);

    await new Promise((resolve) => {
      server = app.listen(0, resolve);
    });

    baseUrl = `http://localhost:${server.address().port}/api/experiences`;
  });

  after(() => server.close());

  afterEach(() => mock.restoreAll());

  // A valid id returns the experience with its rating values and a 200, and the id is passed to PostgreSQL as a parameter
  test("returns the experience and its ratings for a valid id", async () => {
    const row = fakeExperienceRow();
    mock.method(pool, "query", async () => ({ rows: [row] }));

    const { status, body } = await getExperience(42);

    assert.strictEqual(status, 200);
    assert.deepStrictEqual(body.experience, row);
    assert.deepStrictEqual(body.experience.ratings, [5, 4, 3]);
    assert.strictEqual(pool.query.mock.calls.length, 1);
    assert.deepStrictEqual(pool.query.mock.calls[0].arguments[1], [42]);
  });

  // An id that has no matching row returns 404 instead of an empty experience
  test("returns 404 when the experience does not exist", async () => {
    mock.method(pool, "query", async () => ({ rows: [] }));

    const { status, body } = await getExperience(999999);

    assert.strictEqual(status, 404);
    assert.strictEqual(body.message, "This experience could not be found.");
    assert.strictEqual(body.experience, undefined);
  });

});
