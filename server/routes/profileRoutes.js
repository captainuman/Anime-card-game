const express = require("express");

const {
  getProfile,
  getCardCollection,
  drawCard,
} = require("../controllers/profileController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getProfile);

router.get("/cards", protect, getCardCollection);

router.post("/draw", protect, drawCard);

module.exports = router;