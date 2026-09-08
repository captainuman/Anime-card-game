const mongoose = require("mongoose");

const ratingField = {
  type: Number,
  min: 1,
  max: 100,
  default: 1,
};

const cardSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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

    position: {
      type: String,
      required: true,
      trim: true,
    },

    gender: {
      type: String,
      required: true,
      trim: true,
    },

    race: {
      type: String,
      required: true,
      trim: true,
    },

    affiliation: {
      type: String,
      required: true,
      trim: true,
    },

    famousDialogue: {
      type: String,
      required: true,
      trim: true,
    },

    hp: ratingField,

    roles: {
      swordsman: ratingField,
      mage: ratingField,
      warrior: ratingField,
      tank: ratingField,
      healer: ratingField,
    },

    general: {
      speed: ratingField,
      strength: ratingField,
      intelligence: ratingField,
      leadership: ratingField,
      race: ratingField,
    },

    specialRole: {
      name: {
        type: String,
        default: "",
        trim: true,
      },
      power: ratingField,
    },

    powerCategories: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        power: ratingField,
      },
    ],

    overallPower: ratingField,

    image: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Card", cardSchema);
