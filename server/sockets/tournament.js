const {
  tournaments,
  ALLOWED_SIZES,
  createTournament,
  getTournament,
  deleteTournament,
  addPlayerToTournament,
  updateTournamentPlayerSocket,
  removePlayerFromTournament,
  startTournament,
  markMatchActive,
  addRandomTournamentPlayer,
  removeRandomTournamentPlayer,
  removeRandomTournamentPlayerBySocket,
  takeRandomTournamentPlayers,
  getRandomTournamentQueueCount,
  getRandomTournamentQueue,
  cleanupRandomTournamentQueue,
  getActiveMatch,
  markMatchComplete,
  createNextRound,
  finishTournament,
} = require("./tournamentState");

const {
  createOnlineMatch,
  getOnlineMatch,
  deleteOnlineMatch,
  updatePlayerSocket,
  markMatchCompleted,
} = require("./onlineMatch");

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
  const userId = socket?.user?.id || socket?.user?._id || socket?.userId;

  if (!userId) {
    return null;
  }

  return {
    userId: String(userId),
    username:
      String(socket.user?.username || socket.username || "Player").trim() ||
      "Player",
  };
}

function isTournamentPlayer(socket, tournament) {
  const user = getAuthenticatedUser(socket);

  if (!user || !tournament || !Array.isArray(tournament.players)) {
    return false;
  }

  return tournament.players.some(
    (player) =>
      String(player.userId) === user.userId &&
      String(player.socketId) === String(socket.id),
  );
}

function isTournamentHost(socket, tournament) {
  const user = getAuthenticatedUser(socket);

  if (!user || !tournament?.host) {
    return false;
  }

  return (
    String(tournament.host.userId) === user.userId &&
    String(tournament.host.socketId) === String(socket.id)
  );
}

function buildTournamentPayload(tournament) {
  if (!tournament) {
    return null;
  }

  return {
    tournamentId: tournament.tournamentId,
    code: tournament.code || null,
    type: tournament.type,
    arena: tournament.arena || null,
    maxPlayers: tournament.maxPlayers,
    host: tournament.host || null,
    players: Array.isArray(tournament.players) ? tournament.players : [],
    status: tournament.status,
    currentRound: tournament.currentRound || 0,
    bracket: Array.isArray(tournament.bracket) ? tournament.bracket : [],
    matches: Array.isArray(tournament.matches) ? tournament.matches : [],
    winner: tournament.winner || null,
  };
}

function findTournamentByUserId(userId) {
  if (!userId) {
    return null;
  }

  const targetUserId = String(userId);

  for (const tournament of tournaments.values()) {
    if (!Array.isArray(tournament.players)) {
      continue;
    }

    const player = tournament.players.find(
      (item) => String(item.userId) === targetUserId,
    );

    if (player) {
      return tournament;
    }
  }

  return null;
}

