const {
  getRankedMatch,
  getCurrentRankedPosition,
  advanceRankedRound,
  finishRankedMatch,
  setPlayerReady,
  areBothPlayersReady,
  TOTAL_ROUNDS,
} = require("./rankedMatch");

const {
  executeOnlineBattle,
  INITIAL_HP,
} = require("../utils/onlineBattleEngine");

const {
  processRankedMatchRewards,
} = require("../services/cardRewardServices");

const Card = require("../models/Card");

function getPlayerCard(match, playerKey, positionIndex) {
  const player = match?.[playerKey];

  if (!player || !Array.isArray(player.cards)) {
    return null;
  }

  return player.cards[positionIndex] || null;
}

function getCardId(card) {
  if (!card) {
    return null;
  }

  return String(
    card.cardId || card.id || "",
  ).trim() || null;
}

function getSocketUserId(socket) {
  const userId =
    socket?.user?.id ||
    socket?.user?._id ||
    socket?.userId ||
    null;

  if (!userId) {
    return null;
  }

  return String(userId).trim() || null;
}

function getAuthenticatedMatchPlayer(match, socket) {
  const userId = getSocketUserId(socket);

  if (!userId) {
    return null;
  }

  if (
    String(match?.player1?.userId || "") === userId
  ) {
    return {
      key: "player1",
      player: match.player1,
    };
  }

  if (
    String(match?.player2?.userId || "") === userId
  ) {
    return {
      key: "player2",
      player: match.player2,
    };
  }

  return null;
}

function getRankedCardIds(match, playerKey) {
  const player = match?.[playerKey];

  if (!Array.isArray(player?.cards)) {
    return [];
  }

  return player.cards
    .map(getCardId)
    .filter(Boolean);
}

function normalizeHP(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return INITIAL_HP;
  }

  return Math.min(
    INITIAL_HP,
    Math.max(0, number),
  );
}

function emitRankedError(
  socket,
  message,
  matchId = null,
) {
  if (!socket) {
    return;
  }

  socket.emit("ranked-battle-error", {
    matchId,
    message,
  });
}

function getRoom(match) {
  return match?.room || match?.matchId;
}

function initializeRoundReady(match, roundNumber) {
  if (!match) {
    return;
  }

  const round = Number(roundNumber || 1);

  match.roundReady = {
    round,
    player1: false,
    player2: false,
  };
}

function getRoundReady(match, roundNumber) {
  const round = Number(roundNumber || 1);

  if (
    !match.roundReady ||
    Number(match.roundReady.round) !== round
  ) {
    initializeRoundReady(match, round);
  }

  return match.roundReady;
}

function markRoundPlayerReady(
  match,
  playerKey,
  roundNumber,
) {
  if (!match) {
    return null;
  }

  const ready = getRoundReady(
    match,
    roundNumber,
  );

  if (
    playerKey !== "player1" &&
    playerKey !== "player2"
  ) {
    return ready;
  }

  ready[playerKey] = true;

  return ready;
}

function areBothRoundPlayersReady(
  match,
  roundNumber,
) {
  const ready = getRoundReady(
    match,
    roundNumber,
  );

  return (
    Boolean(ready.player1) &&
    Boolean(ready.player2)
  );
}

async function loadBattleCard(card) {
  const cardId = getCardId(card);

  if (!cardId) {
    return null;
  }

  const masterCard = await Card.findOne({
    id: cardId,
  }).lean();

  if (!masterCard) {
    throw new Error(
      `Master card not found: ${cardId}`,
    );
  }

  return {
    ...masterCard,
    cardId,
    hp: normalizeHP(card.hp),
  };
}

