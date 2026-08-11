/**
 * Admin authorization middleware.
 * Must run AFTER authMiddleware (requires req.user to be set).
 * Requires the verified Firebase user to have the custom claim: admin === true.
 */
module.exports = function adminMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  if (req.user.admin !== true) {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }

  next();
};