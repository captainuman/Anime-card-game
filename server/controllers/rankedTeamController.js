const User = require("../models/User");
const PlayerCard = require("../models/PlayerCard");
const { positions } = require("../data/positions");

const RANKED_POSITIONS = positions.map((position) => position.id);
const REQUIRED_TEAM_SIZE = RANKED_POSITIONS.length;

async function getRankedTeam(req, res) {
  try {
    const user = await User.findById(req.user.id).select(
      "rankedTeam username",
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const cardIds = Array.isArray(user.rankedTeam?.cards)
      ? user.rankedTeam.cards.map(String)
      : [];

    const playerCards = await PlayerCard.find({
      userId: req.user.id,
      cardId: { $in: cardIds },
    }).lean();

    const cardMap = new Map(
      playerCards.map((card) => [String(card.cardId), card]),
    );

    const cards = cardIds
      .map((cardId) => cardMap.get(cardId))
      .filter(Boolean);

    const isComplete =
      cardIds.length === REQUIRED_TEAM_SIZE &&
      new Set(cardIds).size === REQUIRED_TEAM_SIZE &&
      cards.length === REQUIRED_TEAM_SIZE;

    return res.status(200).json({
      cards,
      cardIds,
      isComplete,
      positions,
    });
  } catch (error) {
    console.error("Get ranked team error:", error);

    return res.status(500).json({
      message: "Failed to get ranked team.",
    });
  }
}

async function saveRankedTeam(req, res) {
  try {
    const { cards } = req.body;

    if (!Array.isArray(cards)) {
      return res.status(400).json({
        message: "Ranked team must be an array of card IDs.",
      });
    }

    if (cards.length !== REQUIRED_TEAM_SIZE) {
      return res.status(400).json({
        message: `Ranked team must contain exactly ${REQUIRED_TEAM_SIZE} cards.`,
      });
    }

    const normalizedCardIds = cards.map((cardId) =>
      String(cardId || "").trim(),
    );

    if (
      normalizedCardIds.some((cardId) => !cardId) ||
      new Set(normalizedCardIds).size !== REQUIRED_TEAM_SIZE
    ) {
      return res.status(400).json({
        message: `Ranked team must contain exactly ${REQUIRED_TEAM_SIZE} unique card IDs.`,
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const playerCards = await PlayerCard.find({
      userId: req.user.id,
      cardId: { $in: normalizedCardIds },
    });

    if (playerCards.length !== REQUIRED_TEAM_SIZE) {
      return res.status(400).json({
        message: "All ranked team cards must belong to your collection.",
      });
    }

    const playerCardMap = new Map(
      playerCards.map((card) => [String(card.cardId), card]),
    );

    for (const cardId of normalizedCardIds) {
      const playerCard = playerCardMap.get(cardId);

      if (!playerCard) {
        return res.status(400).json({
          message: `Card ${cardId} is not in your collection.`,
        });
      }

      if (Number(playerCard.hp ?? 0) <= 0) {
        return res.status(400).json({
          message: `Card ${cardId} has no HP remaining and cannot be used in ranked mode.`,
        });
      }
    }

    if (!user.rankedTeam) {
      user.rankedTeam = {
        cards: [],
        isComplete: false,
      };
    }

    user.rankedTeam.cards = normalizedCardIds;
    user.rankedTeam.isComplete = true;

    await user.save();

    return res.status(200).json({
      message: "Ranked team saved successfully.",
      cardIds: user.rankedTeam.cards,
      isComplete: user.rankedTeam.isComplete,
    });
  } catch (error) {
    console.error("Save ranked team error:", error);

    return res.status(500).json({
      message: "Failed to save ranked team.",
    });
  }
}

async function clearRankedTeam(req, res) {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    if (!user.rankedTeam) {
      user.rankedTeam = {
        cards: [],
        isComplete: false,
      };
    } else {
      user.rankedTeam.cards = [];
      user.rankedTeam.isComplete = false;
    }

    await user.save();

    return res.status(200).json({
      message: "Ranked team cleared successfully.",
      cardIds: [],
      isComplete: false,
    });
  } catch (error) {
    console.error("Clear ranked team error:", error);

    return res.status(500).json({
      message: "Failed to clear ranked team.",
    });
  }
}

module.exports = {
  getRankedTeam,
  saveRankedTeam,
  clearRankedTeam,
};