const { positions } = require("../data/positions");
const { executeOnlineBattle } = require("../utils/onlineBattleEngine");
const { getOnlineMatch, deleteOnlineMatch } = require("./onlineMatch");
const { initializeOnlineDraft } = require("./onlineDraft");
const { handleTournamentMatchComplete } = require("./tournament");

const TOTAL_BATTLES = positions.length;
const INITIAL_HP = 100;

function emitOnlineMatchComplete(io, roomId, match) {
  const player1HP = Math.max(0, Math.min(INITIAL_HP, Number(match.player1HP) || 0));
  const player2HP = Math.max(0, Math.min(INITIAL_HP, Number(match.player2HP) || 0));

  const winner =
    player1HP > player2HP
      ? "player1"
      : player2HP > player1HP
        ? "player2"
        : "draw";

  io.to(roomId).emit("online-match-complete", {
    roomId,
    results: match.results,
    player1HP,
    player2HP,
    player1Score: match.player1Score,
    player2Score: match.player2Score,
    winner,
    tournamentId: match.tournamentId || null,
    tournamentMatchId: match.tournamentMatchId || null,
    arena: match.arena || null,
  });

  return winner;
}

function getPlayerBySocket(match, socketId) {
  if (!match || !socketId) {
    return null;
  }

  return (
    match.players?.find(
      (player) => String(player?.socketId) === String(socketId),
    ) || null
  );
}

function isAuthenticatedMatchPlayer(socket, match) {
  if (!socket?.user?.id || !match) {
    return false;
  }

  const player = getPlayerBySocket(match, socket.id);

  if (!player) {
    return false;
  }

  return String(player.userId) === String(socket.user.id);
}

function getMatchWinner(match) {
  const player1HP = Math.max(
    0,
    Math.min(INITIAL_HP, Number(match?.player1HP) || 0),
  );

  const player2HP = Math.max(
    0,
    Math.min(INITIAL_HP, Number(match?.player2HP) || 0),
  );

  if (player1HP > player2HP) {
    return "player1";
  }

  if (player2HP > player1HP) {
    return "player2";
  }

  return "draw";
}

function emitTournamentMatchComplete(io, match, result) {
  if (!match?.tournamentId || !match?.tournamentMatchId || !result) {
    return;
  }

  handleTournamentMatchComplete(io, match, result);
}

