const Card = require("../models/Card");
const PlayerCard = require("../models/PlayerCard");

const normalizeRating = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 1;
  }

  return Math.round(Math.min(100, Math.max(1, number)));
};

const calculateOverallPower = ({
  hp,
  roles,
  general,
  specialRole,
  powerCategories,
}) => {
  const ratingValues = [
    normalizeRating(hp),
    normalizeRating(roles?.swordsman),
    normalizeRating(roles?.mage),
    normalizeRating(roles?.warrior),
    normalizeRating(roles?.tank),
    normalizeRating(roles?.healer),
    normalizeRating(general?.speed),
    normalizeRating(general?.strength),
    normalizeRating(general?.intelligence),
    normalizeRating(general?.leadership),
    normalizeRating(general?.race),
    normalizeRating(specialRole?.power),
    ...(Array.isArray(powerCategories)
      ? powerCategories.map((category) => normalizeRating(category?.power))
      : []),
  ];

  const total = ratingValues.reduce((sum, value) => sum + value, 0);

  return Number((total / ratingValues.length).toFixed(2));
};

const parseJSON = (value, defaultValue) => {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    throw new Error("Invalid JSON data");
  }
};

const cleanRoles = (roles = {}) => ({
  swordsman: normalizeRating(roles?.swordsman),
  mage: normalizeRating(roles?.mage),
  warrior: normalizeRating(roles?.warrior),
  tank: normalizeRating(roles?.tank),
  healer: normalizeRating(roles?.healer),
});

const cleanGeneral = (general = {}) => ({
  speed: normalizeRating(general?.speed),
  strength: normalizeRating(general?.strength),
  intelligence: normalizeRating(general?.intelligence),
  leadership: normalizeRating(general?.leadership),
  race: normalizeRating(general?.race),
});

const cleanSpecialRole = (specialRole = {}) => ({
  name:
    typeof specialRole?.name === "string"
      ? specialRole.name.trim()
      : "",
  power: normalizeRating(specialRole?.power),
});

const cleanPowerCategories = (powerCategories) => {
  if (!Array.isArray(powerCategories)) {
    return [];
  }

  return powerCategories
    .filter(
      (category) =>
        category &&
        typeof category.name === "string" &&
        category.name.trim() !== "",
    )
    .map((category) => ({
      name: category.name.trim(),
      power: normalizeRating(category.power),
    }));
};

const getText = (value) =>
  typeof value === "string" ? value.trim() : "";

const getCards = async (req, res) => {
  try {
    const cards = await Card.find().sort({
      createdAt: -1,
    });

    return res.status(200).json(cards);
  } catch (error) {
    console.error("Get cards error:", error);

    return res.status(500).json({
      message: "Failed to fetch cards",
    });
  }
};

const getMyCollection = async (req, res) => {
  try {
    const playerCards = await PlayerCard.find({
      userId: req.user.id,
    }).sort({
      obtainedAt: 1,
    });

    return res.status(200).json({
      cards: playerCards,
    });
  } catch (error) {
    console.error("Get my collection error:", error);

    return res.status(500).json({
      message: "Failed to fetch card collection",
    });
  }
};

const getCard = async (req, res) => {
  try {
    const card = await Card.findOne({
      id: getText(req.params.id),
    });

    if (!card) {
      return res.status(404).json({
        message: "Card not found",
      });
    }

    return res.status(200).json(card);
  } catch (error) {
    console.error("Get card error:", error);

    return res.status(500).json({
      message: "Failed to fetch card",
    });
  }
};

