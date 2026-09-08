import { useEffect, useMemo, useRef, useState } from "react";
import socket from "../../socket";

import OnlineDraftScreen from "../Online/OnlineDraftScreen";
import OnlineBattleScreen from "../Online/OnlineBattleScreen";

function TournamentMatch({ match, user, onComplete, onBack }) {
  const [phase, setPhase] = useState("waiting");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [playersConnected, setPlayersConnected] = useState(true);

  const readySentRef = useRef(false);
  const readyRequestedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  const currentUserId =
    user?.id || user?._id || user?.userId || "";

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const normalizedMatch = useMemo(() => {
    if (!match) return null;

    const players = Array.isArray(match.players)
      ? match.players
      : [match.player1, match.player2].filter(Boolean);

    return {
      ...match,
      players,
      player1: match.player1 || players[0] || null,
      player2: match.player2 || players[1] || null,
      arena: match.arena || null,
    };
  }, [match]);

  useEffect(() => {
    setPhase("waiting");
    setError("");
    setReady(false);
    setOpponentReady(false);
    setPlayersConnected(true);

    readySentRef.current = false;
    readyRequestedRef.current = false;
  }, [normalizedMatch?.roomId]);

  useEffect(() => {
    if (!normalizedMatch?.roomId || !currentUserId) {
      return undefined;
    }

    const roomId = String(normalizedMatch.roomId);

    const tournamentId = normalizedMatch?.tournamentId
      ? String(normalizedMatch.tournamentId)
      : null;

    const matchId = normalizedMatch?.matchId
      ? String(normalizedMatch.matchId)
      : null;

    const userId = String(currentUserId);

    const emitReady = () => {
      if (
        !readyRequestedRef.current ||
        readySentRef.current ||
        !socket.connected
      ) {
        return;
      }

      readySentRef.current = true;
      setError("");

      socket.emit("player-ready", {
        roomId,
        userId: currentUserId,
        username:
          user?.username ||
          user?.name ||
          "Player",
      });
    };

    const handleSocketConnect = () => {
      setPlayersConnected(true);
      setError("");
      emitReady();
    };

    const handlePlayerReady = (data = {}) => {
      if (
        data?.roomId &&
        String(data.roomId) !== roomId
      ) {
        return;
      }

      const readyUserId = String(
        data?.userId || "",
      );

      if (!readyUserId) return;

      if (readyUserId === userId) {
        setReady(true);
        setError("");
        return;
      }

      setOpponentReady(true);
      setError("");
    };

    const handleMatchReady = (data = {}) => {
      if (
        data?.roomId &&
        String(data.roomId) !== roomId
      ) {
        return;
      }

      setReady(true);
      setOpponentReady(true);
      setPlayersConnected(true);
      setError("");
    };

    const handleDraftStarted = (data = {}) => {
      if (
        data?.roomId &&
        String(data.roomId) !== roomId
      ) {
        return;
      }

      setError("");
      setPhase("draft");
    };

    const handleBattleReady = (data = {}) => {
      if (
        data?.roomId &&
        String(data.roomId) !== roomId
      ) {
        return;
      }

      setError("");
      setPhase("battle");
    };

    const handleOnlineMatchComplete = (data = {}) => {
      if (
        data?.roomId &&
        String(data.roomId) !== roomId
      ) {
        return;
      }

      console.log(
        "🔥 ONLINE MATCH COMPLETE:",
        data,
      );
    };

    const handleTournamentMatchComplete = (
      data = {},
    ) => {
      if (
        data?.roomId &&
        String(data.roomId) !== roomId
      ) {
        return;
      }

      if (
        tournamentId &&
        data?.tournamentId &&
        String(data.tournamentId) !== tournamentId
      ) {
        return;
      }

      if (
        matchId &&
        data?.matchId &&
        String(data.matchId) !== matchId
      ) {
        return;
      }

      setError("");
      setPhase("complete");

      onCompleteRef.current?.({
        type: "match-complete",
        ...data,
      });
    };

    const handleTournamentRoundComplete = (
      data = {},
    ) => {
      if (
        data?.roomId &&
        String(data.roomId) !== roomId
      ) {
        return;
      }

      if (
        tournamentId &&
        data?.tournamentId &&
        String(data.tournamentId) !== tournamentId
      ) {
        return;
      }

      if (
        matchId &&
        data?.matchId &&
        String(data.matchId) !== matchId
      ) {
        return;
      }

      setError("");
      setPhase("complete");

      onCompleteRef.current?.({
        type: "round-complete",
        ...data,
      });
    };

    const handleTournamentComplete = (
      data = {},
    ) => {
      if (
        tournamentId &&
        data?.tournamentId &&
        String(data.tournamentId) !== tournamentId
      ) {
        return;
      }

      setError("");
      setPhase("complete");

      onCompleteRef.current?.({
        type: "tournament-complete",
        ...data,
      });
    };

    const handleOpponentLeft = (data = {}) => {
      if (
        data?.roomId &&
        String(data.roomId) !== roomId
      ) {
        return;
      }

      setPlayersConnected(false);

      setError(
        "Opponent disconnected. The tournament server is processing the match.",
      );
    };

    const handleRoomError = (data = {}) => {
      if (
        typeof data === "object" &&
        data?.roomId &&
        String(data.roomId) !== roomId
      ) {
        return;
      }

      console.error(
        "🔥 TOURNAMENT MATCH ERROR:",
        data,
      );

      const errorMessage =
        typeof data === "string"
          ? data
          : data?.message ||
            "Tournament match error.";

      readySentRef.current = false;

      setError(errorMessage);
    };

    socket.on("connect", handleSocketConnect);
    socket.on("player-ready", handlePlayerReady);
    socket.on("match-ready", handleMatchReady);
    socket.on(
      "online-draft-started",
      handleDraftStarted,
    );
    socket.on(
      "online-battle-ready",
      handleBattleReady,
    );
    socket.on(
      "online-match-complete",
      handleOnlineMatchComplete,
    );
    socket.on(
      "tournament-match-complete",
      handleTournamentMatchComplete,
    );
    socket.on(
      "tournament-round-complete",
      handleTournamentRoundComplete,
    );
    socket.on(
      "tournament-complete",
      handleTournamentComplete,
    );
    socket.on(
      "opponent-left",
      handleOpponentLeft,
    );
    socket.on(
      "room-error",
      handleRoomError,
    );

    if (socket.connected) {
      setPlayersConnected(true);
      emitReady();
    } else {
      setPlayersConnected(false);
    }

    return () => {
      socket.off("connect", handleSocketConnect);
      socket.off("player-ready", handlePlayerReady);
      socket.off("match-ready", handleMatchReady);
      socket.off(
        "online-draft-started",
        handleDraftStarted,
      );
      socket.off(
        "online-battle-ready",
        handleBattleReady,
      );
      socket.off(
        "online-match-complete",
        handleOnlineMatchComplete,
      );
      socket.off(
        "tournament-match-complete",
        handleTournamentMatchComplete,
      );
      socket.off(
        "tournament-round-complete",
        handleTournamentRoundComplete,
      );
      socket.off(
        "tournament-complete",
        handleTournamentComplete,
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
    normalizedMatch?.roomId,
    normalizedMatch?.matchId,
    normalizedMatch?.tournamentId,
    currentUserId,
    user?.username,
    user?.name,
  ]);

  if (!normalizedMatch?.roomId) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-[#030712] text-white flex items-center justify-center px-4 relative overflow-hidden">
        <BackgroundGlow />

        <div className="relative w-full max-w-lg text-center rounded-[28px] border border-red-500/20 bg-[#070b14]/95 p-8 sm:p-10 shadow-2xl">
          <div className="mx-auto w-20 h-20 rounded-3xl bg-red-500/[0.06] border border-red-500/20 flex items-center justify-center text-4xl">
            ⚠️
          </div>

          <p className="text-[9px] text-red-400 font-black tracking-[0.3em] mt-6">
            TOURNAMENT SYSTEM
          </p>

          <h2 className="text-2xl sm:text-3xl font-black mt-2">
            MATCH NOT FOUND
          </h2>

          <p className="text-gray-600 text-sm mt-3">
            The selected tournament match could not be loaded.
          </p>

          <button
            type="button"
            onClick={onBack}
            className="mt-7 w-full py-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:text-white text-gray-500 font-black text-xs tracking-wider transition-all"
          >
            ← BACK TO BRACKET
          </button>
        </div>
      </div>
    );
  }

  const tournamentArena =
    normalizedMatch.arena || null;

  const players =
    normalizedMatch.players || [];

  const player1 =
    normalizedMatch.player1 ||
    players[0] ||
    null;

  const player2 =
    normalizedMatch.player2 ||
    players[1] ||
    null;

  const handleBack = () => {
    if (normalizedMatch?.roomId) {
      socket.emit("leave-online-match", {
        roomId: normalizedMatch.roomId,
      });
    }

    onBack?.();
  };

  const handleReady = () => {
    if (
      ready ||
      readyRequestedRef.current
    ) {
      return;
    }

    readyRequestedRef.current = true;
    readySentRef.current = false;

    setError("");

    if (!socket.connected) {
      setPlayersConnected(false);

      setError(
        "Connecting to the tournament server...",
      );

      return;
    }

    setPlayersConnected(true);

    socket.emit("player-ready", {
      roomId: normalizedMatch.roomId,
      userId: currentUserId,
      username:
        user?.username ||
        user?.name ||
        "Player",
    });

    readySentRef.current = true;
  };

  if (error) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-[#030712] text-white flex items-center justify-center px-4 relative overflow-hidden">
        <BackgroundGlow />

        <div className="relative w-full max-w-xl rounded-[28px] border border-red-500/20 bg-[#070b14]/95 p-7 sm:p-9 text-center shadow-2xl">
          <div className="mx-auto w-20 h-20 rounded-3xl bg-red-500/[0.06] border border-red-500/20 flex items-center justify-center text-4xl">
            ⚠️
          </div>

          <p className="text-[9px] text-purple-400 font-black tracking-[0.3em] mt-6">
            TOURNAMENT MATCH
          </p>

          <h2 className="text-2xl sm:text-3xl font-black mt-2">
            MATCH ERROR
          </h2>

          <div className="mt-5 rounded-2xl bg-red-500/[0.05] border border-red-500/15 px-4 py-4">
            <p className="text-red-300 text-sm font-bold">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={handleBack}
            className="mt-6 w-full py-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-gray-500 hover:text-white hover:bg-white/[0.06] font-black text-xs tracking-wider transition-all"
          >
            ← BACK TO BRACKET
          </button>
        </div>
      </div>
    );
  }

  if (phase === "complete") {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-[#030712] text-white flex items-center justify-center px-4 relative overflow-hidden">
        <BackgroundGlow />

        <div className="relative text-center">
          <div className="mx-auto w-28 h-28 rounded-[32px] bg-gradient-to-br from-yellow-400/[0.12] via-purple-500/[0.08] to-cyan-400/[0.08] border border-yellow-400/20 flex items-center justify-center text-6xl shadow-[0_0_60px_rgba(250,204,21,0.08)] animate-pulse">
            🏆
          </div>

          <p className="text-[9px] text-cyan-400 font-black tracking-[0.35em] mt-7">
            TOURNAMENT
          </p>

          <h2 className="text-3xl sm:text-4xl font-black mt-2">
            MATCH COMPLETE
          </h2>

          <p className="text-gray-600 text-sm mt-3">
            Returning to tournament bracket...
          </p>
        </div>
      </div>
    );
  }

  if (phase === "waiting") {
    return (
      <TournamentMatchWaiting
        match={normalizedMatch}
        arena={tournamentArena}
        ready={ready}
        opponentReady={opponentReady}
        playersConnected={playersConnected}
        currentUserId={currentUserId}
        onReady={handleReady}
        onBack={handleBack}
      />
    );
  }

  if (phase === "draft") {
    return (
      <OnlineDraftScreen
        match={normalizedMatch}
        user={user}
        arena={tournamentArena}
        onComplete={() => {
          console.log(
            "🔥 TOURNAMENT DRAFT COMPLETE",
          );
        }}
        onBack={handleBack}
      />
    );
  }

  if (phase === "battle") {
    return (
      <OnlineBattleScreen
        match={normalizedMatch}
        user={user}
        onComplete={(data) => {
          console.log(
            "🔥 TOURNAMENT BATTLE COMPLETE:",
            data,
          );
        }}
        onBack={handleBack}
      />
    );
  }

  return (
    <TournamentMatchWaiting
      match={normalizedMatch}
      arena={tournamentArena}
      ready={ready}
      opponentReady={opponentReady}
      playersConnected={playersConnected}
      currentUserId={currentUserId}
      onReady={handleReady}
      onBack={handleBack}
    />
  );
}

