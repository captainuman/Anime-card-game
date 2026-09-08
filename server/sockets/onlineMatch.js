const ONLINE_INITIAL_HP = 100;
const ONLINE_MAX_HP = 100;

const onlineMatches = new Map();

function normalizePlayer(player) {
  if (!player?.socketId || !player?.userId) {
    return null;
  }

  const socketId = String(player.socketId).trim();
  const userId = String(player.userId).trim();
  const username = String(player.username || "Player").trim() || "Player";

  if (!socketId || !userId) {
    return null;
  }

  return {
    socketId,
    userId,
    username,
  };
}

function normalizeArena(arena) {
  if (!arena?.id || !arena?.name) {
    return null;
  }

  const id = String(arena.id).trim();
  const name = String(arena.name).trim();

  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    image: String(arena.image || ""),
  };
}

function createEmptyDraftPlayer(player) {
  return {
    userId: player.userId,
    socketId: player.socketId,
    username: player.username,
    drawn: [],
    team: {},
    pendingCard: null,
    completed: false,
  };
}

function createOnlineMatch(roomId, players = []) {
  if (!roomId) {
    throw new Error("Room ID is required.");
  }

  if (!Array.isArray(players) || players.length !== 2) {
    throw new Error("Online match requires exactly 2 players.");
  }

  const normalizedRoomId = String(roomId).trim();

  if (!normalizedRoomId) {
    throw new Error("Room ID is required.");
  }

  if (onlineMatches.has(normalizedRoomId)) {
    throw new Error("Online match already exists.");
  }

  const normalizedPlayers = players.map(normalizePlayer);

  if (normalizedPlayers.some((player) => !player)) {
    throw new Error("Invalid online match player.");
  }

  const userIds = new Set(
    normalizedPlayers.map((player) => player.userId),
  );

  const socketIds = new Set(
    normalizedPlayers.map((player) => player.socketId),
  );

  if (userIds.size !== 2) {
    throw new Error("Online match requires two different users.");
  }

  if (socketIds.size !== 2) {
    throw new Error("Online match requires two different sockets.");
  }

  const match = {
    roomId: normalizedRoomId,

    players: normalizedPlayers,

    readyPlayers: new Set(),

    arena: null,

    phase: "waiting",

    draft: {
      cardPool: [],
      usedCardIds: new Set(),
      players: {},
    },

    currentBattle: 0,

    battleRevealed: false,

    nextBattleLocked: false,

    battleProcessing: false,

    matchCompleted: false,

    player1Team: {},

    player2Team: {},

    player1HP: ONLINE_INITIAL_HP,

    player2HP: ONLINE_INITIAL_HP,

    player1Score: 0,

    player2Score: 0,

    results: [],

    createdAt: Date.now(),

    completedAt: null,
  };

  for (const player of normalizedPlayers) {
    match.draft.players[player.userId] =
      createEmptyDraftPlayer(player);
  }

  onlineMatches.set(normalizedRoomId, match);

  console.log(`Online match created: ${normalizedRoomId}`);

  return match;
}

function getOnlineMatch(roomId) {
  if (!roomId) {
    return null;
  }

  const normalizedRoomId = String(roomId).trim();

  if (!normalizedRoomId) {
    return null;
  }

  return onlineMatches.get(normalizedRoomId) || null;
}

function deleteOnlineMatch(roomId) {
  if (!roomId) {
    return false;
  }

  const normalizedRoomId = String(roomId).trim();

  if (!normalizedRoomId) {
    return false;
  }

  return onlineMatches.delete(normalizedRoomId);
}

function setOnlineMatchArena(roomId, arena) {
  const match = getOnlineMatch(roomId);

  if (!match || match.matchCompleted) {
    return null;
  }

  const normalizedArena = normalizeArena(arena);

  if (!normalizedArena) {
    return null;
  }

  match.arena = normalizedArena;

  return match;
}

function getPlayerDraft(match, userId) {
  if (!match || !userId) {
    return null;
  }

  const normalizedUserId = String(userId).trim();

  if (!normalizedUserId) {
    return null;
  }

  return match.draft?.players?.[normalizedUserId] || null;
}

function getPlayerBySocket(match, socketId) {
  if (!match || !socketId || !Array.isArray(match.players)) {
    return null;
  }

  const normalizedSocketId = String(socketId).trim();

  if (!normalizedSocketId) {
    return null;
  }

  return (
    match.players.find(
      (player) => String(player?.socketId) === normalizedSocketId,
    ) || null
  );
}

