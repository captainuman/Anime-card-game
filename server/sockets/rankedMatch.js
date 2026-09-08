const { positions } = require("../data/positions");

const INITIAL_HP = 100;
const TOTAL_ROUNDS = positions.length;

const rankedMatches = new Map();

const RANKED_POSITIONS = positions.map((position) => ({
  id: position.id,
  name: position.name,
  icon: position.icon,
}));

function normalizePlayer(player, playerKey) {
  if (!player?.userId || !player?.socketId) {
    throw new Error(`${playerKey} must have a user ID and socket ID.`);
  }

  const userId = String(player.userId).trim();
  const socketId = String(player.socketId).trim();

  if (!userId || !socketId) {
    throw new Error(`${playerKey} must have a user ID and socket ID.`);
  }

  return {
    playerKey,
    socketId,
    userId,
    username: String(player.username || "Player").trim() || "Player",
    ready: false,
    cards: [],
  };
}

function getMatchObject(matchOrId) {
  if (matchOrId && typeof matchOrId === "object") {
    return matchOrId;
  }

  return getRankedMatch(matchOrId);
}

function createRankedMatch({ matchId, player1, player2 }) {
  if (!matchId) {
    throw new Error("Match ID is required.");
  }

  const normalizedMatchId = String(matchId).trim();

  if (!normalizedMatchId) {
    throw new Error("Match ID is required.");
  }

  if (!player1 || !player2) {
    throw new Error("Two players are required.");
  }

  const normalizedPlayer1 = normalizePlayer(player1, "Player 1");
  const normalizedPlayer2 = normalizePlayer(player2, "Player 2");

  if (normalizedPlayer1.userId === normalizedPlayer2.userId) {
    throw new Error("A player cannot play against themselves.");
  }

  if (normalizedPlayer1.socketId === normalizedPlayer2.socketId) {
    throw new Error("Both players cannot use the same socket.");
  }

  if (rankedMatches.has(normalizedMatchId)) {
    throw new Error("Ranked match already exists.");
  }

  const match = {
    matchId: normalizedMatchId,

    room: normalizedMatchId,

    players: [normalizedPlayer1, normalizedPlayer2],

    player1: {
      ...normalizedPlayer1,
      cards: [],
    },

    player2: {
      ...normalizedPlayer2,
      cards: [],
    },

    positions: RANKED_POSITIONS,

    phase: "battle",

    currentRound: 1,

    totalRounds: TOTAL_ROUNDS,

    player1HP: INITIAL_HP,

    player2HP: INITIAL_HP,

    player1Score: 0,

    player2Score: 0,

    rounds: [],

    results: [],

    battleStarted: false,

    battleInProgress: false,

    battleRevealed: false,

    finished: false,

    matchFinished: false,

    rewardsProcessed: false,

    rewardProcessing: false,

    rewardResult: null,

    resultReason: null,

    winner: null,

    createdAt: Date.now(),

    finishedAt: null,
  };

  rankedMatches.set(normalizedMatchId, match);

  return match;
}

function getRankedMatch(matchId) {
  if (!matchId) {
    return null;
  }

  return rankedMatches.get(String(matchId).trim()) || null;
}

function deleteRankedMatch(matchId) {
  if (!matchId) {
    return false;
  }

  return rankedMatches.delete(String(matchId).trim());
}

function getRankedMatchBySocket(socketId) {
  if (!socketId) {
    return null;
  }

  const normalizedSocketId = String(socketId);

  for (const match of rankedMatches.values()) {
    const player = match.players?.find(
      (item) => String(item?.socketId) === normalizedSocketId
    );

    if (player) {
      return match;
    }
  }

  return null;
}

function getRankedMatchPlayer(matchOrId, socketId) {
  const match = getMatchObject(matchOrId);

  if (!match || !socketId) {
    return null;
  }

  return (
    match.players?.find(
      (player) => String(player?.socketId) === String(socketId)
    ) || null
  );
}

function getRankedMatchPlayerByUserId(matchOrId, userId) {
  const match = getMatchObject(matchOrId);

  if (!match || !userId) {
    return null;
  }

  return (
    match.players?.find(
      (player) => String(player?.userId) === String(userId)
    ) || null
  );
}

function getRankedOpponent(matchOrId, socketId) {
  const match = getMatchObject(matchOrId);

  if (!match || !socketId) {
    return null;
  }

  return (
    match.players?.find(
      (player) => String(player?.socketId) !== String(socketId)
    ) || null
  );
}

