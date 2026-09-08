const express = require("express");

const router = express.Router();

const {
  getCards,
  getCard,
  getMyCollection,
  createCard,
  updateCard,
  deleteCard,
  createCardsBulk,
} = require("../controllers/cardController");

const { protect, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

router.get("/", getCards);

router.get("/collection", protect, getMyCollection);

router.post("/bulk", protect, adminOnly, createCardsBulk);

router.get("/:id", getCard);

router.post("/", protect, adminOnly, upload.single("image"), createCard);

router.put("/:id", protect, adminOnly, upload.single("image"), updateCard);

router.delete("/:id", protect, adminOnly, deleteCard);

module.exports = router;