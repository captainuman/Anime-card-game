import { useState } from "react";
import socket from "../../socket";
import { useAuth } from "../../context/AuthContext";

import { arenas } from "../../data/arenas";

function TournamentMenu({
  onBack,
  onCreateSuccess,
  onJoinSuccess,
  onRandomSearching,
}) {
  const { user, loading: authLoading } = useAuth();

  const [mode, setMode] = useState(null);
  const [size, setSize] = useState(8);
  const [selectedArena, setSelectedArena] = useState(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentUser = user?.user || user;

  const userId =
    currentUser?.id ||
    currentUser?._id ||
    currentUser?.userId ||
    null;

  const username =
    currentUser?.username ||
    currentUser?.name ||
    "Player";

  const handleSelectMode = (nextMode) => {
    if (loading) return;

    setMode(nextMode);
    setSelectedArena(null);
    setCode("");
    setError("");
  };

  const handleArenaSelect = (arena) => {
    if (!arena || loading) return;

    setSelectedArena(arena);
    setError("");

    console.log(
      "🔥 TOURNAMENT ARENA SELECTED:",
      arena,
    );
  };

  const handleCreateFriend = () => {
    if (!userId) {
      setError(
        "Your account could not be identified.",
      );
      return;
    }

    if (!selectedArena) {
      setError(
        "Please select an arena first.",
      );
      return;
    }

    if (!socket.connected) {
      setError(
        "Socket is not connected. Please wait a moment and try again.",
      );

      socket.connect();
      return;
    }

    const maxPlayers = Number(size);

    const arena = {
      id: String(selectedArena.id),
      name: String(selectedArena.name),
      image: selectedArena.image || "",
    };

    setLoading(true);
    setError("");

    console.log(
      "🔥 CREATE FRIEND TOURNAMENT:",
      {
        userId,
        username,
        maxPlayers,
        arena,
      },
    );

    socket.emit(
      "create-friend-tournament",
      {
        userId,
        username,
        maxPlayers,
        arena,
      },
      (response) => {
        console.log(
          "🔥 CREATE TOURNAMENT ACK:",
          response,
        );

        if (
          !response ||
          response.success !== true ||
          !response.tournament
        ) {
          setLoading(false);

          setError(
            response?.error ||
              "Failed to create tournament.",
          );

          return;
        }

        setLoading(false);
        setError("");

        console.log(
          "🔥 TOURNAMENT CREATED:",
          response.tournament,
        );

        onCreateSuccess?.(
          response.tournament,
        );
      },
    );
  };

  const handleRandomTournament = () => {
    if (!userId) {
      setError(
        "Your account could not be identified.",
      );
      return;
    }

    if (!selectedArena) {
      setError(
        "Please select an arena first.",
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

    const maxPlayers = Number(size);

    const arena = {
      id: String(selectedArena.id),
      name: String(selectedArena.name),
      image: selectedArena.image || "",
    };

    setLoading(true);
    setError("");

    console.log(
      "🔥 JOIN RANDOM TOURNAMENT:",
      {
        userId,
        username,
        maxPlayers,
        arena,
      },
    );

    socket.emit(
      "join-random-tournament",
      {
        userId,
        username,
        maxPlayers,
        arena,
      },
      (response) => {
        console.log(
          "🔥 RANDOM TOURNAMENT ACK:",
          response,
        );

        if (
          !response ||
          response.success !== true
        ) {
          setLoading(false);

          setError(
            response?.error ||
              "Failed to join tournament queue.",
          );

          return;
        }

        setLoading(false);

        const selectedServerArena =
          response?.arena || arena;

        onRandomSearching?.({
          type: "random-searching",
          playersSearching:
            Number(
              response?.playersSearching,
            ) || 0,
          maxPlayers,
          arena: selectedServerArena,
        });
      },
    );
  };

  const handleJoinFriend = () => {
    if (!userId) {
      setError(
        "Your account could not be identified.",
      );
      return;
    }

    const cleanCode = code
      .trim()
      .toUpperCase();

    if (!cleanCode) {
      setError(
        "Enter a tournament code.",
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

    setLoading(true);
    setError("");

    console.log(
      "🔥 JOIN FRIEND TOURNAMENT:",
      {
        code: cleanCode,
        userId,
        username,
      },
    );

    socket.emit(
      "join-friend-tournament",
      {
        code: cleanCode,
        userId,
        username,
      },
      (response) => {
        console.log(
          "🔥 JOIN TOURNAMENT ACK:",
          response,
        );

        if (
          !response ||
          response.success !== true ||
          !response.tournament
        ) {
          setLoading(false);

          setError(
            response?.error ||
              "Failed to join tournament.",
          );

          return;
        }

        const tournament =
          response.tournament;

        console.log(
          "🔥 JOINED TOURNAMENT:",
          tournament,
        );

        setSelectedArena(
          tournament.arena || null,
        );

        setLoading(false);
        setError("");

        onJoinSuccess?.(tournament);
      },
    );
  };

  const handleBack = () => {
    if (loading) return;

    setMode(null);
    setSelectedArena(null);
    setCode("");
    setError("");
  };

  if (authLoading) {
    return (
      <FullScreenState
        icon="🎴"
        label="ACCOUNT SYSTEM"
        title="LOADING ACCOUNT..."
        description="Restoring your session"
      />
    );
  }

  if (!currentUser || !userId) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-[#030712] text-white flex items-center justify-center px-4 relative overflow-hidden">
        <BackgroundGlow />

        <div className="relative w-full max-w-md rounded-[28px] border border-white/10 bg-[#070b14]/95 p-8 text-center">
          <div className="mx-auto w-20 h-20 rounded-3xl bg-purple-500/[0.06] border border-purple-400/15 flex items-center justify-center text-4xl">
            🔐
          </div>

          <p className="text-[8px] text-purple-400 font-black tracking-[0.3em] mt-6">
            ACCOUNT SYSTEM
          </p>

          <h2 className="text-2xl font-black mt-2">
            LOGIN REQUIRED
          </h2>

          <p className="text-gray-600 text-xs mt-3">
            Your login session could not be restored.
          </p>

          <button
            type="button"
            onClick={onBack}
            className="w-full mt-6 py-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-gray-500 hover:text-white hover:bg-white/[0.06] font-black text-xs transition-all"
          >
            ← BACK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#030712] text-white px-3 sm:px-6 py-6 sm:py-8 relative overflow-hidden">
      <BackgroundGlow />

      <div className="relative max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="text-center mb-7 sm:mb-9">

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-400/[0.05] border border-cyan-400/15">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />

            <span className="text-[8px] sm:text-[9px] text-cyan-300 font-black tracking-[0.3em] uppercase">
              TOURNAMENT MODE
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mt-4 tracking-tight">
            TOURNAMENT{" "}
            <span className="text-cyan-400">
              HUB
            </span>
          </h1>

          <p className="text-gray-600 text-xs sm:text-sm mt-3">
            Build your tournament. Choose your battlefield. Enter the fight.
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="max-w-2xl mx-auto mb-5 px-4 py-3 rounded-2xl bg-red-500/[0.05] border border-red-500/20 text-red-300 text-xs text-center font-bold">
            ⚠️ {error}
          </div>
        )}

        {/* MODE SELECTION */}
        {!mode && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto">

            {/* RANDOM */}
            <button
              type="button"
              onClick={() =>
                handleSelectMode("random")
              }
              className="group relative overflow-hidden text-left rounded-[28px] border border-cyan-400/15 bg-gradient-to-br from-cyan-500/[0.08] via-[#07111d] to-[#05070c] p-6 sm:p-8 hover:border-cyan-400/35 hover:-translate-y-1 hover:shadow-[0_15px_45px_rgba(34,211,238,0.07)] transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/[0.04] blur-3xl rounded-full" />

              <div className="relative">

                <div className="flex items-start justify-between">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-400/[0.07] border border-cyan-400/15 flex items-center justify-center text-3xl">
                    🌐
                  </div>

                  <span className="text-[8px] px-2.5 py-1.5 rounded-full bg-cyan-400/[0.05] border border-cyan-400/15 text-cyan-300 font-black tracking-wider">
                    PUBLIC
                  </span>
                </div>

                <p className="text-[8px] text-cyan-400 font-black tracking-[0.25em] mt-7">
                  FIND OPPONENTS
                </p>

                <h2 className="text-2xl sm:text-3xl font-black mt-2">
                  RANDOM MATCH
                </h2>

                <p className="text-gray-600 text-xs sm:text-sm mt-3 max-w-md">
                  Enter the public queue and battle players searching for the same arena.
                </p>

                <div className="flex items-center gap-2 mt-6 text-cyan-400 text-[9px] font-black tracking-wider">
                  ENTER MATCHMAKING
                  <span className="group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </div>
              </div>
            </button>

            {/* FRIEND */}
            <button
              type="button"
              onClick={() =>
                handleSelectMode("friend")
              }
              className="group relative overflow-hidden text-left rounded-[28px] border border-purple-400/15 bg-gradient-to-br from-purple-500/[0.08] via-[#10091b] to-[#05070c] p-6 sm:p-8 hover:border-purple-400/35 hover:-translate-y-1 hover:shadow-[0_15px_45px_rgba(168,85,247,0.07)] transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/[0.04] blur-3xl rounded-full" />

              <div className="relative">

                <div className="flex items-start justify-between">
                  <div className="w-16 h-16 rounded-2xl bg-purple-400/[0.07] border border-purple-400/15 flex items-center justify-center text-3xl">
                    👥
                  </div>

                  <span className="text-[8px] px-2.5 py-1.5 rounded-full bg-purple-400/[0.05] border border-purple-400/15 text-purple-300 font-black tracking-wider">
                    PRIVATE
                  </span>
                </div>

                <p className="text-[8px] text-purple-400 font-black tracking-[0.25em] mt-7">
                  PLAY WITH FRIENDS
                </p>

                <h2 className="text-2xl sm:text-3xl font-black mt-2">
                  FRIEND MATCH
                </h2>

                <p className="text-gray-600 text-xs sm:text-sm mt-3 max-w-md">
                  Create a private tournament or join your friend's lobby using a code.
                </p>

                <div className="flex items-center gap-2 mt-6 text-purple-300 text-[9px] font-black tracking-wider">
                  CREATE PRIVATE ROOM
                  <span className="group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* SETTINGS */}
        {mode && (
          <div className="max-w-6xl mx-auto">

            {/* TOP NAV */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.025] border border-white/[0.07] text-gray-600 hover:text-white hover:border-white/15 disabled:opacity-40 transition-all"
              >
                <span>←</span>

                <span className="text-[9px] font-black tracking-wider">
                  MODES
                </span>
              </button>

              <div
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border ${
                  mode === "friend"
                    ? "bg-purple-400/[0.04] border-purple-400/15 text-purple-300"
                    : "bg-cyan-400/[0.04] border-cyan-400/15 text-cyan-300"
                }`}
              >
                <span className="text-sm">
                  {mode === "friend"
                    ? "👥"
                    : "🌐"}
                </span>

                <span className="text-[8px] font-black tracking-wider">
                  {mode === "friend"
                    ? "PRIVATE"
                    : "PUBLIC"}
                </span>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-[#050912]/95 overflow-hidden">

              {/* PANEL HEADER */}
              <div className="relative p-5 sm:p-7 border-b border-white/[0.06] bg-gradient-to-r from-white/[0.02] to-transparent">

                <div
                  className={`absolute top-0 left-8 w-28 h-px ${
                    mode === "friend"
                      ? "bg-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.6)]"
                      : "bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.6)]"
                  }`}
                />

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                  <div>
                    <p
                      className={`text-[8px] font-black tracking-[0.3em] ${
                        mode === "friend"
                          ? "text-purple-400"
                          : "text-cyan-400"
                      }`}
                    >
                      TOURNAMENT CONFIGURATION
                    </p>

                    <h2 className="text-2xl sm:text-3xl font-black mt-2">
                      {mode === "friend"
                        ? "FRIEND TOURNAMENT"
                        : "RANDOM TOURNAMENT"}
                    </h2>

                    <p className="text-gray-600 text-xs mt-2">
                      Configure your battle before entering the arena.
                    </p>
                  </div>

                  <div className="hidden sm:flex items-center gap-2">
                    <StepBadge
                      number="01"
                      label="SIZE"
                      active
                    />
                    <StepLine />
                    <StepBadge
                      number="02"
                      label="ARENA"
                      active={
                        !!selectedArena
                      }
                    />
                    <StepLine />
                    <StepBadge
                      number="03"
                      label="START"
                      active={
                        !!selectedArena
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-7">

                {/* SIZE */}
                <section>
                  <SectionTitle
                    number="01"
                    title="TOURNAMENT SIZE"
                    subtitle="Choose how many fighters will enter the bracket."
                  />

                  <div className="grid grid-cols-3 gap-3">
                    {[4, 8, 16].map(
                      (count) => {
                        const active =
                          size === count;

                        return (
                          <button
                            key={count}
                            type="button"
                            disabled={loading}
                            onClick={() =>
                              setSize(count)
                            }
                            className={`relative overflow-hidden py-4 sm:py-5 rounded-2xl border transition-all ${
                              active
                                ? "bg-gradient-to-br from-purple-500/[0.16] to-cyan-400/[0.06] border-cyan-400/40 text-white shadow-[0_0_25px_rgba(34,211,238,0.06)]"
                                : "bg-white/[0.02] border-white/[0.07] text-gray-500 hover:border-white/15 hover:text-white"
                            }`}
                          >
                            {active && (
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-px bg-cyan-400" />
                            )}

                            <span className="text-xl sm:text-2xl font-black">
                              {count}
                            </span>

                            <span className="block text-[7px] sm:text-[8px] uppercase tracking-[0.2em] font-black opacity-50 mt-1">
                              PLAYERS
                            </span>
                          </button>
                        );
                      },
                    )}
                  </div>
                </section>

                {/* ARENA */}
                <section className="mt-8">
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">

                    <SectionTitle
                      number="02"
                      title="SELECT ARENA"
                      subtitle={
                        mode === "friend"
                          ? "The host's arena will be used throughout the tournament."
                          : "You'll only be matched with players using the same arena."
                      }
                    />

                    {selectedArena && (
                      <div className="self-start sm:self-end inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-400/[0.04] border border-cyan-400/15">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />

                        <span className="text-[8px] text-cyan-300 font-black">
                          {selectedArena.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

                    {arenas.map(
                      (arena) => {
                        const selected =
                          selectedArena?.id ===
                          arena.id;

                        return (
                          <button
                            key={arena.id}
                            type="button"
                            disabled={loading}
                            onClick={() =>
                              handleArenaSelect(
                                arena,
                              )
                            }
                            className={`group relative overflow-hidden rounded-2xl border text-left transition-all duration-300 ${
                              selected
                                ? "border-cyan-400/50 shadow-[0_0_30px_rgba(34,211,238,0.08)]"
                                : "border-white/[0.07] hover:border-white/20"
                            }`}
                          >
                            <div className="relative h-36 sm:h-40 bg-[#080c14] overflow-hidden">

                              {arena.image ? (
                                <img
                                  src={
                                    arena.image
                                  }
                                  alt={
                                    arena.name
                                  }
                                  className={`w-full h-full object-cover transition-transform duration-500 ${
                                    selected
                                      ? "scale-110"
                                      : "group-hover:scale-105"
                                  }`}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-5xl opacity-30">
                                  🏟️
                                </div>
                              )}

                              <div className="absolute inset-0 bg-gradient-to-t from-[#050912] via-black/10 to-transparent" />

                              {selected && (
                                <>
                                  <div className="absolute inset-0 bg-cyan-400/[0.06]" />

                                  <div className="absolute top-3 right-3 px-2.5 py-1.5 rounded-lg bg-cyan-400/10 backdrop-blur-md border border-cyan-400/25 text-cyan-300 text-[7px] font-black tracking-wider">
                                    ✓ SELECTED
                                  </div>
                                </>
                              )}
                            </div>

                            <div className="p-4 bg-[#070b13]">
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="font-black text-sm">
                                  {arena.name}
                                </h3>

                                <span className="text-[8px] text-gray-700">
                                  #{String(
                                    arena.id,
                                  ).slice(
                                    -3,
                                  )}
                                </span>
                              </div>

                              <p className="text-[9px] text-gray-700 mt-1">
                                TOURNAMENT BATTLEFIELD
                              </p>
                            </div>
                          </button>
                        );
                      },
                    )}
                  </div>
                </section>

                {/* ACTION AREA */}
                <section className="mt-8">

                  {mode === "random" && (
                    <>
                      <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.025] p-4 sm:p-5">

                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 shrink-0 rounded-xl bg-cyan-400/[0.06] border border-cyan-400/15 flex items-center justify-center">
                            🌐
                          </div>

                          <div>
                            <p className="text-[9px] text-cyan-300 font-black tracking-[0.15em]">
                              PUBLIC MATCHMAKING
                            </p>

                            <p className="text-xs text-gray-500 mt-1">
                              Find a{" "}
                              <span className="text-white font-bold">
                                {size}-player
                              </span>{" "}
                              tournament at{" "}
                              <span className="text-cyan-300 font-bold">
                                {selectedArena?.name ||
                                  "your selected arena"}
                              </span>
                              .
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={
                          handleRandomTournament
                        }
                        disabled={
                          loading ||
                          !selectedArena
                        }
                        className="group relative overflow-hidden w-full mt-4 py-4 rounded-2xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 border border-cyan-300/20 disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_35px_rgba(34,211,238,0.15)] transition-all font-black text-xs sm:text-sm tracking-[0.12em]"
                      >
                        <span className="relative z-10">
                          {loading
                            ? "SEARCHING FOR TOURNAMENT..."
                            : "🌐 FIND TOURNAMENT"}
                        </span>

                        {!loading && (
                          <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        )}
                      </button>
                    </>
                  )}

                  {mode === "friend" && (
                    <div className="space-y-4">

                      <div className="rounded-2xl border border-purple-400/15 bg-purple-400/[0.025] p-4 sm:p-5">

                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 shrink-0 rounded-xl bg-purple-400/[0.06] border border-purple-400/15 flex items-center justify-center">
                            👥
                          </div>

                          <div>
                            <p className="text-[9px] text-purple-300 font-black tracking-[0.15em]">
                              PRIVATE TOURNAMENT
                            </p>

                            <p className="text-xs text-gray-500 mt-1">
                              Create a{" "}
                              <span className="text-white font-bold">
                                {size}-player
                              </span>{" "}
                              private tournament and invite your friends.
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <MiniInfo
                            label="PLAYERS"
                            value={size}
                          />

                          <MiniInfo
                            label="ARENA"
                            value={
                              selectedArena?.name ||
                              "NOT SELECTED"
                            }
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={
                          handleCreateFriend
                        }
                        disabled={
                          loading ||
                          !selectedArena
                        }
                        className="group relative overflow-hidden w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 border border-purple-300/20 disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_35px_rgba(168,85,247,0.15)] transition-all font-black text-xs sm:text-sm tracking-[0.12em]"
                      >
                        <span className="relative z-10">
                          {loading
                            ? "CREATING TOURNAMENT..."
                            : "🏆 CREATE TOURNAMENT"}
                        </span>

                        {!loading && (
                          <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        )}
                      </button>

                      {/* JOIN DIVIDER */}
                      <div className="flex items-center gap-3 py-2">
                        <div className="h-px flex-1 bg-white/[0.06]" />

                        <span className="text-[8px] text-gray-700 font-black tracking-[0.2em]">
                          OR JOIN EXISTING
                        </span>

                        <div className="h-px flex-1 bg-white/[0.06]" />
                      </div>

                      {/* CODE */}
                      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.015] p-4 sm:p-5">

                        <p className="text-[8px] text-gray-600 uppercase tracking-[0.2em] font-black mb-3">
                          TOURNAMENT CODE
                        </p>

                        <input
                          type="text"
                          value={code}
                          disabled={loading}
                          maxLength={6}
                          placeholder="ENTER CODE"
                          onChange={(e) =>
                            setCode(
                              e.target.value
                                .toUpperCase()
                                .replace(
                                  /[^A-Z0-9]/g,
                                  "",
                                )
                                .slice(
                                  0,
                                  6,
                                ),
                            )
                          }
                          className="w-full bg-black/50 border border-white/[0.08] rounded-2xl px-4 py-4 text-center text-lg font-black tracking-[0.35em] text-purple-300 outline-none placeholder:text-gray-800 focus:border-purple-400/40 focus:ring-1 focus:ring-purple-400/10 transition-all"
                        />

                        <button
                          type="button"
                          onClick={
                            handleJoinFriend
                          }
                          disabled={
                            loading ||
                            !code.trim()
                          }
                          className="w-full mt-3 py-3.5 rounded-2xl bg-white/[0.035] border border-white/[0.08] hover:bg-purple-500/[0.08] hover:border-purple-400/25 disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 hover:text-white font-black text-xs tracking-wider transition-all"
                        >
                          {loading
                            ? "JOINING..."
                            : "👥 JOIN TOURNAMENT"}
                        </button>
                      </div>
                    </div>
                  )}
                </section>

                {/* BACK */}
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="w-full mt-5 py-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.07] text-gray-600 hover:text-white hover:bg-white/[0.05] hover:border-white/15 disabled:opacity-30 font-black text-[10px] tracking-[0.15em] transition-all"
                >
                  ← CHANGE TOURNAMENT MODE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EXIT */}
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="block mx-auto mt-6 px-5 py-2.5 text-gray-700 hover:text-gray-400 disabled:opacity-30 text-[8px] font-black tracking-[0.2em] uppercase transition-all"
        >
          EXIT TO GAME
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   UI COMPONENTS
========================================================= */

function SectionTitle({
  number,
  title,
  subtitle,
}) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-7 h-7 shrink-0 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
        <span className="text-[8px] text-cyan-300 font-black">
          {number}
        </span>
      </div>

      <div>
        <p className="text-[9px] text-gray-400 font-black tracking-[0.2em]">
          {title}
        </p>

        <p className="text-[9px] text-gray-700 mt-1">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function StepBadge({
  number,
  label,
  active,
}) {
  return (
    <div
      className={`flex items-center gap-2 ${
        active
          ? "text-cyan-300"
          : "text-gray-700"
      }`}
    >
      <span
        className={`w-6 h-6 rounded-lg flex items-center justify-center text-[7px] font-black border ${
          active
            ? "bg-cyan-400/[0.06] border-cyan-400/20"
            : "bg-white/[0.02] border-white/[0.06]"
        }`}
      >
        {number}
      </span>

      <span className="text-[7px] font-black tracking-wider">
        {label}
      </span>
    </div>
  );
}

function StepLine() {
  return (
    <div className="w-4 h-px bg-white/[0.06]" />
  );
}

function MiniInfo({
  label,
  value,
}) {
  return (
    <div className="px-3 py-2 rounded-xl bg-black/20 border border-white/[0.05]">
      <p className="text-[6px] text-gray-700 uppercase tracking-widest font-black">
        {label}
      </p>

      <p className="text-[9px] text-gray-300 font-black mt-1">
        {value}
      </p>
    </div>
  );
}

function FullScreenState({
  icon,
  label,
  title,
  description,
}) {
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#030712] text-white flex items-center justify-center px-4 relative overflow-hidden">
      <BackgroundGlow />

      <div className="relative text-center">
        <div className="mx-auto w-24 h-24 rounded-[28px] bg-cyan-400/[0.05] border border-cyan-400/15 flex items-center justify-center text-5xl animate-pulse">
          {icon}
        </div>

        <p className="text-[8px] text-cyan-400 font-black tracking-[0.3em] mt-6">
          {label}
        </p>

        <h2 className="text-2xl sm:text-3xl font-black mt-2">
          {title}
        </h2>

        <p className="text-gray-600 text-xs mt-3">
          {description}
        </p>
      </div>
    </div>
  );
}

function BackgroundGlow() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-[-180px] left-[-130px] w-[430px] h-[430px] rounded-full bg-cyan-500/[0.045] blur-[110px]" />

      <div className="absolute top-[20%] right-[-170px] w-[430px] h-[430px] rounded-full bg-pink-500/[0.04] blur-[110px]" />

      <div className="absolute bottom-[-180px] left-[30%] w-[430px] h-[430px] rounded-full bg-purple-500/[0.045] blur-[110px]" />
    </div>
  );
}

export default TournamentMenu;