const createCard = async (req, res) => {
  try {
    const id = getText(req.body.id);
    const name = getText(req.body.name);
    const anime = getText(req.body.anime);
    const position = getText(req.body.position);
    const gender = getText(req.body.gender);
    const race = getText(req.body.race);
    const affiliation = getText(req.body.affiliation);
    const famousDialogue = getText(req.body.famousDialogue);

    if (
      !id ||
      !name ||
      !anime ||
      !position ||
      !gender ||
      !race ||
      !affiliation ||
      !famousDialogue
    ) {
      return res.status(400).json({
        message:
          "id, name, anime, position, gender, race, affiliation and famousDialogue are required",
      });
    }

    const existingCard = await Card.findOne({ id });

    if (existingCard) {
      return res.status(409).json({
        message: "A card with this ID already exists",
      });
    }

    let roles;
    let general;
    let specialRole;
    let powerCategories;

    try {
      roles = parseJSON(req.body.roles, {});
      general = parseJSON(req.body.general, {});
      specialRole = parseJSON(req.body.specialRole, {});
      powerCategories = parseJSON(req.body.powerCategories, []);
    } catch (error) {
      return res.status(400).json({
        message:
          "Invalid JSON data in roles, general, specialRole or powerCategories",
        error: error.message,
      });
    }

    roles = cleanRoles(roles);
    general = cleanGeneral(general);
    specialRole = cleanSpecialRole(specialRole);
    powerCategories = cleanPowerCategories(powerCategories);

    const hp = normalizeRating(req.body.hp);

    const cardData = {
      id,
      name,
      anime,
      position,
      gender,
      race,
      affiliation,
      famousDialogue,
      hp,
      roles,
      general,
      specialRole,
      powerCategories,
      overallPower: 1,
      image: "",
    };

    if (req.file) {
      cardData.image = `/uploads/cards/${req.file.filename}`;
    }

    cardData.overallPower = calculateOverallPower(cardData);

    const card = await Card.create(cardData);

    return res.status(201).json({
      message: "Card created successfully",
      card,
    });
  } catch (error) {
    console.error("Create card error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Card ID already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Card validation failed",
        error: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to create card",
    });
  }
};

const updateCard = async (req, res) => {
  try {
    const oldId = getText(req.params.id);

    const existingCard = await Card.findOne({
      id: oldId,
    });

    if (!existingCard) {
      return res.status(404).json({
        message: "Card not found",
      });
    }

    const requestedId =
      req.body.id !== undefined
        ? getText(req.body.id)
        : oldId;

    if (!requestedId) {
      return res.status(400).json({
        message: "Card ID cannot be empty",
      });
    }

    if (requestedId !== oldId) {
      const referencedPlayerCard = await PlayerCard.exists({
        cardId: oldId,
      });

      if (referencedPlayerCard) {
        return res.status(409).json({
          message:
            "Card ID cannot be changed because players already own this card",
          id: oldId,
        });
      }

      const duplicateCard = await Card.findOne({
        id: requestedId,
      });

      if (duplicateCard) {
        return res.status(409).json({
          message: "Another card already uses this ID",
          id: requestedId,
        });
      }
    }

    let roles;
    let general;
    let specialRole;
    let powerCategories;

    try {
      roles = parseJSON(req.body.roles, existingCard.roles);
      general = parseJSON(req.body.general, existingCard.general);
      specialRole = parseJSON(
        req.body.specialRole,
        existingCard.specialRole,
      );
      powerCategories = parseJSON(
        req.body.powerCategories,
        existingCard.powerCategories,
      );
    } catch (error) {
      return res.status(400).json({
        message: "Invalid JSON data in card fields",
        error: error.message,
      });
    }

    roles = cleanRoles(roles);
    general = cleanGeneral(general);
    specialRole = cleanSpecialRole(specialRole);
    powerCategories = cleanPowerCategories(powerCategories);

    const name =
      req.body.name !== undefined
        ? getText(req.body.name)
        : existingCard.name;

    const anime =
      req.body.anime !== undefined
        ? getText(req.body.anime)
        : existingCard.anime;

    const position =
      req.body.position !== undefined
        ? getText(req.body.position)
        : existingCard.position;

    const gender =
      req.body.gender !== undefined
        ? getText(req.body.gender)
        : existingCard.gender;

    const race =
      req.body.race !== undefined
        ? getText(req.body.race)
        : existingCard.race;

    const affiliation =
      req.body.affiliation !== undefined
        ? getText(req.body.affiliation)
        : existingCard.affiliation;

    const famousDialogue =
      req.body.famousDialogue !== undefined
        ? getText(req.body.famousDialogue)
        : existingCard.famousDialogue;

    if (
      !name ||
      !anime ||
      !position ||
      !gender ||
      !race ||
      !affiliation ||
      !famousDialogue
    ) {
      return res.status(400).json({
        message:
          "name, anime, position, gender, race, affiliation and famousDialogue are required",
      });
    }

    const hp =
      req.body.hp !== undefined
        ? normalizeRating(req.body.hp)
        : normalizeRating(existingCard.hp);

    const updateData = {
      id: requestedId,
      name,
      anime,
      position,
      gender,
      race,
      affiliation,
      famousDialogue,
      hp,
      roles,
      general,
      specialRole,
      powerCategories,
      image: existingCard.image || "",
    };

    if (req.file) {
      updateData.image = `/uploads/cards/${req.file.filename}`;
    }

    updateData.overallPower = calculateOverallPower(updateData);

    const card = await Card.findOneAndUpdate(
      { id: oldId },
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!card) {
      return res.status(404).json({
        message: "Card not found",
      });
    }

    return res.status(200).json({
      message: "Card updated successfully",
      card,
    });
  } catch (error) {
    console.error("Update card error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Another card already uses this ID",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Card validation failed",
        error: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to update card",
    });
  }
};