function registerOnlineBattle(io, socket) {
  socket.on("online-get-battle-state", ({ roomId } = {}) => {
    try {
      if (!roomId) {
        socket.emit("room-error", "Room ID is required.");
        return;
      }

      const match = getOnlineMatch(roomId);

      if (!match) {
        socket.emit("room-error", "Online match not found.");
        return;
      }

      if (!isAuthenticatedMatchPlayer(socket, match)) {
        socket.emit("room-error", "You are not part of this match.");
        return;
      }

      if (match.phase !== "battle" && match.phase !== "complete") {
        socket.emit(
          "room-error",
          `Battle is not ready yet. Current phase: ${match.phase}`,
        );
        return;
      }

      const position = positions[match.currentBattle] || null;
      const currentResult =
        match.results?.[match.results.length - 1] || null;

      socket.emit("online-battle-state", {
        roomId,
        phase: match.phase,
        currentBattle: match.currentBattle,
        totalBattles: TOTAL_BATTLES,
        position,
        player1HP: match.player1HP,
        player2HP: match.player2HP,
        player1Score: match.player1Score,
        player2Score: match.player2Score,
        battleRevealed: Boolean(match.battleRevealed),
        nextBattleLocked: Boolean(match.nextBattleLocked),
        result: match.battleRevealed ? currentResult : null,
        results: match.results || [],
        arena: match.arena || null,
        tournamentId: match.tournamentId || null,
        tournamentMatchId: match.tournamentMatchId || null,
      });
    } catch (error) {
      console.error("Get battle state failed:", error);
      socket.emit("room-error", "Failed to get battle state.");
    }
  });

  socket.on("online-fight", ({ roomId } = {}) => {
    try {
      if (!roomId) {
        socket.emit("room-error", "Room ID is required.");
        return;
      }

      const match = getOnlineMatch(roomId);

      if (!match) {
        socket.emit("room-error", "Online match not found.");
        return;
      }

      if (!isAuthenticatedMatchPlayer(socket, match)) {
        socket.emit("room-error", "You are not part of this match.");
        return;
      }

      if (match.phase !== "battle") {
        socket.emit(
          "room-error",
          `Battle is not active. Current phase: ${match.phase}`,
        );
        return;
      }

      if (match.battleRevealed || match.battleProcessing) {
        return;
      }

      if (match.currentBattle < 0 || match.currentBattle >= TOTAL_BATTLES) {
        socket.emit("room-error", "Invalid battle position.");
        return;
      }

      const position = positions[match.currentBattle];

      if (!position) {
        socket.emit("room-error", "Battle position not found.");
        return;
      }

      const player1Card = match.player1Team?.[position.id];
      const player2Card = match.player2Team?.[position.id];

      if (!player1Card || !player2Card) {
        socket.emit("room-error", "Battle cards are missing.");
        return;
      }

      match.battleProcessing = true;

      const result = executeOnlineBattle({
        player1Card,
        player2Card,
        positionId: position.id,
        positionName: position.name,
        icon: position.icon,
        player1HP: match.player1HP,
        player2HP: match.player2HP,
      });

      if (!result) {
        match.battleProcessing = false;
        socket.emit("room-error", "Unable to calculate battle.");
        return;
      }

      match.player1HP = Math.max(
        0,
        Math.min(INITIAL_HP, Number(result.player1HP) || 0),
      );

      match.player2HP = Math.max(
        0,
        Math.min(INITIAL_HP, Number(result.player2HP) || 0),
      );

      if (result.pointTo === "player1") {
        match.player1Score += 1;
      }

      if (result.pointTo === "player2") {
        match.player2Score += 1;
      }

      const isFinalBattle = match.currentBattle >= TOTAL_BATTLES - 1;

      const finalResult = {
        ...result,
        roomId: String(roomId),
        battleIndex: match.currentBattle,
        player1Score: match.player1Score,
        player2Score: match.player2Score,
        matchEnded: isFinalBattle,
      };

      match.battleRevealed = true;
      match.nextBattleLocked = false;
      match.results.push(finalResult);
      match.battleProcessing = false;

      io.to(roomId).emit("online-battle-result", {
        roomId,
        result: finalResult,
        currentBattle: match.currentBattle,
        totalBattles: TOTAL_BATTLES,
        player1HP: match.player1HP,
        player2HP: match.player2HP,
        player1Score: match.player1Score,
        player2Score: match.player2Score,
        battleRevealed: true,
        nextBattleLocked: false,
        results: match.results,
        arena: match.arena || null,
        tournamentId: match.tournamentId || null,
        tournamentMatchId: match.tournamentMatchId || null,
      });

      if (!isFinalBattle) {
        return;
      }

      match.phase = "complete";

      const matchWinner = emitOnlineMatchComplete(io, roomId, match);

      emitTournamentMatchComplete(io, match, {
        ...finalResult,
        winner: matchWinner,
        matchWinner,
        player1HP: match.player1HP,
        player2HP: match.player2HP,
      });
    } catch (error) {
      const match = roomId ? getOnlineMatch(roomId) : null;

      if (match) {
        match.battleProcessing = false;
      }

      console.error("Online fight failed:", error);

      socket.emit("room-error", "Online battle failed.");
    }
  });

  socket.on("player-ready", async ({ roomId } = {}) => {
    try {
      if (!roomId) {
        socket.emit("room-error", "Room ID is required.");
        return;
      }

      const match = getOnlineMatch(roomId);

      if (!match) {
        socket.emit("room-error", "Online match not found.");
        return;
      }

      if (!isAuthenticatedMatchPlayer(socket, match)) {
        socket.emit("room-error", "You are not part of this match.");
        return;
      }

      const player = getPlayerBySocket(match, socket.id);

      if (!player) {
        socket.emit("room-error", "You are not part of this match.");
        return;
      }

      if (!match.readyPlayers) {
        match.readyPlayers = new Set();
      }

      const socketId = String(socket.id);

      if (match.readyPlayers.has(socketId)) {
        return;
      }

      match.readyPlayers.add(socketId);

      io.to(roomId).emit("player-ready", {
        roomId,
        userId: player.userId,
        username: player.username,
      });

      const allReady =
        match.players?.length === 2 &&
        match.players.every((item) =>
          match.readyPlayers.has(String(item.socketId)),
        );

      if (!allReady) {
        return;
      }

      if (match.arena) {
        try {
          if (match.phase !== "draft") {
            await initializeOnlineDraft(match);
          }

          match.phase = "draft";

          io.to(roomId).emit("match-ready", {
            roomId,
            arena: match.arena,
          });

          io.to(roomId).emit("online-arena-selected", {
            roomId,
            arena: match.arena,
            selectedBy: {
              userId: match.players[0]?.userId,
              username: match.players[0]?.username,
            },
          });

          io.to(roomId).emit("online-draft-started", {
            roomId,
            arena: match.arena,
            cardsPerPlayer: 10,
          });

          return;
        } catch (error) {
          console.error("Draft initialization failed:", error);

          socket.emit(
            "room-error",
            error.message || "Failed to initialize draft.",
          );

          return;
        }
      }

      match.phase = "arena";

      io.to(roomId).emit("match-ready", {
        roomId,
      });
    } catch (error) {
      console.error("Player ready failed:", error);

      socket.emit(
        "room-error",
        error.message || "Failed to mark player ready.",
      );
    }
  });

  socket.on("online-next-battle", ({ roomId } = {}) => {
    try {
      if (!roomId) {
        socket.emit("room-error", "Room ID is required.");
        return;
      }

      const match = getOnlineMatch(roomId);

      if (!match) {
        socket.emit("room-error", "Online match not found.");
        return;
      }

      if (!isAuthenticatedMatchPlayer(socket, match)) {
        socket.emit("room-error", "You are not part of this match.");
        return;
      }

      if (match.phase !== "battle") {
        return;
      }

      if (!match.battleRevealed || match.nextBattleLocked) {
        return;
      }

      const lastResult = match.results?.[match.results.length - 1] || null;

      if (lastResult?.matchEnded || match.currentBattle >= TOTAL_BATTLES - 1) {
        match.phase = "complete";

        const matchWinner = emitOnlineMatchComplete(io, roomId, match);

        if (lastResult) {
          emitTournamentMatchComplete(io, match, {
            ...lastResult,
            winner: matchWinner,
            matchWinner,
            player1HP: match.player1HP,
            player2HP: match.player2HP,
          });
        }

        return;
      }

      const nextIndex = match.currentBattle + 1;

      if (nextIndex >= TOTAL_BATTLES) {
        match.phase = "complete";

        const matchWinner = emitOnlineMatchComplete(io, roomId, match);

        if (lastResult) {
          emitTournamentMatchComplete(io, match, {
            ...lastResult,
            winner: matchWinner,
            matchWinner,
            player1HP: match.player1HP,
            player2HP: match.player2HP,
          });
        }

        return;
      }

      match.nextBattleLocked = true;
      match.currentBattle = nextIndex;
      match.battleRevealed = false;
      match.battleProcessing = false;

      const nextPosition = positions[nextIndex];

      if (!nextPosition) {
        match.nextBattleLocked = false;
        socket.emit("room-error", "Next battle position not found.");
        return;
      }

      match.nextBattleLocked = false;

      io.to(roomId).emit("online-next-battle", {
        roomId,
        currentBattle: nextIndex,
        totalBattles: TOTAL_BATTLES,
        position: nextPosition,
        player1HP: match.player1HP,
        player2HP: match.player2HP,
        player1Score: match.player1Score,
        player2Score: match.player2Score,
        battleRevealed: false,
        nextBattleLocked: false,
        results: match.results,
        arena: match.arena || null,
        tournamentId: match.tournamentId || null,
        tournamentMatchId: match.tournamentMatchId || null,
      });
    } catch (error) {
      console.error("Next battle failed:", error);

      socket.emit("room-error", "Unable to start next battle.");
    }
  });

  socket.on("leave-online-match", ({ roomId } = {}) => {
    try {
      if (!roomId) {
        return;
      }

      const match = getOnlineMatch(roomId);

      if (!match) {
        socket.leave(roomId);
        return;
      }

      if (!isAuthenticatedMatchPlayer(socket, match)) {
        socket.emit("room-error", "You are not part of this match.");
        return;
      }

      if (match.tournamentId && match.tournamentMatchId) {
        socket.leave(roomId);
        return;
      }

      socket.leave(roomId);

      socket.to(roomId).emit("opponent-left");

      deleteOnlineMatch(roomId);

      console.log(`Online match closed: ${roomId}`);
    } catch (error) {
      console.error("Leave online match failed:", error);
    }
  });
}

module.exports = registerOnlineBattle;