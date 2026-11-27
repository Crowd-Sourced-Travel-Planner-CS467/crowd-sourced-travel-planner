{/*
Citation:
The code handling the experience view page was generated with the help of ChatGPT.
These transcript links: https://chatgpt.com/share/6af67cf0-17e4-83e9-bfa2-3c8d5c20b1a9 and https://chatgpt.com/share/6af67df0-f978-83ea-a1ed-86fa32cdb705
document the GenAI interaction that led to ExperienceView.jsx and parts of ExperienceForm.css, experiences.js, and experiences.test.js

Citation:
The code for incorporating user authentication, adding update and delete experience, and update rating was generated with the help of ChatGPT
These transcipts: https://chatgpt.com/share/6aff3dab-2534-83e9-ad94-956e4c2a3ee3 and https://chatgpt.com/share/6aff3e47-c2c8-83ea-917d-1db944c50533
document the GenAI interaction that led to code in ExperienceForm.jsx, ExperienceView.jsx, experiences.js, experienceValidation.js, 
experienceValidation.test.js, and expereiences.test.js
*/}

import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ExperienceForm.css";

// Filter out invalid ratings.
function getValidRatings(ratings = []) {
    return ratings.map(Number).filter(Number.isFinite);
}

// Calculate the average rating.
export function calculateAverageRating(ratings = []) {
    const validRatings = ratings.filter(
        (rating) => typeof rating === "number" && Number.isFinite(rating)
    );

    if (validRatings.length === 0) {
        return null;
    }

    const total = validRatings.reduce((sum, rating) => sum + rating, 0);
    const average = total / validRatings.length;

    return Math.round(average * 2) / 2;
}

// Format the creation date.
function formatCreatedDate(dateValue) {
    if (!dateValue || isNaN(new Date(dateValue))) {
        return "Date unavailable";
    }

    return new Date(dateValue)
        .toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        })
        .replace(",", ".");
}

