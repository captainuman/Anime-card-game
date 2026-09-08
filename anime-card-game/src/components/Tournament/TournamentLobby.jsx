import { useEffect, useState } from "react";
import socket from "../../socket";

function TournamentLobby({
  tournament,
  user,
  onBack,
  onStarted,
}) {
  const [players, setPlayers] = useState(
    Array.isArray(tournament?.players)
      ? tournament.players
      : [],
  );

  const [error, setError] = useState("");

  const maxPlayers =
    Number(tournament?.maxPlayers) || 4;

  const currentUserId =
    user?.id ||
    user?._id ||
    user?.userId ||
    null;

  const isHost =
    String(tournament?.host?.userId) ===
    String(currentUserId);

  useEffect(() => {
    setPlayers(
      Array.isArray(tournament?.players)
        ? tournament.players
        : [],
    );

    setError("");
  }, [
    tournament?.tournamentId,
    tournament?.players,
  ]);

  useEffect(() => {
    if (!tournament?.tournamentId) {
      return;
    }

    const tournamentId = String(
      tournament.tournamentId,
    );

    const handleUpdated = (data = {}) => {
      if (
        String(data?.tournamentId) !==
        tournamentId
      ) {
        return;
      }

      const updatedPlayers =
        Array.isArray(data?.players)
          ? data.players
          : [];

      setPlayers(updatedPlayers);
      setError("");
    };

    const handleStarted = (data = {}) => {
      if (
        String(data?.tournamentId) !==
        tournamentId
      ) {
        return;
      }

      setError("");
      onStarted?.(data);
    };

    const handleError = (message) => {
      console.error(
        "Tournament lobby error:",
        message,
      );

      setError(
        message || "Tournament error.",
      );
    };

    socket.on(
      "friend-tournament-updated",
      handleUpdated,
    );

    socket.on(
      "tournament-started",
      handleStarted,
    );

    socket.on(
      "room-error",
      handleError,
    );

    return () => {
      socket.off(
        "friend-tournament-updated",
        handleUpdated,
      );

      socket.off(
        "tournament-started",
        handleStarted,
      );

      socket.off(
        "room-error",
        handleError,
      );
    };
  }, [
    tournament?.tournamentId,
    onStarted,
  ]);

  const handleStart = () => {
    if (!isHost) {
      return;
    }

    if (players.length !== maxPlayers) {
      setError(
        `Need ${maxPlayers} players to start.`,
      );
      return;
    }

    if (!tournament?.tournamentId) {
      setError(
        "Tournament ID is missing.",
      );
      return;
    }

    if (!socket.connected) {
      setError(
        "Socket is not connected.",
      );

      socket.connect();
      return;
    }

    setError("");

    socket.emit("start-tournament", {
      tournamentId:
        tournament.tournamentId,
    });
  };

  const waitingCount = Math.max(
    maxPlayers - players.length,
    0,
  );

  const progress =
    maxPlayers > 0
      ? Math.min(
          (players.length / maxPlayers) * 100,
          100,
        )
      : 0;

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#030712] text-white px-3 sm:px-6 py-6 overflow-hidden">
      <div className="max-w-5xl mx-auto">

        {/* BACKGROUND EFFECTS */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-180px] left-[-120px] w-[420px] h-[420px] rounded-full bg-cyan-500/[0.06] blur-[100px]" />
          <div className="absolute top-[20%] right-[-160px] w-[420px] h-[420px] rounded-full bg-pink-500/[0.05] blur-[100px]" />
          <div className="absolute bottom-[-180px] left-[30%] w-[420px] h-[420px] rounded-full bg-purple-500/[0.05] blur-[100px]" />
        </div>

        <div className="relative">

          {/* HEADER */}
          <div className="relative rounded-[28px] border border-white/10 bg-gradient-to-br from-[#0b1220] via-[#070b14] to-[#120713] overflow-hidden p-6 sm:p-8 mb-5">

            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.8)]" />

            <div className="text-center">

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-400/[0.06] border border-cyan-400/20 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />

                <span className="text-[8px] sm:text-[9px] text-cyan-300 font-black tracking-[0.3em] uppercase">
                  FRIEND TOURNAMENT
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
                <span className="text-white">
                  TOURNAMENT
                </span>{" "}
                <span className="text-cyan-400">
                  LOBBY
                </span>
              </h1>

              <p className="text-gray-600 text-xs sm:text-sm mt-3">
                Assemble your fighters and prepare for battle
              </p>

              {/* ARENA */}
              {tournament?.arena && (
                <div className="inline-flex items-center gap-3 mt-5 px-4 py-3 rounded-2xl bg-black/30 border border-cyan-400/15">

                  {tournament.arena.image ? (
                    <img
                      src={
                        tournament.arena.image
                      }
                      alt={
                        tournament.arena.name
                      }
                      className="w-12 h-12 rounded-xl object-cover border border-white/10"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-xl">
                      🏟️
                    </div>
                  )}

                  <div className="text-left">
                    <p className="text-[7px] text-gray-600 uppercase tracking-[0.2em] font-black">
                      SELECTED ARENA
                    </p>

                    <p className="text-sm sm:text-base font-black text-cyan-300 mt-1">
                      {tournament.arena.name}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CODE */}
          {tournament?.code && (
            <div className="relative rounded-2xl border border-pink-400/20 bg-gradient-to-r from-pink-500/[0.05] via-purple-500/[0.06] to-pink-500/[0.05] p-5 mb-4 text-center overflow-hidden">

              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-px bg-pink-400/70" />

              <p className="text-[8px] text-gray-600 uppercase tracking-[0.25em] font-black">
                TOURNAMENT CODE
              </p>

              <p className="text-2xl sm:text-3xl font-black tracking-[0.3em] text-pink-300 mt-2">
                {tournament.code}
              </p>

              <p className="text-[10px] text-gray-600 mt-2">
                Share this code with your friends
              </p>
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-2xl bg-red-500/[0.06] border border-red-500/20 text-red-300 text-xs text-center font-bold">
              ⚠️ {error}
            </div>
          )}

          {/* MAIN PANEL */}
          <div className="rounded-[28px] border border-white/10 bg-[#050912]/90 p-4 sm:p-6">

            {/* PLAYER HEADER */}
            <div className="flex items-center justify-between mb-4">

              <div>
                <p className="text-[8px] text-gray-600 uppercase tracking-[0.25em] font-black">
                  BATTLE ROSTER
                </p>

                <p className="text-2xl sm:text-3xl font-black mt-1">
                  {players.length}
                  <span className="text-gray-700">
                    {" / "}
                    {maxPlayers}
                  </span>
                </p>
              </div>

              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                players.length >= maxPlayers
                  ? "bg-green-400/[0.07] border-green-400/20"
                  : "bg-yellow-400/[0.06] border-yellow-400/20"
              }`}>
                <span className="text-xl">
                  {players.length >=
                  maxPlayers
                    ? "✓"
                    : "⏳"}
                </span>
              </div>
            </div>

            {/* PROGRESS */}
            <div className="relative h-2 bg-black/50 rounded-full overflow-hidden border border-white/[0.04]">

              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 via-cyan-400 to-cyan-300 transition-all duration-700"
                style={{
                  width: `${progress}%`,
                }}
              />

              {progress > 0 && (
                <div
                  className="absolute inset-y-0 left-0 bg-white/20 blur-sm transition-all duration-700"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              )}
            </div>

            {/* PLAYER SLOTS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">

              {Array.from({
                length: maxPlayers,
              }).map((_, index) => {
                const player =
                  players[index];

                if (!player) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="relative flex items-center gap-3 px-4 py-3 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.015]"
                    >
                      <div className="w-11 h-11 rounded-xl bg-white/[0.025] border border-white/[0.06] flex items-center justify-center text-gray-700 text-lg">
                        +
                      </div>

                      <div>
                        <p className="text-xs text-gray-700 font-black">
                          EMPTY SLOT
                        </p>

                        <p className="text-[8px] text-gray-800 uppercase tracking-widest mt-1">
                          Waiting for player
                        </p>
                      </div>
                    </div>
                  );
                }

                const isYou =
                  String(
                    player?.userId,
                  ) ===
                  String(
                    currentUserId,
                  );

                const isPlayerHost =
                  String(
                    player?.userId,
                  ) ===
                  String(
                    tournament?.host
                      ?.userId,
                  );

                return (
                  <div
                    key={
                      player?.userId ||
                      player?.socketId ||
                      index
                    }
                    className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
                      isYou
                        ? "bg-cyan-400/[0.045] border-cyan-400/25 shadow-[0_0_20px_rgba(34,211,238,0.05)]"
                        : "bg-white/[0.025] border-white/[0.07]"
                    }`}
                  >
                    {isYou && (
                      <div className="absolute top-0 left-5 right-5 h-px bg-cyan-400/60" />
                    )}

                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                        isPlayerHost
                          ? "bg-gradient-to-br from-yellow-400/20 to-orange-500/10 text-yellow-300 border border-yellow-400/20"
                          : "bg-gradient-to-br from-purple-500/20 to-cyan-500/10 text-purple-300 border border-purple-400/20"
                      }`}
                    >
                      {(
                        player?.username ||
                        "P"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">

                        <p className="text-sm font-black truncate">
                          {player?.username ||
                            "Player"}
                        </p>

                        {isYou && (
                          <span className="text-[7px] text-cyan-300 font-black tracking-wider">
                            YOU
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1">

                        {isPlayerHost ? (
                          <span className="inline-flex items-center gap-1 text-[7px] text-yellow-300 font-black tracking-wider">
                            👑 HOST
                          </span>
                        ) : (
                          <span className="text-[7px] text-gray-600 font-black tracking-wider">
                            PLAYER{" "}
                            {index + 1}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                  </div>
                );
              })}
            </div>

            {/* WAITING */}
            {waitingCount > 0 && (
              <div className="mt-5 rounded-2xl border border-yellow-400/10 bg-yellow-400/[0.025] px-4 py-3 text-center">
                <p className="text-[10px] text-gray-500">
                  Waiting for{" "}
                  <span className="text-yellow-300 font-black">
                    {waitingCount}
                  </span>{" "}
                  more player
                  {waitingCount !== 1
                    ? "s"
                    : ""}
                  ...
                </p>
              </div>
            )}

            {/* HOST CONTROL */}
            {isHost && (
              <div className="mt-5">

                <button
                  type="button"
                  onClick={handleStart}
                  disabled={
                    players.length !==
                    maxPlayers
                  }
                  className={`relative w-full py-4 rounded-2xl border font-black text-xs sm:text-sm tracking-[0.12em] transition-all overflow-hidden ${
                    players.length ===
                    maxPlayers
                      ? "bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-500 border-purple-400/30 hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] text-white"
                      : "bg-white/[0.03] border-white/[0.06] text-gray-600 cursor-not-allowed"
                  }`}
                >
                  {players.length ===
                  maxPlayers ? (
                    <>
                      <span className="relative z-10">
                        ⚔ START TOURNAMENT
                      </span>

                      <div className="absolute inset-0 bg-white/10 -translate-x-full hover:translate-x-full transition-transform duration-700" />
                    </>
                  ) : (
                    `WAITING FOR ${waitingCount} PLAYER${
                      waitingCount !== 1
                        ? "S"
                        : ""
                    }`
                  )}
                </button>

                <p className="text-center text-[8px] text-gray-700 mt-2 uppercase tracking-widest">
                  Host controls tournament start
                </p>
              </div>
            )}

            {/* NON HOST */}
            {!isHost && (
              <div className="mt-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-4 text-center">
                <div className="inline-flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />

                  <p className="text-[10px] text-gray-500 font-bold">
                    Waiting for the host to start the tournament
                  </p>
                </div>
              </div>
            )}

            {/* LEAVE */}
            <button
              type="button"
              onClick={onBack}
              className="w-full mt-3 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.07] text-gray-600 hover:text-white hover:bg-white/[0.05] hover:border-white/15 transition-all font-black text-[10px] tracking-[0.15em]"
            >
              ← LEAVE LOBBY
            </button>
          </div>

          {/* FOOTER */}
          <div className="text-center mt-5">
            <p className="text-[8px] text-gray-800 uppercase tracking-[0.2em]">
              Prepare your deck • Enter the arena • Become the champion
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default TournamentLobby;