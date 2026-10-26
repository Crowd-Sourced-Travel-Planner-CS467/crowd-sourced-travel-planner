{/*
Citation:
The code for the Create an Experience page was generated with the help of ChatGPT.
This transcript link https://chatgpt.com/share/6ad83a24-8640-83ea-a7ae-43ff7156b007
documents the GenAI interaction that led to ExperienceForm.jsx
*/}

import { useState } from "react";
import "./ExperienceForm.css";

function ExperienceForm() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [address, setAddress] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [rating, setRating] = useState(0);
    const [keywords, setKeywords] = useState([]);
    const [keywordInput, setKeywordInput] = useState("");
    const [showDialog, setShowDialog] = useState(false);

    const handleAddKeyword = (event) => {
        if (event.key !== "Enter" && event.key !== ",") {
            return;
        }

        event.preventDefault();

        const keyword = keywordInput.trim().replace(/,$/, "");

        if (
            keyword &&
            keywords.length < 10 &&
            !keywords.some(
                (item) => item.toLowerCase() === keyword.toLowerCase()
            )
        ) {
            setKeywords([...keywords, keyword]);
        }

        setKeywordInput("");
    };

    const handleRemoveKeyword = (keywordToRemove) => {
        setKeywords(
            keywords.filter((keyword) => keyword !== keywordToRemove)
        );
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        setShowDialog(true);
    };

    const handleCancel = () => {
        setTitle("");
        setDescription("");
        setAddress("");
        setImageUrl("");
        setRating(0);
        setKeywords([]);
        setKeywordInput("");
        setShowDialog(false);
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
                        />
                    </div>

                    <div className="form-group">
                        <label>Average Rating</label>

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
                                    onClick={() => setRating(star)}
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
                            Keywords (max 10)
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
                                keywords.length >= 10
                                    ? "Maximum of 10 keywords reached"
                                    : "Type a keyword and press Enter"
                            }
                            disabled={keywords.length >= 10}
                        />

                        <p className="help-text">
                            Press Enter or type a comma to add a keyword.
                            {" "}{keywords.length}/10 keywords added.
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

                    <div className="form-actions">
                        <button type="submit" className="create-button">
                            Create Experience
                        </button>

                        <button
                            type="button"
                            className="cancel-button"
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </section>

            {showDialog && (
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
                                <strong>Title:</strong> {title}
                            </p>
                            <p>
                                <strong>Description:</strong> {description}
                            </p>
                            <p>
                                <strong>Address:</strong> {address}
                            </p>
                            <p>
                                <strong>Image URL:</strong> {imageUrl || "Not provided"}
                            </p>
                            <p>
                                <strong>Average Rating:</strong>{" "}
                                {rating > 0 ? `${rating}/5 stars` : "Not rated"}
                            </p>
                            <p>
                                <strong>Keywords:</strong>{" "}
                                {keywords.length > 0 ? keywords.join(", ") : "None"}
                            </p>
                        </div>

                        <div className="dialog-actions">
                            <button
                                type="button"
                                className="create-button"
                                onClick={() => setShowDialog(false)}
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
