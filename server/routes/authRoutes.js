const express = require("express");

const {
  register,
  login,
  adminLogin,
  me,
} = require("../controllers/authController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post("/admin/login", adminLogin);

router.get("/me", protect, me);

router.get("/admin/check", protect, adminOnly, (req, res) => {
  return res.status(200).json({
    message: "Admin access granted.",
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

module.exports = router;