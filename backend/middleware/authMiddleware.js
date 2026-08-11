const admin = require("../config/firebaseAdmin");

/**
 * Authentication middleware.
 * Verifies the Firebase ID token from the Authorization header:
 *   Authorization: Bearer <Firebase ID token>
 * Attaches the decoded token to req.user on success.
 */
module.exports = async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const idToken = authHeader.slice(7).trim();

    if (!idToken) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);

    req.user = decodedToken;

    next();
  } catch (error) {
    // Log safe diagnostic info server-side only
    console.error("Auth middleware error:", error.code || error.message);
    return res.status(401).json({ success: false, message: "Authentication required" });
  }
};