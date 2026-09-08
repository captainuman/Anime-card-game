const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    favoriteCardId: {
      type: String,
      default: null,
      trim: true,
    },

    rankedTeam: {
      cards: {
        type: [String],
        default: [],
        validate: {
          validator: function (cards) {
            if (!Array.isArray(cards)) {
              return false;
            }

            if (cards.length > 10) {
              return false;
            }

            return new Set(cards).size === cards.length;
          },
          message: "Ranked team must contain a maximum of 10 unique cards.",
        },
      },

      isComplete: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  },
);

userSchema.methods.getRank = function (rating) {
  const normalizedRating = Math.max(0, Number(rating ?? 0));

  if (normalizedRating >= 2500) {
    return "Diamond";
  }

  if (normalizedRating >= 2000) {
    return "Platinum";
  }

  if (normalizedRating >= 1500) {
    return "Gold";
  }

  if (normalizedRating >= 1000) {
    return "Silver";
  }

  return "Bronze";
};

module.exports = mongoose.model("User", userSchema);