function getPlayerByUserId(match, userId) {
  if (!match || !userId || !Array.isArray(match.players)) {
    return null;
  }

  const normalizedUserId = String(userId).trim();

  if (!normalizedUserId) {
    return null;
  }

  return (
    match.players.find(
      (player) => String(player?.userId) === normalizedUserId,
    ) || null
  );
}

function getAuthenticatedMatchPlayer(match, socket) {
  if (!match || !socket) {
    return null;
  }

  const authenticatedUserId = socket.user?.id || socket.userId;

  if (!authenticatedUserId) {
    return null;
  }

  const player = getPlayerByUserId(match, authenticatedUserId);

  if (!player) {
    return null;
  }

  if (String(player.socketId) !== String(socket.id)) {
    return null;
  }

  return player;
}

function isAuthenticatedMatchPlayer(match, socket) {
  return Boolean(getAuthenticatedMatchPlayer(match, socket));
}

function areBothPlayersReady(match) {
  if (!match) {
    return false;
  }

  if (!Array.isArray(match.players) || match.players.length !== 2) {
    return false;
  }

  if (!(match.readyPlayers instanceof Set)) {
    return false;
  }

  return match.players.every((player) =>
    match.readyPlayers.has(String(player.socketId)),
  );
}

function areBothDraftsComplete(match) {
  if (!match) {
    return false;
  }

  if (!Array.isArray(match.players) || match.players.length !== 2) {
    return false;
  }

  return match.players.every((player) => {
    const draft = getPlayerDraft(match, player.userId);

    return draft?.completed === true;
  });
}

function markPlayerReady(match, socket) {
  if (!match || !socket || match.matchCompleted) {
    return false;
  }

  const player = getAuthenticatedMatchPlayer(match, socket);

  if (!player) {
    return false;
  }

  if (!(match.readyPlayers instanceof Set)) {
    match.readyPlayers = new Set();
  }

  match.readyPlayers.add(String(player.socketId));

  return true;
}

function updatePlayerSocket(match, userId, socketId) {
  if (!match || !userId || !socketId || match.matchCompleted) {
    return null;
  }

  const normalizedUserId = String(userId).trim();
  const normalizedSocketId = String(socketId).trim();

  if (!normalizedUserId || !normalizedSocketId) {
    return null;
  }

  const player = getPlayerByUserId(match, normalizedUserId);

  if (!player) {
    return null;
  }

  const socketOwner = getPlayerBySocket(match, normalizedSocketId);

  if (
    socketOwner &&
    String(socketOwner.userId) !== normalizedUserId
  ) {
    return null;
  }

  const oldSocketId = String(player.socketId);

  player.socketId = normalizedSocketId;

  if (!(match.readyPlayers instanceof Set)) {
    match.readyPlayers = new Set();
  }

  if (match.readyPlayers.has(oldSocketId)) {
    match.readyPlayers.delete(oldSocketId);
    match.readyPlayers.add(normalizedSocketId);
  }

  const draftPlayer = match.draft?.players?.[normalizedUserId];

  if (draftPlayer) {
    draftPlayer.socketId = normalizedSocketId;
  }

  return player;
}

function markMatchCompleted(match) {
  if (!match || match.matchCompleted) {
    return false;
  }

  match.matchCompleted = true;
  match.phase = "complete";
  match.battleProcessing = false;
  match.nextBattleLocked = false;
  match.completedAt = Date.now();

  return true;
}

function normalizeMatchHP(match) {
  if (!match) {
    return null;
  }

  match.player1HP = Math.max(
    0,
    Math.min(
      ONLINE_MAX_HP,
      Math.round(Number(match.player1HP) || 0),
    ),
  );

  match.player2HP = Math.max(
    0,
    Math.min(
      ONLINE_MAX_HP,
      Math.round(Number(match.player2HP) || 0),
    ),
  );

  return match;
}

function getOnlineMatches() {
  return onlineMatches;
}

module.exports = {
  ONLINE_INITIAL_HP,
  ONLINE_MAX_HP,

  onlineMatches,

  createOnlineMatch,

  getOnlineMatch,

  deleteOnlineMatch,

  setOnlineMatchArena,

  getPlayerDraft,

  getPlayerBySocket,

  getPlayerByUserId,

  getAuthenticatedMatchPlayer,

  isAuthenticatedMatchPlayer,

  areBothPlayersReady,

  areBothDraftsComplete,

  markPlayerReady,

  updatePlayerSocket,

  markMatchCompleted,

  normalizeMatchHP,

  getOnlineMatches,

  normalizeArena,
};