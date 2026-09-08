const mongoose = require("mongoose");

const integerField = {
  type: Number,
  default: 0,
  min: 0,
  validate: {
    validator: Number.isInteger,
    message: "Value must be an integer.",
  },
};

const playerStatsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    rating: {
      type: Number,
      default: 1000,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Rating must be an integer.",
      },
    },

    wins: integerField,

    losses: integerField,

    draws: integerField,

    totalMatches: integerField,

    winPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    currentWinStreak: integerField,

    bestWinStreak: integerField,

    availableDraws: {
      type: Number,
      default: 12,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "availableDraws must be an integer.",
      },
    },

    totalCardsCollected: integerField,

    rewardMilestone: integerField,
  },
  {
    timestamps: true,
  },
);

playerStatsSchema.methods.calculateWinPercentage = function () {
  const wins = Math.max(0, Number(this.wins ?? 0));
  const losses = Math.max(0, Number(this.losses ?? 0));
  const draws = Math.max(0, Number(this.draws ?? 0));

  const total = wins + losses + draws;

  this.totalMatches = total;

  this.winPercentage =
    total > 0 ? Number(((wins / total) * 100).toFixed(2)) : 0;

  return this.winPercentage;
};

playerStatsSchema.methods.applyWinRewardMilestones = function () {
  const wins = Math.max(0, Number(this.wins ?? 0));
  const currentMilestone = Math.max(0, Number(this.rewardMilestone ?? 0));

  const earnedMilestone = Math.floor(wins / 5) * 5;

  if (earnedMilestone > currentMilestone) {
    const newRewards = (earnedMilestone - currentMilestone) / 5;

    this.availableDraws =
      Math.max(0, Number(this.availableDraws ?? 0)) + newRewards;

    this.rewardMilestone = earnedMilestone;

    return newRewards;
  }

  return 0;
};

playerStatsSchema.methods.registerResult = function (result) {
  if (!["win", "loss", "draw"].includes(result)) {
    throw new Error("Invalid match result.");
  }

  if (result === "win") {
    this.wins = Math.max(0, Number(this.wins ?? 0)) + 1;
    this.currentWinStreak =
      Math.max(0, Number(this.currentWinStreak ?? 0)) + 1;

    if (
      this.currentWinStreak >
      Math.max(0, Number(this.bestWinStreak ?? 0))
    ) {
      this.bestWinStreak = this.currentWinStreak;
    }

    this.applyWinRewardMilestones();
  }

  if (result === "loss") {
    this.losses = Math.max(0, Number(this.losses ?? 0)) + 1;
    this.currentWinStreak = 0;
  }

  if (result === "draw") {
    this.draws = Math.max(0, Number(this.draws ?? 0)) + 1;
    this.currentWinStreak = 0;
  }

  this.calculateWinPercentage();

  return this;
};

playerStatsSchema.methods.getRank = function () {
  const rating = Math.max(0, Number(this.rating ?? 0));

  if (rating >= 2500) {
    return "Diamond";
  }

  if (rating >= 2000) {
    return "Platinum";
  }

  if (rating >= 1500) {
    return "Gold";
  }

  if (rating >= 1000) {
    return "Silver";
  }

  return "Bronze";
};

module.exports = mongoose.model("PlayerStats", playerStatsSchema);
