{/*
Citation:
The code for the Create an Experience page was generated with the help of ChatGPT.
This transcript link https://chatgpt.com/share/6ad83a24-8640-83ea-a7ae-43ff7156b007
documents the GenAI interaction that led to ExperienceForm.jsx

Citation:
The code for handling geocoding the address into latitude and longitude coordinates was generated with the help of ChatGPT. 
These transcripts: https://chatgpt.com/share/6aee540f-e514-83e9-99ca-a8070a4385d7 and https://chatgpt.com/share/6aee54a5-a088-83ea-a22e-1c43db12f8cd
document the GenAI interaction that led to code in geocoding.js, experiences.js, ExperienceForm.jsx, and experiences.test.js

Citation:
The code for incorporating user authentication, adding update and delete experience, and update rating was generated with the help of ChatGPT
These transcipts: https://chatgpt.com/share/6aff3dab-2534-83e9-ad94-956e4c2a3ee3 and https://chatgpt.com/share/6aff3e47-c2c8-83ea-917d-1db944c50533
document the GenAI interaction that led to code in ExperienceForm.jsx, ExperienceView.jsx, experiences.js, experienceValidation.js, 
experienceValidation.test.js, and expereiences.test.js
*/}

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ExperienceForm.css";

const MAX_KEYWORDS = 10;
const MAX_KEYWORD_LENGTH = 30;
const MAX_DESCRIPTION_LENGTH = 2000;

function isValidKeyword(keyword, existingKeywords) {
    return (
        keyword.length > 0 &&
        keyword.length <= MAX_KEYWORD_LENGTH &&
        existingKeywords.length < MAX_KEYWORDS &&
        !existingKeywords.some(
            (item) =>
                item.toLowerCase() === keyword.toLowerCase()
        )
    );
}

// Check that the URL is valid and that the image loads.
function validateImage(imageUrl) {
    return new Promise((resolve) => {
        let parsed;

        try {
            parsed = new URL(imageUrl);
        } catch {
            return resolve(false);
        }

        if (!["http:", "https:"].includes(parsed.protocol)) {
            return resolve(false);
        }

        const image = new Image();
        const finish = (result) => {
            clearTimeout(timeout);
            resolve(result);
        };

        // Allow up to 10 seconds for the image to load.
        const timeout = setTimeout(() => {
            image.src = "";
            finish(false);
        }, 10000);

        image.onload = () => finish(true);
        image.onerror = () => finish(false);

        image.src = imageUrl;
    });
}

// Return an error message for an unsuccessful API response.
function getApiErrorMessage(data, isEditMode) {
    if (data.code === "LOCATION_NOT_FOUND") {
        return "We couldn't find this location. Please check the address and try again.";
    }

    if (data.code === "LOCATION_VERIFICATION_FAILED") {
        return "We couldn't verify the location right now. Please try again.";
    }

    return (
        data.message ||
        `We couldn't ${
            isEditMode ? "update" : "create"
        } the experience. Please try again.`
    );
}

