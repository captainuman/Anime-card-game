const Card = require("../models/Card");
const PlayerCard = require("../models/PlayerCard");
const PlayerStats = require("../models/PlayerStats");
const RankedMatch = require("../models/RankedMatch");

const {
  RATING_WIN,
  RATING_LOSS,
  RATING_DRAW,
} = require("../utils/rankedRating");

const CARDS_PER_DRAW = 10;
const HP_PER_GAME = 5;
const INITIAL_CARD_HP = 100;

async function getOrCreatePlayerStats(userId) {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  let stats = await PlayerStats.findOne({ userId });

  if (!stats) {
    try {
      stats = await PlayerStats.create({
        userId,
      });
    } catch (error) {
      if (error.code === 11000) {
        stats = await PlayerStats.findOne({ userId });
      } else {
        throw error;
      }
    }
  }

  if (!stats) {
    throw new Error("Unable to create player stats.");
  }

  return stats;
}

async function addCardToCollection(userId, card) {
  if (!userId || !card?.id) {
    return null;
  }

  const cardId = String(card.id);

  const existingCard = await PlayerCard.findOne({
    userId,
    cardId,
  });

  if (existingCard) {
    return existingCard;
  }

  try {
    const playerCard = await PlayerCard.create({
      userId,
      cardId,
      name: card.name || "Unknown Character",
      anime: card.anime || "Unknown Anime",
      image: card.image || "",
      hp: INITIAL_CARD_HP,
      rankedGamesUsed: 0,
    });

    const stats = await getOrCreatePlayerStats(userId);

    stats.totalCardsCollected = await PlayerCard.countDocuments({
      userId,
    });

    await stats.save();

    return playerCard;
  } catch (error) {
    if (error.code === 11000) {
      return PlayerCard.findOne({
        userId,
        cardId,
      });
    }

    throw error;
  }
}

async function awardDrawForFiveWins(userId) {
  if (!userId) {
    return null;
  }

  const stats = await getOrCreatePlayerStats(userId);

  stats.applyWinRewardMilestones();
  stats.calculateWinPercentage();

  await stats.save();

  return stats;
}

async function drawRandomCollectionCard(userId) {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  const stats = await getOrCreatePlayerStats(userId);

  if (Number(stats.availableDraws ?? 0) <= 0) {
    throw new Error("No card draws available.");
  }

  const cards = await Card.find({}).lean();

  if (!cards.length) {
    throw new Error("No cards available.");
  }

  const ownedCards = await PlayerCard.find(
    {
      userId,
    },
    {
      cardId: 1,
      _id: 0,
    },
  ).lean();

  const ownedCardIds = new Set(
    ownedCards.map((card) => String(card.cardId)),
  );

  const availableCards = cards.filter(
    (card) => !ownedCardIds.has(String(card.id)),
  );

  if (!availableCards.length) {
    throw new Error(
      "You already own every available card.",
    );
  }

  const randomIndex = Math.floor(
    Math.random() * availableCards.length,
  );

  const selectedCard = availableCards[randomIndex];

  const playerCard = await addCardToCollection(
    userId,
    selectedCard,
  );

  if (!playerCard) {
    throw new Error(
      "Unable to add card to collection.",
    );
  }

  const updatedStats =
    await PlayerStats.findOneAndUpdate(
      {
        _id: stats._id,
        availableDraws: {
          $gt: 0,
        },
      },
      {
        $inc: {
          availableDraws: -1,
        },
      },
      {
        new: true,
      },
    );

  if (!updatedStats) {
    if (
      await PlayerCard.countDocuments({
        userId,
        cardId: selectedCard.id,
      })
    ) {
      throw new Error(
        "Card draw could not be completed.",
      );
    }

    throw new Error("No card draws available.");
  }

  updatedStats.totalCardsCollected =
    await PlayerCard.countDocuments({
      userId,
    });

  await updatedStats.save();

  const playerCardData = playerCard.toObject();

  const completeCard = {
    ...selectedCard,
    ...playerCardData,

    id: selectedCard.id,
    name: selectedCard.name,
    anime: selectedCard.anime,
    position: selectedCard.position,
    gender: selectedCard.gender,
    race: selectedCard.race,
    affiliation: selectedCard.affiliation,
    famousDialogue:
      selectedCard.famousDialogue,
    image: selectedCard.image,

    hp: playerCardData.hp,

    roles: selectedCard.roles,
    general: selectedCard.general,
    specialRole:
      selectedCard.specialRole,
    powerCategories:
      selectedCard.powerCategories,
    overallPower:
      selectedCard.overallPower,
  };

  return {
    card: completeCard,
    remainingDraws:
      updatedStats.availableDraws,
  };
}