function setPlayerReady(matchOrId, socketId, ready = true) {
  const match = getMatchObject(matchOrId);

  if (!match || !socketId || match.matchFinished || match.finished) {
    return null;
  }

  const player = getRankedMatchPlayer(match, socketId);

  if (!player) {
    return null;
  }

  const readyState = Boolean(ready);

  player.ready = readyState;

  if (player.playerKey === "player1") {
    match.player1.ready = readyState;

    const player1 = match.players?.find(
      (item) => item?.playerKey === "player1"
    );

    if (player1) {
      player1.ready = readyState;
    }
  }

  if (player.playerKey === "player2") {
    match.player2.ready = readyState;

    const player2 = match.players?.find(
      (item) => item?.playerKey === "player2"
    );

    if (player2) {
      player2.ready = readyState;
    }
  }

  return match;
}

function areBothPlayersReady(matchOrId) {
  const match = getMatchObject(matchOrId);

  if (!match) {
    return false;
  }

  return Boolean(match.player1?.ready && match.player2?.ready);
}

function setRankedTeams(matchOrId, player1Cards, player2Cards) {
  const match = getMatchObject(matchOrId);

  if (!match) {
    return null;
  }

  if (match.matchFinished) {
    throw new Error("Ranked match has already finished.");
  }

  if (!Array.isArray(player1Cards) || !Array.isArray(player2Cards)) {
    throw new Error("Both ranked teams must be arrays.");
  }

  if (
    player1Cards.length !== TOTAL_ROUNDS ||
    player2Cards.length !== TOTAL_ROUNDS
  ) {
    throw new Error(
      `Both ranked teams must contain exactly ${TOTAL_ROUNDS} cards.`
    );
  }

  const player1CardIds = player1Cards.map((card) =>
    String(card?.cardId || card?.id || "").trim()
  );

  const player2CardIds = player2Cards.map((card) =>
    String(card?.cardId || card?.id || "").trim()
  );

  if (
    player1CardIds.some((cardId) => !cardId) ||
    player2CardIds.some((cardId) => !cardId)
  ) {
    throw new Error("Every ranked team card must have a card ID.");
  }

  if (
    new Set(player1CardIds).size !== TOTAL_ROUNDS ||
    new Set(player2CardIds).size !== TOTAL_ROUNDS
  ) {
    throw new Error(
      `Both ranked teams must contain exactly ${TOTAL_ROUNDS} unique cards.`
    );
  }

  const allCardIds = [...player1CardIds, ...player2CardIds];

  if (new Set(allCardIds).size !== allCardIds.length) {
    throw new Error("The same card cannot be used by both ranked players.");
  }

  const normalizePower = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return 1;
    }

    return Math.min(100, Math.max(1, Math.round(number)));
  };

  const normalizeCard = (card, index) => {
    const cardId = String(
      card?.cardId || card?.id || ""
    ).trim();

    const position = RANKED_POSITIONS[index];

    const numericHP = Number(
      card?.hp ?? INITIAL_HP
    );

    const hp = Number.isFinite(numericHP)
      ? Math.max(
          0,
          Math.min(
            INITIAL_HP,
            Math.round(numericHP)
          )
        )
      : INITIAL_HP;

    return {
      cardId,

      position: position.id,

      positionName: position.name,

      icon: position.icon,

      name: String(
        card?.name || ""
      ).trim(),

      anime: String(
        card?.anime || ""
      ).trim(),

      image: String(
        card?.image || ""
      ),

      hp,

      overallPower: normalizePower(
        card?.overallPower
      ),

      roles: {
        swordsman: normalizePower(
          card?.roles?.swordsman
        ),
        mage: normalizePower(
          card?.roles?.mage
        ),
        warrior: normalizePower(
          card?.roles?.warrior
        ),
        tank: normalizePower(
          card?.roles?.tank
        ),
        healer: normalizePower(
          card?.roles?.healer
        ),
      },

      general: {
        speed: normalizePower(
          card?.general?.speed
        ),
        strength: normalizePower(
          card?.general?.strength
        ),
        intelligence: normalizePower(
          card?.general?.intelligence
        ),
        leadership: normalizePower(
          card?.general?.leadership
        ),
        race: normalizePower(
          card?.general?.race
        ),
      },

      specialRole: {
        name: String(
          card?.specialRole?.name || ""
        ).trim(),

        power: normalizePower(
          card?.specialRole?.power
        ),
      },

      powerCategories: Array.isArray(
        card?.powerCategories
      )
        ? card.powerCategories.map(
            (power) => ({
              name: String(
                power?.name || ""
              ).trim(),

              power: normalizePower(
                power?.power
              ),
            })
          )
        : [],
    };
  };

  const normalizedPlayer1Cards =
    player1Cards.map(normalizeCard);

  const normalizedPlayer2Cards =
    player2Cards.map(normalizeCard);

  match.player1.cards =
    normalizedPlayer1Cards;

  match.player2.cards =
    normalizedPlayer2Cards;

  if (
    Array.isArray(match.players) &&
    match.players.length === 2
  ) {
    match.players[0].cards =
      normalizedPlayer1Cards;

    match.players[1].cards =
      normalizedPlayer2Cards;
  }

  match.player1Team =
    normalizedPlayer1Cards;

  match.player2Team =
    normalizedPlayer2Cards;

  return match;
}

