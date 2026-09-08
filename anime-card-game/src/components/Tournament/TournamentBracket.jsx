import { useEffect, useMemo, useRef, useState } from "react";
import socket from "../../socket";

function TournamentBracket({
  tournament,
  user,
  onMatchFound,
  onComplete,
  onBack,
}) {
  const [bracket, setBracket] = useState(
    Array.isArray(tournament?.bracket) ? tournament.bracket : [],
  );

  const [players, setPlayers] = useState(
    Array.isArray(tournament?.players) ? tournament.players : [],
  );

  const [currentRound, setCurrentRound] = useState(
    Number(tournament?.currentRound) || 1,
  );

  const [status, setStatus] = useState("Tournament started.");

  const [loadingMatch, setLoadingMatch] = useState(false);

  const tournamentId = tournament?.tournamentId || null;

  const currentUserId = user?.id || user?._id || user?.userId || null;

  const onMatchFoundRef = useRef(onMatchFound);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onMatchFoundRef.current = onMatchFound;
  }, [onMatchFound]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!tournamentId) {
      return;
    }

    setBracket(Array.isArray(tournament?.bracket) ? tournament.bracket : []);

    setPlayers(Array.isArray(tournament?.players) ? tournament.players : []);

    setCurrentRound(Number(tournament?.currentRound) || 1);
  }, [
    tournamentId,
    tournament?.bracket,
    tournament?.players,
    tournament?.currentRound,
  ]);

  useEffect(() => {
    if (!tournamentId || !currentUserId) {
      return undefined;
    }

    const matchesTournament = (data = {}) => {
      if (!data?.tournamentId) {
        return false;
      }

      return String(data.tournamentId) === String(tournamentId);
    };

    const isMyMatch = (data = {}) =>
      String(data?.player1?.userId) === String(currentUserId) ||
      String(data?.player2?.userId) === String(currentUserId);

    const handleTournamentStarted = (data = {}) => {
      if (!matchesTournament(data)) {
        return;
      }

      if (Array.isArray(data.bracket)) {
        setBracket(data.bracket);
      }

      if (Array.isArray(data.players)) {
        setPlayers(data.players);
      }

      setCurrentRound(Number(data.currentRound) || 1);

      setLoadingMatch(false);
      setStatus("Tournament started. Preparing Round 1...");
    };

    const handleMatchCreated = (data = {}) => {
      if (!matchesTournament(data)) {
        return;
      }

      if (Array.isArray(data.bracket)) {
        setBracket(data.bracket);
      }

      if (!isMyMatch(data)) {
        return;
      }

      setLoadingMatch(true);
      setStatus("Your match has been created. Connecting...");
    };

    const handleMatchFound = (data = {}) => {
      if (!matchesTournament(data)) {
        return;
      }

      if (!isMyMatch(data)) {
        return;
      }

      if (!data?.roomId || !data?.matchId) {
        console.error("Invalid tournament match:", data);

        setLoadingMatch(false);
        setStatus("Invalid tournament match received.");

        return;
      }

      setLoadingMatch(false);
      setStatus("Your tournament match is ready!");

      onMatchFoundRef.current?.({
        ...data,
        arena: data?.arena || tournament?.arena || null,
      });
    };

    const handleMatchComplete = (data = {}) => {
      if (!matchesTournament(data)) {
        return;
      }

      if (Array.isArray(data.bracket)) {
        setBracket(data.bracket);
      }

      setLoadingMatch(false);
      setStatus("Match complete. Waiting for the round to finish...");
    };

    const handleRoundComplete = (data = {}) => {
      if (!matchesTournament(data)) {
        return;
      }

      if (Array.isArray(data.bracket)) {
        setBracket(data.bracket);
      }

      const payloadCurrentRound = Number(data?.currentRound);

      const payloadNextRound = Number(data?.nextRound);

      const eventRound = Number(data?.round);

      let nextRound = 0;

      if (Number.isFinite(payloadNextRound) && payloadNextRound > 0) {
        nextRound = payloadNextRound;
      } else if (
        Number.isFinite(payloadCurrentRound) &&
        payloadCurrentRound > 0
      ) {
        nextRound = payloadCurrentRound + 1;
      } else if (Number.isFinite(eventRound) && eventRound > 0) {
        nextRound = eventRound + 1;
      } else {
        nextRound = Number(currentRound) > 0 ? Number(currentRound) + 1 : 1;
      }

      setCurrentRound(nextRound);
      setLoadingMatch(false);
      setStatus(`Round ${nextRound} is starting...`);
    };

    const handleTournamentComplete = (data = {}) => {
      if (!matchesTournament(data)) {
        return;
      }

      if (Array.isArray(data.bracket)) {
        setBracket(data.bracket);
      }

      setLoadingMatch(false);
      setStatus("Tournament complete!");

      onCompleteRef.current?.(data);
    };

    const handleRoomError = (data = {}) => {
      if (data?.tournamentId && !matchesTournament(data)) {
        return;
      }

      setLoadingMatch(false);

      console.error("Tournament bracket error:", data);

      const errorMessage =
        typeof data === "string" ? data : data?.message || "Tournament error.";

      setStatus(errorMessage);
    };

    socket.on("tournament-started", handleTournamentStarted);

    socket.on("tournament-match-created", handleMatchCreated);

    socket.on("tournament-match-found", handleMatchFound);

    socket.on("tournament-match-complete", handleMatchComplete);

    socket.on("tournament-round-complete", handleRoundComplete);

    socket.on("tournament-complete", handleTournamentComplete);

    socket.on("room-error", handleRoomError);

    return () => {
      socket.off("tournament-started", handleTournamentStarted);

      socket.off("tournament-match-created", handleMatchCreated);

      socket.off("tournament-match-found", handleMatchFound);

      socket.off("tournament-match-complete", handleMatchComplete);

      socket.off("tournament-round-complete", handleRoundComplete);

      socket.off("tournament-complete", handleTournamentComplete);

      socket.off("room-error", handleRoomError);
    };
  }, [tournamentId, currentUserId, tournament?.arena]);

  const rounds = useMemo(() => {
    return [...bracket].sort(
      (a, b) => Number(a?.round || 0) - Number(b?.round || 0),
    );
  }, [bracket]);

  const totalRounds = rounds.length;

  const currentRoundData = rounds.find(
    (round) => Number(round?.round) === Number(currentRound),
  );

  const currentRoundMatches = Array.isArray(currentRoundData?.matches)
    ? currentRoundData.matches
    : [];

  const myCurrentMatch = currentRoundMatches.find(
    (match) =>
      String(match?.player1?.userId) === String(currentUserId) ||
      String(match?.player2?.userId) === String(currentUserId),
  );

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#030712] text-white px-3 sm:px-6 py-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#0b1220] via-[#070b14] to-[#130714] p-5 sm:p-7 mb-5">
          <div className="absolute -top-24 -left-20 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -top-24 -right-20 w-64 h-64 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />

          <div className="relative text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-400/20 bg-cyan-400/5 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[9px] text-cyan-300 font-black tracking-[0.28em] uppercase">
                Live Tournament
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
              <span className="text-white">TOURNAMENT</span>{" "}
              <span className="text-cyan-400">BRACKET</span>
            </h1>

            <div className="flex items-center justify-center gap-3 mt-3">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-cyan-500/50" />

              <p className="text-[10px] sm:text-xs text-gray-500 font-black tracking-[0.22em]">
                ROUND {currentRound}
                {totalRounds > 0 ? ` / ${totalRounds}` : ""}
              </p>

              <div className="h-px w-12 bg-gradient-to-l from-transparent to-pink-500/50" />
            </div>
          </div>
        </div>

        {/* TOURNAMENT INFO */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {tournament?.code && (
            <InfoTile
              label="TOURNAMENT CODE"
              value={tournament.code}
              accent="pink"
            />
          )}

          <InfoTile
            label="PLAYERS"
            value={
              <>
                {players.length}

                <span className="text-gray-600">
                  {" / "}
                  {tournament?.maxPlayers || players.length}
                </span>
              </>
            }
            accent="cyan"
          />

          {tournament?.arena && (
            <InfoTile
              label="ARENA"
              value={tournament.arena.name}
              accent="purple"
            />
          )}
        </div>

        {/* STATUS */}
        <div
          className={`mb-5 rounded-2xl border px-4 py-3 flex items-center justify-center gap-3 ${
            loadingMatch
              ? "bg-yellow-500/5 border-yellow-500/20"
              : "bg-white/[0.025] border-white/10"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              loadingMatch ? "bg-yellow-400 animate-pulse" : "bg-cyan-400"
            }`}
          />

          <span className="text-xs sm:text-sm text-gray-400 font-semibold text-center">
            {loadingMatch ? "Opening your match..." : status}
          </span>
        </div>

        {/* CURRENT MATCH */}
        {myCurrentMatch && (
          <div className="relative mb-6 rounded-3xl overflow-hidden border border-cyan-400/20 bg-gradient-to-r from-cyan-950/30 via-[#080d18] to-pink-950/30 p-4 sm:p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.07),transparent_45%)] pointer-events-none" />

            <div className="relative">
              <div className="flex items-center justify-center gap-2 mb-5">
                <span className="text-yellow-400">⚔</span>

                <p className="text-[9px] sm:text-[10px] text-cyan-300 uppercase tracking-[0.3em] font-black">
                  Your Current Match
                </p>

                <span className="text-yellow-400">⚔</span>
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-8 max-w-3xl mx-auto">
                <PlayerBox
                  player={myCurrentMatch.player1}
                  currentUserId={currentUserId}
                  side="blue"
                />

                <div className="flex flex-col items-center">
                  <span className="text-[8px] text-gray-600 font-black tracking-widest mb-1">
                    VS
                  </span>

                  <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shadow-lg">
                    <span className="text-lg sm:text-xl font-black italic text-white">
                      VS
                    </span>
                  </div>
                </div>

                <PlayerBox
                  player={myCurrentMatch.player2}
                  currentUserId={currentUserId}
                  side="red"
                />
              </div>
            </div>
          </div>
        )}

        {/* BRACKET */}
        <div className="rounded-3xl border border-white/10 bg-[#050912]/80 p-3 sm:p-5">
          <div className="flex items-center justify-between mb-4 px-1">
            <div>
              <p className="text-[9px] text-gray-600 font-black tracking-[0.25em] uppercase">
                Championship Path
              </p>

              <h2 className="text-lg sm:text-xl font-black mt-1">
                <span className="text-white">ROAD TO </span>

                <span className="text-yellow-400">VICTORY</span>
              </h2>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[8px] text-gray-600 uppercase tracking-widest font-black">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Current Round
            </div>
          </div>

          <div className="overflow-x-auto pb-5 scrollbar-thin scrollbar-thumb-gray-700">
            <div className="min-w-[820px] flex items-start justify-center gap-4 sm:gap-6 px-1">
              {rounds.map((round) => {
                const isCurrentRound =
                  Number(round?.round) === Number(currentRound);

                return (
                  <div
                    key={round.round}
                    className={`flex flex-col gap-3 min-w-[195px] flex-1 ${
                      isCurrentRound ? "max-w-[225px]" : "max-w-[210px]"
                    }`}
                  >
                    {/* ROUND HEADER */}
                    <div
                      className={`relative rounded-2xl border px-3 py-3 text-center overflow-hidden ${
                        isCurrentRound
                          ? "border-cyan-400/40 bg-cyan-400/[0.06] shadow-[0_0_25px_rgba(34,211,238,0.08)]"
                          : "border-white/10 bg-white/[0.025]"
                      }`}
                    >
                      {isCurrentRound && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-px bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                      )}

                      <p
                        className={`text-[10px] font-black uppercase tracking-[0.18em] ${
                          isCurrentRound ? "text-cyan-300" : "text-gray-500"
                        }`}
                      >
                        {getRoundName(round.round, totalRounds)}
                      </p>

                      <p className="text-[8px] text-gray-700 mt-1 font-bold">
                        ROUND {round.round}
                      </p>
                    </div>

                    {/* MATCHES */}
                    {Array.isArray(round?.matches) &&
                      round.matches.map((match, index) => {
                        const player1 = match.player1;

                        const player2 = match.player2;

                        const player1Winner = Boolean(
                          match.winner?.userId &&
                          String(match.winner.userId) ===
                            String(player1?.userId),
                        );

                        const player2Winner = Boolean(
                          match.winner?.userId &&
                          String(match.winner.userId) ===
                            String(player2?.userId),
                        );

                        const isMyMatch =
                          String(player1?.userId) === String(currentUserId) ||
                          String(player2?.userId) === String(currentUserId);

                        return (
                          <div
                            key={match.matchId || index}
                            className={`relative rounded-2xl border p-2.5 transition-all ${
                              isMyMatch
                                ? "border-cyan-400/40 bg-cyan-400/[0.045] shadow-[0_0_25px_rgba(34,211,238,0.08)]"
                                : "border-white/[0.08] bg-[#090e18]"
                            }`}
                          >
                            {isMyMatch && (
                              <div className="absolute top-0 left-4 right-4 h-px bg-cyan-400/60" />
                            )}

                            <div className="flex items-center justify-between mb-2 px-1">
                              <span className="text-[7px] text-gray-600 uppercase tracking-[0.16em] font-black">
                                Match {match.matchNumber || index + 1}
                              </span>

                              {isMyMatch && (
                                <span className="text-[7px] text-cyan-300 font-black tracking-wider">
                                  YOU
                                </span>
                              )}
                            </div>

                            <MatchPlayer
                              player={player1}
                              winner={player1Winner}
                              currentUserId={currentUserId}
                              side="blue"
                            />

                            <div className="flex items-center gap-2 my-1.5">
                              <div className="h-px flex-1 bg-white/[0.06]" />

                              <span className="text-[6px] text-gray-700 font-black">
                                VS
                              </span>

                              <div className="h-px flex-1 bg-white/[0.06]" />
                            </div>

                            <MatchPlayer
                              player={player2}
                              winner={player2Winner}
                              currentUserId={currentUserId}
                              side="red"
                            />

                            <div className="mt-2 text-center">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[7px] font-black uppercase tracking-wider ${
                                  match.status === "active"
                                    ? "bg-green-400/10 text-green-300 border border-green-400/20"
                                    : match.status === "complete"
                                      ? "bg-white/[0.04] text-gray-500 border border-white/[0.07]"
                                      : "bg-yellow-400/10 text-yellow-300 border border-yellow-400/20"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    match.status === "active"
                                      ? "bg-green-400 animate-pulse"
                                      : match.status === "complete"
                                        ? "bg-gray-600"
                                        : "bg-yellow-400"
                                  }`}
                                />

                                {match.status || "PENDING"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-5 text-center">
          <p className="text-[10px] text-gray-600 font-bold">
            {players.length} players competing
          </p>

          <p className="text-[9px] text-gray-800 mt-1">
            Your next match will open automatically.
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="block mx-auto mt-5 px-6 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-gray-500 hover:text-white hover:border-white/20 hover:bg-white/[0.06] transition-all font-black text-xs tracking-wider"
        >
          ← LEAVE TOURNAMENT
        </button>
      </div>
    </div>
  );
}

function InfoTile({ label, value, accent = "cyan" }) {
  const accentClasses = {
    cyan: "text-cyan-300 border-cyan-400/20 bg-cyan-400/[0.04]",

    pink: "text-pink-300 border-pink-400/20 bg-pink-400/[0.04]",

    purple: "text-purple-300 border-purple-400/20 bg-purple-400/[0.04]",
  };

  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        accentClasses[accent] || accentClasses.cyan
      }`}
    >
      <p className="text-[8px] text-gray-600 uppercase tracking-[0.2em] font-black">
        {label}
      </p>

      <p className="text-sm font-black mt-1 truncate">{value}</p>
    </div>
  );
}

function PlayerBox({ player, currentUserId, side }) {
  if (!player) {
    return (
      <div className="text-center">
        <div className="text-gray-700 font-black">TBD</div>
      </div>
    );
  }

  const isMe = String(player.userId) === String(currentUserId);

  const isBlue = side === "blue";

  return (
    <div className="text-center min-w-0">
      <div
        className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-2xl flex items-center justify-center font-black text-lg sm:text-xl ${
          isBlue
            ? "bg-blue-500/10 text-blue-400 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.08)]"
            : "bg-red-500/10 text-red-400 border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.08)]"
        }`}
      >
        {(player.username || "P").charAt(0).toUpperCase()}
      </div>

      <p className="text-xs sm:text-sm font-black mt-2 truncate max-w-[120px] sm:max-w-[160px] mx-auto">
        {player.username || "Player"}
      </p>

      {isMe && (
        <p className="text-[7px] text-cyan-400 font-black tracking-[0.2em] mt-1">
          YOU
        </p>
      )}
    </div>
  );
}

function MatchPlayer({ player, winner, currentUserId, side }) {
  if (!player) {
    return (
      <div className="py-2 text-center">
        <p className="text-[9px] text-gray-700 font-bold">TBD</p>
      </div>
    );
  }

  const isMe = String(player.userId) === String(currentUserId);

  const isBlue = side === "blue";

  return (
    <div
      className={`flex items-center justify-between gap-2 px-2 py-2 rounded-xl border ${
        winner
          ? "bg-yellow-400/[0.06] border-yellow-400/20"
          : "bg-white/[0.025] border-transparent"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black shrink-0 ${
            isBlue
              ? "bg-blue-500/10 text-blue-400 border border-blue-500/10"
              : "bg-red-500/10 text-red-400 border border-red-500/10"
          }`}
        >
          {(player.username || "P").charAt(0).toUpperCase()}
        </div>

        <p className="text-[10px] font-bold truncate">
          {player.username || "Player"}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {isMe && (
          <span className="text-[6px] text-cyan-400 font-black">YOU</span>
        )}

        {winner && <span className="text-[10px]">🏆</span>}
      </div>
    </div>
  );
}

function getRoundName(round, totalRounds) {
  const remaining = totalRounds - Number(round) + 1;

  if (remaining === 1) {
    return "FINAL";
  }

  if (remaining === 2) {
    return "SEMIFINAL";
  }

  if (remaining === 3) {
    return "QUARTERFINAL";
  }

  if (remaining === 4) {
    return "ROUND OF 16";
  }

  return `ROUND ${round}`;
}

export default TournamentBracket;