async function processRankedRound(
  io,
  matchId,
) {
  const match = getRankedMatch(matchId);

  if (!match) {
    return null;
  }

  if (
    match.finished ||
    match.rewardsProcessed ||
    match.rewardProcessing
  ) {
    return null;
  }

  if (match.battleInProgress) {
    return null;
  }

  const roundNumber = Number(
    match.currentRound || 1,
  );

  if (
    !Number.isInteger(roundNumber) ||
    roundNumber < 1 ||
    roundNumber > TOTAL_ROUNDS
  ) {
    return null;
  }

  if (
    !areBothRoundPlayersReady(
      match,
      roundNumber,
    )
  ) {
    return null;
  }

  const position =
    getCurrentRankedPosition(match);

  if (!position) {
    const room = getRoom(match);

    io.to(room).emit(
      "ranked-battle-error",
      {
        matchId: match.matchId,
        message:
          "Unable to determine the current ranked position.",
      },
    );

    return null;
  }

  const positionIndex = roundNumber - 1;

  const player1Card = getPlayerCard(
    match,
    "player1",
    positionIndex,
  );

  const player2Card = getPlayerCard(
    match,
    "player2",
    positionIndex,
  );

  if (!player1Card || !player2Card) {
    const room = getRoom(match);

    io.to(room).emit(
      "ranked-battle-error",
      {
        matchId: match.matchId,
        message:
          "Ranked battle cards are missing.",
      },
    );

    return null;
  }

  match.battleInProgress = true;

  try {
    const player1BattleCard =
      await loadBattleCard(player1Card);

    const player2BattleCard =
      await loadBattleCard(player2Card);

    if (
      !player1BattleCard ||
      !player2BattleCard
    ) {
      throw new Error(
        "Unable to load ranked battle card data.",
      );
    }

    console.log(
      "⚔️ Ranked battle card stats:",
      {
        round: roundNumber,
        position:
          position.id || position.name,
        player1: {
          cardId:
            player1BattleCard.cardId,
          name:
            player1BattleCard.name,
          overallPower:
            player1BattleCard.overallPower,
          roles:
            player1BattleCard.roles,
          general:
            player1BattleCard.general,
          specialRole:
            player1BattleCard.specialRole,
          powerCategories:
            player1BattleCard.powerCategories,
        },
        player2: {
          cardId:
            player2BattleCard.cardId,
          name:
            player2BattleCard.name,
          overallPower:
            player2BattleCard.overallPower,
          roles:
            player2BattleCard.roles,
          general:
            player2BattleCard.general,
          specialRole:
            player2BattleCard.specialRole,
          powerCategories:
            player2BattleCard.powerCategories,
        },
      },
    );

    const player1HP = normalizeHP(
      match.player1?.hp,
    );

    const player2HP = normalizeHP(
      match.player2?.hp,
    );

    const battleResult =
      executeOnlineBattle({
        player1Card:
          player1BattleCard,
        player2Card:
          player2BattleCard,
        positionId:
          position.id ||
          position.name,
        positionName:
          position.name || "",
        icon:
          position.icon || "",
        player1HP,
        player2HP,
      });

    const nextPlayer1HP =
      normalizeHP(
        battleResult.player1HP,
      );

    const nextPlayer2HP =
      normalizeHP(
        battleResult.player2HP,
      );

    match.player1.hp =
      nextPlayer1HP;

    match.player2.hp =
      nextPlayer2HP;

    if (
      battleResult.winner ===
      "player1"
    ) {
      match.player1Score =
        Number(
          match.player1Score || 0,
        ) + 1;
    }

    if (
      battleResult.winner ===
      "player2"
    ) {
      match.player2Score =
        Number(
          match.player2Score || 0,
        ) + 1;
    }

    const roundResult = {
      round: roundNumber,
      position:
        position.id ||
        position.name ||
        "",
      positionName:
        position.name || "",
      positionIcon:
        position.icon || "",
      winner:
        battleResult.winner ||
        "draw",
      damage:
        Number(
          battleResult.damage || 0,
        ),
      damagedPlayer:
        battleResult.damagedPlayer ||
        null,
      pointTo:
        battleResult.pointTo ||
        null,
      player1HP:
        nextPlayer1HP,
      player2HP:
        nextPlayer2HP,
      player1Power:
        Number(
          battleResult.player1Power ??
            1,
        ),
      player2Power:
        Number(
          battleResult.player2Power ??
            1,
        ),
      player1CardId:
        getCardId(
          player1BattleCard,
        ),
      player2CardId:
        getCardId(
          player2BattleCard,
        ),
    };

    if (!Array.isArray(match.rounds)) {
      match.rounds = [];
    }

    if (!Array.isArray(match.results)) {
      match.results = [];
    }

    match.rounds.push(roundResult);
    match.results.push(roundResult);

    match.battleInProgress = false;

    const room = getRoom(match);

    io.to(room).emit(
      "ranked-round-result",
      {
        matchId: match.matchId,
        ...roundResult,
      },
    );

    if (
      roundNumber >= TOTAL_ROUNDS
    ) {
      let winner = "draw";
      let reason = "draw";

      if (
        nextPlayer1HP >
        nextPlayer2HP
      ) {
        winner = "player1";
        reason = "final-hp";
      } else if (
        nextPlayer2HP >
        nextPlayer1HP
      ) {
        winner = "player2";
        reason = "final-hp";
      } else {
        const player1Score =
          Number(
            match.player1Score || 0,
          );

        const player2Score =
          Number(
            match.player2Score || 0,
          );

        if (
          player1Score >
          player2Score
        ) {
          winner = "player1";
          reason = "round-score";
        } else if (
          player2Score >
          player1Score
        ) {
          winner = "player2";
          reason = "round-score";
        }
      }

      return completeRankedMatch(
        io,
        match.matchId,
        winner,
        reason,
      );
    }

    advanceRankedRound(
      match.matchId,
    );

    const updatedMatch =
      getRankedMatch(
        match.matchId,
      );

    if (!updatedMatch) {
      return null;
    }

    const nextRound = Number(
      updatedMatch.currentRound ||
        roundNumber + 1,
    );

    initializeRoundReady(
      updatedMatch,
      nextRound,
    );

    console.log(
      "⏸️ Ranked battle waiting for both players:",
      {
        matchId:
          updatedMatch.matchId,
        nextRound,
        message:
          "Both players must press NEXT ROUND.",
      },
    );

    return roundResult;
  } catch (error) {
    match.battleInProgress = false;

    console.error(
      "Ranked round processing error:",
      error,
    );

    const room = getRoom(match);

    io.to(room).emit(
      "ranked-battle-error",
      {
        matchId: match.matchId,
        message:
          error.message ||
          "Failed to process ranked round.",
      },
    );

    return null;
  }
}

