const {
  processRankedMatchRewards,
  HP_PER_GAME,
} = require("./cardRewardServices");

const CARD_HP_LOSS = HP_PER_GAME;
const WINS_PER_CARD_DRAW = 5;

async function completeRankedMatch({
  matchId = null,
  playerId,
  opponentId,
  winner,
  usedCardIds = [],
  opponentCardIds = [],
}) {
  if (!playerId) {
    throw new Error("Player ID is required.");
  }

  if (!opponentId) {
    throw new Error("Opponent ID is required.");
  }

  if (String(playerId) === String(opponentId)) {
    throw new Error("Ranked match requires two different players.");
  }

  if (!["player1", "player2", "draw"].includes(winner)) {
    throw new Error("Invalid match result.");
  }

  if (!Array.isArray(usedCardIds)) {
    throw new Error("Used card IDs must be an array.");
  }

  if (!Array.isArray(opponentCardIds)) {
    throw new Error("Opponent card IDs must be an array.");
  }

  const uniqueUsedCardIds = [
    ...new Set(
      usedCardIds
        .filter(Boolean)
        .map(String),
    ),
  ];

  const uniqueOpponentCardIds = [
    ...new Set(
      opponentCardIds
        .filter(Boolean)
        .map(String),
    ),
  ];

  const result = await processRankedMatchRewards({
    matchId,
    winner,
    player1UserId: playerId,
    player2UserId: opponentId,
    player1CardIds: uniqueUsedCardIds,
    player2CardIds: uniqueOpponentCardIds,
  });

  const playerResult = result.player1;

  const ratingChange =
    winner === "player1"
      ? 25
      : winner === "player2"
        ? -15
        : 5;

  return {
    winner,

    ratingChange,

    rating: playerResult.rating,

    rank: playerResult.rank,

    wins: playerResult.wins,

    losses: playerResult.losses,

    draws: playerResult.draws,

    totalMatches: playerResult.totalMatches,

    winPercentage: playerResult.winPercentage,

    availableDraws: playerResult.availableDraws,

    cardsUsed: uniqueUsedCardIds,

    cardsDamaged: uniqueUsedCardIds.length,

    cardHpLoss: CARD_HP_LOSS,

    newDraws: playerResult.drawAwarded ? 1 : 0,

    rewardMilestone:
      playerResult.wins >= WINS_PER_CARD_DRAW
        ? Math.floor(playerResult.wins / WINS_PER_CARD_DRAW) *
          WINS_PER_CARD_DRAW
        : 0,
  };
}

module.exports = {
  CARD_HP_LOSS,
  WINS_PER_CARD_DRAW,
  completeRankedMatch,
};