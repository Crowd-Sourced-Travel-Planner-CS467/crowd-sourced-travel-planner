// Citation
// This code was generated with the help of Claude VSCode extension.  
// This transcript https://docs.google.com/document/d/13X01sMsMOhjlLOLURQMMhm94s9a2zac8OnuDPs4kJUc/edit?tab=t.0
// documents the GenAI interaction that led to the code in experienceCleaning.js, experienceValidation.js, and experienceValidation.test.js.

// Citation:
// The code for updating a rating was generated with the help of ChatGPT
// These transcipts: https://chatgpt.com/share/6aff3dab-2534-83e9-ad94-956e4c2a3ee3 and https://chatgpt.com/share/6aff3e47-c2c8-83ea-917d-1db944c50533
// document the GenAI interaction that led to code in ExperienceForm.jsx, ExperienceView.jsx, experiences.js, experienceValidation.js, 
// experienceValidation.test.js, and expereiences.test.js

const {
  cleanString,
  dedupeKeywords,
} = require("./experienceCleaning");

// Column limits from database/schema.sql
const MAX_TITLE_LENGTH = 250;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_ADDRESS_LENGTH = 1000;
const MAX_IMAGE_URL_LENGTH = 2000;
const MAX_KEYWORD_LENGTH = 30;
const MAX_KEYWORDS = 10;

// Returns true if the value is a valid http or https URL.
const isHttpUrl = (value) =>
  URL.canParse(value) &&
  ["http:", "https:"].includes(new URL(value).protocol);

// Text fields that are required and limited to their column length.
const TEXT_FIELDS = [
  {
    field: "title",
    label: "Title",
    max: MAX_TITLE_LENGTH,
  },
  {
    field: "description",
    label: "Description",
    max: MAX_DESCRIPTION_LENGTH,
  },
  {
    field: "address",
    label: "Address",
    max: MAX_ADDRESS_LENGTH,
  },
  {
    field: "imageUrl",
    label: "Image URL",
    max: MAX_IMAGE_URL_LENGTH,
  },
];

// Checks that every field is present and valid.
// Returns { errors, values }.
//
// requireRating defaults to true for new experiences.
// Updates can set it to false because the existing rating is preserved
// when no new rating is included in the request.
const validateExperience = (
  body,
  { requireRating = true } = {}
) => {
  const errors = [];
  const values = {};

  // Validate and clean the required text fields.
  for (const { field, label, max } of TEXT_FIELDS) {
    values[field] = cleanString(body[field]);

    if (!values[field]) {
      errors.push(`${label} is required.`);
    } else if (values[field].length > max) {
      errors.push(
        `${label} must be ${max} characters or fewer.`
      );
    }
  }

  // Image URLs must use HTTP or HTTPS.
  const { imageUrl } = values;

  if (
    imageUrl &&
    imageUrl.length <= MAX_IMAGE_URL_LENGTH &&
    !isHttpUrl(imageUrl)
  ) {
    errors.push(
      "Image URL must be a valid http or https URL."
    );
  }

  // A rating is required when creating an experience.
  // During an update, validate it only if one was provided.
  const rating = body.rating;

  if (
    (requireRating || rating !== undefined) &&
    (!Number.isInteger(rating) || rating < 1 || rating > 5)
  ) {
    errors.push(
      requireRating
        ? "Rating is required and must be a whole number from 1 to 5."
        : "Rating must be a whole number from 1 to 5."
    );
  }

  // Remove duplicate keywords and normalize their formatting.
  let keywords = [];

  if (Array.isArray(body.keywords)) {
    keywords = dedupeKeywords(body.keywords);
  }

  if (keywords.length === 0) {
    errors.push("At least one keyword is required.");
  } else if (keywords.length > MAX_KEYWORDS) {
    errors.push(
      `No more than ${MAX_KEYWORDS} keywords are allowed.`
    );
  } else if (
    keywords.some(
      (keyword) => keyword.length > MAX_KEYWORD_LENGTH
    )
  ) {
    errors.push(
      `Each keyword must be ${MAX_KEYWORD_LENGTH} characters or fewer.`
    );
  }

  return {
    errors,
    values: {
      ...values,
      rating,
      keywords,
    },
  };
};

module.exports = { validateExperience };