async function recordRankedMatch({
  winner,
  player1UserId,
  player2UserId,
}) {
  if (!player1UserId || !player2UserId) {
    throw new Error(
      "Both player IDs are required.",
    );
  }

  if (
    String(player1UserId) ===
    String(player2UserId)
  ) {
    throw new Error(
      "Ranked match requires two different players.",
    );
  }

  if (
    !["player1", "player2", "draw"].includes(
      winner,
    )
  ) {
    throw new Error("Invalid match winner.");
  }

  const player1Stats =
    await getOrCreatePlayerStats(
      player1UserId,
    );

  const player2Stats =
    await getOrCreatePlayerStats(
      player2UserId,
    );

  if (winner === "player1") {
    player1Stats.registerResult("win");
    player2Stats.registerResult("loss");

    player1Stats.rating =
      Number(player1Stats.rating ?? 0) +
      RATING_WIN;

    player2Stats.rating = Math.max(
      0,
      Number(player2Stats.rating ?? 0) -
        RATING_LOSS,
    );
  } else if (winner === "player2") {
    player1Stats.registerResult("loss");
    player2Stats.registerResult("win");

    player1Stats.rating = Math.max(
      0,
      Number(player1Stats.rating ?? 0) -
        RATING_LOSS,
    );

    player2Stats.rating =
      Number(player2Stats.rating ?? 0) +
      RATING_WIN;
  } else {
    player1Stats.registerResult("draw");
    player2Stats.registerResult("draw");

    player1Stats.rating =
      Number(player1Stats.rating ?? 0) +
      RATING_DRAW;

    player2Stats.rating =
      Number(player2Stats.rating ?? 0) +
      RATING_DRAW;
  }

  await player1Stats.save();
  await player2Stats.save();

  return {
    player1: player1Stats,
    player2: player2Stats,
  };
}

async function reduceUsedCardHP(
  userId,
  usedCardIds = [],
) {
  if (
    !userId ||
    !Array.isArray(usedCardIds)
  ) {
    return null;
  }

  const uniqueCardIds = [
    ...new Set(
      usedCardIds
        .filter(Boolean)
        .map(String),
    ),
  ];

  if (!uniqueCardIds.length) {
    return null;
  }

  const now = new Date();

  await PlayerCard.updateMany(
    {
      userId,
      cardId: {
        $in: uniqueCardIds,
      },
    },
    {
      $inc: {
        rankedGamesUsed: 1,
      },
      $set: {
        lastUsedAt: now,
      },
    },
  );

  await PlayerCard.updateMany(
    {
      userId,
      cardId: {
        $in: uniqueCardIds,
      },
      hp: {
        $gte: HP_PER_GAME,
      },
    },
    {
      $inc: {
        hp: -HP_PER_GAME,
      },
    },
  );

  await PlayerCard.updateMany(
    {
      userId,
      cardId: {
        $in: uniqueCardIds,
      },
      hp: {
        $gt: 0,
        $lt: HP_PER_GAME,
      },
    },
    {
      $set: {
        hp: 0,
      },
    },
  );

  return PlayerCard.find({
    userId,
  }).sort({
    obtainedAt: 1,
  });
}

function resolveCardIds(
  cardIds = [],
  cards = [],
) {
  return [
    ...new Set([
      ...cardIds
        .filter(Boolean)
        .map(String),

      ...cards
        .map((card) => card?.id)
        .filter(Boolean)
        .map(String),
    ]),
  ];
}

function buildPlayerRewardStats(
  stats,
  previousWins,
) {
  const currentWins = Number(
    stats.wins ?? 0,
  );

  return {
    wins: currentWins,
    losses: Number(stats.losses ?? 0),
    draws: Number(stats.draws ?? 0),
    totalMatches: Number(
      stats.totalMatches ?? 0,
    ),
    winPercentage: Number(
      stats.winPercentage ?? 0,
    ),
    rating: Number(stats.rating ?? 0),
    rank: stats.getRank(),
    drawAwarded:
      currentWins > previousWins &&
      currentWins > 0 &&
      currentWins % 5 === 0,
    availableDraws: Number(
      stats.availableDraws ?? 0,
    ),
  };
}

