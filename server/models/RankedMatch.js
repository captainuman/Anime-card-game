const mongoose = require("mongoose");

const integerField = {
  type: Number,
  min: 0,
  validate: {
    validator: Number.isInteger,
    message: "Value must be an integer.",
  },
};

const cardIdsField = {
  type: [String],
  required: true,
  validate: {
    validator: function (cards) {
      return (
        Array.isArray(cards) &&
        cards.length === 10 &&
        new Set(cards).size === 10
      );
    },
    message: "Player must have exactly 10 unique cards.",
  },
};

const rankedRoundSchema = new mongoose.Schema(
  {
    round: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
      validate: {
        validator: Number.isInteger,
        message: "Round must be an integer.",
      },
    },

    position: {
      type: String,
      required: true,
      trim: true,
    },

    positionName: {
      type: String,
      required: true,
      trim: true,
    },

    positionIcon: {
      type: String,
      default: "",
      trim: true,
    },

    winner: {
      type: String,
      enum: ["player1", "player2", "draw"],
      required: true,
    },

    damage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    damagedPlayer: {
      type: String,
      enum: ["player1", "player2", null],
      default: null,
    },

    pointTo: {
      type: String,
      enum: ["player1", "player2", null],
      default: null,
    },

    player1HP: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    player2HP: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    player1Power: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },

    player2Power: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },

    player1CardId: {
      type: String,
      required: true,
      trim: true,
    },

    player2CardId: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const rankedMatchSchema = new mongoose.Schema(
  {
    matchId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    player1: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      username: {
        type: String,
        required: true,
        trim: true,
      },

      cardIds: cardIdsField,
    },

    player2: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      username: {
        type: String,
        required: true,
        trim: true,
      },

      cardIds: cardIdsField,
    },

    winner: {
      type: String,
      enum: ["player1", "player2", "draw", null],
      default: null,
    },

    player1FinalHP: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },

    player2FinalHP: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },

    player1Score: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
      validate: {
        validator: Number.isInteger,
        message: "Player 1 score must be an integer.",
      },
    },

    player2Score: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
      validate: {
        validator: Number.isInteger,
        message: "Player 2 score must be an integer.",
      },
    },

    rounds: {
      type: [rankedRoundSchema],
      default: [],
      validate: {
        validator: function (rounds) {
          return Array.isArray(rounds) && rounds.length <= 10;
        },
        message: "A ranked match cannot contain more than 10 rounds.",
      },
    },

    resultProcessed: {
      type: Boolean,
      default: false,
    },

    rewardsProcessed: {
      type: Boolean,
      default: false,
    },

    player1RatingChange: {
      type: Number,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: "Player 1 rating change must be an integer.",
      },
    },

    player2RatingChange: {
      type: Number,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: "Player 2 rating change must be an integer.",
      },
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    finishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

rankedMatchSchema.index({
  "player1.userId": 1,
  startedAt: -1,
});

rankedMatchSchema.index({
  "player2.userId": 1,
  startedAt: -1,
});

module.exports = mongoose.model("RankedMatch", rankedMatchSchema);
