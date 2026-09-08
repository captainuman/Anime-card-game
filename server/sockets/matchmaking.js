const crypto = require("crypto");

const { createOnlineMatch } = require("./onlineMatch");

const randomQueue = [];

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

function getAuthenticatedUser(socket) {
  const userId = socket?.user?.id || socket?.userId || null;

  if (!userId) {
    return null;
  }

  return {
    userId: String(userId),
    username:
      String(socket?.user?.username || socket?.username || "Player").trim() ||
      "Player",
  };
}

function createMatchRoomId() {
  return `match-${crypto.randomUUID()}`;
}

function buildSearchingPayload(arena) {
  return {
    arena,
    playersSearching: getQueueCountForArena(arena.id),
  };
}

function registerMatchmaking(io, socket) {
  socket.on("find-random-match", ({ arena } = {}) => {
    try {
      const user = getAuthenticatedUser(socket);

      if (!user) {
        socket.emit("room-error", "Authentication required.");
        return;
      }

      const normalizedArena = normalizeArena(arena);

      if (!normalizedArena) {
        socket.emit("room-error", "A valid arena is required.");
        return;
      }

      socket.userId = user.userId;
      socket.username = user.username;

      removeFromRandomQueue(socket.id);
      removeUserFromRandomQueue(user.userId);
      cleanupRandomQueue(io);

      const currentPlayer = {
        socketId: socket.id,
        userId: user.userId,
        username: user.username,
        arena: normalizedArena,
        searchingAt: Date.now(),
      };

      const opponentIndex = randomQueue.findIndex((player) => {
        if (!player) {
          return false;
        }

        if (String(player.socketId) === String(socket.id)) {
          return false;
        }

        if (String(player.userId) === String(user.userId)) {
          return false;
        }

        if (
          String(player.arena?.id) !==
          String(normalizedArena.id)
        ) {
          return false;
        }

        return Boolean(
          io.sockets.sockets.get(player.socketId),
        );
      });

      if (opponentIndex === -1) {
        randomQueue.push(currentPlayer);

        socket.emit(
          "random-searching",
          buildSearchingPayload(normalizedArena),
        );

        return;
      }

      const opponent = randomQueue.splice(opponentIndex, 1)[0];

      if (!opponent) {
        randomQueue.push(currentPlayer);

        socket.emit(
          "random-searching",
          buildSearchingPayload(normalizedArena),
        );

        return;
      }

      const opponentSocket = io.sockets.sockets.get(
        opponent.socketId,
      );

      if (!opponentSocket) {
        randomQueue.push(currentPlayer);
        cleanupRandomQueue(io);

        socket.emit(
          "random-searching",
          buildSearchingPayload(normalizedArena),
        );

        return;
      }

      const roomId = createMatchRoomId();

      socket.join(roomId);
      opponentSocket.join(roomId);

      socket.ready = false;
      opponentSocket.ready = false;

      const players = [
        {
          socketId: opponent.socketId,
          userId: opponent.userId,
          username: opponent.username || "Player",
        },
        {
          socketId: socket.id,
          userId: user.userId,
          username: user.username || "Player",
        },
      ];

      let onlineMatch;

      try {
        onlineMatch = createOnlineMatch(roomId, players);
      } catch (error) {
        console.error(
          `Failed to create random online match: ${roomId}`,
          error,
        );
      }

      if (!onlineMatch) {
        socket.leave(roomId);
        opponentSocket.leave(roomId);

        randomQueue.push(opponent);
        randomQueue.push(currentPlayer);

        cleanupRandomQueue(io);

        socket.emit(
          "room-error",
          "Failed to create online match.",
        );

        opponentSocket.emit(
          "room-error",
          "Failed to create online match.",
        );

        return;
      }

      onlineMatch.arena = normalizedArena;
      onlineMatch.phase = "waiting";

      if (!(onlineMatch.readyPlayers instanceof Set)) {
        onlineMatch.readyPlayers = new Set();
      }

      const matchPayload = {
        roomId,
        arena: onlineMatch.arena,
        players,
      };

      io.to(roomId).emit(
        "random-matched",
        matchPayload,
      );
    } catch (error) {
      console.error(
        "Random matchmaking failed:",
        error,
      );

      socket.emit(
        "room-error",
        error.message || "Random matchmaking failed.",
      );
    }
  });

  socket.on("cancel-random-match", () => {
    const removed = removeFromRandomQueue(socket.id);

    socket.emit("random-search-cancelled");

    if (removed) {
      console.log(
        `Random search cancelled: ${socket.id}`,
      );
    }
  });

  socket.on("disconnect", () => {
    const removed = removeFromRandomQueue(socket.id);

    if (removed) {
      console.log(
        `Removed disconnected player from random queue: ${socket.id}`,
      );
    }
  });
}

function removeFromRandomQueue(socketId) {
  if (!socketId) {
    return false;
  }

  let removed = false;

  for (let i = randomQueue.length - 1; i >= 0; i -= 1) {
    if (
      String(randomQueue[i]?.socketId) ===
      String(socketId)
    ) {
      randomQueue.splice(i, 1);
      removed = true;
    }
  }

  return removed;
}

function removeUserFromRandomQueue(userId) {
  if (!userId) {
    return false;
  }

  let removed = false;

  for (let i = randomQueue.length - 1; i >= 0; i -= 1) {
    if (
      String(randomQueue[i]?.userId) ===
      String(userId)
    ) {
      randomQueue.splice(i, 1);
      removed = true;
    }
  }

  return removed;
}

function cleanupRandomQueue(io) {
  if (!io?.sockets?.sockets) {
    return;
  }

  for (let i = randomQueue.length - 1; i >= 0; i -= 1) {
    const player = randomQueue[i];

    if (
      !player?.socketId ||
      !player?.userId ||
      !player?.arena?.id
    ) {
      randomQueue.splice(i, 1);
      continue;
    }

    const playerSocket = io.sockets.sockets.get(
      player.socketId,
    );

    if (!playerSocket) {
      randomQueue.splice(i, 1);
    }
  }
}

function getQueueCountForArena(arenaId) {
  return randomQueue.filter(
    (player) =>
      String(player?.arena?.id) === String(arenaId),
  ).length;
}

function getRandomQueue() {
  return randomQueue;
}

module.exports = {
  registerMatchmaking,
  randomQueue,
  removeFromRandomQueue,
  getQueueCountForArena,
  getRandomQueue,
  normalizeArena,
  removeUserFromRandomQueue,
  cleanupRandomQueue,
};