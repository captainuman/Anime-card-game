const mongoose = require("mongoose");

const playerCardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    cardId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    anime: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      default: "",
      trim: true,
    },

    hp: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },

    rankedGamesUsed: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "rankedGamesUsed must be an integer.",
      },
    },

    obtainedAt: {
      type: Date,
      default: Date.now,
    },

    lastUsedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

playerCardSchema.index(
  {
    userId: 1,
    cardId: 1,
  },
  {
    unique: true,
  },
);

module.exports = mongoose.model("PlayerCard", playerCardSchema);