async function completeRankedMatch(
  io,
  matchId,
  winner,
  reason = "completed",
) {
  const match = getRankedMatch(matchId);

  if (!match) {
    return null;
  }

  if (
    match.finished ||
    match.rewardsProcessed ||
    match.rewardProcessing
  ) {
    return match;
  }

  if (
    winner !== "player1" &&
    winner !== "player2" &&
    winner !== "draw"
  ) {
    winner = "draw";
  }

  match.rewardProcessing = true;

  try {
    const player1UserId =
      String(
        match.player1?.userId || "",
      );

    const player2UserId =
      String(
        match.player2?.userId || "",
      );

    const player1CardIds =
      getRankedCardIds(
        match,
        "player1",
      );

    const player2CardIds =
      getRankedCardIds(
        match,
        "player2",
      );

    const rewards =
      await processRankedMatchRewards({
        matchId:
          match.matchId,
        winner,
        player1UserId,
        player2UserId,
        player1CardIds,
        player2CardIds,
      });

    match.rewards = rewards;
    match.rewardsProcessed = true;
    match.rewardProcessing = false;
    match.resultReason = reason;

    const finalMatch =
      finishRankedMatch(
        match.matchId,
        winner,
      );

    if (finalMatch) {
      finalMatch.resultReason =
        reason;

      finalMatch.player1FinalHP =
        normalizeHP(
          match.player1?.hp,
        );

      finalMatch.player2FinalHP =
        normalizeHP(
          match.player2?.hp,
        );

      finalMatch.player1Score =
        Number(
          match.player1Score || 0,
        );

      finalMatch.player2Score =
        Number(
          match.player2Score || 0,
        );
    }

    const result = {
      matchId: match.matchId,
      winner,
      reason,
      player1FinalHP:
        normalizeHP(
          match.player1?.hp,
        ),
      player2FinalHP:
        normalizeHP(
          match.player2?.hp,
        ),
      player1Score:
        Number(
          match.player1Score || 0,
        ),
      player2Score:
        Number(
          match.player2Score || 0,
        ),
      rounds:
        Array.isArray(match.rounds)
          ? match.rounds
          : [],
      rewards,
      match:
        finalMatch || match,
    };

    const room = getRoom(match);

    io.to(room).emit(
      "ranked-match-finished",
      result,
    );

    return finalMatch || match;
  } catch (error) {
    match.rewardProcessing = false;

    console.error(
      "Ranked match completion error:",
      error,
    );

    const room = getRoom(match);

    io.to(room).emit(
      "ranked-battle-error",
      {
        matchId: match.matchId,
        message:
          error.message ||
          "Failed to complete ranked match.",
      },
    );

    return null;
  }
}

