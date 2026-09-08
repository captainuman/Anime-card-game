const User = require("../models/User");
const Card = require("../models/Card");
const PlayerCard = require("../models/PlayerCard");
const PlayerStats = require("../models/PlayerStats");
const {
  drawRandomCollectionCard,
  getOrCreatePlayerStats,
} = require("../services/cardRewardServices");

async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const stats = await getOrCreatePlayerStats(req.user.id);

    return res.status(200).json({
      user,
      stats,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      message: "Failed to get profile.",
    });
  }
}

async function getCardCollection(req, res) {
  try {
    const playerCards = await PlayerCard.find({
      userId: req.user.id,
    }).sort({
      obtainedAt: 1,
    });

    const cardIds = playerCards.map((playerCard) =>
      String(playerCard.cardId)
    );

    const masterCards = await Card.find({
      id: { $in: cardIds },
    });

    const masterCardMap = new Map(
      masterCards.map((card) => [String(card.id), card.toObject()])
    );

    const cards = playerCards.map((playerCard) => {
      const playerCardData = playerCard.toObject();
      const masterCard = masterCardMap.get(
        String(playerCard.cardId)
      );

      if (!masterCard) {
        return playerCardData;
      }

      return {
        ...masterCard,
        ...playerCardData,

        id: masterCard.id,
        name: masterCard.name,
        anime: masterCard.anime,
        position: masterCard.position,
        gender: masterCard.gender,
        race: masterCard.race,
        affiliation: masterCard.affiliation,
        famousDialogue: masterCard.famousDialogue,
        image: masterCard.image,

        hp: playerCardData.hp,

        roles: masterCard.roles,
        general: masterCard.general,
        specialRole: masterCard.specialRole,
        powerCategories: masterCard.powerCategories,
        overallPower: masterCard.overallPower,
      };
    });

    const stats = await getOrCreatePlayerStats(req.user.id);

    return res.status(200).json({
      cards,
      stats,
    });
  } catch (error) {
    console.error("Get card collection error:", error);

    return res.status(500).json({
      message: "Failed to get card collection.",
    });
  }
}

async function drawCard(req, res) {
  try {
    const result = await drawRandomCollectionCard(req.user.id);

    return res.status(200).json({
      message: "Card drawn successfully.",
      card: result.card,
      remainingDraws: result.remainingDraws,
    });
  } catch (error) {
    console.error("Draw card error:", error);

    const clientErrors = new Set([
      "User ID is required.",
      "User not found.",
      "No card draws available.",
      "No cards available.",
      "You already own every available card.",
    ]);

    const statusCode = clientErrors.has(error.message)
      ? 400
      : 500;

    return res.status(statusCode).json({
      message:
        error.message || "Failed to draw card.",
    });
  }
}

module.exports = {
  getProfile,
  getCardCollection,
  drawCard,
};