function getCurrentRankedPosition(matchOrId) {
  const match = getMatchObject(matchOrId);

  if (!match) {
    return null;
  }

  const roundIndex =
    Number(match.currentRound || 1) - 1;

  return (
    RANKED_POSITIONS[roundIndex] ||
    null
  );
}

function advanceRankedRound(matchOrId) {
  const match = getMatchObject(matchOrId);

  if (!match) {
    return null;
  }

  if (match.matchFinished || match.finished) {
    return match;
  }

  if (
    Number(match.currentRound) >=
    TOTAL_ROUNDS
  ) {
    return match;
  }

  match.currentRound =
    Number(match.currentRound || 1) + 1;

  match.battleInProgress = false;

  match.battleRevealed = false;

  return match;
}

function finishRankedMatch(matchOrId, winner) {
  const match = getMatchObject(matchOrId);

  if (!match) {
    return null;
  }

  if (match.matchFinished || match.finished) {
    return match;
  }

  const validWinner = [
    "player1",
    "player2",
    "draw",
  ].includes(winner)
    ? winner
    : "draw";

  match.matchFinished = true;

  match.finished = true;

  match.phase = "complete";

  match.finishedAt = Date.now();

  match.winner = validWinner;

  match.battleInProgress = false;

  match.battleRevealed = true;

  return match;
}

function updateRankedPlayerSocket(
  matchOrId,
  userId,
  socketId
) {
  const match = getMatchObject(matchOrId);

  if (
    !match ||
    !userId ||
    !socketId ||
    match.matchFinished ||
    match.finished
  ) {
    return null;
  }

  const normalizedUserId =
    String(userId).trim();

  const normalizedSocketId =
    String(socketId).trim();

  if (
    !normalizedUserId ||
    !normalizedSocketId
  ) {
    return null;
  }

  const player =
    getRankedMatchPlayerByUserId(
      match.matchId,
      normalizedUserId
    );

  if (!player) {
    return null;
  }

  const socketBelongsToAnotherPlayer =
    match.players.some(
      (item) =>
        String(item?.socketId) ===
          normalizedSocketId &&
        String(item?.userId) !==
          normalizedUserId
    );

  if (socketBelongsToAnotherPlayer) {
    return null;
  }

  const playerKey =
    player.playerKey;

  player.socketId =
    normalizedSocketId;

  if (playerKey === "player1") {
    match.player1.socketId =
      normalizedSocketId;
  }

  if (playerKey === "player2") {
    match.player2.socketId =
      normalizedSocketId;
  }

  return player;
}

function areBothPlayersPresent(match, io) {
  if (!match || !io) {
    return false;
  }

  if (
    !Array.isArray(match.players) ||
    match.players.length !== 2
  ) {
    return false;
  }

  return match.players.every(
    (player) => {
      if (!player?.socketId) {
        return false;
      }

      return io.sockets.sockets.has(
        String(player.socketId)
      );
    }
  );
}

function getRankedMatches() {
  return rankedMatches;
}

module.exports = {
  INITIAL_HP,
  TOTAL_ROUNDS,
  RANKED_POSITIONS,
  rankedMatches,
  createRankedMatch,
  getRankedMatch,
  deleteRankedMatch,
  getRankedMatchBySocket,
  getRankedMatchPlayer,
  getRankedMatchPlayerByUserId,
  getRankedOpponent,
  setPlayerReady,
  areBothPlayersReady,
  setRankedTeams,
  getCurrentRankedPosition,
  advanceRankedRound,
  finishRankedMatch,
  updateRankedPlayerSocket,
  areBothPlayersPresent,
  getRankedMatches,
};