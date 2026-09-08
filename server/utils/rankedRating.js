const RATING_WIN = 25;
const RATING_LOSS = 15;
const RATING_DRAW = 5;

function calculateRatingChange(winner) {
  if (winner === "player1") {
    return RATING_WIN;
  }

  if (winner === "player2") {
    return -RATING_LOSS;
  }

  if (winner === "draw") {
    return RATING_DRAW;
  }

  return 0;
}

function getRankFromRating(rating) {
  const value = Number(rating ?? 0);

  if (value >= 2500) {
    return "Diamond";
  }

  if (value >= 2000) {
    return "Platinum";
  }

  if (value >= 1500) {
    return "Gold";
  }

  if (value >= 1000) {
    return "Silver";
  }

  return "Bronze";
}

module.exports = {
  RATING_WIN,
  RATING_LOSS,
  RATING_DRAW,
  calculateRatingChange,
  getRankFromRating,
};
