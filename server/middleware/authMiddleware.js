const jwt = require("jsonwebtoken");

function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Not authorized. Please login.",
      });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        message: "Not authorized. Please login.",
      });
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("Authentication failed: JWT_SECRET is not defined.");

      return res.status(500).json({
        message: "Authentication configuration error.",
      });
    }

    const decoded = jwt.verify(token, jwtSecret);

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        message: "Invalid authentication token.",
      });
    }

    req.user = {
      ...decoded,
      id: String(decoded.id),
    };

    return next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);

    return res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
}

function adminOnly(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      message: "Not authorized. Please login.",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required.",
    });
  }

  return next();
}

module.exports = {
  protect,
  adminOnly,
};