function TournamentMatchWaiting({
  match,
  arena,
  ready,
  opponentReady,
  playersConnected,
  onReady,
  onBack,
  currentUserId,
}) {
  const players = Array.isArray(match?.players)
    ? match.players
    : [
        match?.player1,
        match?.player2,
      ].filter(Boolean);

  const player1 =
    match?.player1 ||
    players[0] ||
    null;

  const player2 =
    match?.player2 ||
    players[1] ||
    null;

  const bothReady =
    ready &&
    opponentReady &&
    playersConnected;

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#030712] text-white px-3 sm:px-6 py-6 sm:py-8 relative overflow-hidden">
      <BackgroundGlow />

      <div className="relative w-full max-w-5xl mx-auto">

        {/* TOP BAR */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onBack}
            className="group inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.025] border border-white/[0.07] text-gray-600 hover:text-white hover:border-white/15 transition-all"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>

            <span className="text-[9px] font-black tracking-wider">
              BRACKET
            </span>
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-400/[0.04] border border-cyan-400/15">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />

            <span className="text-[8px] text-cyan-300 font-black tracking-[0.2em]">
              MATCH ROOM
            </span>
          </div>
        </div>

        {/* HERO */}
        <div className="relative rounded-[30px] border border-white/10 bg-gradient-to-br from-[#0b1220] via-[#070b14] to-[#120713] overflow-hidden">

          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-px bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)]" />

          <div className="p-5 sm:p-8 text-center">

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/[0.06] border border-purple-400/15">
              <span className="text-[8px] text-purple-300 font-black tracking-[0.3em]">
                TOURNAMENT MATCH
              </span>
            </div>

            <div className="mt-5 mx-auto w-20 h-20 rounded-[24px] bg-gradient-to-br from-purple-500/[0.12] to-cyan-400/[0.07] border border-purple-400/20 flex items-center justify-center text-4xl shadow-[0_0_35px_rgba(168,85,247,0.08)]">
              ⚔️
            </div>

            <h1 className="text-3xl sm:text-5xl font-black mt-5 tracking-tight">
              READY FOR{" "}
              <span className="text-cyan-400">
                BATTLE
              </span>
            </h1>

            <p className="text-gray-600 text-xs sm:text-sm mt-3">
              Both fighters must be ready before the draft begins
            </p>

            {/* ROOM ID */}
            <div className="inline-flex items-center gap-2 mt-4 px-3 py-2 rounded-xl bg-black/30 border border-white/[0.06]">
              <span className="text-[7px] text-gray-700 uppercase tracking-widest font-black">
                ROOM
              </span>

              <span className="font-mono text-[10px] text-gray-400">
                {match.roomId}
              </span>
            </div>

            {/* ARENA */}
            {arena && (
              <div className="mt-5 flex justify-center">
                <div className="relative w-full max-w-xl h-32 sm:h-40 rounded-2xl overflow-hidden border border-cyan-400/15 bg-black/30">

                  {arena.image ? (
                    <img
                      src={arena.image}
                      alt={arena.name}
                      className="absolute inset-0 w-full h-full object-cover opacity-45"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-30">
                      🏟️
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-r from-[#030712] via-transparent to-[#030712]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent" />

                  <div className="absolute inset-0 flex items-end p-4 sm:p-5">
                    <div className="text-left">
                      <p className="text-[7px] text-cyan-300/60 uppercase tracking-[0.25em] font-black">
                        BATTLE ARENA
                      </p>

                      <p className="text-lg sm:text-xl font-black text-white mt-1">
                        {arena.name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FIGHTERS */}
          <div className="px-4 sm:px-8 pb-7">

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-6">

              <TournamentPlayer
                player={player1}
                currentUserId={currentUserId}
                side="blue"
                ready={
                  String(player1?.userId) ===
                  String(currentUserId)
                    ? ready
                    : opponentReady
                }
              />

              <div className="flex items-center justify-center">
                <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-[#030712] border border-white/[0.08]">
                  <div className="absolute inset-1 rounded-full border border-red-500/20" />

                  <span className="relative text-sm font-black italic text-red-400">
                    VS
                  </span>
                </div>
              </div>

              <TournamentPlayer
                player={player2}
                currentUserId={currentUserId}
                side="red"
                ready={
                  String(player2?.userId) ===
                  String(currentUserId)
                    ? ready
                    : opponentReady
                }
              />
            </div>
          </div>
        </div>

        {/* CONNECTION STATUS */}
        <div
          className={`mt-4 rounded-2xl border px-4 py-3 flex items-center justify-center gap-2 ${
            playersConnected
              ? "bg-green-400/[0.035] border-green-400/15"
              : "bg-red-400/[0.035] border-red-400/15"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              playersConnected
                ? "bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]"
                : "bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.8)]"
            }`}
          />

          <span
            className={`text-[9px] font-black tracking-[0.12em] ${
              playersConnected
                ? "text-green-300"
                : "text-red-300"
            }`}
          >
            {playersConnected
              ? "BOTH PLAYERS CONNECTED"
              : "OPPONENT DISCONNECTED"}
          </span>
        </div>

        {/* READY CONTROL */}
        <div className="mt-4 rounded-[26px] border border-white/[0.08] bg-[#050912]/95 p-4 sm:p-6">

          {!ready &&
            playersConnected && (
              <div className="text-center">
                <p className="text-[9px] text-gray-600 uppercase tracking-[0.2em] font-black">
                  YOUR STATUS
                </p>

                <h3 className="text-xl sm:text-2xl font-black mt-2">
                  ARE YOU READY?
                </h3>

                <p className="text-gray-600 text-xs mt-2">
                  Lock in your readiness to enter the draft.
                </p>

                <button
                  type="button"
                  onClick={onReady}
                  className="group relative overflow-hidden w-full mt-5 py-4 rounded-2xl bg-gradient-to-r from-green-600 via-emerald-500 to-cyan-500 border border-green-400/20 hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] font-black text-xs sm:text-sm tracking-[0.12em] transition-all"
                >
                  <span className="relative z-10">
                    ✓ READY FOR BATTLE
                  </span>

                  <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </button>
              </div>
            )}

          {ready &&
            !opponentReady &&
            playersConnected && (
              <div className="text-center py-2">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-yellow-400/[0.06] border border-yellow-400/15 flex items-center justify-center text-3xl animate-pulse">
                  ⏳
                </div>

                <p className="text-yellow-300 font-black text-sm mt-4 tracking-wider">
                  YOU ARE READY
                </p>

                <p className="text-gray-600 text-xs mt-2">
                  Waiting for your opponent to ready up...
                </p>

                <div className="mt-5 max-w-xs mx-auto h-1 rounded-full bg-white/[0.04] overflow-hidden">
                  <div className="w-1/2 h-full bg-gradient-to-r from-yellow-400 to-cyan-400 animate-pulse" />
                </div>
              </div>
            )}

          {bothReady && (
            <div className="text-center py-2">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-green-400/[0.06] border border-green-400/20 flex items-center justify-center text-3xl">
                ⚔️
              </div>

              <p className="text-green-300 font-black text-sm mt-4 tracking-wider">
                BOTH PLAYERS READY
              </p>

              <p className="text-gray-600 text-xs mt-2">
                Initializing battle draft...
              </p>

              <div className="mt-5 flex justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
                  style={{ animationDelay: "100ms" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce"
                  style={{ animationDelay: "200ms" }}
                />
              </div>
            </div>
          )}

          {!playersConnected && (
            <div className="text-center py-2">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-red-400/[0.06] border border-red-400/15 flex items-center justify-center text-3xl">
                🔴
              </div>

              <p className="text-red-300 font-black text-sm mt-4">
                CONNECTION LOST
              </p>

              <p className="text-gray-600 text-xs mt-2">
                Waiting for the tournament server...
              </p>
            </div>
          )}
        </div>

        {/* BACK BUTTON */}
        <button
          type="button"
          onClick={onBack}
          className="w-full mt-3 py-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.07] text-gray-600 hover:text-white hover:bg-white/[0.05] hover:border-white/15 transition-all font-black text-[10px] tracking-[0.15em]"
        >
          ← BACK TO BRACKET
        </button>

        <p className="text-center text-[7px] text-gray-800 uppercase tracking-[0.2em] mt-4">
          Prepare your deck • Enter the arena • Fight for victory
        </p>
      </div>
    </div>
  );
}

function TournamentPlayer({
  player,
  currentUserId,
  side,
  ready,
}) {
  if (!player) {
    return (
      <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.015] p-6 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-white/[0.025] border border-white/[0.06] flex items-center justify-center text-gray-700 text-2xl">
          ?
        </div>

        <p className="text-gray-700 font-black text-sm mt-3">
          TBD
        </p>
      </div>
    );
  }

  const isBlue = side === "blue";

  const isMe =
    String(player.userId) ===
    String(currentUserId);

  return (
    <div
      className={`relative rounded-[24px] border p-5 sm:p-6 text-center overflow-hidden ${
        isBlue
          ? "bg-blue-500/[0.035] border-blue-400/15"
          : "bg-red-500/[0.035] border-red-400/15"
      }`}
    >
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-20 h-px ${
          isBlue
            ? "bg-blue-400/70"
            : "bg-red-400/70"
        }`}
      />

      <div
        className={`mx-auto w-20 h-20 rounded-[24px] flex items-center justify-center text-3xl font-black ${
          isBlue
            ? "bg-blue-400/[0.08] border border-blue-400/20 text-blue-300 shadow-[0_0_30px_rgba(59,130,246,0.08)]"
            : "bg-red-400/[0.08] border border-red-400/20 text-red-300 shadow-[0_0_30px_rgba(248,113,113,0.08)]"
        }`}
      >
        {(player.username || "P")
          .charAt(0)
          .toUpperCase()}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        <p className="font-black text-base sm:text-lg">
          {player.username || "Player"}
        </p>

        {isMe && (
          <span className="px-2 py-0.5 rounded-md bg-cyan-400/[0.08] border border-cyan-400/15 text-[7px] text-cyan-300 font-black tracking-wider">
            YOU
          </span>
        )}
      </div>

      <p
        className={`text-[8px] font-black uppercase tracking-[0.2em] mt-1 ${
          isBlue
            ? "text-blue-400/60"
            : "text-red-400/60"
        }`}
      >
        {isBlue
          ? "BLUE FIGHTER"
          : "RED FIGHTER"}
      </p>

      <div className="mt-4">
        {ready ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-400/[0.06] border border-green-400/20 text-green-300 text-[8px] font-black tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            READY
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.025] border border-white/[0.07] text-gray-600 text-[8px] font-black tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-700" />
            WAITING
          </span>
        )}
      </div>
    </div>
  );
}

function BackgroundGlow() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-[-180px] left-[-120px] w-[430px] h-[430px] rounded-full bg-cyan-500/[0.05] blur-[110px]" />

      <div className="absolute top-[25%] right-[-180px] w-[430px] h-[430px] rounded-full bg-pink-500/[0.045] blur-[110px]" />

      <div className="absolute bottom-[-180px] left-[35%] w-[430px] h-[430px] rounded-full bg-purple-500/[0.05] blur-[110px]" />
    </div>
  );
}

export default TournamentMatch;