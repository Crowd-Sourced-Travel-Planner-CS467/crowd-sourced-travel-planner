{/*
Citation:
The code for the Create an Experience page was generated with the help of ChatGPT.
This transcript link https://chatgpt.com/share/6ad83a24-8640-83ea-a7ae-43ff7156b007
documents the GenAI interaction that led to ExperienceForm.jsx

Citation:
The code for handling geocoding the address into latitude and longitude coordinates was generated with the help of ChatGPT. 
These transcripts: https://chatgpt.com/share/6aee540f-e514-83e9-99ca-a8070a4385d7 and https://chatgpt.com/share/6aee54a5-a088-83ea-a22e-1c43db12f8cd
document the GenAI interaction that led to code in geocoding.js, experiences.js, ExperienceForm.jsx, and experiences.test.js
*/}

import { useState } from "react";
import "./ExperienceForm.css";

// TODO: replace with the logged-in user's id once auth exists
const TEMP_USER_ID = 1;

// Must match the limits in backend/validation/experienceValidation.js
const MAX_KEYWORDS = 10;
const MAX_KEYWORD_LENGTH = 30;
const MAX_DESCRIPTION_LENGTH = 2000;

function ExperienceForm() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [address, setAddress] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [rating, setRating] = useState(0);
    const [keywords, setKeywords] = useState([]);
    const [keywordInput, setKeywordInput] = useState("");
    const [showDialog, setShowDialog] = useState(false);
    const [error, setError] = useState("");
    const [imageError, setImageError] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Stores the experience returned by the backend after successful creation.
    const [createdExperience, setCreatedExperience] = useState(null);

    const handleAddKeyword = (event) => {
        if (event.key !== "Enter" && event.key !== ",") {
            return;
        }

        event.preventDefault();

        const keyword = keywordInput.trim().replace(/,$/, "");

        if (
            keyword &&
            keyword.length <= MAX_KEYWORD_LENGTH &&
            keywords.length < MAX_KEYWORDS &&
            !keywords.some(
                (item) => item.toLowerCase() === keyword.toLowerCase()
            )
        ) {
            setKeywords([...keywords, keyword]);
            setError("");
        }

        setKeywordInput("");
    };

    const handleRemoveKeyword = (keywordToRemove) => {
        setKeywords(
            keywords.filter((keyword) => keyword !== keywordToRemove)
        );
    };

    // Saves the experience to the database, then shows the confirmation dialog or an error.
    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (rating === 0) {
            setError("Please select a rating.");
            return;
        }

        if (keywords.length === 0) {
            setError("Please add at least one keyword. Press Enter or type a comma to add it.");
            return;
        }

        // Prevent duplicate submissions while processing the request.
        setIsSubmitting(true);

        try {
            const response = await fetch("/api/experiences", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: TEMP_USER_ID,
                    title,
                    description,
                    address,
                    imageUrl,
                    rating,
                    keywords,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle an address that Nominatim could not find.
                if (data.code === "LOCATION_NOT_FOUND") {
                    throw new Error(
                        "We couldn't find this location. Please check the address and try again."
                    );
                }

                // Handle a Nominatim network, rate-limit, or service error.
                if (data.code === "LOCATION_VERIFICATION_FAILED") {
                    throw new Error(
                        "We couldn't verify the location right now. Please try again."
                    );
                }

                // Handle database errors and other API errors.
                throw new Error(
                    data.message || "We couldn't create the experience right now. Please try again."
                );
            }

            // Store the actual experience returned by PostgreSQL.
            setCreatedExperience(data.experience);

            // Display the confirmation dialog after successful creation.
            setShowDialog(true);

        } catch (err) {
            // Keep the form populated so the user can correct or retry.
            setError(err.message);
        } finally {
            // Re-enable the Create Experience button.
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setAddress("");
        setImageUrl("");
        setRating(0);
        setKeywords([]);
        setKeywordInput("");
        setError("");
        setImageError(false);
        setShowDialog(false);
        // Clear the previously created experience.
        setCreatedExperience(null);
    };

    return (
        <main className="experience-page">
            <section className="experience-card">
                <h1>Create an Experience</h1>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="experience-title">Title</label>
                        <input
                            id="experience-title"
                            type="text"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="Enter an experience title"
                            maxLength={250}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="experience-description">
                            Description
                        </label>
                        <textarea
                            id="experience-description"
                            value={description}
                            onChange={(event) =>
                                setDescription(event.target.value)
                            }
                            placeholder="Describe your experience"
                            rows={5}
                            maxLength={MAX_DESCRIPTION_LENGTH}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="experience-address">Address</label>
                        <input
                            id="experience-address"
                            type="text"
                            value={address}
                            onChange={(event) => setAddress(event.target.value)}
                            placeholder="Enter the location address"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="experience-image">Image URL</label>
                        <input
                            id="experience-image"
                            type="url"
                            value={imageUrl}
                            onChange={(event) => setImageUrl(event.target.value)}
                            placeholder="https://example.com/image.jpg"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Rating</label>

                        <div
                            className="star-rating"
                            role="radiogroup"
                            aria-label="Select a rating"
                        >
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    role="radio"
                                    aria-checked={rating === star}
                                    aria-label={`${star} star${star > 1 ? "s" : ""}`}
                                    className={
                                        star <= rating ? "star selected" : "star"
                                    }
                                    onClick={() => {
                                        setRating(star);
                                        setError("");
                                    }}
                                >
                                    ★
                                </button>
                            ))}

                            <span className="rating-label">
                {rating === 0 ? "Select a rating" : `${rating} out of 5`}
              </span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="experience-keywords">
                            Keywords (1–{MAX_KEYWORDS})
                        </label>

                        <input
                            id="experience-keywords"
                            type="text"
                            value={keywordInput}
                            onChange={(event) =>
                                setKeywordInput(event.target.value)
                            }
                            onKeyDown={handleAddKeyword}
                            placeholder={
                                keywords.length >= MAX_KEYWORDS
                                    ? `Maximum of ${MAX_KEYWORDS} keywords reached`
                                    : "Type a keyword and press Enter"
                            }
                            maxLength={MAX_KEYWORD_LENGTH}
                            disabled={keywords.length >= MAX_KEYWORDS}
                        />

                        <p className="help-text">
                            Press Enter or type a comma to add a keyword.
                            {" "}{keywords.length}/{MAX_KEYWORDS} keywords added.
                        </p>

                        <div className="keyword-list">
                            {keywords.map((keyword) => (
                                <span className="keyword-tag" key={keyword}>
                  {keyword}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveKeyword(keyword)}
                                        aria-label={`Remove ${keyword}`}
                                    >
                    ×
                  </button>
                </span>
                            ))}
                        </div>
                    </div>

                    {error && <p className="error-text">{error}</p>}

                    <div className="form-actions">
                        {/* Disable the Create Experience button while request is processing
                        Prevents users from clicking twice and creating duplicate experiences */}
                        <button type="submit" className="create-button" disabled={isSubmitting}>
                            {isSubmitting ? "Creating..." : "Create Experience"}
                        </button>

                        <button
                            type="button"
                            className="cancel-button"
                            onClick={resetForm}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </section>

            {showDialog && createdExperience && (
                <div className="dialog-overlay">
                    <section
                        className="confirmation-dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="experience-dialog-title"
                    >
                        <h2 id="experience-dialog-title">Experience Details</h2>

                        <div className="dialog-details">
                            <p>
                                <strong>Title:</strong> {createdExperience.title}
                            </p>

                            <p>
                                <strong>Description:</strong> {createdExperience.description}
                            </p>

                            <p>
                                <strong>Address:</strong> {createdExperience.address}
                            </p>

                            <p>
                                <strong>Latitude:</strong> {createdExperience.latitude}
                            </p>

                            <p>
                                <strong>Longitude:</strong> {createdExperience.longitude}
                            </p>

                            <div className="dialog-image">
                                <strong>Image:</strong>

                                {imageError ? (
                                    <p className="image-error">
                                        Image could not be loaded. Please check the image URL.
                                    </p>
                                ) : (
                                    <img
                                        src={createdExperience.image_url}
                                        alt={createdExperience.title}
                                        className="experience-preview-image"
                                        onError={() => setImageError(true)}
                                    />
                                )}
                            </div>

                            <p>
                                <strong>Rating:</strong> {createdExperience.rating ?? rating}/5 stars
                            </p>

                            <p>
                                <strong>Keywords:</strong>{" "}
                                {createdExperience.keywords.join(", ")}
                            </p>
                        </div>

                        <div className="dialog-actions">
                            <button
                                type="button"
                                className="create-button"
                                onClick={resetForm}
                            >
                                Close
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </main>
    );
}

export default ExperienceForm;