const deleteCard = async (req, res) => {
  try {
    const cardId = getText(req.params.id);

    if (!cardId) {
      return res.status(400).json({
        message: "Card ID is required",
      });
    }

    const card = await Card.findOne({
      id: cardId,
    });

    if (!card) {
      return res.status(404).json({
        message: "Card not found",
      });
    }

    const playerCardCount = await PlayerCard.countDocuments({
      cardId,
    });

    if (playerCardCount > 0) {
      return res.status(409).json({
        message:
          "Card cannot be deleted because players already own this card",
        cardId,
        playerCardCount,
      });
    }

    await Card.deleteOne({
      id: cardId,
    });

    return res.status(200).json({
      message: "Card deleted successfully",
      card,
    });
  } catch (error) {
    console.error("Delete card error:", error);

    return res.status(500).json({
      message: "Failed to delete card",
    });
  }
};

const createCardsBulk = async (req, res) => {
  try {
    const cards = req.body;

    if (!Array.isArray(cards)) {
      return res.status(400).json({
        message: "Request body must be an array of cards",
      });
    }

    if (cards.length === 0) {
      return res.status(400).json({
        message: "No cards provided",
      });
    }

    const cleanedCards = cards.map((card) => {
      const roles = cleanRoles(card?.roles);
      const general = cleanGeneral(card?.general);
      const specialRole = cleanSpecialRole(card?.specialRole);
      const powerCategories = cleanPowerCategories(
        card?.powerCategories,
      );

      const preparedCard = {
        id: getText(card?.id),
        name: getText(card?.name),
        anime: getText(card?.anime),
        position: getText(card?.position),
        gender: getText(card?.gender),
        race: getText(card?.race),
        affiliation: getText(card?.affiliation),
        famousDialogue: getText(card?.famousDialogue),
        hp: normalizeRating(card?.hp),
        roles,
        general,
        specialRole,
        powerCategories,
        overallPower: 1,
        image: getText(card?.image),
      };

      preparedCard.overallPower =
        calculateOverallPower(preparedCard);

      return preparedCard;
    });

    const invalidCards = cleanedCards.filter(
      (card) =>
        !card.id ||
        !card.name ||
        !card.anime ||
        !card.position ||
        !card.gender ||
        !card.race ||
        !card.affiliation ||
        !card.famousDialogue,
    );

    if (invalidCards.length > 0) {
      return res.status(400).json({
        message: "Some cards are missing required fields",
        invalidCards: invalidCards.map((card) => ({
          id: card.id,
          name: card.name,
        })),
      });
    }

    const ids = cleanedCards.map((card) => card.id);

    const duplicateIds = ids.filter(
      (id, index) => ids.indexOf(id) !== index,
    );

    if (duplicateIds.length > 0) {
      return res.status(400).json({
        message: "Duplicate card IDs found in upload",
        duplicateIds: [...new Set(duplicateIds)],
      });
    }

    const existingCards = await Card.find({
      id: {
        $in: ids,
      },
    }).select("id");

    const existingIds = existingCards.map((card) => card.id);

    if (existingIds.length > 0) {
      return res.status(409).json({
        message: "Some cards already exist",
        existingIds,
      });
    }

    const createdCards = await Card.insertMany(cleanedCards);

    return res.status(201).json({
      message: `${createdCards.length} cards created successfully`,
      count: createdCards.length,
      cards: createdCards,
    });
  } catch (error) {
    console.error("Bulk create cards error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "One or more card IDs already exist",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Card validation failed",
        error: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to create cards",
    });
  }
};

module.exports = {
  getCards,
  getCard,
  getMyCollection,
  createCard,
  createCardsBulk,
  updateCard,
  deleteCard,
};