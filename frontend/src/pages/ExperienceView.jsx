{/*
Citation:
The code handling the experience view page was generated with the help of ChatGPT.
These transcript links: https://chatgpt.com/share/6af67cf0-17e4-83e9-bfa2-3c8d5c20b1a9 and https://chatgpt.com/share/6af67df0-f978-83ea-a1ed-86fa32cdb705
document the GenAI interaction that led to ExperienceView.jsx and parts of ExperienceForm.css, experiences.js, and experiences.test.js
*/}

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./ExperienceForm.css";

// Calculate the average rating, returning null if there are no valid ratings
export function calculateAverageRating(ratings = []) {
    const validRatings = ratings.map(Number).filter(Number.isFinite);

    return validRatings.length
        ? validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length
        : null;
}

// Format the creation date as "Dec. 1, 2026"
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
    // Read the experience ID from a URL such as /experiences/12.
    const { experienceId } = useParams();

    const [experience, setExperience] = useState(null);
    const [averageRating, setAverageRating] = useState(null);
    const [ratingCount, setRatingCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [imageError, setImageError] = useState(false);

    // Fetch the experience and its ratings when the page loads or the ID changes.
    useEffect(() => {
        const fetchExperience = async () => {
            setIsLoading(true);
            setError("");

            try {
                const response = await fetch(
                    `/api/experiences/${encodeURIComponent(experienceId)}`
                );
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Unable to load this experience.");
                }

                setExperience(data.experience);

                const ratings = data.experience.ratings || [];
                setAverageRating(calculateAverageRating(ratings));
                setRatingCount(ratings.length);
                setImageError(false);
            } catch (err) {
                setError(err.message || "Unable to load this experience.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchExperience();
    }, [experienceId]);

    if (isLoading) {
        return (
            <main className="experience-view-page">
                <p className="experience-view-status">Loading experience...</p>
            </main>
        );
    }

    if (error) {
        return (
            <main className="experience-view-page">
                <p className="experience-view-error" role="alert">{error}</p>
            </main>
        );
    }

    if (!experience) return null;

    // Convert the average into a one-decimal display value.
    const averageRatingText =
        averageRating === null ? "No ratings yet" : `${averageRating.toFixed(1)} / 5`;

    return (
        <main className="experience-view-page">
            <article className="experience-view-card">
                {/* Shared experience details are displayed in all three view modes. */}
                <header className="experience-view-header">
                    <h1>{experience.title}</h1>
                    <p className="experience-created-date">
                        Created {formatCreatedDate(experience.create_datetime)}
                    </p>
                </header>

                <section className="experience-view-section">
                    <h2>Description</h2>
                    <p className="experience-view-description">
                        {experience.description || "No description provided."}
                    </p>
                </section>

                <section className="experience-view-section">
                    <h2>Address</h2>
                    <p>{experience.address}</p>
                </section>

                <section className="experience-view-section">
                    <h2>Geo-location</h2>
                    <p>
                        Latitude: {experience.latitude ?? "Unavailable"}
                        <br />
                        Longitude: {experience.longitude ?? "Unavailable"}
                    </p>
                </section>

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
                    <h2>Average Rating</h2>
                    <div className="experience-average-rating">
                        <span className="experience-average-stars" aria-label={
                            averageRating === null
                                ? "No ratings yet"
                                : `Average rating: ${averageRating.toFixed(1)} out of 5`
                        }>
                            {averageRating === null
                                ? "☆☆☆☆☆"
                                : `${"★".repeat(Math.round(averageRating))}${"☆".repeat(5 - Math.round(averageRating))}`}
                        </span>
                        <span>
                            {averageRatingText} ({ratingCount}{" "}
                            {ratingCount === 1 ? "rating" : "ratings"})
                        </span>
                    </div>
                </section>

                <section className="experience-view-section">
                    <h2>Keywords</h2>
                    {experience.keywords?.length > 0 ? (
                        <div className="experience-view-keywords">
                            {experience.keywords.map((keyword) => (
                                <span className="experience-view-keyword" key={keyword}>
                                    {keyword}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p>No keywords provided.</p>
                    )}
                </section>
            </article>
        </main>
    );
}

export default ExperienceView;