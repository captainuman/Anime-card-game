import { useEffect, useState } from "react";
import socket from "../../socket";

function OnlineMatchRoom({
  match,
  user,
  onReady,
  onBack,
}) {
  const [ready, setReady] = useState(false);
  const [opponentReady, setOpponentReady] =
    useState(false);
  const [playersConnected, setPlayersConnected] =
    useState(false);
  const [status, setStatus] = useState(
    "Waiting for players...",
  );
  const [error, setError] = useState("");

  const currentUserId =
    user?.id ||
    user?._id ||
    user?.userId ||
    "";

  const players = Array.isArray(
    match?.players,
  )
    ? match.players
    : [];

  const player1 = players[0] || null;
  const player2 = players[1] || null;

  const hasOpponent = players.length >= 2;

  useEffect(() => {
    setReady(false);
    setOpponentReady(false);
    setPlayersConnected(
      players.length >= 2,
    );

    setStatus(
      players.length >= 2
        ? "Waiting for both players to be ready..."
        : "Waiting for opponent...",
    );

    setError("");
  }, [
    match?.roomId,
    players.length,
  ]);

  useEffect(() => {
    if (
      !match?.roomId ||
      !currentUserId
    ) {
      return;
    }

    const roomId = String(
      match.roomId,
    );

    const userId = String(
      currentUserId,
    );

    const handlePlayerReady = (
      data = {},
    ) => {
      if (
        data?.roomId &&
        String(data.roomId) !==
          roomId
      ) {
        return;
      }

      const readyUserId =
        String(
          data?.userId || "",
        );

      if (!readyUserId) {
        return;
      }

      if (
        readyUserId === userId
      ) {
        setReady(true);
        setStatus(
          "Waiting for opponent...",
        );
        return;
      }

      setOpponentReady(true);

      setStatus(
        `${
          data?.username ||
          "Opponent"
        } is ready.`,
      );
    };

    const handleMatchReady = (
      data = {},
    ) => {
      if (
        data?.roomId &&
        String(data.roomId) !==
          roomId
      ) {
        return;
      }

      setReady(true);
      setOpponentReady(true);
      setPlayersConnected(true);
      setError("");
      setStatus(
        "Both players are ready. Starting draft...",
      );
    };

    const handleDraftStarted = (
      data = {},
    ) => {
      if (
        data?.roomId &&
        String(data.roomId) !==
          roomId
      ) {
        return;
      }

      setStatus(
        `${
          data?.arena?.name ||
          "Arena"
        } draft started.`,
      );

      setError("");

      onReady?.({
        type: "draft-started",
        ...data,
      });
    };

    const handleArenaSelected = (
      data = {},
    ) => {
      if (
        data?.roomId &&
        String(data.roomId) !==
          roomId
      ) {
        return;
      }

      setStatus(
        `${
          data?.arena?.name ||
          "Arena"
        } selected.`,
      );
    };

    const handleOpponentLeft = (
      data = {},
    ) => {
      if (
        data?.roomId &&
        String(data.roomId) !==
          roomId
      ) {
        return;
      }

      setPlayersConnected(false);
      setOpponentReady(false);
      setStatus(
        "Opponent disconnected.",
      );
      setError(
        "Your opponent has left the match.",
      );
    };

    const handleRoomError = (
      data,
    ) => {
      const message =
        typeof data === "string"
          ? data
          : data?.message ||
            "Online match error.";

      console.error(
        "ONLINE MATCH ROOM ERROR:",
        data,
      );

      setError(message);
      setStatus("Action failed.");
    };

    socket.on(
      "player-ready",
      handlePlayerReady,
    );

    socket.on(
      "match-ready",
      handleMatchReady,
    );

    socket.on(
      "online-arena-selected",
      handleArenaSelected,
    );

    socket.on(
      "online-draft-started",
      handleDraftStarted,
    );

    socket.on(
      "opponent-left",
      handleOpponentLeft,
    );

    socket.on(
      "room-error",
      handleRoomError,
    );

    return () => {
      socket.off(
        "player-ready",
        handlePlayerReady,
      );

      socket.off(
        "match-ready",
        handleMatchReady,
      );

      socket.off(
        "online-arena-selected",
        handleArenaSelected,
      );

      socket.off(
        "online-draft-started",
        handleDraftStarted,
      );

      socket.off(
        "opponent-left",
        handleOpponentLeft,
      );

      socket.off(
        "room-error",
        handleRoomError,
      );
    };
  }, [
    match?.roomId,
    currentUserId,
    onReady,
  ]);

  const handleReady = () => {
    if (ready) {
      return;
    }

    if (!match?.roomId) {
      setError(
        "Match room not found.",
      );
      return;
    }

    if (!currentUserId) {
      setError(
        "User information not found.",
      );
      return;
    }

    if (!hasOpponent) {
      setError(
        "Waiting for your opponent to join.",
      );
      return;
    }

    if (!socket.connected) {
      setError(
        "Socket disconnected. Reconnecting...",
      );

      socket.connect();
      return;
    }

    setError("");
    setReady(true);
    setStatus(
      "Waiting for opponent...",
    );

    socket.emit(
      "player-ready",
      {
        roomId: match.roomId,
        userId: currentUserId,
        username:
          user?.username ||
          user?.name ||
          "Player",
      },
    );
  };

  const handleLeave = () => {
    if (match?.roomId) {
      socket.emit(
        "leave-online-match",
        {
          roomId: match.roomId,
        },
      );
    }

    onBack?.();
  };

  if (!match?.roomId) {
    return (
      <div className="min-h-screen bg-[#0d0715] px-4 text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="w-full max-w-sm rounded-2xl border border-gray-800 bg-[#15101d] p-6 text-center">
            <div className="mx-auto h-12 w-12 rounded-full border border-red-500/20 bg-red-500/5" />

            <p className="mt-5 text-[9px] font-black uppercase tracking-[0.25em] text-red-400">
              Online Match
            </p>

            <h2 className="mt-2 text-xl font-black">
              Match Not Found
            </h2>

            <p className="mt-2 text-xs text-gray-600">
              The match information is
              unavailable.
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
      <div className="mx-auto max-w-4xl">

        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-purple-400">
              Online Match
            </p>

            <h1 className="mt-1 text-2xl font-black sm:text-3xl">
              Ready for Battle
            </h1>

            <p className="mt-1 text-xs text-gray-600">
              Room{" "}
              <span className="font-mono text-gray-400">
                {match.roomId}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleLeave}
            className="rounded-lg border border-gray-800 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 transition hover:border-red-500/30 hover:text-red-400"
          >
            Leave
          </button>
        </div>

        {match?.arena && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-purple-500/20 bg-[#15101d]">
            <div className="flex items-center gap-4 p-4">
              <div className="h-14 w-20 overflow-hidden rounded-lg bg-black">
                {match.arena.image ? (
                  <img
                    src={match.arena.image}
                    alt={match.arena.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-purple-950/20" />
                )}
              </div>

              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-600">
                  Arena
                </p>

                <p className="mt-1 text-base font-black text-purple-300">
                  {match.arena.name}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid items-center gap-4 md:grid-cols-[1fr_70px_1fr]">

          <PlayerPanel
            player={player1}
            isCurrentUser={
              String(
                player1?.userId,
              ) ===
              String(
                currentUserId,
              )
            }
            ready={
              String(
                player1?.userId,
              ) ===
              String(
                currentUserId,
              )
                ? ready
                : opponentReady
            }
            side="blue"
          />

          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-purple-500/30 bg-black text-sm font-black shadow-[0_0_25px_rgba(168,85,247,0.1)]">
              VS
            </div>
          </div>

          <PlayerPanel
            player={player2}
            isCurrentUser={
              String(
                player2?.userId,
              ) ===
              String(
                currentUserId,
              )
            }
            ready={
              String(
                player2?.userId,
              ) ===
              String(
                currentUserId,
              )
                ? ready
                : opponentReady
            }
            side="red"
          />
        </div>

        {error && (
          <div className="mt-5 rounded-lg border border-red-500/20 bg-red-950/20 px-4 py-3 text-center text-xs font-bold text-red-400">
            {error}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between rounded-xl border border-gray-800 bg-black/20 px-4 py-3">
          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600">
            Connection
          </span>

          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                playersConnected
                  ? "bg-green-400"
                  : "bg-red-400"
              }`}
            />

            <span
              className={`text-[9px] font-black uppercase tracking-wider ${
                playersConnected
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {playersConnected
                ? "Both Connected"
                : "Waiting for Opponent"}
            </span>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-gray-800 bg-black/20 px-4 py-3 text-center">
          <p className="text-xs text-gray-500">
            {status}
          </p>
        </div>

        {!ready &&
          playersConnected && (
            <button
              type="button"
              onClick={handleReady}
              className="mt-5 w-full rounded-lg bg-blue-600 py-3.5 text-xs font-black uppercase tracking-widest transition hover:bg-blue-500"
            >
              Ready for Battle
            </button>
          )}

        {ready &&
          !opponentReady &&
          playersConnected && (
            <div className="mt-5 rounded-xl border border-blue-500/20 bg-blue-950/10 px-4 py-5 text-center">
              <p className="text-xs font-black uppercase tracking-widest text-blue-400">
                You Are Ready
              </p>

              <p className="mt-2 text-xs text-gray-600">
                Waiting for your opponent to
                press ready.
              </p>
            </div>
          )}

        {ready &&
          opponentReady &&
          playersConnected && (
            <div className="mt-5 rounded-xl border border-green-500/20 bg-green-950/10 px-4 py-5 text-center">
              <p className="text-xs font-black uppercase tracking-widest text-green-400">
                Both Players Ready
              </p>

              <p className="mt-2 text-xs text-gray-600">
                Starting draft...
              </p>
            </div>
          )}

        <button
          type="button"
          onClick={handleLeave}
          className="mx-auto mt-6 block text-[10px] font-bold uppercase tracking-widest text-gray-700 transition hover:text-red-400"
        >
          Leave Match
        </button>
      </div>
    </div>
  );
}

function PlayerPanel({
  player,
  isCurrentUser,
  ready,
  side,
}) {
  const isBlue = side === "blue";

  if (!player) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-[#15101d] p-6 text-center">
        <div className="mx-auto h-10 w-10 rounded-full border border-gray-800 bg-black" />

        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-gray-600">
          Waiting for player
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border p-5 text-center ${
        isBlue
          ? "border-blue-500/20 bg-blue-950/10"
          : "border-red-500/20 bg-red-950/10"
      }`}
    >
      <div
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-xl font-black ${
          isBlue
            ? "bg-blue-500/10 text-blue-400"
            : "bg-red-500/10 text-red-400"
        }`}
      >
        {(
          player.username ||
          "P"
        )
          .charAt(0)
          .toUpperCase()}
      </div>

      <p
        className={`mt-4 text-[9px] font-black uppercase tracking-[0.2em] ${
          isBlue
            ? "text-blue-400"
            : "text-red-400"
        }`}
      >
        {isBlue
          ? "Player 1"
          : "Player 2"}
      </p>

      <h2 className="mt-1 truncate text-xl font-black">
        {player.username ||
          "Player"}
      </h2>

      {isCurrentUser && (
        <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-purple-400">
          You
        </p>
      )}

      <div className="mt-4">
        {ready ? (
          <span className="rounded-full border border-green-500/20 bg-green-500/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-green-400">
            Ready
          </span>
        ) : (
          <span className="rounded-full border border-gray-700 bg-black/20 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-600">
            Not Ready
          </span>
        )}
      </div>
    </div>
  );
}

export default OnlineMatchRoom;