function getActiveMatchByTournamentUser(tournament, userId) {
  if (!tournament || !userId || !Array.isArray(tournament.matches)) {
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

function getTournamentMatchRoomId(tournament, match) {
  if (!tournament || !match) {
    return null;
  }

  return (
    match.onlineRoomId ||
    `${tournament.tournamentId}-${match.matchId}`
  );
}

function markOnlineTournamentMatchCompleted(tournament, match) {
  if (!tournament || !match) {
    return null;
  }

  const roomId = getTournamentMatchRoomId(tournament, match);

  if (!roomId) {
    return null;
  }

  const onlineMatch = getOnlineMatch(roomId);

  if (!onlineMatch) {
    return null;
  }

  if (typeof markMatchCompleted === "function") {
    markMatchCompleted(onlineMatch);
  } else {
    onlineMatch.matchCompleted = true;
    onlineMatch.phase = "complete";
    onlineMatch.battleProcessing = false;
    onlineMatch.nextBattleLocked = false;
    onlineMatch.completedAt = Date.now();
  }

  return onlineMatch;
}

function registerTournament(io, socket) {
  socket.on(
    "create-friend-tournament",
    ({ maxPlayers = 8, arena } = {}, ack) => {
      try {
        const user = getAuthenticatedUser(socket);

        if (!user) {
          const message = "Authentication required.";

          socket.emit("room-error", message);

          ack?.({
            success: false,
            error: message,
          });

          return;
        }

        const normalizedArena = normalizeArena(arena);

        if (!normalizedArena) {
          const message = "Please select an arena first.";

          socket.emit("room-error", message);

          ack?.({
            success: false,
            error: message,
          });

          return;
        }

        const size = Number(maxPlayers);

        if (!ALLOWED_SIZES.includes(size)) {
          const message = "Tournament size must be 4, 8 or 16.";

          socket.emit("room-error", message);

          ack?.({
            success: false,
            error: message,
          });

          return;
        }

        const existingTournament = findTournamentByUserId(user.userId);

        if (existingTournament) {
          const message = "You already have an active tournament.";

          socket.emit("room-error", message);

          ack?.({
            success: false,
            error: message,
          });

          return;
        }

        socket.userId = user.userId;
        socket.username = user.username;

        const tournament = createTournament({
          type: "friend",
          host: {
            socketId: socket.id,
            userId: user.userId,
            username: user.username,
          },
          maxPlayers: size,
          arena: normalizedArena,
        });

        try {
          addPlayerToTournament(tournament, {
            socketId: socket.id,
            userId: user.userId,
            username: user.username,
          });
        } catch (error) {
          deleteTournament(tournament.tournamentId);
          throw error;
        }

        socket.join(tournament.tournamentId);
        socket.ready = false;

        const payload = buildTournamentPayload(tournament);

        socket.emit("friend-tournament-created", payload);

        ack?.({
          success: true,
          tournament: payload,
        });

        console.log(`Friend tournament created: ${tournament.tournamentId}`);
      } catch (error) {
        console.error("Create friend tournament failed:", error);

        const message = error.message || "Failed to create tournament.";

        socket.emit("room-error", message);

        ack?.({
          success: false,
          error: message,
        });
      }
    },
  );

  socket.on("join-friend-tournament", ({ code } = {}, ack) => {
    try {
      const user = getAuthenticatedUser(socket);

      if (!user) {
        const message = "Authentication required.";

        ack?.({
          success: false,
          error: message,
        });

        socket.emit("room-error", message);

        return;
      }

      const cleanCode = String(code || "")
        .trim()
        .toUpperCase();

      if (!cleanCode) {
        const message = "Tournament code is required.";

        ack?.({
          success: false,
          error: message,
        });

        socket.emit("room-error", message);

        return;
      }

      const tournament = [...tournaments.values()].find(
        (item) =>
          item.type === "friend" &&
          String(item.code || "").toUpperCase() === cleanCode,
      );

      if (!tournament) {
        const message = "Tournament not found.";

        ack?.({
          success: false,
          error: message,
        });

        socket.emit("room-error", message);

        return;
      }

      const normalizedArena = normalizeArena(tournament.arena);

      if (!normalizedArena) {
        const message = "Tournament arena is missing.";

        ack?.({
          success: false,
          error: message,
        });

        socket.emit("room-error", message);

        return;
      }

      const existingPlayer = tournament.players.find(
        (player) => String(player.userId) === String(user.userId),
      );

      socket.userId = user.userId;
      socket.username = user.username;

      if (existingPlayer) {
        if (tournament.status === "complete") {
          const message = "Tournament has already finished.";

          ack?.({
            success: false,
            error: message,
          });

          socket.emit("room-error", message);

          return;
        }

        const updatedPlayer = updateTournamentPlayerSocket(
          tournament,
          user.userId,
          socket.id,
          user.username,
        );

        if (!updatedPlayer) {
          throw new Error("Unable to restore tournament connection.");
        }

        socket.join(tournament.tournamentId);
        socket.ready = false;

        const activeMatch = getActiveMatchByTournamentUser(
          tournament,
          user.userId,
        );

        if (activeMatch) {
          const activeRoomId = getTournamentMatchRoomId(
            tournament,
            activeMatch,
          );

          const onlineMatch = getOnlineMatch(activeRoomId);

          if (onlineMatch && !onlineMatch.matchCompleted) {
            const updatedOnlinePlayer = updatePlayerSocket(
              onlineMatch,
              user.userId,
              socket.id,
            );

            if (updatedOnlinePlayer) {
              socket.join(activeRoomId);
            }
          }
        }

        const payload = buildTournamentPayload(tournament);

        ack?.({
          success: true,
          alreadyJoined: true,
          reconnected: true,
          tournament: payload,
        });

        socket.emit("friend-tournament-joined", payload);

        io.to(tournament.tournamentId).emit(
          "friend-tournament-updated",
          payload,
        );

        if (activeMatch) {
          const roomId = getTournamentMatchRoomId(
            tournament,
            activeMatch,
          );

          socket.emit("tournament-match-found", {
            tournamentId: tournament.tournamentId,
            matchId: activeMatch.matchId,
            roomId,
            round: activeMatch.round,
            matchNumber: activeMatch.matchNumber,
            player1: activeMatch.player1,
            player2: activeMatch.player2,
            arena: tournament.arena,
          });
        }

        return;
      }

      if (tournament.status !== "waiting") {
        const message = "Tournament has already started.";

        ack?.({
          success: false,
          error: message,
        });

        socket.emit("room-error", message);

        return;
      }

      const existingTournament = findTournamentByUserId(user.userId);

      if (existingTournament) {
        const message = "You are already part of another tournament.";

        ack?.({
          success: false,
          error: message,
        });

        socket.emit("room-error", message);

        return;
      }

      const added = addPlayerToTournament(tournament, {
        socketId: socket.id,
        userId: user.userId,
        username: user.username,
      });

      if (!added) {
        throw new Error("Unable to join tournament.");
      }

      socket.join(tournament.tournamentId);
      socket.ready = false;

      const payload = buildTournamentPayload(tournament);

      ack?.({
        success: true,
        alreadyJoined: false,
        tournament: payload,
      });

      socket.emit("friend-tournament-joined", payload);

      io.to(tournament.tournamentId).emit(
        "friend-tournament-updated",
        payload,
      );

      console.log(`Friend tournament updated: ${tournament.tournamentId}`);
    } catch (error) {
      console.error("Join friend tournament failed:", error);

      const message = error.message || "Failed to join tournament.";

      ack?.({
        success: false,
        error: message,
      });

      socket.emit("room-error", message);
    }
  });

  socket.on("leave-friend-tournament", ({ tournamentId } = {}, ack) => {
    try {
      const user = getAuthenticatedUser(socket);

      if (!user) {
        ack?.({
          success: false,
          error: "Authentication required.",
        });

        return;
      }

      if (!tournamentId) {
        ack?.({
          success: false,
          error: "Tournament ID is required.",
        });

        return;
      }

      const tournament = getTournament(tournamentId);

      if (!tournament) {
        ack?.({
          success: false,
          error: "Tournament not found.",
        });

        return;
      }

      if (tournament.status !== "waiting") {
        ack?.({
          success: false,
          error: "Tournament has already started.",
        });

        return;
      }

      if (!isTournamentPlayer(socket, tournament)) {
        ack?.({
          success: false,
          error: "You are not part of this tournament.",
        });

        return;
      }

      const player = tournament.players.find(
        (item) =>
          String(item.userId) === user.userId &&
          String(item.socketId) === String(socket.id),
      );

      removePlayerFromTournament(tournament, socket.id);

      socket.leave(tournamentId);

      if (String(tournament.host?.userId) === String(player?.userId)) {
        const newHost = tournament.players[0] || null;

        tournament.host = newHost
          ? {
              socketId: newHost.socketId,
              userId: newHost.userId,
              username: newHost.username,
            }
          : null;
      }

      const payload = buildTournamentPayload(tournament);

      io.to(tournamentId).emit(
        "friend-tournament-updated",
        payload,
      );

      ack?.({
        success: true,
        tournament: payload,
      });

      if (tournament.players.length === 0) {
        deleteTournament(tournamentId);
      }
    } catch (error) {
      console.error("Leave tournament failed:", error);

      ack?.({
        success: false,
        error: error.message || "Failed to leave tournament.",
      });
    }
  });

  socket.on("start-tournament", ({ tournamentId } = {}, ack) => {
    try {
      const user = getAuthenticatedUser(socket);

      if (!user) {
        const message = "Authentication required.";

        socket.emit("room-error", message);

        ack?.({
          success: false,
          error: message,
        });

        return;
      }

      if (!tournamentId) {
        const message = "Tournament ID is required.";

        socket.emit("room-error", message);

        ack?.({
          success: false,
          error: message,
        });

        return;
      }

      const tournament = getTournament(tournamentId);

      if (!tournament) {
        const message = "Tournament not found.";

        socket.emit("room-error", message);

        ack?.({
          success: false,
          error: message,
        });

        return;
      }

      if (!isTournamentHost(socket, tournament)) {
        const message =
          "Only the authenticated host can start the tournament.";

        socket.emit("room-error", message);

        ack?.({
          success: false,
          error: message,
        });

        return;
      }

      if (tournament.status !== "waiting") {
        const message = "Tournament has already started.";

        socket.emit("room-error", message);

        ack?.({
          success: false,
          error: message,
        });

        return;
      }

      if (!tournament.arena?.id || !tournament.arena?.name) {
        const message = "Tournament arena is missing.";

        socket.emit("room-error", message);

        ack?.({
          success: false,
          error: message,
        });

        return;
      }

      if (
        !Array.isArray(tournament.players) ||
        tournament.players.length !== tournament.maxPlayers
      ) {
        const message = `Tournament requires ${tournament.maxPlayers} players.`;

        socket.emit("room-error", message);

        ack?.({
          success: false,
          error: message,
        });

        return;
      }

      const disconnectedPlayer = tournament.players.find(
        (player) =>
          !io.sockets.sockets.get(String(player.socketId)),
      );

      if (disconnectedPlayer) {
        const message =
          "All tournament players must be connected before starting.";

        socket.emit("room-error", message);

        ack?.({
          success: false,
          error: message,
        });

        return;
      }

      const bracket = startTournament(tournament);

      const payload = buildTournamentPayload(tournament);

      io.to(tournamentId).emit("tournament-started", {
        ...payload,
        bracket,
      });

      const startedMatches = startRoundMatches(io, tournament);

      if (startedMatches.length !== tournament.matches.length) {
        console.error(
          `Some tournament matches failed to start: ${tournament.tournamentId}`,
        );
      }

      ack?.({
        success: true,
        tournament: buildTournamentPayload(tournament),
      });

      console.log(`Tournament started: ${tournamentId}`);
    } catch (error) {
      console.error("Start tournament failed:", error);

      const message = error.message || "Failed to start tournament.";

      socket.emit("room-error", message);

      ack?.({
        success: false,
        error: message,
      });
    }
  });

  socket.on(
    "join-random-tournament",
    ({ maxPlayers = 8, arena } = {}, ack) => {
      try {
        cleanupRandomTournamentQueue(io);

        const user = getAuthenticatedUser(socket);

        if (!user) {
          const message = "Authentication required.";

          socket.emit("room-error", message);

          ack?.({
            success: false,
            error: message,
          });

          return;
        }

        const normalizedArena = normalizeArena(arena);

        if (!normalizedArena) {
          const message = "Please select an arena first.";

          socket.emit("room-error", message);

          ack?.({
            success: false,
            error: message,
          });

          return;
        }

        const size = Number(maxPlayers);

        if (!ALLOWED_SIZES.includes(size)) {
          const message = "Tournament size must be 4, 8 or 16.";

          socket.emit("room-error", message);

          ack?.({
            success: false,
            error: message,
          });

          return;
        }

        const existingTournament = findTournamentByUserId(user.userId);

        if (existingTournament) {
          const message =
            "You are already part of an active tournament.";

          socket.emit("room-error", message);

          ack?.({
            success: false,
            error: message,
          });

          return;
        }

        socket.userId = user.userId;
        socket.username = user.username;

        removeRandomTournamentPlayer(user.userId);

        const added = addRandomTournamentPlayer({
          socketId: socket.id,
          userId: user.userId,
          username: user.username,
          requestedSize: size,
          arena: normalizedArena,
        });

        if (!added) {
          throw new Error("Unable to join tournament queue.");
        }

        const playersSearching = getRandomTournamentQueueCount(
          size,
          normalizedArena.id,
        );

        const payload = {
          playersSearching,
          maxPlayers: size,
          arena: normalizedArena,
        };

        socket.emit("random-tournament-searching", payload);

        ack?.({
          success: true,
          ...payload,
        });

        tryCreateRandomTournament(
          io,
          size,
          normalizedArena,
        );
      } catch (error) {
        console.error("Random tournament failed:", error);

        const message =
          error.message || "Failed to join tournament queue.";

        socket.emit("room-error", message);

        ack?.({
          success: false,
          error: message,
        });
      }
    },
  );

  socket.on("cancel-random-tournament", (_, ack) => {
    try {
      const user = getAuthenticatedUser(socket);

      if (!user) {
        const message = "Authentication required.";

        socket.emit("room-error", message);

        ack?.({
          success: false,
          error: message,
        });

        return;
      }

      removeRandomTournamentPlayer(user.userId, socket.id);

      socket.emit("random-tournament-cancelled");

      ack?.({
        success: true,
      });
    } catch (error) {
      console.error("Cancel random tournament failed:", error);

      ack?.({
        success: false,
        error:
          error.message ||
          "Failed to cancel tournament search.",
      });
    }
  });

  socket.on("disconnect", () => {
    const user = getAuthenticatedUser(socket);

    if (user) {
      removeRandomTournamentPlayer(user.userId, socket.id);
    } else {
      removeRandomTournamentPlayerBySocket(socket.id);
    }

    for (const tournament of tournaments.values()) {
      if (tournament.status === "waiting") {
        const player = tournament.players.find(
          (item) =>
            String(item.socketId) === String(socket.id) &&
            (!user ||
              String(item.userId) === String(user.userId)),
        );

        if (!player) {
          continue;
        }

        removePlayerFromTournament(tournament, socket.id);

        if (
          String(tournament.host?.userId) ===
          String(player.userId)
        ) {
          const newHost = tournament.players[0] || null;

          tournament.host = newHost
            ? {
                socketId: newHost.socketId,
                userId: newHost.userId,
                username: newHost.username,
              }
            : null;
        }

        const payload = buildTournamentPayload(tournament);

        io.to(tournament.tournamentId).emit(
          "friend-tournament-updated",
          payload,
        );

        if (tournament.players.length === 0) {
          deleteTournament(tournament.tournamentId);
        }

        continue;
      }

      if (tournament.status !== "active") {
        continue;
      }

      const activeMatch = getActiveMatch(
        tournament,
        socket.id,
      );

      if (!activeMatch) {
        continue;
      }

      const disconnectedPlayer =
        String(activeMatch.player1?.socketId) ===
        String(socket.id)
          ? activeMatch.player1
          : String(activeMatch.player2?.socketId) ===
              String(socket.id)
            ? activeMatch.player2
            : null;

      if (!disconnectedPlayer) {
        continue;
      }

      const currentPlayer = tournament.players.find(
        (player) =>
          String(player.userId) ===
          String(disconnectedPlayer.userId),
      );

      if (
        currentPlayer &&
        String(currentPlayer.socketId) !==
          String(socket.id)
      ) {
        continue;
      }

      handleTournamentPlayerDisconnect(io, socket.id);

      break;
    }
  });
}

function startRoundMatches(io, tournament) {
  if (!tournament) {
    return [];
  }

  const roundMatches = tournament.matches.filter(
    (match) =>
      Number(match.round) ===
        Number(tournament.currentRound) &&
      match.status === "pending",
  );

  const startedMatches = [];

  for (const match of roundMatches) {
    const startedMatch = startTournamentMatch(
      io,
      tournament,
      match,
    );

    if (startedMatch) {
      startedMatches.push(startedMatch);
    }
  }

  return startedMatches;
}

function tryCreateRandomTournament(io, size, arena) {
  const requestedSize = Number(size);

  if (!ALLOWED_SIZES.includes(requestedSize)) {
    return null;
  }

  const normalizedArena = normalizeArena(arena);

  if (!normalizedArena) {
    return null;
  }

  cleanupRandomTournamentQueue(io);

  const queue = getRandomTournamentQueue();

  const eligiblePlayers = queue.filter((player) => {
    const sameSize =
      Number(player.requestedSize) === requestedSize;

    const sameArena =
      String(player?.arena?.id || "") ===
      String(normalizedArena.id);

    return sameSize && sameArena;
  });

  if (eligiblePlayers.length < requestedSize) {
    return null;
  }

  const selectedPlayers = takeRandomTournamentPlayers(
    requestedSize,
    normalizedArena.id,
  );

  if (
    !selectedPlayers ||
    selectedPlayers.length !== requestedSize
  ) {
    return null;
  }

  const connectedPlayers = selectedPlayers.filter((player) =>
    Boolean(io.sockets.sockets.get(player.socketId)),
  );

  if (connectedPlayers.length !== requestedSize) {
    for (const player of selectedPlayers) {
      const playerSocket = io.sockets.sockets.get(
        player.socketId,
      );

      if (playerSocket) {
        addRandomTournamentPlayer(player);
      }
    }

    cleanupRandomTournamentQueue(io);

    return null;
  }

  const host = selectedPlayers[0];

  let tournament = null;

  try {
    tournament = createTournament({
      type: "random",
      host: {
        socketId: host.socketId,
        userId: host.userId,
        username: host.username,
      },
      maxPlayers: requestedSize,
      arena: normalizedArena,
    });

    for (const player of selectedPlayers) {
      const added = addPlayerToTournament(
        tournament,
        player,
      );

      if (!added) {
        throw new Error(
          "Unable to add player to random tournament.",
        );
      }
    }

    const bracket = startTournament(tournament);

    for (const player of selectedPlayers) {
      const playerSocket = io.sockets.sockets.get(
        player.socketId,
      );

      if (playerSocket) {
        playerSocket.join(tournament.tournamentId);
      }
    }

    const payload = buildTournamentPayload(tournament);

    io.to(tournament.tournamentId).emit(
      "random-tournament-found",
      {
        ...payload,
        bracket,
      },
    );

    const startedMatches = startRoundMatches(
      io,
      tournament,
    );

    if (startedMatches.length !== tournament.matches.length) {
      console.error(
        `Some random tournament matches failed to start: ${tournament.tournamentId}`,
      );
    }

    console.log(
      `Random tournament created: ${tournament.tournamentId}`,
    );

    return tournament;
  } catch (error) {
    console.error(
      "Failed to create random tournament:",
      error,
    );

    if (tournament) {
      deleteTournament(tournament.tournamentId);
    }

    for (const player of selectedPlayers) {
      const playerSocket = io.sockets.sockets.get(
        player.socketId,
      );

      if (playerSocket) {
        addRandomTournamentPlayer(player);
      }
    }

    cleanupRandomTournamentQueue(io);

    return null;
  }
}

function startTournamentMatch(io, tournament, match) {
  if (!tournament || !match) {
    return null;
  }

  if (!match.player1 || !match.player2) {
    return null;
  }

  if (match.status !== "pending") {
    return null;
  }

  const arena = normalizeArena(tournament.arena);

  if (!arena) {
    console.error(
      `Cannot start tournament match without arena: ${match.matchId}`,
    );

    return null;
  }

  const player1Socket = io.sockets.sockets.get(
    match.player1.socketId,
  );

  const player2Socket = io.sockets.sockets.get(
    match.player2.socketId,
  );

  if (!player1Socket || !player2Socket) {
    console.error(
      `Cannot start tournament match because a player is disconnected: ${match.matchId}`,
    );

    return null;
  }

  const roomId = `${tournament.tournamentId}-${match.matchId}`;

  const players = [
    {
      socketId: match.player1.socketId,
      userId: match.player1.userId,
      username: match.player1.username,
    },
    {
      socketId: match.player2.socketId,
      userId: match.player2.userId,
      username: match.player2.username,
    },
  ];

  let onlineMatch = null;

  try {
    onlineMatch = createOnlineMatch(
      roomId,
      players,
    );

    onlineMatch.tournamentId =
      tournament.tournamentId;

    onlineMatch.tournamentMatchId =
      match.matchId;

    onlineMatch.arena = arena;
    onlineMatch.phase = "waiting";

    const markedMatch = markMatchActive(
      tournament,
      match.matchId,
      roomId,
    );

    if (!markedMatch) {
      deleteOnlineMatch(roomId);
      return null;
    }
  } catch (error) {
    if (onlineMatch) {
      deleteOnlineMatch(roomId);
    }

    console.error(
      `Failed to create tournament online match: ${roomId}`,
      error,
    );

    return null;
  }

  player1Socket.join(roomId);
  player2Socket.join(roomId);

  const payload = {
    tournamentId: tournament.tournamentId,
    matchId: match.matchId,
    roomId,
    round: match.round,
    matchNumber: match.matchNumber,
    player1: match.player1,
    player2: match.player2,
    arena,
  };

  io.to(roomId).emit(
    "tournament-match-found",
    payload,
  );

  io.to(tournament.tournamentId).emit(
    "tournament-match-created",
    payload,
  );

  console.log(
    `Tournament match created: ${roomId}`,
  );

  return payload;
}

function handleTournamentMatchComplete(
  io,
  match,
  finalResult,
) {
  if (
    !match?.tournamentId ||
    !match?.tournamentMatchId
  ) {
    return false;
  }

  if (!finalResult || !finalResult.winner) {
    return false;
  }

  if (
    finalResult.winner !== "player1" &&
    finalResult.winner !== "player2"
  ) {
    return false;
  }

  const tournament = getTournament(
    match.tournamentId,
  );

  if (!tournament || tournament.status !== "active") {
    return false;
  }

  const tournamentMatch = tournament.matches.find(
    (item) =>
      String(item.matchId) ===
      String(match.tournamentMatchId),
  );

  if (!tournamentMatch) {
    return false;
  }

  if (tournamentMatch.status === "complete") {
    return false;
  }

  let winnerPlayer = null;

  if (finalResult.winner === "player1") {
    winnerPlayer = tournamentMatch.player1;
  }

  if (finalResult.winner === "player2") {
    winnerPlayer = tournamentMatch.player2;
  }

  if (!winnerPlayer) {
    console.error(
      "Tournament match finished without valid winner.",
    );

    return false;
  }

  const completedMatch = markMatchComplete(
    tournament,
    tournamentMatch.matchId,
    winnerPlayer,
  );

  if (!completedMatch) {
    return false;
  }

  completedMatch.reason = "battle";

  const roomId = getTournamentMatchRoomId(
    tournament,
    tournamentMatch,
  );

  const onlineMatch = markOnlineTournamentMatchCompleted(
    tournament,
    tournamentMatch,
  );

  const completionResult = {
    ...finalResult,
    winner: finalResult.winner,
    player1HP:
      onlineMatch?.player1HP ??
      finalResult.player1HP ??
      null,
    player2HP:
      onlineMatch?.player2HP ??
      finalResult.player2HP ??
      null,
  };

  io.to(tournament.tournamentId).emit(
    "tournament-match-complete",
    {
      tournamentId: tournament.tournamentId,
      matchId: completedMatch.matchId,
      round: completedMatch.round,
      winner: winnerPlayer,
      arena: tournament.arena,
      bracket: tournament.bracket,
      matches: tournament.matches,
    },
  );

  const result = advanceTournamentAfterMatch(
    io,
    tournament,
    completedMatch,
    winnerPlayer,
    "battle",
  );

  if (
    result?.type === "tournament-complete" ||
    result?.type === "round-advanced"
  ) {
    deleteOnlineMatch(roomId);
  }

  return {
    ...result,
    completionResult,
  };
}

function handleTournamentPlayerDisconnect(io, socketId) {
  for (const tournament of tournaments.values()) {
    if (tournament.status !== "active") {
      continue;
    }

    const activeMatch = getActiveMatch(
      tournament,
      socketId,
    );

    if (!activeMatch) {
      continue;
    }

    let disconnectedPlayer = null;
    let winner = null;

    if (
      String(activeMatch.player1?.socketId) ===
      String(socketId)
    ) {
      disconnectedPlayer = activeMatch.player1;
      winner = activeMatch.player2;
    }

    if (
      String(activeMatch.player2?.socketId) ===
      String(socketId)
    ) {
      disconnectedPlayer = activeMatch.player2;
      winner = activeMatch.player1;
    }

    if (!disconnectedPlayer || !winner) {
      continue;
    }

    const currentPlayer = tournament.players.find(
      (player) =>
        String(player.userId) ===
        String(disconnectedPlayer.userId),
    );

    if (
      currentPlayer &&
      String(currentPlayer.socketId) !==
        String(socketId)
    ) {
      return {
        type: "reconnect-detected",
        tournament,
        match: activeMatch,
      };
    }

    const completedMatch = markMatchComplete(
      tournament,
      activeMatch.matchId,
      winner,
    );

    if (!completedMatch) {
      continue;
    }

    completedMatch.reason = "forfeit";
    completedMatch.forfeitedPlayer = socketId;

    const roomId = getTournamentMatchRoomId(
      tournament,
      activeMatch,
    );

    markOnlineTournamentMatchCompleted(
      tournament,
      activeMatch,
    );

    io.to(tournament.tournamentId).emit(
      "tournament-match-complete",
      {
        tournamentId: tournament.tournamentId,
        matchId: completedMatch.matchId,
        round: completedMatch.round,
        winner,
        reason: "forfeit",
        forfeitedPlayer: socketId,
        arena: tournament.arena,
        bracket: tournament.bracket,
        matches: tournament.matches,
      },
    );

    const result = advanceTournamentAfterMatch(
      io,
      tournament,
      completedMatch,
      winner,
      "forfeit",
    );

    if (
      result?.type === "tournament-complete" ||
      result?.type === "round-advanced"
    ) {
      deleteOnlineMatch(roomId);
    }

    return {
      type: result?.type || "match-complete",
      tournament,
      match: completedMatch,
      winner,
      ...(result || {}),
    };
  }

  return null;
}

function advanceTournamentAfterMatch(
  io,
  tournament,
  completedMatch,
  winner,
  reason,
) {
  if (
    !tournament ||
    !completedMatch ||
    !winner
  ) {
    return false;
  }

  const currentRound = tournament.currentRound;

  const currentRoundMatches =
    tournament.matches.filter(
      (item) =>
        Number(item.round) ===
        Number(currentRound),
    );

  const allRoundComplete =
    currentRoundMatches.length > 0 &&
    currentRoundMatches.every(
      (item) => item.status === "complete",
    );

  if (!allRoundComplete) {
    return {
      type: "match-complete",
      tournament,
      match: completedMatch,
      winner,
    };
  }

  const tournamentWinner =
    finishTournament(tournament);

  if (tournamentWinner) {
    io.to(tournament.tournamentId).emit(
      "tournament-complete",
      {
        tournamentId: tournament.tournamentId,
        winner: tournamentWinner,
        players: tournament.players,
        arena: tournament.arena,
        currentRound: tournament.currentRound,
        bracket: tournament.bracket,
        matches: tournament.matches,
        ...(reason === "forfeit"
          ? {
              reason: "forfeit",
            }
          : {}),
      },
    );

    return {
      type: "tournament-complete",
      tournament,
      winner: tournamentWinner,
    };
  }

  const completedRound =
    tournament.currentRound;

  const nextMatches =
    createNextRound(tournament);

  if (
    !nextMatches ||
    nextMatches.length === 0
  ) {
    return {
      type: "match-complete",
      tournament,
      match: completedMatch,
      winner,
    };
  }

  io.to(tournament.tournamentId).emit(
    "tournament-round-complete",
    {
      tournamentId: tournament.tournamentId,
      completedRound,
      nextRound: tournament.currentRound,
      arena: tournament.arena,
      bracket: tournament.bracket,
      matches: tournament.matches,
    },
  );

  for (const nextMatch of nextMatches) {
    startTournamentMatch(
      io,
      tournament,
      nextMatch,
    );
  }

  return {
    type: "round-advanced",
    tournament,
    nextMatches,
  };
}

module.exports = registerTournament;

module.exports.registerTournament =
  registerTournament;

module.exports.startTournamentMatch =
  startTournamentMatch;

module.exports.startRoundMatches =
  startRoundMatches;

module.exports.handleTournamentMatchComplete =
  handleTournamentMatchComplete;

module.exports.handleTournamentPlayerDisconnect =
  handleTournamentPlayerDisconnect;
