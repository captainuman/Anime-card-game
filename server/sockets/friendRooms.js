const crypto = require("crypto");

const {
  createOnlineMatch,
  deleteOnlineMatch,
} = require("./onlineMatch");

const friendRooms = new Map();

function normalizeArena(arena) {
  if (!arena) {
    return null;
  }

  const id =
    arena?.id != null
      ? String(arena.id).trim()
      : "";

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

function generateRoomCode() {
  return crypto
    .randomBytes(4)
    .toString("hex")
    .slice(0, 6)
    .toUpperCase();
}

function generateUniqueRoomCode() {
  let code = generateRoomCode();

  while (friendRooms.has(code)) {
    code = generateRoomCode();
  }

  return code;
}

function getAuthenticatedUser(socket) {
  const userId =
    socket?.user?.id ||
    socket?.userId ||
    null;

  if (!userId) {
    return null;
  }

  return {
    userId: String(userId).trim(),
    username:
      String(
        socket?.user?.username ||
          socket?.username ||
          "Player",
      ).trim() || "Player",
  };
}

function findFriendRoomByUserId(userId) {
  if (!userId) {
    return null;
  }

  const normalizedUserId = String(userId);

  for (const room of friendRooms.values()) {
    if (
      String(room.host?.userId) ===
      normalizedUserId
    ) {
      return room;
    }

    if (
      String(room.guest?.userId) ===
      normalizedUserId
    ) {
      return room;
    }
  }

  return null;
}

function registerFriendRooms(io, socket) {
  socket.on(
    "create-friend-room",
    ({ arena } = {}) => {
      try {
        const user = getAuthenticatedUser(socket);

        if (!user) {
          socket.emit(
            "room-error",
            "Authentication required.",
          );
          return;
        }

        const normalizedArena =
          normalizeArena(arena);

        if (!normalizedArena) {
          socket.emit(
            "room-error",
            "Please select an arena first.",
          );
          return;
        }

        const existingRoom =
          findFriendRoomByUserId(user.userId);

        if (existingRoom) {
          socket.emit(
            "room-error",
            "You already have an active friend room.",
          );
          return;
        }

        socket.userId = user.userId;
        socket.username = user.username;

        const roomCode =
          generateUniqueRoomCode();

        const room = {
          roomCode,
          type: "friend",
          arena: normalizedArena,
          host: {
            socketId: socket.id,
            userId: user.userId,
            username: user.username,
          },
          guest: null,
          createdAt: Date.now(),
        };

        friendRooms.set(roomCode, room);

        socket.join(roomCode);
        socket.ready = false;

        const payload = {
          roomId: roomCode,
          roomCode,
          type: room.type,
          arena: room.arena,
          players: [room.host],
        };

        socket.emit(
          "friend-room-created",
          payload,
        );
      } catch (error) {
        console.error(
          "Create friend room failed:",
          error,
        );

        socket.emit(
          "room-error",
          error.message ||
            "Failed to create friend room.",
        );
      }
    },
  );

  socket.on(
    "join-friend-room",
    ({ roomCode } = {}) => {
      try {
        const user = getAuthenticatedUser(socket);

        if (!user) {
          socket.emit(
            "room-error",
            "Authentication required.",
          );
          return;
        }

        const code = String(
          roomCode || "",
        )
          .trim()
          .toUpperCase();

        if (!code) {
          socket.emit(
            "room-error",
            "Room code is required.",
          );
          return;
        }

        const room = friendRooms.get(code);

        if (!room) {
          socket.emit(
            "room-error",
            "Room not found.",
          );
          return;
        }

        if (
          !room.arena?.id ||
          !room.arena?.name
        ) {
          socket.emit(
            "room-error",
            "Room arena is missing.",
          );
          return;
        }

        if (
          String(room.host?.userId) ===
          String(user.userId)
        ) {
          socket.emit(
            "room-error",
            "You cannot join your own room.",
          );
          return;
        }

        if (
          String(room.guest?.userId) ===
          String(user.userId)
        ) {
          socket.emit(
            "room-error",
            "You are already in this room.",
          );
          return;
        }

        if (room.guest) {
          socket.emit(
            "room-error",
            "Room is already full.",
          );
          return;
        }

        const existingRoom =
          findFriendRoomByUserId(user.userId);

        if (
          existingRoom &&
          existingRoom.roomCode !== code
        ) {
          socket.emit(
            "room-error",
            "You already have an active friend room.",
          );
          return;
        }

        const hostSocket =
          io.sockets.sockets.get(
            room.host?.socketId,
          );

        if (!hostSocket) {
          friendRooms.delete(code);
          deleteOnlineMatch(code);

          socket.emit(
            "room-error",
            "Host is no longer connected.",
          );
          return;
        }

        socket.userId = user.userId;
        socket.username = user.username;

        const guest = {
          socketId: socket.id,
          userId: user.userId,
          username: user.username,
        };

        room.guest = guest;
        friendRooms.set(code, room);

        socket.join(code);
        socket.ready = false;
        hostSocket.ready = false;

        const players = [
          room.host,
          room.guest,
        ];

        let onlineMatch;

        try {
          onlineMatch =
            createOnlineMatch(
              code,
              players,
            );
        } catch (error) {
          room.guest = null;
          friendRooms.set(code, room);

          throw error;
        }

        if (!onlineMatch) {
          room.guest = null;
          friendRooms.set(code, room);

          socket.emit(
            "room-error",
            "Failed to create online match.",
          );

          return;
        }

        onlineMatch.arena = {
          id: room.arena.id,
          name: room.arena.name,
          image: room.arena.image || "",
        };

        onlineMatch.phase = "waiting";

        if (
          !(onlineMatch.readyPlayers instanceof Set)
        ) {
          onlineMatch.readyPlayers = new Set();
        }

        const matchPayload = {
          roomId: code,
          type: "friend",
          arena: onlineMatch.arena,
          players,
          player1: players[0],
          player2: players[1],
        };

        io.to(code).emit(
          "friend-matched",
          matchPayload,
        );

        io.to(code).emit(
          "online-match-found",
          matchPayload,
        );
      } catch (error) {
        console.error(
          "Join friend room failed:",
          error,
        );

        socket.emit(
          "room-error",
          error.message ||
            "Failed to join friend room.",
        );
      }
    },
  );
}

function removeFriendRoomsForSocket(
  io,
  socketId,
) {
  if (!socketId) {
    return;
  }

  const normalizedSocketId =
    String(socketId);

  for (const [code, room] of friendRooms) {
    const hostDisconnected =
      String(room.host?.socketId) ===
      normalizedSocketId;

    const guestDisconnected =
      String(room.guest?.socketId) ===
      normalizedSocketId;

    if (
      !hostDisconnected &&
      !guestDisconnected
    ) {
      continue;
    }

    if (hostDisconnected && room.guest) {
      const guestSocket =
        io.sockets.sockets.get(
          room.guest.socketId,
        );

      if (guestSocket) {
        guestSocket.emit(
          "opponent-left",
          {
            roomId: code,
            reason: "host-disconnected",
          },
        );
      }

      deleteOnlineMatch(code);
      friendRooms.delete(code);

      continue;
    }

    if (guestDisconnected) {
      const hostSocket =
        io.sockets.sockets.get(
          room.host?.socketId,
        );

      if (hostSocket) {
        hostSocket.emit(
          "opponent-left",
          {
            roomId: code,
            reason: "guest-disconnected",
          },
        );
      }

      deleteOnlineMatch(code);
      friendRooms.delete(code);

      continue;
    }

    deleteOnlineMatch(code);
    friendRooms.delete(code);
  }
}

function cleanupFriendRooms(socketId) {
  if (!socketId) {
    return;
  }

  const normalizedSocketId =
    String(socketId);

  for (const [code, room] of friendRooms) {
    const hostDisconnected =
      String(room.host?.socketId) ===
      normalizedSocketId;

    const guestDisconnected =
      String(room.guest?.socketId) ===
      normalizedSocketId;

    if (
      !hostDisconnected &&
      !guestDisconnected
    ) {
      continue;
    }

    deleteOnlineMatch(code);
    friendRooms.delete(code);
  }
}

function removeFriendRoom(roomCode) {
  if (!roomCode) {
    return false;
  }

  const code = String(roomCode)
    .trim()
    .toUpperCase();

  if (!friendRooms.has(code)) {
    return false;
  }

  friendRooms.delete(code);
  deleteOnlineMatch(code);

  return true;
}

module.exports = {
  registerFriendRooms,
  cleanupFriendRooms,
  friendRooms,
  removeFriendRoomsForSocket,
  removeFriendRoom,
  normalizeArena,
  findFriendRoomByUserId,
};