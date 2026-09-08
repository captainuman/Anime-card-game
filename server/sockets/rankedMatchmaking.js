const crypto = require("crypto");
const User = require("../models/User");
const Card = require("../models/Card");
const PlayerCard = require("../models/PlayerCard");
const RankedMatch = require("../models/RankedMatch");

const {
  createRankedMatch,
  getRankedMatch,
  setRankedTeams,
  deleteRankedMatch,
} = require("./rankedMatch");

const { positions } = require("../data/positions");

const rankedQueue = [];
const rankedSearchingUsers = new Set();

const RANKED_POSITIONS = positions.map((position) => position.id);
const TOTAL_RANKED_CARDS = RANKED_POSITIONS.length;

async function buildRankedTeam(userId) {
  const user = await User.findById(userId).select(
    "rankedTeam username"
  );

  if (!user) {
    throw new Error("User not found.");
  }

  const cardIds = user.rankedTeam?.cards || [];

  if (cardIds.length !== TOTAL_RANKED_CARDS) {
    throw new Error(
      `Ranked team must contain exactly ${TOTAL_RANKED_CARDS} cards.`
    );
  }

  const normalizedCardIds = cardIds.map((cardId) =>
    String(cardId || "").trim()
  );

  if (
    normalizedCardIds.some((cardId) => !cardId) ||
    new Set(normalizedCardIds).size !== TOTAL_RANKED_CARDS
  ) {
    throw new Error(
      `Ranked team must contain exactly ${TOTAL_RANKED_CARDS} unique cards.`
    );
  }

  const playerCards = await PlayerCard.find({
    userId,
    cardId: { $in: normalizedCardIds },
  }).lean();

  if (playerCards.length !== normalizedCardIds.length) {
    throw new Error(
      "All ranked team cards must belong to your collection."
    );
  }

  const playerCardMap = new Map(
    playerCards.map((card) => [String(card.cardId), card])
  );

  const masterCards = await Card.find({
    id: { $in: normalizedCardIds },
  }).lean();

  if (masterCards.length !== normalizedCardIds.length) {
    throw new Error(
      "Some ranked team cards no longer exist in the master card collection."
    );
  }

  const masterCardMap = new Map(
    masterCards.map((card) => [String(card.id), card])
  );

  const team = normalizedCardIds.map((cardId, index) => {
    const playerCard = playerCardMap.get(cardId);
    const masterCard = masterCardMap.get(cardId);

    if (!playerCard) {
      throw new Error(
        `Card ${cardId} is not in your collection.`
      );
    }

    if (!masterCard) {
      throw new Error(
        `Master card ${cardId} was not found.`
      );
    }

    if (Number(playerCard.hp ?? 0) <= 0) {
      throw new Error(
        `Card ${cardId} has no HP remaining.`
      );
    }

    return {
      cardId,
      position: RANKED_POSITIONS[index],

      name: masterCard.name,
      anime: masterCard.anime,
      image: masterCard.image || "",

      hp: Number(playerCard.hp ?? 0),

      overallPower: Number(
        masterCard.overallPower ?? 1
      ),

      roles: {
        swordsman: Number(
          masterCard.roles?.swordsman ?? 1
        ),
        mage: Number(
          masterCard.roles?.mage ?? 1
        ),
        warrior: Number(
          masterCard.roles?.warrior ?? 1
        ),
        tank: Number(
          masterCard.roles?.tank ?? 1
        ),
        healer: Number(
          masterCard.roles?.healer ?? 1
        ),
      },

      general: {
        speed: Number(
          masterCard.general?.speed ?? 1
        ),
        strength: Number(
          masterCard.general?.strength ?? 1
        ),
        intelligence: Number(
          masterCard.general?.intelligence ?? 1
        ),
        leadership: Number(
          masterCard.general?.leadership ?? 1
        ),
        race: Number(
          masterCard.general?.race ?? 1
        ),
      },

      specialRole: {
        name: masterCard.specialRole?.name || "",
        power: Number(
          masterCard.specialRole?.power ?? 1
        ),
      },

      powerCategories: Array.isArray(
        masterCard.powerCategories
      )
        ? masterCard.powerCategories.map((power) => ({
            name: power?.name || "",
            power: Number(power?.power ?? 1),
          }))
        : [],
    };
  });

  return {
    userId: String(user._id),
    username: user.username,
    cards: team,
  };
}

