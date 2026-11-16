// Code below created with AI assistance from chatGPT.
// Transcript: https://oregonstateuniversity-my.sharepoint.com/:w:/g/personal/harrisr6_oregonstate_edu/IQBeWruOGYKtRJCqR3wQY04OAQb-4zGosjXMuJZV76Xwpms?e=cQa044 

const jwt = require("jsonwebtoken");

const JWT_SECRET =
  process.env.JWT_SECRET || "change_this_secret_in_production";

function authenticateToken(req, res, next) {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  // Verify token and identify logged-in user
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }

    // Make logged-in user's information available to routes
    req.user = decoded;

    next();
  });
}

module.exports = authenticateToken;