function ExperienceForm() {
    const navigate = useNavigate();
    const { experienceId } = useParams();

    // An experienceId means the form is being used in edit mode.
    const isEditMode = Boolean(experienceId);

    const token = localStorage.getItem("token");

    const [user] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("user"));
        } catch {
            return null;
        }
    });

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [address, setAddress] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [rating, setRating] = useState(0);

    // Store the rating that was originally saved for this experience.
    // This lets the form determine whether the creator changed it.
    const [initialRating, setInitialRating] = useState(0);

    const [keywords, setKeywords] = useState([]);
    const [keywordInput, setKeywordInput] = useState("");

    const [showDialog, setShowDialog] = useState(false);
    const [error, setError] = useState("");
    const [imageError, setImageError] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(isEditMode);

    // Load an existing experience and populate the form.
    const loadExperience = async () => {
        try {
            const response = await fetch(
                `/api/experiences/${encodeURIComponent(experienceId)}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to load this experience."
                );
            }

            // Only the creator can edit the experience.
            if (
                String(data.experience.user_id) !==
                String(user?.user_id)
            ) {
                throw new Error(
                    "You can only edit your own experiences."
                );
            }

            // Populate the form with the existing experience details.
            const item = data.experience;

            setTitle(item.title || "");
            setDescription(item.description || "");
            setAddress(item.address || "");
            setImageUrl(item.image_url || "");
            setKeywords(item.keywords || []);

            // Load the creator's existing rating.
            // Save it as both the current and original rating.
            const existingRating = Number(
                item.current_user_rating ?? 0
            );

            setRating(existingRating);
            setInitialRating(existingRating);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Load the existing experience when the form opens in edit mode.
    useEffect(() => {
        if (isEditMode) {
            loadExperience();
        }
    }, [experienceId, isEditMode, token, user?.user_id]);

    // Add a keyword when Enter or comma is pressed.
    const handleAddKeyword = (event) => {
        if (event.key !== "Enter" && event.key !== ",") {
            return;
        }

        event.preventDefault();

        const keyword = keywordInput.trim().replace(/,$/, "");

        if (isValidKeyword(keyword, keywords)) {
            setKeywords((current) => [...current, keyword]);
            setError("");
        }

        setKeywordInput("");
    };

    // Remove a keyword from the form.
    const handleRemoveKeyword = (keywordToRemove) => {
        setKeywords((current) =>
            current.filter(
                (keyword) => keyword !== keywordToRemove
            )
        );
    };

    // Validate required fields, then show the preview.
    // This function does NOT save anything to the database.
    const handlePreview = async (event) => {
        event.preventDefault();
        setError("");

        // A new experience requires an initial rating.
        // An existing experience already has a rating, but its creator
        // can change that rating before confirming the update.
        if (!rating || rating < 1 || rating > 5) {
            setError("Please select a rating.");
            return;
        }

        if (!keywords.length) {
            setError(
                "Please add at least one keyword. Press Enter or type a comma to add it."
            );
            return;
        }

        setIsSubmitting(true);

        try {
            // Validate the image before displaying the preview.
            const imageIsValid = await validateImage(imageUrl);

            if (!imageIsValid) {
                setImageError(true);
                setError("Please enter a valid image URL.");
                return;
            }

            setImageError(false);

            // Open the preview using the current form values.
            setShowDialog(true);

        } finally {
            setIsSubmitting(false);
        }
    };

    // Save the experience only after the user confirms in the dialog.
    const handleConfirm = async () => {
        setError("");
        setIsSubmitting(true);

        try {
            // Include the rating when creating an experience.
            // During an update, include it only if the creator changed it.
            const requestBody = {
                title,
                description,
                address,
                imageUrl,
                keywords,
            };

            if (!isEditMode || rating !== initialRating) {
                requestBody.rating = rating;
            }

            const response = await fetch(
                isEditMode
                    ? `/api/experiences/${experienceId}`
                    : "/api/experiences",
                {
                    method: isEditMode ? "PUT" : "POST",

                    headers: {
                        "Content-Type": "application/json",

                        // The backend verifies this token and determines
                        // the actual user_id from the authenticated session.
                        Authorization: `Bearer ${token}`,
                    },

                    body: JSON.stringify(requestBody),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(getApiErrorMessage(data, isEditMode));
            }

            // Navigate to the saved experience using its database ID.
            const saved = data.experience;

            navigate(
                `/experiences/${saved.experience_id}`,
                { replace: true }
            );

        } catch (err) {
            // Close the dialog but preserve the form values.
            setShowDialog(false);
            setError(err.message);

        } finally {
            setIsSubmitting(false);
        }
    };

    // Canceling the main form has different behavior in each mode.
    const handleFormCancel = () => {
        if (isEditMode) {
            // Return to the existing experience.
            navigate(`/experiences/${experienceId}`);
        } else {
            navigate("/");
        }
    };

    // Do not display the experience form actions to logged-out users.
    if (!token || !user) {
        return (
            <main className="experience-page">
                <section className="experience-card">
                    <p>
                        Please log in to{" "}
                        {isEditMode ? "edit" : "create"} an experience.
                    </p>

                    <button
                        type="button"
                        className="create-button"
                        onClick={() => navigate("/login")}
                    >
                        Log in
                    </button>
                </section>
            </main>
        );
    }

    if (isLoading) {
        return (
            <main className="experience-page">
                <p>Loading experience...</p>
            </main>
        );
    }

    return (
        <main className="experience-page">
            <section className="experience-card">

                <h1>
                    {isEditMode
                        ? "Update Experience"
                        : "Create an Experience"}
                </h1>

                <form onSubmit={handlePreview}>

                    <div className="form-group">
                        <label htmlFor="experience-title">
                            Title
                        </label>

                        <input
                            id="experience-title"
                            type="text"
                            value={title}
                            onChange={(e) =>
                                setTitle(e.target.value)
                            }
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
                            onChange={(e) =>
                                setDescription(e.target.value)
                            }
                            placeholder="Describe your experience"
                            rows={5}
                            maxLength={MAX_DESCRIPTION_LENGTH}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="experience-address">
                            Address
                        </label>

                        <input
                            id="experience-address"
                            type="text"
                            value={address}
                            onChange={(e) =>
                                setAddress(e.target.value)
                            }
                            placeholder="Enter the location address"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="experience-image">
                            Image URL
                        </label>

                        <input
                            id="experience-image"
                            type="text"
                            value={imageUrl}
                            onChange={(e) => {
                                setImageUrl(e.target.value);
                                setImageError(false);
                            }}
                            placeholder="https://example.com/image.jpg"
                            required
                        />
                    </div>

                    {/* The creator can select or change the rating in either mode. */}
                    <div className="form-group">
                        <label>
                            {isEditMode ? "Initial Rating" : "Rating"}
                        </label>

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
                                    aria-label={`${star} star${
                                        star > 1 ? "s" : ""
                                    }`}
                                    className={
                                        star <= rating
                                            ? "star selected"
                                            : "star"
                                    }
                                    onClick={() =>
                                        setRating(star)
                                    }
                                >
                                    ★
                                </button>
                            ))}

                            <span className="rating-label">
                                {rating === 0
                                    ? "Select a rating"
                                    : `${rating} out of 5`}
                            </span>
                        </div>

                        {isEditMode && rating !== initialRating && (
                            <p className="help-text">
                                Your initial rating will be updated.
                            </p>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="experience-keywords">
                            Keywords (1–{MAX_KEYWORDS})
                        </label>

                        <input
                            id="experience-keywords"
                            type="text"
                            value={keywordInput}
                            onChange={(e) =>
                                setKeywordInput(e.target.value)
                            }
                            onKeyDown={handleAddKeyword}
                            placeholder={
                                keywords.length >= MAX_KEYWORDS
                                    ? `Maximum of ${MAX_KEYWORDS} keywords reached`
                                    : "Type a keyword and press Enter"
                            }
                            maxLength={MAX_KEYWORD_LENGTH}
                            disabled={
                                keywords.length >= MAX_KEYWORDS
                            }
                        />

                        <p className="help-text">
                            Press Enter or type a comma to add a keyword.
                            {" "}
                            {keywords.length}/{MAX_KEYWORDS} keywords added.
                        </p>

                        <div className="keyword-list">
                            {keywords.map((keyword) => (
                                <span
                                    className="keyword-tag"
                                    key={keyword}
                                >
                                    {keyword}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleRemoveKeyword(keyword)
                                        }
                                        aria-label={`Remove ${keyword}`}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <p className="error-text" role="alert">
                            {error}
                        </p>
                    )}

                    {/* These actions are only rendered for logged-in users. */}
                    <div className="form-actions">

                        <button
                            type="submit"
                            className="create-button"
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? "Checking..."
                                : isEditMode
                                    ? "Update"
                                    : "Create"}
                        </button>

                        <button
                            type="button"
                            className="cancel-button"
                            onClick={handleFormCancel}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>

                    </div>
                </form>
            </section>

            {/* Preview dialog: values come directly from the form state. */}
            {showDialog && (
                <div className="dialog-overlay">
                    <section
                        className="confirmation-dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="experience-dialog-title"
                    >
                        <h2 id="experience-dialog-title">
                            Preview Experience
                        </h2>

                        <div className="dialog-details">

                            <p>
                                <strong>Title:</strong> {title}
                            </p>

                            <p>
                                <strong>Description:</strong>{" "}
                                {description}
                            </p>

                            <p>
                                <strong>Address:</strong> {address}
                            </p>

                            <p>
                                <strong>Geo-location:</strong>{" "}
                                Coordinates will be verified when you{" "}
                                {isEditMode ? "update" : "create"} the experience.
                            </p>

                            <div className="dialog-image">
                                <strong>Image:</strong>

                                <img
                                    src={imageUrl}
                                    alt={title}
                                    className="experience-preview-image"
                                    onError={() => setImageError(true)}
                                />
                            </div>

                            {imageError && (
                                <p className="error-text">
                                    Please enter a valid image URL.
                                </p>
                            )}

                            <p>
                                <strong>Initial rating:</strong>{" "}
                                {rating}/5 stars
                            </p>

                            <p>
                                <strong>Keywords:</strong>{" "}
                                {keywords.join(", ")}
                            </p>

                        </div>

                        <div className="dialog-actions">

                            {/* This button performs the actual database operation. */}
                            <button
                                type="button"
                                className="create-button"
                                onClick={handleConfirm}
                                disabled={isSubmitting || imageError}
                            >
                                {isSubmitting
                                    ? "Saving..."
                                    : isEditMode
                                        ? "Update"
                                        : "Create"}
                            </button>

                            {/* Cancel closes the dialog without saving. */}
                            <button
                                type="button"
                                className="cancel-button"
                                onClick={() => setShowDialog(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>

                        </div>
                    </section>
                </div>
            )}

        </main>
    );
}

export default ExperienceForm;