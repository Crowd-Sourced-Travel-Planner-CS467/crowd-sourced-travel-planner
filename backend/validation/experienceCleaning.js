// Citation
// This code was generated with the help of Claude VSCode extension.
// This transcript https://docs.google.com/document/d/13X01sMsMOhjlLOLURQMMhm94s9a2zac8OnuDPs4kJUc/edit?tab=t.0
// documents the GenAI interaction that led to the code in experienceCleaning.js, experienceValidation.js, and experienceValidation.test.js.


// Returns the trimmed string, or "" if the value is not a string.
const cleanString = (value) => (typeof value === "string" ? value.trim() : "");

// Trims keywords, lowercases them, drops blanks, and removes duplicates (keeps the first one entered).
const dedupeKeywords = (keywords) => {
  const seen = new Set();
  const unique = [];

  for (const keyword of keywords) {
    const cleaned = cleanString(keyword).toLowerCase();

    if (cleaned && !seen.has(cleaned)) {
      seen.add(cleaned);
      unique.push(cleaned);
    }
  }

  return unique;
};

module.exports = { cleanString, dedupeKeywords };
