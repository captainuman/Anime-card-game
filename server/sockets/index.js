const jwt = require("jsonwebtoken");

const { registerMatchmaking } = require("./matchmaking");
const {
  registerFriendRooms,
  cleanupFriendRooms,
} = require("./friendRooms");
const { registerOnlineDraft } = require("./onlineDraft");
const registerOnlineBattle = require("./onlineBattle");

const {
  registerTournament,
  handleTournamentPlayerDisconnect,
} = require("./tournament");

const { removeRandomTournamentPlayer } = require("./tournamentState");

const registerRankedMatchmaking = require("./rankedMatchmaking");

const {
  registerRankedBattle,
  completeRankedMatchForfeit,
} = require("./rankedBattle");

const { getRankedMatchBySocket } = require("./rankedMatch");

const { onlineMatches } = require("./onlineMatch");

function authenticateSocket(socket, next) {
  try {
    const authToken = socket.handshake?.auth?.token;
    const authorization = socket.handshake?.headers?.authorization;

    let token = authToken;

    if (!token && authorization?.startsWith("Bearer ")) {
      token = authorization.slice(7).trim();
    }

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return next(new Error("JWT_SECRET is not configured"));
    }

    const decoded = jwt.verify(token, jwtSecret);

    if (!decoded?.id) {
      return next(new Error("Invalid authentication token"));
    }

    const userId = String(decoded.id);

    socket.user = {
      id: userId,
      username: String(decoded.username || ""),
      email: String(decoded.email || ""),
      role: decoded.role || "user",
    };

    socket.userId = userId;
    socket.username = socket.user.username;

    return next();
  } catch (error) {
    console.error("Socket authentication error:", error.message);

    return next(new Error("Authentication failed"));
  }
}

function getSocketUser(socket) {
  if (!socket?.user?.id) {
    return null;
  }

  return {
    id: String(socket.user.id),
    username: String(socket.user.username || ""),
    email: String(socket.user.email || ""),
    role: socket.user.role || "user",
  };
}

async function handleRankedDisconnect(io, socket) {
  const match = getRankedMatchBySocket(socket.id);

  if (!match) {
    return null;
  }

  if (
    match.finished ||
    match.rewardsProcessed ||
    match.rewardProcessing
  ) {
    return {
      handled: false,
      reason: "match-already-finished-or-processing",
      matchId: match.matchId,
    };
  }

  const disconnectedPlayer = match.players?.find(
    (player) => player.socketId === socket.id,
  );

  if (!disconnectedPlayer) {
    return {
      handled: false,
      reason: "player-not-found",
      matchId: match.matchId,
    };
  }

  return completeRankedMatchForfeit(
    io,
    match.matchId,
    socket.id,
  );
}

function cleanupNormalOnlineMatch(io, socket) {
  for (const [matchId, match] of onlineMatches.entries()) {
    if (!Array.isArray(match?.players)) {
      continue;
    }

    const disconnectedPlayer = match.players.find(
      (player) => player.socketId === socket.id,
    );

    if (!disconnectedPlayer) {
      continue;
    }

    if (match.tournamentId) {
      continue;
    }

    const remainingPlayers = match.players.filter(
      (player) => player.socketId !== socket.id,
    );

    if (remainingPlayers.length === 0) {
      onlineMatches.delete(matchId);
      continue;
    }

    const opponent = remainingPlayers[0];

    if (opponent.socketId) {
      io.to(opponent.socketId).emit("opponent-left", {
        matchId,
        opponentId: disconnectedPlayer.userId,
        opponentUsername: disconnectedPlayer.username,
      });
    }

    onlineMatches.delete(matchId);
  }
}

function registerSocketHandlers(io) {
  io.use(authenticateSocket);

  registerRankedMatchmaking(io);
  registerRankedBattle(io);

  io.on("connection", (socket) => {
    const user = getSocketUser(socket);

    if (!user) {
      socket.disconnect(true);
      return;
    }

    registerMatchmaking(io, socket);
    registerFriendRooms(io, socket);
    registerOnlineDraft(io, socket);
    registerOnlineBattle(io, socket);
    registerTournament(io, socket);

    socket.on("disconnect", async () => {
      try {
        const socketUser = getSocketUser(socket);

        if (socketUser) {
          const rankedMatch = getRankedMatchBySocket(socket.id);

          if (
            rankedMatch &&
            !rankedMatch.finished &&
            !rankedMatch.rewardsProcessed &&
            !rankedMatch.rewardProcessing
          ) {
            await handleRankedDisconnect(io, socket);
          }

          removeRandomTournamentPlayer(
            socketUser.id,
            socket.id,
          );
        }

        await handleTournamentPlayerDisconnect(io, socket);

        cleanupNormalOnlineMatch(io, socket);

        cleanupFriendRooms(socket.id);
      } catch (error) {
        console.error(
          "Socket disconnect handling error:",
          error,
        );
      }
    });
  });
}

module.exports = {
  registerSocketHandlers,
  authenticateSocket,
  getSocketUser,
  handleRankedDisconnect,
};