async function processRankedMatchRewards({
  matchId,
  winner,
  player1UserId,
  player2UserId,
  player1Cards = [],
  player2Cards = [],
  player1CardIds = [],
  player2CardIds = [],
}) {
  if (!player1UserId || !player2UserId) {
    throw new Error(
      "Both player IDs are required.",
    );
  }

  if (
    String(player1UserId) ===
    String(player2UserId)
  ) {
    throw new Error(
      "Ranked match requires two different players.",
    );
  }

  if (
    !["player1", "player2", "draw"].includes(
      winner,
    )
  ) {
    throw new Error("Invalid match winner.");
  }

  if (matchId) {
    const match = await RankedMatch.findOne({
      matchId: String(matchId),
    });

    if (!match) {
      throw new Error(
        "Ranked match history not found.",
      );
    }

    if (match.rewardsProcessed) {
      const player1Stats =
        await getOrCreatePlayerStats(
          player1UserId,
        );

      const player2Stats =
        await getOrCreatePlayerStats(
          player2UserId,
        );

      return {
        player1: buildPlayerRewardStats(
          player1Stats,
          Number(
            player1Stats.wins ?? 0,
          ),
        ),

        player2: buildPlayerRewardStats(
          player2Stats,
          Number(
            player2Stats.wins ?? 0,
          ),
        ),

        player1Cards:
          await PlayerCard.find({
            userId: player1UserId,
          }).sort({
            obtainedAt: 1,
          }),

        player2Cards:
          await PlayerCard.find({
            userId: player2UserId,
          }).sort({
            obtainedAt: 1,
          }),

        rewards: {
          player1Draws: Number(
            player1Stats.availableDraws ?? 0,
          ),
          player2Draws: Number(
            player2Stats.availableDraws ?? 0,
          ),
        },

        alreadyProcessed: true,
      };
    }
  }

  const player1Before =
    await getOrCreatePlayerStats(
      player1UserId,
    );

  const player2Before =
    await getOrCreatePlayerStats(
      player2UserId,
    );

  const player1PreviousWins =
    Number(player1Before.wins ?? 0);

  const player2PreviousWins =
    Number(player2Before.wins ?? 0);

  const stats = await recordRankedMatch({
    winner,
    player1UserId,
    player2UserId,
  });

  const resolvedPlayer1CardIds =
    resolveCardIds(
      player1CardIds,
      player1Cards,
    );

  const resolvedPlayer2CardIds =
    resolveCardIds(
      player2CardIds,
      player2Cards,
    );

  const updatedPlayer1 =
    await reduceUsedCardHP(
      player1UserId,
      resolvedPlayer1CardIds,
    );

  const updatedPlayer2 =
    await reduceUsedCardHP(
      player2UserId,
      resolvedPlayer2CardIds,
    );

  const player1Stats =
    stats.player1;

  const player2Stats =
    stats.player2;

  player1Stats.totalCardsCollected =
    await PlayerCard.countDocuments({
      userId: player1UserId,
    });

  player2Stats.totalCardsCollected =
    await PlayerCard.countDocuments({
      userId: player2UserId,
    });

  await player1Stats.save();
  await player2Stats.save();

  if (matchId) {
    const processedMatch =
      await RankedMatch.findOneAndUpdate(
        {
          matchId: String(matchId),
          rewardsProcessed: false,
        },
        {
          $set: {
            rewardsProcessed: true,
            resultProcessed: true,
          },
        },
        {
          new: true,
        },
      );

    if (!processedMatch) {
      return processRankedMatchRewards({
        matchId,
        winner,
        player1UserId,
        player2UserId,
        player1Cards,
        player2Cards,
        player1CardIds,
        player2CardIds,
      });
    }
  }

  const player1CardsResult =
    updatedPlayer1 ||
    (await PlayerCard.find({
      userId: player1UserId,
    }).sort({
      obtainedAt: 1,
    }));

  const player2CardsResult =
    updatedPlayer2 ||
    (await PlayerCard.find({
      userId: player2UserId,
    }).sort({
      obtainedAt: 1,
    }));

  return {
    player1: buildPlayerRewardStats(
      player1Stats,
      player1PreviousWins,
    ),

    player2: buildPlayerRewardStats(
      player2Stats,
      player2PreviousWins,
    ),

    player1Cards: player1CardsResult,

    player2Cards: player2CardsResult,

    rewards: {
      player1Draws: Number(
        player1Stats.availableDraws ?? 0,
      ),
      player2Draws: Number(
        player2Stats.availableDraws ?? 0,
      ),
    },

    alreadyProcessed: false,
  };
}

module.exports = {
  CARDS_PER_DRAW,
  HP_PER_GAME,
  INITIAL_CARD_HP,
  getOrCreatePlayerStats,
  addCardToCollection,
  awardDrawForFiveWins,
  drawRandomCollectionCard,
  recordRankedMatch,
  reduceUsedCardHP,
  processRankedMatchRewards,
};