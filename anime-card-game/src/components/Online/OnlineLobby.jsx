import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import socket from "../../socket";

function OnlineLobby({
  mode,
  arena,
  onMatched,
  onBack,
}) {
  const { user } = useAuth();

  const userId =
    user?.id || user?._id || null;

  const username =
    user?.username ||
    user?.name ||
    "Player";

  const [connected, setConnected] =
    useState(socket.connected);

  const [status, setStatus] =
    useState("Connecting...");

  const [roomCode, setRoomCode] =
    useState("");

  const [createdRoomCode, setCreatedRoomCode] =
    useState("");

  const [searching, setSearching] =
    useState(false);

  const [error, setError] =
    useState("");

  const isRandom = mode === "random";
  const isFriend = mode === "friend";

  const normalizedArena = arena
    ? {
        id:
          arena?.id != null
            ? String(arena.id)
            : "",
        name: String(
          arena?.name || "",
        ).trim(),
        image: arena?.image || "",
      }
    : null;

  useEffect(() => {
    if (!userId) {
      setConnected(false);
      setError(
        "You must be logged in to play online.",
      );
      return;
    }

    const handleConnect = () => {
      setConnected(true);
      setStatus(
        "Connected to online server.",
      );
      setError("");

      socket.emit(
        "identify-user",
        {
          userId,
          username,
        },
      );
    };

    const handleDisconnect = () => {
      setConnected(false);
      setSearching(false);
      setStatus(
        "Disconnected from server.",
      );
    };

    const handleConnectError = (
      connectionError,
    ) => {
      console.error(
        "Socket connection error:",
        connectionError,
      );

      setConnected(false);
      setError(
        "Unable to connect to online server.",
      );
      setStatus("");
    };

    const handleRandomSearching = (
      data = {},
    ) => {
      setSearching(true);

      const selectedArenaName =
        data?.arena?.name ||
        normalizedArena?.name ||
        "selected arena";

      setStatus(
        `Searching for a player in ${selectedArenaName}...`,
      );

      setError("");
    };

    const handleRandomMatched = (
      match,
    ) => {
      if (!match?.roomId) {
        setError(
          "Invalid match information received from server.",
        );
        return;
      }

      setSearching(false);
      setStatus("Opponent found!");

      onMatched?.(match);
    };

    const handleFriendRoomCreated = (
      data = {},
    ) => {
      setCreatedRoomCode(
        data?.roomCode || "",
      );

      setStatus(
        `Waiting for your friend to join${
          data?.arena?.name
            ? ` (${data.arena.name})`
            : normalizedArena?.name
              ? ` (${normalizedArena.name})`
              : ""
        }...`,
      );

      setError("");
    };

    const handleFriendMatched = (
      match,
    ) => {
      if (!match?.roomId) {
        setError(
          "Invalid match information received from server.",
        );
        return;
      }

      setCreatedRoomCode("");
      setSearching(false);
      setStatus(
        "Friend joined the room!",
      );

      onMatched?.(match);
    };

    const handleRoomError = (
      data = {},
    ) => {
      const message =
        typeof data === "string"
          ? data
          : data?.message ||
            "Something went wrong.";

      console.error(
        "Online room error:",
        data,
      );

      setSearching(false);
      setError(message);
      setStatus("");
    };

    socket.on(
      "connect",
      handleConnect,
    );

    socket.on(
      "disconnect",
      handleDisconnect,
    );

    socket.on(
      "connect_error",
      handleConnectError,
    );

    socket.on(
      "random-searching",
      handleRandomSearching,
    );

    socket.on(
      "random-matched",
      handleRandomMatched,
    );

    socket.on(
      "friend-room-created",
      handleFriendRoomCreated,
    );

    socket.on(
      "friend-matched",
      handleFriendMatched,
    );

    socket.on(
      "room-error",
      handleRoomError,
    );

    if (!socket.connected) {
      socket.connect();
    } else {
      handleConnect();
    }

    return () => {
      socket.off(
        "connect",
        handleConnect,
      );

      socket.off(
        "disconnect",
        handleDisconnect,
      );

      socket.off(
        "connect_error",
        handleConnectError,
      );

      socket.off(
        "random-searching",
        handleRandomSearching,
      );

      socket.off(
        "random-matched",
        handleRandomMatched,
      );

      socket.off(
        "friend-room-created",
        handleFriendRoomCreated,
      );

      socket.off(
        "friend-matched",
        handleFriendMatched,
      );

      socket.off(
        "room-error",
        handleRoomError,
      );
    };
  }, [
    userId,
    username,
    mode,
    normalizedArena?.id,
    normalizedArena?.name,
    onMatched,
  ]);

  const validateArena = () => {
    if (!normalizedArena) {
      setError(
        "Please select an arena first.",
      );
      return false;
    }

    if (!normalizedArena.id) {
      setError(
        "Selected arena has no valid ID.",
      );
      return false;
    }

    if (!normalizedArena.name) {
      setError(
        "Selected arena has no valid name.",
      );
      return false;
    }

    return true;
  };

  const findRandomMatch = () => {
    if (!userId) {
      setError("Please login first.");
      return;
    }

    if (!validateArena()) {
      return;
    }

    if (!socket.connected) {
      setError("Not connected to server.");
      socket.connect();
      return;
    }

    setError("");
    setSearching(true);

    setStatus(
      `Searching for a player in ${normalizedArena.name}...`,
    );

    socket.emit(
      "find-random-match",
      {
        userId,
        username,
        arena: normalizedArena,
      },
    );
  };

  const createFriendRoom = () => {
    if (!userId) {
      setError("Please login first.");
      return;
    }

    if (!validateArena()) {
      return;
    }

    if (!socket.connected) {
      setError(
        "Not connected to server.",
      );
      socket.connect();
      return;
    }

    setError("");
    setCreatedRoomCode("");

    setStatus(
      `Creating ${normalizedArena.name} private room...`,
    );

    socket.emit(
      "create-friend-room",
      {
        userId,
        username,
        arena: normalizedArena,
      },
    );
  };

  const joinFriendRoom = () => {
    if (!userId) {
      setError("Please login first.");
      return;
    }

    const code = roomCode
      .trim()
      .toUpperCase();

    if (!code) {
      setError(
        "Enter a room code.",
      );
      return;
    }

    if (!socket.connected) {
      setError(
        "Not connected to server.",
      );
      socket.connect();
      return;
    }

    setError("");
    setStatus("Joining room...");

    socket.emit(
      "join-friend-room",
      {
        roomCode: code,
        userId,
        username,
      },
    );
  };

  const cancelSearch = () => {
    if (!socket.connected) {
      return;
    }

    socket.emit(
      "cancel-random-match",
    );

    setSearching(false);
    setStatus("Search cancelled.");
  };

  const handleBack = () => {
    if (
      searching &&
      socket.connected
    ) {
      socket.emit(
        "cancel-random-match",
      );
    }

    onBack?.();
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-[#0d0715] px-4 text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="w-full max-w-sm rounded-2xl border border-gray-800 bg-[#15101d] p-6 text-center">
            <div className="mx-auto h-12 w-12 rounded-full border border-purple-500/20 bg-purple-500/5" />

            <p className="mt-5 text-[9px] font-black uppercase tracking-[0.25em] text-purple-400">
              Online Play
            </p>

            <h2 className="mt-2 text-xl font-black">
              Login Required
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Please login before playing
              online.
            </p>

            <button
              type="button"
              onClick={onBack}
              className="mt-6 w-full rounded-lg border border-gray-700 py-3 text-xs font-bold uppercase tracking-widest text-gray-400 transition hover:border-purple-500/30 hover:text-white"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0715] px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-2xl">

        <div className="mb-6 flex items-center justify-between">
          <div>
            <p
              className={`text-[9px] font-black uppercase tracking-[0.3em] ${
                isRandom
                  ? "text-blue-400"
                  : "text-purple-400"
              }`}
            >
              Online Match
            </p>

            <h1 className="mt-1 text-2xl font-black sm:text-3xl">
              {isRandom
                ? "Random Match"
                : "Play With Friend"}
            </h1>

            <p className="mt-1 text-xs text-gray-600">
              Playing as{" "}
              <span className="font-bold text-gray-400">
                {username}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleBack}
            className="rounded-lg border border-gray-800 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 transition hover:border-purple-500/30 hover:text-white"
          >
            Back
          </button>
        </div>

        {normalizedArena && (
          <div className="mb-5 overflow-hidden rounded-2xl border border-purple-500/20 bg-[#15101d]">
            <div className="flex items-center gap-4 p-4">
              <div className="h-16 w-20 overflow-hidden rounded-lg bg-black">
                {normalizedArena.image ? (
                  <img
                    src={
                      normalizedArena.image
                    }
                    alt={
                      normalizedArena.name
                    }
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-purple-950/20" />
                )}
              </div>

              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-600">
                  Selected Arena
                </p>

                <p className="mt-1 truncate text-base font-black text-purple-300">
                  {normalizedArena.name}
                </p>

                <p className="mt-1 text-[9px] text-gray-700">
                  {normalizedArena.id}
                </p>
              </div>
            </div>
          </div>
        )}

        {!normalizedArena && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-950/20 px-4 py-3 text-center text-xs font-bold text-red-400">
            No arena selected.
          </div>
        )}

        <div className="mb-5 flex items-center justify-between rounded-xl border border-gray-800 bg-black/20 px-4 py-3">
          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600">
            Server Status
          </span>

          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                connected
                  ? "bg-green-400"
                  : "bg-red-400"
              }`}
            />

            <span
              className={`text-[10px] font-black uppercase tracking-wider ${
                connected
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {connected
                ? "Online"
                : "Offline"}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-500/20 bg-red-950/20 px-4 py-3 text-center text-xs font-bold text-red-400">
            {error}
          </div>
        )}

        {isRandom && (
          <div className="rounded-2xl border border-blue-500/20 bg-[#15101d] p-5">
            {!searching ? (
              <>
                <div className="mb-5">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">
                    Matchmaking
                  </p>

                  <p className="mt-1 text-sm font-bold text-gray-300">
                    Find another player
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-600">
                    You will be matched with a
                    player in the selected arena.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    findRandomMatch
                  }
                  disabled={
                    !connected ||
                    !normalizedArena
                  }
                  className="w-full rounded-lg bg-blue-600 py-3.5 text-xs font-black uppercase tracking-widest transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Find Opponent
                </button>
              </>
            ) : (
              <>
                <div className="rounded-xl border border-blue-500/10 bg-blue-950/10 px-5 py-8 text-center">
                  <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-blue-500/20 border-t-blue-400" />

                  <p className="mt-5 text-sm font-black uppercase tracking-wider">
                    Searching
                  </p>

                  <p className="mt-2 text-xs text-gray-600">
                    Looking for an opponent in{" "}
                    <span className="text-blue-400">
                      {normalizedArena?.name}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    cancelSearch
                  }
                  className="mt-3 w-full rounded-lg border border-gray-700 py-3 text-xs font-bold uppercase tracking-widest text-gray-500 transition hover:border-red-500/30 hover:text-red-400"
                >
                  Cancel Search
                </button>
              </>
            )}
          </div>
        )}

        {isFriend && (
          <div className="rounded-2xl border border-purple-500/20 bg-[#15101d] p-5">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-purple-400">
              Private Match
            </p>

            <p className="mt-1 text-sm font-bold text-gray-300">
              Play with your friend
            </p>

            {!createdRoomCode && (
              <button
                type="button"
                onClick={
                  createFriendRoom
                }
                disabled={
                  !connected ||
                  !normalizedArena
                }
                className="mt-5 w-full rounded-lg bg-purple-600 py-3.5 text-xs font-black uppercase tracking-widest transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Create Private Room
              </button>
            )}

            {createdRoomCode && (
              <div className="mt-5 rounded-xl border border-purple-500/20 bg-purple-950/10 p-5 text-center">
                <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-gray-600">
                  Room Code
                </p>

                <p className="mt-2 text-3xl font-black tracking-[0.25em] text-purple-400">
                  {createdRoomCode}
                </p>

                <p className="mt-3 text-xs text-gray-600">
                  Send this code to your friend.
                </p>
              </div>
            )}

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-800" />

              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-700">
                Or
              </span>

              <div className="h-px flex-1 bg-gray-800" />
            </div>

            <input
              type="text"
              value={roomCode}
              onChange={(event) =>
                setRoomCode(
                  event.target.value
                    .toUpperCase()
                    .replace(
                      /[^A-Z0-9]/g,
                      "",
                    )
                    .slice(0, 6),
                )
              }
              maxLength={6}
              placeholder="ROOM CODE"
              className="w-full rounded-lg border border-gray-700 bg-black/30 px-4 py-3 text-center text-base font-black tracking-[0.3em] text-white outline-none transition placeholder:text-gray-700 focus:border-blue-500/50"
            />

            <button
              type="button"
              onClick={
                joinFriendRoom
              }
              disabled={
                !connected ||
                !roomCode.trim()
              }
              className="mt-3 w-full rounded-lg bg-blue-600 py-3.5 text-xs font-black uppercase tracking-widest transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Join Room
            </button>
          </div>
        )}

        {status && (
          <div className="mt-5 text-center">
            <p className="text-xs text-gray-600">
              {status}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleBack}
          className="mx-auto mt-6 block text-[10px] font-bold uppercase tracking-widest text-gray-700 transition hover:text-gray-300"
        >
          Back to Online Modes
        </button>
      </div>
    </div>
  );
}

export default OnlineLobby;