function ExperienceView() {
    const { experienceId } = useParams();
    const navigate = useNavigate();

    const token = localStorage.getItem("token");

    const [user] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("user"));
        } catch {
            return null;
        }
    });

    const [experience, setExperience] = useState(null);
    const [averageRating, setAverageRating] = useState(null);
    const [ratingCount, setRatingCount] = useState(0);
    const [userRating, setUserRating] = useState(null);

    const [ratingEditMode, setRatingEditMode] = useState(false);
    const [hoverRating, setHoverRating] = useState(0);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");
    const [imageError, setImageError] = useState(false);

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Retrieve the experience and its ratings from the backend.
    const loadExperience = useCallback(async () => {
        setIsLoading(true);
        setError("");

        try {
            const response = await fetch(
                `/api/experiences/${encodeURIComponent(experienceId)}`,
                {
                    headers: token
                        ? { Authorization: `Bearer ${token}` }
                        : {},
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to load this experience."
                );
            }

            const item = data.experience;

            setExperience(item);

            const ratings = getValidRatings(item.ratings || []);

            setAverageRating(calculateAverageRating(ratings));
            setRatingCount(ratings.length);

            // This value is returned specifically for the logged-in user.
            setUserRating(
                item.current_user_rating == null
                    ? null
                    : Number(item.current_user_rating)
            );

            setImageError(false);

        } catch (err) {
            setError(
                err.message || "Unable to load this experience."
            );
        } finally {
            setIsLoading(false);
        }

    }, [experienceId, token]);

    useEffect(() => {
        loadExperience();
    }, [loadExperience]);

    // Save a new rating or update the user's existing rating.
    const saveRating = async (newRating) => {

        if (!token) {
            navigate("/login", {
                state: {
                    from: `/experiences/${experienceId}`,
                },
            });
            return;
        }

        // If the user selected their original rating again,
        // there is no reason to update the database.
        if (newRating === userRating) {
            setRatingEditMode(false);
            setHoverRating(0);
            return;
        }

        try {
            const response = await fetch(
                `/api/experiences/${experienceId}/rating`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        rating: newRating,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to save your rating."
                );
            }

            setUserRating(Number(data.rating));
            setRatingEditMode(false);
            setHoverRating(0);

            // Refresh the average rating and rating count.
            await loadExperience();

        } catch (err) {
            setActionError(err.message);
        }
    };

    // Clicking an existing rating once activates editing.
    const handleRatingClick = (star) => {

        if (userRating !== null && !ratingEditMode) {
            setRatingEditMode(true);
            setHoverRating(0);
            return;
        }

        // The next click selects and saves the new rating.
        saveRating(star);
    };

    // Permanently delete the experience.
    const handleDelete = async () => {
        setIsDeleting(true);
        setActionError("");

        try {
            const response = await fetch(
                `/api/experiences/${experienceId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to delete this experience."
                );
            }

            // Return to the main landing page.
            navigate("/", { replace: true });

        } catch (err) {
            setActionError(err.message);
            setShowDeleteDialog(false);
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <main className="experience-view-page">
                <p className="experience-view-status">
                    Loading experience...
                </p>
            </main>
        );
    }

    if (error) {
        return (
            <main className="experience-view-page">
                <p
                    className="experience-view-error"
                    role="alert"
                >
                    {error}
                </p>
            </main>
        );
    }

    if (!experience) return null;

    // Only the creator should see the Update and Delete buttons.
    const isOwner = Boolean(
        user &&
        String(user.user_id) === String(experience.user_id)
    );

    const ratingPrompt = !token
        ? "Log in to rate this experience"
        : userRating === null
            ? "Select your rating"
            : ratingEditMode
                ? "Choose a new rating"
                : "Your rating (select to edit)";

    return (
        <main className="experience-view-page">
            <article className="experience-view-card">

                <header className="experience-view-header">
                    <h1>{experience.title}</h1>

                    <p className="experience-created-date">
                        Created{" "}
                        {formatCreatedDate(
                            experience.create_datetime
                        )}
                    </p>
                </header>

                <section className="experience-view-section">
                    <h2>Image</h2>

                    {imageError || !experience.image_url ? (
                        <p className="experience-view-image-error">
                            {imageError
                                ? "The experience image could not be loaded."
                                : "No image provided."}
                        </p>
                    ) : (
                        <img
                            src={experience.image_url}
                            alt={experience.title}
                            className="experience-view-image"
                            onError={() => setImageError(true)}
                        />
                    )}
                </section>

                <section className="experience-view-section">
                    <h2>Description</h2>

                    <p className="experience-view-description">
                        {experience.description ||
                            "No description provided."}
                    </p>
                </section>

                <section className="experience-view-section">
                    <h2>Address</h2>
                    <p>{experience.address}</p>
                </section>

                <section className="experience-view-section">
                    <h2>Geo-location</h2>

                    <p>
                        Latitude:{" "}
                        {experience.latitude ?? "Unavailable"}

                        <br />

                        Longitude:{" "}
                        {experience.longitude ?? "Unavailable"}
                    </p>
                </section>

                {/* Individual rating for the currently logged-in user. */}
                <section className="experience-view-section">
                    <h2>Your Rating</h2>

                    <div
                        className="user-rating-stars"
                        role="group"
                        aria-label={ratingPrompt}
                        onMouseLeave={() => setHoverRating(0)}
                    >
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className={`star ${
                                    star <=
                                    (hoverRating || userRating || 0)
                                        ? "selected"
                                        : ""
                                }`}
                                aria-label={`Rate ${star} out of 5`}
                                disabled={!token}
                                onMouseEnter={() => {
                                    if (
                                        ratingEditMode ||
                                        userRating === null
                                    ) {
                                        setHoverRating(star);
                                    }
                                }}
                                onClick={() =>
                                    handleRatingClick(star)
                                }
                            >
                                ★
                            </button>
                        ))}
                    </div>

                    <p className="help-text">
                        {ratingPrompt}
                    </p>

                    {/* Average rating from all users. */}
                    <h2 className="average-rating-heading">
                        Average Rating
                    </h2>

                    <div className="experience-average-rating">
                        <span
                            className="experience-average-stars"
                            aria-label={
                                averageRating === null
                                    ? "No ratings yet"
                                    : `Average rating: ${averageRating.toFixed(1)} out of 5`
                            }
                        >
                            {averageRating !== null &&
                                [1, 2, 3, 4, 5].map((star) => {
                                    const fillPercentage = Math.max(
                                        0,
                                        Math.min(1, averageRating - star + 1)
                                    ) * 100;

                                    return (
                                        <span
                                            key={star}
                                            style={{
                                                background: `linear-gradient(90deg, #f5b301 ${fillPercentage}%, #ccc ${fillPercentage}%)`,
                                                backgroundClip: "text",
                                                WebkitBackgroundClip: "text",
                                                WebkitTextFillColor: "transparent",
                                            }}
                                        >
                                            ★
                                        </span>
                                    );
                                })}
                        </span>

                        <span>
                            {averageRating === null
                                ? "No ratings yet"
                                : `${averageRating.toFixed(1)} / 5`}
                            {" "}({ratingCount}{" "}
                            {ratingCount === 1
                                ? "rating"
                                : "ratings"})
                        </span>
                    </div>
                </section>

                <section className="experience-view-section">
                    <h2>Keywords</h2>

                    {experience.keywords?.length ? (
                        <div className="experience-view-keywords">
                            {experience.keywords.map((keyword) => (
                                <span
                                    className="experience-view-keyword"
                                    key={keyword}
                                >
                                    {keyword}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p>No keywords provided.</p>
                    )}
                </section>

                {actionError && (
                    <p className="error-text" role="alert">
                        {actionError}
                    </p>
                )}

                {/* Creator-only actions, positioned at the bottom right. */}
                {isOwner && (
                    <div className="experience-owner-actions">

                        <button
                            type="button"
                            className="create-button"
                            onClick={() =>
                                navigate(
                                    `/experiences/${experienceId}/edit`
                                )
                            }
                        >
                            Update
                        </button>

                        <button
                            type="button"
                            className="delete-button"
                            onClick={() =>
                                setShowDeleteDialog(true)
                            }
                        >
                            Delete
                        </button>

                    </div>
                )}

            </article>

            {/* Delete confirmation dialog. */}
            {showDeleteDialog && (
                <div className="dialog-overlay">
                    <section
                        className="confirmation-dialog"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="delete-dialog-title"
                    >
                        <h2 id="delete-dialog-title">
                            Delete Experience?
                        </h2>

                        <p>
                            This deletion is permanent. Are you sure
                            you want to delete this experience?
                        </p>

                        <div className="dialog-actions">

                            <button
                                type="button"
                                className="delete-button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting
                                    ? "Deleting..."
                                    : "Delete"}
                            </button>

                            <button
                                type="button"
                                className="cancel-button"
                                onClick={() =>
                                    setShowDeleteDialog(false)
                                }
                                disabled={isDeleting}
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

export default ExperienceView;