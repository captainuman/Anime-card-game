const crypto = require("crypto");

const tournaments = new Map();
const randomTournamentQueue = [];

const ALLOWED_SIZES = [4, 8, 16];

function normalizeArena(arena) {
  if (!arena) {
    return null;
  }

  const id = arena?.id != null ? String(arena.id).trim() : "";
  const name = String(arena?.name || "").trim();

  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    image: String(arena?.image || ""),
  };
}

function generateTournamentId() {
  let tournamentId;

  do {
    tournamentId = `TRN-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
  } while (tournaments.has(tournamentId));

  return tournamentId;
}

function generateTournamentCode() {
  let code;

  do {
    code = crypto.randomBytes(4).toString("hex").slice(0, 6).toUpperCase();
  } while (
    [...tournaments.values()].some(
      (tournament) => String(tournament.code) === code,
    )
  );

  return code;
}

function createTournament({ type, host, maxPlayers = 8, arena }) {
  if (!host?.userId || !host?.socketId) {
    throw new Error("Invalid tournament host.");
  }

  const size = Number(maxPlayers);

  if (!ALLOWED_SIZES.includes(size)) {
    throw new Error("Tournament size must be 4, 8 or 16.");
  }

  if (type !== "friend" && type !== "random") {
    throw new Error("Invalid tournament type.");
  }

  const normalizedArena = normalizeArena(arena);

  if (!normalizedArena) {
    throw new Error("Tournament arena is required.");
  }

  const tournamentId = generateTournamentId();

  const hostUserId = String(host.userId).trim();
  const hostSocketId = String(host.socketId).trim();

  if (!hostUserId || !hostSocketId) {
    throw new Error("Invalid tournament host.");
  }

  const hostPlayer = {
    socketId: hostSocketId,
    userId: hostUserId,
    username: String(host.username || "Player").trim() || "Player",
  };

  const tournament = {
    tournamentId,
    code: type === "friend" ? generateTournamentCode() : null,
    type,
    arena: normalizedArena,
    host: { ...hostPlayer },
    maxPlayers: size,
    status: "waiting",
    currentRound: 0,
    players: [hostPlayer],
    matches: [],
    bracket: [],
    winner: null,
    createdAt: Date.now(),
  };

  tournaments.set(tournamentId, tournament);

  return tournament;
}

function getTournament(tournamentId) {
  if (!tournamentId) {
    return null;
  }

  return tournaments.get(String(tournamentId).trim()) || null;
}

function deleteTournament(tournamentId) {
  if (!tournamentId) {
    return false;
  }

  const normalizedTournamentId = String(tournamentId).trim();
  const tournament = tournaments.get(normalizedTournamentId);

  if (!tournament) {
    return false;
  }

  if (tournament.type === "random") {
    for (const player of tournament.players) {
      removeRandomTournamentPlayer(player.userId, player.socketId);
    }
  }

  tournaments.delete(normalizedTournamentId);

  return true;
}

function addPlayerToTournament(tournament, player) {
  if (!tournament) {
    throw new Error("Tournament not found.");
  }

  if (tournament.status !== "waiting") {
    throw new Error("Tournament has already started.");
  }

  if (!player?.userId || !player?.socketId) {
    throw new Error("Invalid tournament player.");
  }

  const userId = String(player.userId).trim();
  const socketId = String(player.socketId).trim();

  if (!userId || !socketId) {
    throw new Error("Invalid tournament player.");
  }

  const alreadyJoined = tournament.players.some(
    (item) => String(item.userId) === userId,
  );

  if (alreadyJoined) {
    return false;
  }

  const socketAlreadyJoined = tournament.players.some(
    (item) => String(item.socketId) === socketId,
  );

  if (socketAlreadyJoined) {
    return false;
  }

  if (tournament.players.length >= tournament.maxPlayers) {
    throw new Error("Tournament is full.");
  }

  tournament.players.push({
    socketId,
    userId,
    username: String(player.username || "Player").trim() || "Player",
  });

  return true;
}

function updatePlayerReferenceSocket(player, userId, socketId, username) {
  if (!player || String(player.userId) !== String(userId)) {
    return;
  }

  player.socketId = String(socketId);

  if (username) {
    player.username = String(username).trim() || player.username;
  }
}

function updateTournamentPlayerSocket(
  tournament,
  userId,
  socketId,
  username = null,
) {
  if (!tournament || !userId || !socketId) {
    return null;
  }

  const targetUserId = String(userId).trim();
  const targetSocketId = String(socketId).trim();

  if (!targetUserId || !targetSocketId) {
    return null;
  }

  const player = tournament.players.find(
    (item) => String(item.userId) === targetUserId,
  );

  if (!player) {
    return null;
  }

  const socketUsedByAnotherPlayer = tournament.players.some(
    (item) =>
      String(item.socketId) === targetSocketId &&
      String(item.userId) !== targetUserId,
  );

  if (socketUsedByAnotherPlayer) {
    return null;
  }

  const previousSocketId = String(player.socketId);

  updatePlayerReferenceSocket(player, targetUserId, targetSocketId, username);

  if (String(tournament.host?.userId) === targetUserId) {
    tournament.host.socketId = targetSocketId;

    if (username) {
      tournament.host.username =
        String(username).trim() || tournament.host.username;
    }
  }

  for (const match of tournament.matches) {
    updatePlayerReferenceSocket(
      match.player1,
      targetUserId,
      targetSocketId,
      username,
    );

    updatePlayerReferenceSocket(
      match.player2,
      targetUserId,
      targetSocketId,
      username,
    );
  }

  for (const round of tournament.bracket) {
    if (!Array.isArray(round?.matches)) {
      continue;
    }

    for (const match of round.matches) {
      updatePlayerReferenceSocket(
        match.player1,
        targetUserId,
        targetSocketId,
        username,
      );

      updatePlayerReferenceSocket(
        match.player2,
        targetUserId,
        targetSocketId,
        username,
      );
    }
  }

  return {
    ...player,
    previousSocketId,
  };
}

function removePlayerFromTournament(tournament, socketId) {
  if (!tournament || !socketId) {
    return false;
  }

  if (tournament.status !== "waiting") {
    return false;
  }

  const normalizedSocketId = String(socketId);
  const originalLength = tournament.players.length;

  tournament.players = tournament.players.filter(
    (player) => String(player.socketId) !== normalizedSocketId,
  );

  if (String(tournament.host?.socketId) === normalizedSocketId) {
    const nextHost = tournament.players[0] || null;

    if (nextHost) {
      tournament.host = {
        socketId: nextHost.socketId,
        userId: nextHost.userId,
        username: nextHost.username,
      };
    }
  }

  return tournament.players.length !== originalLength;
}

function shuffle(array) {
  const result = Array.isArray(array) ? [...array] : [];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function createTournamentMatch({
  tournamentId,
  round,
  matchNumber,
  player1,
  player2,
}) {
  return {
    matchId: `${String(tournamentId)}-R${Number(round)}-M${Number(matchNumber)}`,
    tournamentId: String(tournamentId),
    round: Number(round),
    matchNumber: Number(matchNumber),
    player1: player1 || null,
    player2: player2 || null,
    winner: null,
    status: "pending",
    onlineRoomId: null,
    startedAt: null,
    completedAt: null,
    reason: null,
    forfeitedPlayer: null,
  };
}

function generateBracket(tournament) {
  if (!tournament) {
    throw new Error("Tournament not found.");
  }

  if (!tournament.arena?.id || !tournament.arena?.name) {
    throw new Error("Tournament arena is missing.");
  }

  if (tournament.players.length !== tournament.maxPlayers) {
    throw new Error(
      `Need ${tournament.maxPlayers} players to generate bracket.`,
    );
  }

  const players = shuffle(tournament.players);
  const matches = [];

  for (let i = 0; i < players.length; i += 2) {
    const match = createTournamentMatch({
      tournamentId: tournament.tournamentId,
      round: 1,
      matchNumber: i / 2 + 1,
      player1: players[i],
      player2: players[i + 1],
    });

    matches.push(match);
  }

  tournament.currentRound = 1;
  tournament.matches = matches;
  tournament.bracket = [
    {
      round: 1,
      matches,
    },
  ];
  tournament.status = "active";

  return tournament.bracket;
}

function getRoundMatches(tournament, round) {
  if (!tournament) {
    return [];
  }

  return tournament.matches.filter(
    (match) => Number(match.round) === Number(round),
  );
}

function getCurrentRoundMatches(tournament) {
  if (!tournament) {
    return [];
  }

  return getRoundMatches(tournament, tournament.currentRound);
}

function areAllRoundMatchesComplete(tournament, round) {
  if (!tournament) {
    return false;
  }

  const targetRound = round ?? tournament.currentRound;
  const matches = getRoundMatches(tournament, targetRound);

  if (matches.length === 0) {
    return false;
  }

  return matches.every((match) => match.status === "complete");
}

function createNextRound(tournament) {
  if (!tournament) {
    return null;
  }

  const currentRound = tournament.currentRound;
  const currentMatches = getRoundMatches(tournament, currentRound);

  if (currentMatches.length === 0) {
    return null;
  }

  if (!currentMatches.every((match) => match.status === "complete")) {
    return null;
  }

  const winners = currentMatches.map((match) => match.winner);

  if (winners.some((winner) => !winner)) {
    return null;
  }

  if (winners.length <= 1) {
    return null;
  }

  const nextRound = currentRound + 1;
  const nextMatches = [];

  for (let i = 0; i < winners.length; i += 2) {
    if (!winners[i] || !winners[i + 1]) {
      return null;
    }

    const match = createTournamentMatch({
      tournamentId: tournament.tournamentId,
      round: nextRound,
      matchNumber: i / 2 + 1,
      player1: winners[i],
      player2: winners[i + 1],
    });

    nextMatches.push(match);
  }

  tournament.currentRound = nextRound;

  tournament.bracket.push({
    round: nextRound,
    matches: nextMatches,
  });

  tournament.matches.push(...nextMatches);

  return nextMatches;
}

function getActiveMatch(tournament, socketId) {
  if (!tournament || !socketId) {
    return null;
  }

  const normalizedSocketId = String(socketId);

  return (
    tournament.matches.find(
      (match) =>
        match.status === "active" &&
        (String(match.player1?.socketId) === normalizedSocketId ||
          String(match.player2?.socketId) === normalizedSocketId),
    ) || null
  );
}

function getActiveMatchByUserId(tournament, userId) {
  if (!tournament || !userId) {
    return null;
  }

  const targetUserId = String(userId);

  return (
    tournament.matches.find(
      (match) =>
        match.status === "active" &&
        (String(match.player1?.userId) === targetUserId ||
          String(match.player2?.userId) === targetUserId),
    ) || null
  );
}

function getMatchById(tournament, matchId) {
  if (!tournament || !matchId) {
    return null;
  }

  const targetMatchId = String(matchId);

  return (
    tournament.matches.find(
      (match) => String(match.matchId) === targetMatchId,
    ) || null
  );
}

function findTournamentForPlayer(socketId) {
  if (!socketId) {
    return null;
  }

  const normalizedSocketId = String(socketId);

  for (const tournament of tournaments.values()) {
    const player = tournament.players.find(
      (item) => String(item.socketId) === normalizedSocketId,
    );

    if (player) {
      return tournament;
    }
  }

  return null;
}

function findTournamentForUser(userId) {
  if (!userId) {
    return null;
  }

  const targetUserId = String(userId);

  for (const tournament of tournaments.values()) {
    const player = tournament.players.find(
      (item) => String(item.userId) === targetUserId,
    );

    if (player) {
      return tournament;
    }
  }

  return null;
}

function getTournamentPlayer(tournament, userId) {
  if (!tournament || !userId) {
    return null;
  }

  return (
    tournament.players.find(
      (player) => String(player.userId) === String(userId),
    ) || null
  );
}

function getTournamentPlayerBySocket(tournament, socketId) {
  if (!tournament || !socketId) {
    return null;
  }

  return (
    tournament.players.find(
      (player) => String(player.socketId) === String(socketId),
    ) || null
  );
}

function markMatchActive(tournament, matchId, onlineRoomId) {
  const match = getMatchById(tournament, matchId);

  if (!match) {
    return null;
  }

  if (match.status === "active") {
    return match;
  }

  if (match.status !== "pending") {
    return match;
  }

  if (!match.player1 || !match.player2) {
    return null;
  }

  match.status = "active";
  match.onlineRoomId = onlineRoomId ? String(onlineRoomId) : null;
  match.startedAt = Date.now();

  return match;
}

function markMatchComplete(tournament, matchId, winner) {
  const match = getMatchById(tournament, matchId);

  if (!match) {
    return null;
  }

  if (match.status === "complete") {
    return match;
  }

  if (!winner) {
    return null;
  }

  match.winner = winner;
  match.status = "complete";
  match.completedAt = Date.now();

  return match;
}

function startTournament(tournament) {
  if (!tournament) {
    throw new Error("Tournament not found.");
  }

  if (!tournament.arena?.id || !tournament.arena?.name) {
    throw new Error("Tournament arena is missing.");
  }

  if (tournament.players.length !== tournament.maxPlayers) {
    throw new Error(`Need ${tournament.maxPlayers} players to start.`);
  }

  if (tournament.status !== "waiting") {
    throw new Error("Tournament has already started.");
  }

  return generateBracket(tournament);
}

function finishTournament(tournament) {
  if (!tournament) {
    return null;
  }

  const matches = getCurrentRoundMatches(tournament);

  if (matches.length !== 1) {
    return null;
  }

  const finalMatch = matches[0];

  if (finalMatch.status !== "complete") {
    return null;
  }

  if (!finalMatch.winner) {
    return null;
  }

  tournament.winner = finalMatch.winner;
  tournament.status = "complete";

  return tournament.winner;
}

function addRandomTournamentPlayer(player) {
  if (!player?.userId || !player?.socketId) {
    return false;
  }

  const requestedSize = Number(player.requestedSize);

  if (!ALLOWED_SIZES.includes(requestedSize)) {
    return false;
  }

  const arena = normalizeArena(player.arena);

  if (!arena) {
    return false;
  }

  const userId = String(player.userId).trim();
  const socketId = String(player.socketId).trim();

  if (!userId || !socketId) {
    return false;
  }

  const existingUser = randomTournamentQueue.some(
    (item) => String(item.userId) === userId,
  );

  if (existingUser) {
    return false;
  }

  const existingSocket = randomTournamentQueue.some(
    (item) => String(item.socketId) === socketId,
  );

  if (existingSocket) {
    return false;
  }

  randomTournamentQueue.push({
    socketId,
    userId,
    username: String(player.username || "Player").trim() || "Player",
    requestedSize,
    arena,
    queuedAt: Date.now(),
  });

  return true;
}

function removeRandomTournamentPlayer(userId, socketId = null) {
  if (!userId) {
    return false;
  }

  const targetUserId = String(userId);

  for (let i = randomTournamentQueue.length - 1; i >= 0; i -= 1) {
    const player = randomTournamentQueue[i];

    if (String(player?.userId) !== targetUserId) {
      continue;
    }

    if (socketId && String(player?.socketId) !== String(socketId)) {
      continue;
    }

    randomTournamentQueue.splice(i, 1);

    return true;
  }

  return false;
}

function removeRandomTournamentPlayerBySocket(socketId) {
  if (!socketId) {
    return false;
  }

  const normalizedSocketId = String(socketId);
  let removed = false;

  for (let i = randomTournamentQueue.length - 1; i >= 0; i -= 1) {
    if (String(randomTournamentQueue[i]?.socketId) === normalizedSocketId) {
      randomTournamentQueue.splice(i, 1);
      removed = true;
    }
  }

  return removed;
}

function cleanupRandomTournamentQueue(io) {
  if (!io?.sockets?.sockets) {
    return;
  }

  for (let i = randomTournamentQueue.length - 1; i >= 0; i -= 1) {
    const player = randomTournamentQueue[i];

    if (!player?.userId || !player?.socketId || !player?.arena?.id) {
      randomTournamentQueue.splice(i, 1);
      continue;
    }

    const socket = io.sockets.sockets.get(player.socketId);

    if (!socket) {
      randomTournamentQueue.splice(i, 1);
      continue;
    }

    const authenticatedUserId = socket.user?.id || socket.userId;

    if (!authenticatedUserId) {
      randomTournamentQueue.splice(i, 1);
      continue;
    }

    if (String(authenticatedUserId) !== String(player.userId)) {
      randomTournamentQueue.splice(i, 1);
    }
  }
}

function getRandomTournamentQueueCount(size, arenaId = null) {
  const requestedSize = Number(size);

  return randomTournamentQueue.filter((player) => {
    if (Number(player.requestedSize) !== requestedSize) {
      return false;
    }

    if (!arenaId) {
      return true;
    }

    return String(player?.arena?.id || "") === String(arenaId);
  }).length;
}

function takeRandomTournamentPlayers(size, arenaId = null) {
  const requestedSize = Number(size);

  const eligiblePlayers = randomTournamentQueue.filter((player) => {
    if (Number(player.requestedSize) !== requestedSize) {
      return false;
    }

    if (!arenaId) {
      return true;
    }

    return String(player?.arena?.id || "") === String(arenaId);
  });

  if (eligiblePlayers.length < requestedSize) {
    return null;
  }

  const selectedPlayers = eligiblePlayers.slice(0, requestedSize);

  for (const player of selectedPlayers) {
    const index = randomTournamentQueue.findIndex(
      (item) =>
        String(item.userId) === String(player.userId) &&
        String(item.socketId) === String(player.socketId),
    );

    if (index !== -1) {
      randomTournamentQueue.splice(index, 1);
    }
  }

  return selectedPlayers;
}

function getRandomTournamentPlayer(userId) {
  if (!userId) {
    return null;
  }

  return (
    randomTournamentQueue.find(
      (player) => String(player.userId) === String(userId),
    ) || null
  );
}

function getRandomTournamentPlayerBySocket(socketId) {
  if (!socketId) {
    return null;
  }

  return (
    randomTournamentQueue.find(
      (player) => String(player.socketId) === String(socketId),
    ) || null
  );
}

function getRandomTournamentQueue() {
  return randomTournamentQueue;
}

module.exports = {
  tournaments,
  randomTournamentQueue,
  ALLOWED_SIZES,
  normalizeArena,
  createTournament,
  getTournament,
  deleteTournament,
  addPlayerToTournament,
  updateTournamentPlayerSocket,
  removePlayerFromTournament,
  createTournamentMatch,
  generateBracket,
  createNextRound,
  getRoundMatches,
  getCurrentRoundMatches,
  areAllRoundMatchesComplete,
  getActiveMatch,
  getActiveMatchByUserId,
  getMatchById,
  findTournamentForPlayer,
  findTournamentForUser,
  getTournamentPlayer,
  getTournamentPlayerBySocket,
  markMatchActive,
  markMatchComplete,
  startTournament,
  finishTournament,
  addRandomTournamentPlayer,
  removeRandomTournamentPlayer,
  removeRandomTournamentPlayerBySocket,
  getRandomTournamentPlayer,
  getRandomTournamentPlayerBySocket,
  getRandomTournamentQueueCount,
  takeRandomTournamentPlayers,
  getRandomTournamentQueue,
  cleanupRandomTournamentQueue,
};