function removeUserFromQueue(userId) {
  if (!userId) {
    return;
  }

  const normalizedUserId = String(userId);

  for (
    let index = rankedQueue.length - 1;
    index >= 0;
    index -= 1
  ) {
    if (
      String(rankedQueue[index].userId) ===
      normalizedUserId
    ) {
      rankedQueue.splice(index, 1);
    }
  }

  rankedSearchingUsers.delete(normalizedUserId);
}

function removeSocketFromQueue(socketId) {
  if (!socketId) {
    return;
  }

  const normalizedSocketId = String(socketId);

  for (
    let index = rankedQueue.length - 1;
    index >= 0;
    index -= 1
  ) {
    if (
      String(rankedQueue[index].socketId) !==
      normalizedSocketId
    ) {
      continue;
    }

    rankedSearchingUsers.delete(
      String(rankedQueue[index].userId)
    );

    rankedQueue.splice(index, 1);
  }
}

function findQueuedOpponent(userId) {
  const normalizedUserId = String(userId);

  return (
    rankedQueue.find(
      (entry) =>
        String(entry.userId) !== normalizedUserId &&
        entry.userId &&
        entry.socketId
    ) || null
  );
}

function requeuePlayer(entry) {
  if (!entry?.userId || !entry?.socketId) {
    return false;
  }

  const userId = String(entry.userId);
  const socketId = String(entry.socketId);

  if (rankedSearchingUsers.has(userId)) {
    return false;
  }

  if (
    rankedQueue.some(
      (item) =>
        String(item.userId) === userId ||
        String(item.socketId) === socketId
    )
  ) {
    return false;
  }

  rankedSearchingUsers.add(userId);

  rankedQueue.push({
    userId,
    username:
      String(entry.username || "Player").trim() ||
      "Player",
    socketId,
    joinedAt: Date.now(),
  });

  return true;
}

async function tryCreateRankedMatch(io, entry) {
  const opponent = findQueuedOpponent(entry.userId);

  if (!opponent) {
    return null;
  }

  removeUserFromQueue(entry.userId);
  removeUserFromQueue(opponent.userId);

  const player1Socket = io.sockets.sockets.get(
    entry.socketId
  );

  const player2Socket = io.sockets.sockets.get(
    opponent.socketId
  );

  if (!player1Socket || !player2Socket) {
    if (player1Socket) {
      requeuePlayer(entry);
    }

    if (player2Socket) {
      requeuePlayer(opponent);
    }

    return null;
  }

  let matchId = null;

  try {
    const player1 = await buildRankedTeam(
      entry.userId
    );

    const player2 = await buildRankedTeam(
      opponent.userId
    );

    matchId = crypto.randomUUID();

    createRankedMatch({
      matchId,

      player1: {
        userId: player1.userId,
        username: player1.username,
        socketId: entry.socketId,
      },

      player2: {
        userId: player2.userId,
        username: player2.username,
        socketId: opponent.socketId,
      },
    });

    setRankedTeams(
      matchId,
      player1.cards,
      player2.cards
    );

    const storedMatch = getRankedMatch(matchId);

    if (!storedMatch) {
      throw new Error(
        "Failed to create ranked match."
      );
    }

    await RankedMatch.create({
      matchId,

      player1: {
        userId: player1.userId,
        username: player1.username,
        cardIds: player1.cards.map((card) =>
          String(card.cardId)
        ),
      },

      player2: {
        userId: player2.userId,
        username: player2.username,
        cardIds: player2.cards.map((card) =>
          String(card.cardId)
        ),
      },

      winner: null,

      player1FinalHP: 100,
      player2FinalHP: 100,

      player1Score: 0,
      player2Score: 0,

      rounds: [],

      resultProcessed: false,
      rewardsProcessed: false,

      player1RatingChange: 0,
      player2RatingChange: 0,
    });

    const room = storedMatch.room || matchId;

    player1Socket.join(room);
    player2Socket.join(room);

    player1Socket.emit(
      "ranked-match-found",
      {
        matchId,
        player: storedMatch.player1,
        opponent: storedMatch.player2,
        positions: storedMatch.positions,
      }
    );

    player2Socket.emit(
      "ranked-match-found",
      {
        matchId,
        player: storedMatch.player2,
        opponent: storedMatch.player1,
        positions: storedMatch.positions,
      }
    );

    return storedMatch;
  } catch (error) {
    if (matchId) {
      deleteRankedMatch(matchId);
    }

    requeuePlayer(entry);
    requeuePlayer(opponent);

    player1Socket.emit(
      "ranked-match-error",
      {
        message:
          error.message ||
          "Failed to create ranked match.",
      }
    );

    player2Socket.emit(
      "ranked-match-error",
      {
        message:
          error.message ||
          "Failed to create ranked match.",
      }
    );

    return null;
  }
}

