// Citation
// This code was generated with the help of Claude VSCode extension.  
// This transcript https://docs.google.com/document/d/13X01sMsMOhjlLOLURQMMhm94s9a2zac8OnuDPs4kJUc/edit?tab=t.0
// documents the GenAI interaction that led to the code in experienceCleaning.js, experienceValidation.js, and experienceValidation.test.js.


const { describe, test } = require("node:test");
const assert = require("node:assert");

const { validateExperience } = require("../validation/experienceValidation");

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

const RATING_ERROR = "Rating is required and must be a whole number from 1 to 5.";
const USER_ID_ERROR = "A valid user id is required.";
const KEYWORDS_REQUIRED_ERROR = "At least one keyword is required.";
const IMAGE_URL_ERROR = "Image URL must be a valid http or https URL.";

const REQUIRED_TEXT_FIELDS = [
  { field: "title", error: "Title is required." },
  { field: "description", error: "Description is required." },
  { field: "address", error: "Address is required." },
  { field: "imageUrl", error: "Image URL is required." },
];

describe("validateExperience", () => {
  test("accepts a valid experience", () => {
    const { errors } = validateExperience(validBody());

    assert.deepStrictEqual(errors, []);
  });

  // Rating must be a whole number from 1 to 5; missing, out-of-range, decimal, string, and boolean values are rejected
  describe("rating", () => {
    for (const rating of [null, undefined, 0, 6, 3.5, "3", true]) {
      test(`rejects ${JSON.stringify(rating) ?? "undefined"}`, () => {
        const { errors } = validateExperience(validBody({ rating }));

        assert.ok(errors.includes(RATING_ERROR));
      });
    }

    for (const rating of [1, 5]) {
      test(`accepts ${rating}`, () => {
        const { errors } = validateExperience(validBody({ rating }));

        assert.deepStrictEqual(errors, []);
      });
    }
  });

  // Title, description, address, and image URL are all required
  describe("missing required fields", () => {
    for (const { field, error } of REQUIRED_TEXT_FIELDS) {
      test(`rejects a missing ${field}`, () => {
        const { errors } = validateExperience(validBody({ [field]: undefined }));

        assert.ok(errors.includes(error));
      });
    }
  });

  // Fields containing only spaces are treated as missing
  describe("whitespace-only fields", () => {
    for (const { field, error } of REQUIRED_TEXT_FIELDS) {
      test(`treats a whitespace-only ${field} as missing`, () => {
        const { errors } = validateExperience(validBody({ [field]: "   " }));

        assert.ok(errors.includes(error));
      });
    }
  });

  // Duplicate keywords are removed, ignoring case and surrounding spaces
  test("removes duplicate keywords", () => {
    const { errors, values } = validateExperience(
      validBody({ keywords: ["summer", "Summer", " summer ", "picnic", "Cruise", " PicniC"] })
    );

    assert.deepStrictEqual(errors, []);
    assert.deepStrictEqual(values.keywords, ["summer", "picnic", "cruise"]);
  });

  // Keywords are saved in lowercase
  test("lowercases keywords", () => {
    const { values } = validateExperience(validBody({ keywords: ["Beach", "HIKING"] }));

    assert.deepStrictEqual(values.keywords, ["beach", "hiking"]);
  });

  // At least one keyword is required; an empty list, blank keywords, or a non-array all count as missing
  describe("missing keywords", () => {
    for (const keywords of [[], undefined, ["", "   "], "summer"]) {
      test(`rejects ${JSON.stringify(keywords) ?? "undefined"}`, () => {
        const { errors } = validateExperience(validBody({ keywords }));

        assert.ok(errors.includes(KEYWORDS_REQUIRED_ERROR));
      });
    }
  });

  // At most 10 keywords are allowed (counted after duplicates are removed), each 30 characters or fewer
  describe("keyword limits", () => {
    const makeKeywords = (count) => Array.from({ length: count }, (_, i) => `keyword${i}`);

    test("accepts 10 keywords", () => {
      const { errors } = validateExperience(validBody({ keywords: makeKeywords(10) }));

      assert.deepStrictEqual(errors, []);
    });

    test("rejects 11 keywords", () => {
      const { errors } = validateExperience(validBody({ keywords: makeKeywords(11) }));

      assert.ok(errors.includes("No more than 10 keywords are allowed."));
    });

    test("counts keywords after removing duplicates", () => {
      const { errors } = validateExperience(
        validBody({ keywords: [...makeKeywords(10), "KEYWORD0"] })
      );

      assert.deepStrictEqual(errors, []);
    });

    test("accepts a 30-character keyword", () => {
      const { errors } = validateExperience(validBody({ keywords: ["a".repeat(30)] }));

      assert.deepStrictEqual(errors, []);
    });

    test("rejects a 31-character keyword", () => {
      const { errors } = validateExperience(validBody({ keywords: ["a".repeat(31)] }));

      assert.ok(errors.includes("Each keyword must be 30 characters or fewer."));
    });
  });

  // User id must be a positive whole number (temporary until auth is complete)
  describe("user id", () => {
    for (const userId of [0, -1, 1.5, "abc", "1", true, undefined]) {
      test(`rejects ${JSON.stringify(userId) ?? "undefined"}`, () => {
        const { errors } = validateExperience(validBody({ userId }));

        assert.ok(errors.includes(USER_ID_ERROR));
      });
    }
  });

  // Image URL must be a valid http or https URL, which blocks javascript: and other schemes
  describe("image URL", () => {
    for (const imageUrl of ["javascript:alert(1)", "ftp://example.com/a.jpg", "not a url", "example.com/a.jpg"]) {
      test(`rejects ${imageUrl}`, () => {
        const { errors } = validateExperience(validBody({ imageUrl }));

        assert.ok(errors.includes(IMAGE_URL_ERROR));
      });
    }

    for (const imageUrl of ["http://example.com/a.jpg", "https://example.com/a.jpg"]) {
      test(`accepts ${imageUrl}`, () => {
        const { errors } = validateExperience(validBody({ imageUrl }));

        assert.deepStrictEqual(errors, []);
      });
    }
  });
});