async function completeRankedMatchForfeit(
  io,
  matchId,
  disconnectedSocketId,
) {
  const match =
    getRankedMatch(matchId);

  if (!match) {
    return null;
  }

  if (
    match.finished ||
    match.rewardsProcessed ||
    match.rewardProcessing
  ) {
    return match;
  }

  let winner = "draw";

  if (
    match.player1?.socketId ===
    disconnectedSocketId
  ) {
    winner = "player2";
  } else if (
    match.player2?.socketId ===
    disconnectedSocketId
  ) {
    winner = "player1";
  }

  const result =
    await completeRankedMatch(
      io,
      matchId,
      winner,
      "opponent-left",
    );

  const room = getRoom(match);

  io.to(room).emit(
    "ranked-opponent-left",
    {
      matchId,
      winner,
    },
  );

  return result;
}

async function startRankedBattle(
  io,
  socket,
  matchId,
) {
  const normalizedMatchId =
    String(matchId || "").trim();

  if (!normalizedMatchId) {
    emitRankedError(
      socket,
      "Match ID is required.",
    );
    return;
  }

  let match =
    getRankedMatch(
      normalizedMatchId,
    );

  if (!match) {
    emitRankedError(
      socket,
      "Ranked match not found.",
      normalizedMatchId,
    );
    return;
  }

  if (match.finished) {
    emitRankedError(
      socket,
      "This ranked match has already finished.",
      normalizedMatchId,
    );
    return;
  }

  const authenticatedPlayer =
    getAuthenticatedMatchPlayer(
      match,
      socket,
    );

  if (!authenticatedPlayer) {
    emitRankedError(
      socket,
      "You are not a player in this ranked match.",
      normalizedMatchId,
    );
    return;
  }

  try {
    const room = getRoom(match);

    socket.join(room);

    const readyMatch =
      setPlayerReady(
        normalizedMatchId,
        socket.id,
        true,
      );

    match =
      getRankedMatch(
        normalizedMatchId,
      );

    if (!match) {
      emitRankedError(
        socket,
        "Ranked match disappeared while preparing the battle.",
        normalizedMatchId,
      );
      return;
    }

    if (!readyMatch) {
      console.error(
        "❌ Ranked ready state could not be updated:",
        {
          matchId:
            normalizedMatchId,
          socketId:
            socket.id,
          userId:
            getSocketUserId(socket),
          player:
            authenticatedPlayer.key,
          players:
            match.players,
        },
      );

      emitRankedError(
        socket,
        "Unable to mark this player as ready.",
        normalizedMatchId,
      );

      return;
    }

    const readyPlayer =
      match.players?.find(
        (player) =>
          player.playerKey ===
          authenticatedPlayer.key,
      );

    if (readyPlayer) {
      readyPlayer.ready = true;
    }

    match[
      authenticatedPlayer.key
    ].ready = true;

    console.log(
      "🏁 Ranked player ready:",
      {
        matchId:
          normalizedMatchId,
        socketId:
          socket.id,
        userId:
          getSocketUserId(socket),
        player:
          authenticatedPlayer.key,
        player1Ready:
          Boolean(
            match.player1?.ready,
          ),
        player2Ready:
          Boolean(
            match.player2?.ready,
          ),
      },
    );

    if (match.battleStarted) {
      return;
    }

    const bothReady =
      areBothPlayersReady(
        normalizedMatchId,
      );

    if (!bothReady) {
      socket.emit(
        "ranked-player-ready",
        {
          matchId:
            normalizedMatchId,
          message:
            "Waiting for your opponent to be ready...",
        },
      );

      return;
    }

    match.battleStarted = true;
    match.battleInProgress = false;
    match.currentRound = 1;

    match.player1.hp =
      normalizeHP(
        match.player1?.hp ??
          INITIAL_HP,
      );

    match.player2.hp =
      normalizeHP(
        match.player2?.hp ??
          INITIAL_HP,
      );

    initializeRoundReady(
      match,
      1,
    );

    console.log(
      "⚔️ BOTH RANKED PLAYERS READY:",
      normalizedMatchId,
    );

    io.to(room).emit(
      "ranked-battle-started",
      {
        matchId:
          normalizedMatchId,
        rounds:
          TOTAL_ROUNDS,
        currentRound: 1,
        round: 1,
        position:
          getCurrentRankedPosition(
            match,
          ) || null,
        positions:
          match.positions || [],
        player1HP:
          normalizeHP(
            match.player1?.hp,
          ),
        player2HP:
          normalizeHP(
            match.player2?.hp,
          ),
        waitingForPlayers: true,
      },
    );
  } catch (error) {
    console.error(
      "Start ranked battle error:",
      error,
    );

    emitRankedError(
      socket,
      error.message ||
        "Failed to start ranked battle.",
      normalizedMatchId,
    );
  }
}