function registerRankedMatchmaking(io) {
  io.on("connection", (socket) => {
    socket.on(
      "find-ranked-match",
      async () => {
        try {
          const userId =
            socket.user?.id ||
            socket.user?._id;

          const username =
            socket.user?.username ||
            "Player";

          if (!userId) {
            socket.emit(
              "ranked-match-error",
              {
                message:
                  "Authentication required.",
              }
            );

            return;
          }

          const normalizedUserId =
            String(userId).trim();

          if (!normalizedUserId) {
            socket.emit(
              "ranked-match-error",
              {
                message:
                  "Authentication required.",
              }
            );

            return;
          }

          if (
            rankedSearchingUsers.has(
              normalizedUserId
            )
          ) {
            socket.emit(
              "ranked-match-error",
              {
                message:
                  "You are already searching for a ranked match.",
              }
            );

            return;
          }

          removeSocketFromQueue(socket.id);

          await buildRankedTeam(
            normalizedUserId
          );

          rankedSearchingUsers.add(
            normalizedUserId
          );

          rankedQueue.push({
            userId: normalizedUserId,
            username:
              String(username).trim() ||
              "Player",
            socketId: socket.id,
            joinedAt: Date.now(),
          });

          socket.emit(
            "ranked-searching",
            {
              message:
                "Searching for a ranked opponent.",
            }
          );

          await tryCreateRankedMatch(io, {
            userId: normalizedUserId,
            username:
              String(username).trim() ||
              "Player",
            socketId: socket.id,
          });
        } catch (error) {
          const userId =
            socket.user?.id ||
            socket.user?._id;

          if (userId) {
            removeUserFromQueue(userId);
          } else {
            removeSocketFromQueue(
              socket.id
            );
          }

          socket.emit(
            "ranked-match-error",
            {
              message:
                error.message ||
                "Failed to find a ranked match.",
            }
          );
        }
      }
    );

    socket.on(
      "cancel-ranked-search",
      () => {
        const userId =
          socket.user?.id ||
          socket.user?._id;

        if (userId) {
          removeUserFromQueue(userId);
        }

        removeSocketFromQueue(socket.id);

        socket.emit(
          "ranked-search-cancelled"
        );
      }
    );

    socket.on("disconnect", () => {
      const userId =
        socket.user?.id ||
        socket.user?._id;

      if (userId) {
        removeUserFromQueue(userId);
      }

      removeSocketFromQueue(socket.id);
    });
  });
}

module.exports = registerRankedMatchmaking;