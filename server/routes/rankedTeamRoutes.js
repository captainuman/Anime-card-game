const express = require("express");

const router = express.Router();

const {
  getRankedTeam,
  saveRankedTeam,
  clearRankedTeam,
} = require("../controllers/rankedTeamController");

const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getRankedTeam);

router.post("/", protect, saveRankedTeam);

router.delete("/", protect, clearRankedTeam);

module.exports = router;