async function handleRankedNextRound(
  io,
  socket,
  matchId,
) {
  const normalizedMatchId =
    String(matchId || "").trim();

  if (!normalizedMatchId) {
    emitRankedError(
      socket,
      "Match ID is required.",
    );
    return;
  }

  const match =
    getRankedMatch(
      normalizedMatchId,
    );

  if (!match) {
    emitRankedError(
      socket,
      "Ranked match not found.",
      normalizedMatchId,
    );
    return;
  }

  if (match.finished) {
    emitRankedError(
      socket,
      "This ranked match has already finished.",
      normalizedMatchId,
    );
    return;
  }

  if (!match.battleStarted) {
    emitRankedError(
      socket,
      "Ranked battle has not started yet.",
      normalizedMatchId,
    );
    return;
  }

  const authenticatedPlayer =
    getAuthenticatedMatchPlayer(
      match,
      socket,
    );

  if (!authenticatedPlayer) {
    emitRankedError(
      socket,
      "You are not a player in this ranked match.",
      normalizedMatchId,
    );
    return;
  }

  const room = getRoom(match);

  socket.join(room);

  const roundNumber = Number(
    match.currentRound || 1,
  );

  if (
    !Number.isInteger(roundNumber) ||
    roundNumber < 1 ||
    roundNumber > TOTAL_ROUNDS
  ) {
    emitRankedError(
      socket,
      "Invalid ranked round.",
      normalizedMatchId,
    );
    return;
  }

  if (match.battleInProgress) {
    return;
  }

  const ready =
    markRoundPlayerReady(
      match,
      authenticatedPlayer.key,
      roundNumber,
    );

  console.log(
    "➡️ Ranked NEXT ROUND:",
    {
      matchId:
        normalizedMatchId,
      round: roundNumber,
      player:
        authenticatedPlayer.key,
      player1Ready:
        Boolean(ready.player1),
      player2Ready:
        Boolean(ready.player2),
    },
  );

  const bothReady =
    areBothRoundPlayersReady(
      match,
      roundNumber,
    );

  socket.emit(
    "ranked-player-ready",
    {
      matchId:
        normalizedMatchId,
      round: roundNumber,
      message:
        bothReady
          ? "Both players are ready. Starting round..."
          : "Waiting for your opponent to press NEXT ROUND...",
      roundReady: {
        player1:
          Boolean(ready.player1),
        player2:
          Boolean(ready.player2),
      },
    },
  );

  if (!bothReady) {
    return;
  }

  await processRankedRound(
    io,
    normalizedMatchId,
  );
}

function registerRankedBattle(io) {
  io.on("connection", (socket) => {
    socket.on(
      "start-ranked-battle",
      ({ matchId, roomId } = {}) => {
        const id =
          matchId || roomId;

        startRankedBattle(
          io,
          socket,
          id,
        ).catch((error) => {
          console.error(
            "start-ranked-battle handler error:",
            error,
          );

          emitRankedError(
            socket,
            error.message ||
              "Failed to start ranked battle.",
            id,
          );
        });
      },
    );

    socket.on(
      "ranked-battle-ready",
      ({ matchId, roomId } = {}) => {
        const id =
          matchId || roomId;

        startRankedBattle(
          io,
          socket,
          id,
        ).catch((error) => {
          console.error(
            "ranked-battle-ready handler error:",
            error,
          );

          emitRankedError(
            socket,
            error.message ||
              "Failed to mark player as ready.",
            id,
          );
        });
      },
    );

    socket.on(
      "ranked-next-round",
      ({ matchId, roomId } = {}) => {
        const id =
          matchId || roomId;

        handleRankedNextRound(
          io,
          socket,
          id,
        ).catch((error) => {
          console.error(
            "ranked-next-round handler error:",
            error,
          );

          emitRankedError(
            socket,
            error.message ||
              "Failed to advance ranked round.",
            id,
          );
        });
      },
    );
  });
}

module.exports =
  registerRankedBattle;

module.exports.registerRankedBattle =
  registerRankedBattle;

module.exports.completeRankedMatch =
  completeRankedMatch;

module.exports.completeRankedMatchForfeit =
  completeRankedMatchForfeit;

module.exports.processRankedRound =
  processRankedRound;