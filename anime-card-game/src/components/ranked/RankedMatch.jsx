import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { positions } from "../../data/positions";
import socket from "../../socket";
import BattleCard from "../Battle/BattleCard";

const MAX_TEAM_SIZE = positions.length;

function getPositionName(position) {
  if (!position) {
    return "";
  }

  if (typeof position === "string") {
    const found = positions.find(
      (item) => item.id === position || item.name === position,
    );

    return found?.name || position;
  }

  if (typeof position === "object") {
    return (
      position.name ||
      positions.find((item) => item.id === position.id)?.name ||
      ""
    );
  }

  return "";
}

function getPositionIcon(position) {
  if (!position) {
    return "";
  }

  if (typeof position === "string") {
    return (
      positions.find((item) => item.id === position || item.name === position)
        ?.icon || ""
    );
  }

  if (typeof position === "object") {
    return (
      position.icon ||
      positions.find((item) => item.id === position.id)?.icon ||
      ""
    );
  }

  return "";
}

function normalizeResult(data = {}) {
  const source = data.result || data;

  const position = data.position || source.position || null;

  return {
    ...source,

    round: Number(
      data.round ??
        source.round ??
        data.currentRound ??
        source.currentRound ??
        1,
    ),

    position,

    positionName:
      data.positionName || source.positionName || getPositionName(position),

    positionIcon:
      data.positionIcon || source.positionIcon || getPositionIcon(position),

    player1Card: data.player1Card || source.player1Card || null,

    player2Card: data.player2Card || source.player2Card || null,

    winner: data.winner || source.winner || "draw",

    damage: Number(data.damage ?? source.damage ?? 0),

    player1Power: Number(data.player1Power ?? source.player1Power ?? 0),

    player2Power: Number(data.player2Power ?? source.player2Power ?? 0),

    player1HP: Number(data.player1HP ?? source.player1HP ?? 100),

    player2HP: Number(data.player2HP ?? source.player2HP ?? 100),
  };
}

function clampHP(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(0, Math.min(100, number));
}

function clampPower(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 1;
  }

  return Math.max(1, Math.min(100, number));
}

function getTeamCard(player, position) {
  if (!player || !position) {
    return null;
  }

  const positionId = typeof position === "object" ? position.id : position;
  const positionName = typeof position === "object" ? position.name : position;

  if (player.team && !Array.isArray(player.team)) {
    return player.team[positionId] || player.team[positionName] || null;
  }

  if (Array.isArray(player.cards)) {
    return (
      player.cards.find(
        (card) =>
          card?.position === positionId || card?.position === positionName,
      ) || null
    );
  }

  return null;
}

function RankedMatch() {
  const navigate = useNavigate();

  const { user, token, loading: authLoading } = useAuth();

  const [status, setStatus] = useState("connecting");
  const [message, setMessage] = useState("");
  const [match, setMatch] = useState(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(positions[0]);
  const [player1HP, setPlayer1HP] = useState(100);
  const [player2HP, setPlayer2HP] = useState(100);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [roundFinished, setRoundFinished] = useState(false);
  const [nextRoundReady, setNextRoundReady] = useState(false);
  const [countdown, setCountdown] = useState(null);

  const playerSideRef = useRef(null);
  const startedRef = useRef(false);
  const matchmakingStartedRef = useRef(false);
  const mountedRef = useRef(true);
  const matchRef = useRef(null);
  const resultsRef = useRef([]);
  const player1HPRef = useRef(100);
  const player2HPRef = useRef(100);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    matchRef.current = match;
  }, [match]);

  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  useEffect(() => {
    player1HPRef.current = player1HP;
  }, [player1HP]);

  useEffect(() => {
    player2HPRef.current = player2HP;
  }, [player2HP]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!token || !user?.id) {
      setStatus("error");
      setError("You must be logged in to play Ranked.");
      return;
    }

    const handleConnect = () => {
      if (!mountedRef.current) {
        return;
      }

      if (!matchmakingStartedRef.current) {
        matchmakingStartedRef.current = true;

        socket.emit("find-ranked-match");

        setStatus("searching");
        setMessage("Searching for a Ranked opponent...");
        setError("");
      }
    };

    const handleSearching = (data = {}) => {
      if (!mountedRef.current) {
        return;
      }

      setStatus("searching");
      setMessage(data.message || "Searching for a Ranked opponent...");
    };

    const handleMatched = (data = {}) => {
      if (!mountedRef.current) {
        return;
      }

      if (!data.matchId || !data.player || !data.opponent) {
        setStatus("error");
        setError("Invalid ranked match data received from server.");
        return;
      }

      const currentUserId = String(user.id);

      const playerIsPlayer1 =
        String(data.player?.userId || data.player?.id || "") === currentUserId;

      const playerIsPlayer2 =
        String(data.opponent?.userId || data.opponent?.id || "") ===
        currentUserId;

      if (!playerIsPlayer1 && !playerIsPlayer2) {
        setStatus("error");
        setError("Unable to determine your side in the ranked match.");
        return;
      }

      const mySide = playerIsPlayer1 ? "player1" : "player2";

      const normalizedMatch = {
        ...data,
        roomId: data.roomId || data.matchId,
        players: {
          player1: playerIsPlayer1 ? data.player : data.opponent,
          player2: playerIsPlayer1 ? data.opponent : data.player,
        },
        positions: Array.isArray(data.positions) ? data.positions : positions,
      };

      matchRef.current = normalizedMatch;
      playerSideRef.current = mySide;

      setMatch(normalizedMatch);
      setStatus("matched");
      setMessage("Opponent found. Preparing battle...");

      setCurrentRound(0);
      setCurrentPosition(positions[0]);

      player1HPRef.current = 100;
      player2HPRef.current = 100;

      setPlayer1HP(100);
      setPlayer2HP(100);

      resultsRef.current = [];
      setResults([]);

      setRoundFinished(false);
      setNextRoundReady(false);
      setCountdown(null);

      if (!startedRef.current) {
        startedRef.current = true;

        setTimeout(() => {
          if (!mountedRef.current) {
            return;
          }

          socket.emit("ranked-battle-ready", {
            matchId: normalizedMatch.matchId,
          });
        }, 300);
      }
    };

    const handlePlayerReady = (data = {}) => {
      if (!mountedRef.current) {
        return;
      }

      if (
        data.matchId &&
        matchRef.current?.matchId &&
        String(data.matchId) !== String(matchRef.current.matchId)
      ) {
        return;
      }

      setStatus(data.round ? "battle" : "matched");
      setMessage(data.message || "Waiting for your opponent to be ready...");
    };

    const handleBattleStarted = (data = {}) => {
      if (!mountedRef.current) {
        return;
      }

      if (
        data.matchId &&
        matchRef.current?.matchId &&
        String(data.matchId) !== String(matchRef.current.matchId)
      ) {
        return;
      }

      setStatus("battle");
      setRoundFinished(false);
      setNextRoundReady(false);
      setCountdown(null);

      const roundNumber = Number(data.currentRound ?? data.round ?? 1);

      setCurrentRound(Math.max(0, roundNumber - 1));

      if (data.position) {
        setCurrentPosition(
          typeof data.position === "object"
            ? data.position
            : positions.find((position) => position.id === data.position) ||
                positions[0],
        );
      }

      const nextPlayer1HP = clampHP(data.player1HP ?? 100);
      const nextPlayer2HP = clampHP(data.player2HP ?? 100);

      player1HPRef.current = nextPlayer1HP;
      player2HPRef.current = nextPlayer2HP;

      setPlayer1HP(nextPlayer1HP);
      setPlayer2HP(nextPlayer2HP);

      setMessage("Press START ROUND when you are ready.");
    };

    const handleNextRound = (data = {}) => {
      if (!mountedRef.current) {
        return;
      }

      if (
        data.matchId &&
        matchRef.current?.matchId &&
        String(data.matchId) !== String(matchRef.current.matchId)
      ) {
        return;
      }

      const roundNumber = Number(
        data.round ?? data.currentRound ?? resultsRef.current.length + 1,
      );

      setStatus("battle");
      setRoundFinished(false);
      setNextRoundReady(false);

      setCurrentRound(Math.max(0, roundNumber - 1));

      if (data.position) {
        setCurrentPosition(
          typeof data.position === "object"
            ? data.position
            : positions.find((position) => position.id === data.position) ||
                positions[0],
        );
      }

      setCountdown(null);
      setMessage(`Round ${roundNumber} starting...`);
    };

    const handleRoundCountdown = (data = {}) => {
      if (!mountedRef.current) {
        return;
      }

      if (
        data.matchId &&
        matchRef.current?.matchId &&
        String(data.matchId) !== String(matchRef.current.matchId)
      ) {
        return;
      }

      const seconds = Number(data.seconds ?? 5);

      if (seconds > 0) {
        setStatus("battle");
        setRoundFinished(false);
        setCountdown(seconds);
        setMessage(`Round ${Number(data.round || currentRound + 1)} starts in...`);
      } else {
        setCountdown(null);
        setMessage("Round starting...");
      }
    };

    const handleRoundResult = (data = {}) => {
      if (!mountedRef.current) {
        return;
      }

      if (
        data.matchId &&
        matchRef.current?.matchId &&
        String(data.matchId) !== String(matchRef.current.matchId)
      ) {
        return;
      }

      const normalizedResult = normalizeResult(data);

      const roundNumber = Number(
        normalizedResult.round || resultsRef.current.length + 1,
      );

      normalizedResult.round = roundNumber;

      setCurrentRound(Math.max(0, roundNumber - 1));

      const nextPlayer1HP = clampHP(normalizedResult.player1HP);
      const nextPlayer2HP = clampHP(normalizedResult.player2HP);

      player1HPRef.current = nextPlayer1HP;
      player2HPRef.current = nextPlayer2HP;

      setPlayer1HP(nextPlayer1HP);
      setPlayer2HP(nextPlayer2HP);

      if (normalizedResult.position) {
        setCurrentPosition(
          typeof normalizedResult.position === "object"
            ? normalizedResult.position
            : positions.find(
                (position) => position.id === normalizedResult.position,
              ) || positions[0],
        );
      }

      setResults((previous) => {
        const exists = previous.some(
          (item) => Number(item.round) === roundNumber,
        );

        if (exists) {
          return previous;
        }

        const updated = [...previous, normalizedResult].sort(
          (a, b) => Number(a.round) - Number(b.round),
        );

        resultsRef.current = updated;

        return updated;
      });

      setNextRoundReady(false);
      setCountdown(null);

      if (roundNumber < MAX_TEAM_SIZE) {
        setRoundFinished(true);

        setMessage(
          `Round ${roundNumber} complete. Press NEXT ROUND when ready.`,
        );
      } else {
        setRoundFinished(false);
        setMessage("Final round complete. Waiting for match result...");
      }
    };

    const handleBattleFinished = (data = {}) => {
      if (!mountedRef.current) {
        return;
      }

      if (
        data.matchId &&
        matchRef.current?.matchId &&
        String(data.matchId) !== String(matchRef.current.matchId)
      ) {
        return;
      }

      const finalResults = Array.isArray(data.rounds)
        ? data.rounds
            .map((result) => normalizeResult(result))
            .sort((a, b) => Number(a.round) - Number(b.round))
        : [...resultsRef.current];

      const finalPlayer1HP = clampHP(
        data.player1FinalHP ?? data.player1HP ?? player1HPRef.current,
      );

      const finalPlayer2HP = clampHP(
        data.player2FinalHP ?? data.player2HP ?? player2HPRef.current,
      );

      const finalWinner = data.winner || "draw";

      const finalMatch = {
        ...(matchRef.current || {}),
        ...data,
        winner: finalWinner,
        players: data.players || matchRef.current?.players,
        roomId: data.roomId || matchRef.current?.roomId || data.matchId,
        matchId: data.matchId || matchRef.current?.matchId,
      };

      matchRef.current = finalMatch;

      resultsRef.current = finalResults;

      player1HPRef.current = finalPlayer1HP;
      player2HPRef.current = finalPlayer2HP;

      setPlayer1HP(finalPlayer1HP);
      setPlayer2HP(finalPlayer2HP);

      setResults(finalResults);
      setMatch(finalMatch);
      setCountdown(null);

      navigate("/ranked-match/result", {
        state: {
          match: finalMatch,
          results: finalResults,
          player1HP: finalPlayer1HP,
          player2HP: finalPlayer2HP,
          winner: finalWinner,
          mySide: playerSideRef.current,
          currentUserId: user.id,
        },
      });
    };

    const handleRankedError = (data = {}) => {
      if (!mountedRef.current) {
        return;
      }

      setStatus("error");
      setError(data.message || "Ranked battle failed.");
    };

    const handleSearchCancelled = (data = {}) => {
      if (!mountedRef.current) {
        return;
      }

      setStatus("cancelled");
      setMessage(data.message || "Ranked matchmaking cancelled.");
    };

    const handleOpponentLeft = (data = {}) => {
      if (!mountedRef.current) {
        return;
      }

      if (
        data.matchId &&
        matchRef.current?.matchId &&
        String(data.matchId) !== String(matchRef.current.matchId)
      ) {
        return;
      }

      setStatus("error");
      setError("Your opponent left the Ranked match.");
    };

    socket.on("connect", handleConnect);
    socket.on("ranked-searching", handleSearching);
    socket.on("ranked-match-found", handleMatched);
    socket.on("ranked-player-ready", handlePlayerReady);
    socket.on("ranked-battle-started", handleBattleStarted);
    socket.on("ranked-next-round", handleNextRound);
    socket.on("ranked-round-countdown", handleRoundCountdown);
    socket.on("ranked-round-result", handleRoundResult);
    socket.on("ranked-match-finished", handleBattleFinished);
    socket.on("ranked-battle-error", handleRankedError);
    socket.on("ranked-search-cancelled", handleSearchCancelled);
    socket.on("ranked-match-cancelled", handleSearchCancelled);
    socket.on("ranked-opponent-left", handleOpponentLeft);
    socket.on("opponent-left", handleOpponentLeft);

    if (!socket.connected) {
      socket.connect();
    } else {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("ranked-searching", handleSearching);
      socket.off("ranked-match-found", handleMatched);
      socket.off("ranked-player-ready", handlePlayerReady);
      socket.off("ranked-battle-started", handleBattleStarted);
      socket.off("ranked-next-round", handleNextRound);
      socket.off("ranked-round-countdown", handleRoundCountdown);
      socket.off("ranked-round-result", handleRoundResult);
      socket.off("ranked-match-finished", handleBattleFinished);
      socket.off("ranked-battle-error", handleRankedError);
      socket.off("ranked-search-cancelled", handleSearchCancelled);
      socket.off("ranked-match-cancelled", handleSearchCancelled);
      socket.off("ranked-opponent-left", handleOpponentLeft);
      socket.off("opponent-left", handleOpponentLeft);

      matchmakingStartedRef.current = false;
      startedRef.current = false;
      playerSideRef.current = null;
    };
  }, [authLoading, token, user, navigate]);

  const handleNextRoundClick = () => {
    if (nextRoundReady || !match?.matchId || !roundFinished) {
      return;
    }

    setNextRoundReady(true);
    setMessage("Waiting for your opponent...");
    setCountdown(null);

    socket.emit("ranked-next-round", {
      matchId: match.matchId,
    });
  };

  const handleStartRoundClick = () => {
    if (nextRoundReady || !match?.matchId) {
      return;
    }

    setNextRoundReady(true);
    setMessage("Waiting for your opponent...");
    setCountdown(null);

    socket.emit("ranked-next-round", {
      matchId: match.matchId,
    });
  };

  const cancelSearch = () => {
    socket.emit("cancel-ranked-search");
    navigate("/ranked-team");
  };

  const goToRankedTeam = () => {
    navigate("/ranked-team");
  };

  const getPlayer = (side) => {
    return match?.players?.[side] || null;
  };

  const mySide = playerSideRef.current;

  const opponentSide =
    mySide === "player1"
      ? "player2"
      : mySide === "player2"
        ? "player1"
        : null;

  const myPlayer = getPlayer(mySide);
  const opponentPlayer = getPlayer(opponentSide);

  const myHP =
    mySide === "player1"
      ? player1HP
      : mySide === "player2"
        ? player2HP
        : 100;

  const opponentHP =
    opponentSide === "player1"
      ? player1HP
      : opponentSide === "player2"
        ? player2HP
        : 100;

  const myCard = getTeamCard(myPlayer, currentPosition);
  const opponentCard = getTeamCard(opponentPlayer, currentPosition);

  const currentRoundResult = results.find(
    (result) => Number(result.round) === currentRound + 1,
  );

  const myPower =
    mySide === "player1"
      ? currentRoundResult?.player1Power
      : mySide === "player2"
        ? currentRoundResult?.player2Power
        : null;

  const opponentPower =
    opponentSide === "player1"
      ? currentRoundResult?.player1Power
      : opponentSide === "player2"
        ? currentRoundResult?.player2Power
        : null;

  const myWinner = currentRoundResult?.winner === mySide;
  const opponentWinner = currentRoundResult?.winner === opponentSide;

  if (authLoading) {
    return <SimpleState title="Checking Account" message="Please wait..." />;
  }

  if (status === "error") {
    return (
      <SimpleState
        title="Ranked Match Error"
        message={error}
        buttonText="Go To Ranked Team"
        onClick={goToRankedTeam}
        danger
      />
    );
  }

  if (status === "connecting" || status === "searching") {
    return (
      <SimpleState
        title="Ranked Matchmaking"
        message={message || "Searching for an opponent..."}
        buttonText="Cancel"
        onClick={cancelSearch}
      />
    );
  }

  if (status === "cancelled") {
    return (
      <SimpleState
        title="Matchmaking Cancelled"
        message={message}
        buttonText="Go To Ranked Team"
        onClick={goToRankedTeam}
      />
    );
  }

  if (status === "matched") {
    return (
      <div className="min-h-screen bg-[#0d0715] px-4 py-6 text-white">
        <div className="mx-auto max-w-5xl">
          <div className="mb-7 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-purple-400">
                Anime Card Battle
              </p>

              <h1 className="mt-1 text-2xl font-black">Opponent Found</h1>
            </div>

            <span className="rounded-lg border border-gray-800 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-gray-600">
              Ranked
            </span>
          </div>

          <div className="grid items-center gap-5 md:grid-cols-[1fr_80px_1fr]">
            <PlayerPreview player={myPlayer} label="YOU" color="blue" />

            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-purple-500/30 bg-black text-lg font-black">
                VS
              </div>
            </div>

            <PlayerPreview
              player={opponentPlayer}
              label="OPPONENT"
              color="red"
            />
          </div>

          <div className="mt-6 rounded-xl border border-gray-800 bg-[#15101d] px-4 py-3 text-center">
            <p className="text-xs text-gray-500">
              {message || "Preparing your battle..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0715] px-4 py-6 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-purple-400">
              Anime Card Battle
            </p>

            <h1 className="mt-1 text-2xl font-black">
              Round {currentRound + 1}
              <span className="ml-2 text-gray-600">/ {MAX_TEAM_SIZE}</span>
            </h1>
          </div>

          <div className="text-right">
            <p className="text-[8px] font-bold uppercase tracking-widest text-gray-600">
              Score
            </p>

            <p className="mt-1 text-lg font-black">
              <span className="text-blue-400">
                {getScore(results, "player1")}
              </span>

              <span className="mx-2 text-gray-700">-</span>

              <span className="text-red-400">
                {getScore(results, "player2")}
              </span>
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-col items-center justify-center gap-2 text-center">
          <span className="rounded-full border border-purple-500/20 bg-purple-500/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-purple-300">
            {getPositionName(currentPosition)}
          </span>

          <p className="text-[10px] text-gray-700">{message}</p>
        </div>

        <div className="mx-auto mb-6 grid max-w-4xl grid-cols-[1fr_80px_1fr] items-center gap-3">
          <HPPanel label="YOU" hp={myHP} color="blue" />

          <div className="text-center">
            <span className="text-[8px] font-black uppercase tracking-widest text-gray-700">
              HP
            </span>
          </div>

          <HPPanel label="OPPONENT" hp={opponentHP} color="red" />
        </div>

        <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-[1fr_90px_1fr]">
          <RankedCardPanel
            card={myCard}
            player={myPlayer}
            label="YOU"
            power={myPower}
            hp={myHP}
            color="blue"
            winner={myWinner}
          />

          <div className="flex flex-col items-center pt-20">
            {countdown !== null ? (
              <div className="text-center">
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-purple-500/30 bg-black shadow-[0_0_40px_rgba(168,85,247,0.2)]">
                  <div className="absolute inset-2 rounded-full border border-purple-500/10" />

                  <span className="relative text-4xl font-black text-purple-400">
                    {countdown}
                  </span>
                </div>

                <p className="mt-4 text-[9px] font-black uppercase tracking-[0.25em] text-purple-400">
                  Get Ready
                </p>
              </div>
            ) : (
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-purple-500/30 bg-black shadow-[0_0_35px_rgba(168,85,247,0.15)]">
                <div className="absolute inset-1 rounded-full border border-purple-500/10" />

                <span className="relative text-xl font-black">VS</span>
              </div>
            )}

            {currentRoundResult && !countdown && (
              <div className="mt-4 text-center">
                {currentRoundResult.winner === "draw" ? (
                  <p className="text-[9px] font-black uppercase tracking-widest text-yellow-400">
                    Draw
                  </p>
                ) : (
                  <p
                    className={`text-[9px] font-black uppercase tracking-widest ${
                      currentRoundResult.winner === mySide
                        ? "text-blue-400"
                        : "text-red-400"
                    }`}
                  >
                    {currentRoundResult.winner === mySide
                      ? "You Win"
                      : "You Lose"}
                  </p>
                )}

                {Number(currentRoundResult.damage || 0) > 0 && (
                  <p className="mt-2 text-xs font-black text-red-400">
                    -{Number(currentRoundResult.damage || 0)} HP
                  </p>
                )}
              </div>
            )}

            {roundFinished && countdown === null && (
              <button
                type="button"
                onClick={handleNextRoundClick}
                disabled={nextRoundReady}
                className="mt-5 rounded-lg bg-purple-600 px-6 py-3 text-[9px] font-black uppercase tracking-widest transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {nextRoundReady ? "Waiting..." : "Next Round"}
              </button>
            )}

            {!roundFinished &&
              results.length === 0 &&
              status === "battle" &&
              countdown === null && (
                <button
                  type="button"
                  onClick={handleStartRoundClick}
                  disabled={nextRoundReady}
                  className="mt-5 rounded-lg bg-purple-600 px-6 py-3 text-[9px] font-black uppercase tracking-widest transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {nextRoundReady ? "Waiting..." : "Start Round"}
                </button>
              )}
          </div>

          <RankedCardPanel
            card={opponentCard}
            player={opponentPlayer}
            label="OPPONENT"
            power={opponentPower}
            hp={opponentHP}
            color="red"
            winner={opponentWinner}
          />
        </div>

        {results.length > 0 && (
          <div className="mt-7 rounded-2xl border border-purple-500/10 bg-[#120c19] p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-purple-400">
                  Match
                </p>

                <h2 className="mt-1 text-sm font-black uppercase tracking-widest">
                  Battle History
                </h2>
              </div>

              <span className="text-[9px] font-black text-gray-700">
                {results.length} / {MAX_TEAM_SIZE}
              </span>
            </div>

            <div className="space-y-2">
              {results.map((item, index) => {
                const roundNumber = Number(item.round ?? index + 1);

                const itemPosition =
                  item.positionName || getPositionName(item.position);

                const winnerText =
                  item.winner === "draw"
                    ? "Draw"
                    : item.winner === mySide
                      ? "You Win"
                      : "You Lose";

                const winnerColor =
                  item.winner === "draw"
                    ? "text-yellow-400"
                    : item.winner === mySide
                      ? "text-blue-400"
                      : "text-red-400";

                return (
                  <div
                    key={`${roundNumber}-${index}`}
                    className="flex items-center justify-between rounded-lg border border-gray-800 bg-black/20 px-3 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-600 text-[9px] font-black">
                        {roundNumber}
                      </span>

                      <div>
                        <p className="text-xs font-black">
                          {itemPosition || `Round ${roundNumber}`}
                        </p>

                        <p className="mt-0.5 text-[9px] text-gray-600">
                          Damage {Number(item.damage || 0)}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-black uppercase tracking-widest ${winnerColor}`}
                    >
                      {winnerText}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RankedCardPanel({
  card,
  player,
  label,
  power,
  hp,
  color,
  winner,
}) {
  const isBlue = color === "blue";

  return (
    <div
      className={`rounded-2xl border bg-[#15101d] p-4 transition ${
        winner
          ? isBlue
            ? "border-blue-400/70 shadow-[0_0_30px_rgba(59,130,246,0.15)]"
            : "border-red-400/70 shadow-[0_0_30px_rgba(239,68,68,0.15)]"
          : isBlue
            ? "border-blue-500/20"
            : "border-red-500/20"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p
            className={`text-[9px] font-bold uppercase tracking-[0.2em] ${
              isBlue ? "text-blue-400" : "text-red-400"
            }`}
          >
            {label}
          </p>

          <p className="mt-1 text-sm font-black">
            {player?.username || "Player"}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[8px] font-bold uppercase tracking-widest text-gray-700">
            Power
          </p>

          <p
            className={`text-sm font-black ${
              isBlue ? "text-blue-400" : "text-red-400"
            }`}
          >
            {power ? clampPower(power) : "—"}
          </p>
        </div>
      </div>

      <div className="flex justify-center overflow-hidden">
        {card ? (
          <div className="origin-top scale-[0.68]">
            <BattleCard
              card={card}
              power={Number(power) || 1}
              player={label}
              winner={winner}
              revealed
              hp={hp}
              damage={0}
            />
          </div>
        ) : (
          <div className="flex h-[300px] w-[210px] items-center justify-center rounded-xl border border-dashed border-gray-800 bg-black/20">
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-700">
              Card unavailable
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function HPPanel({ label, hp, color }) {
  const isBlue = color === "blue";
  const safeHP = clampHP(hp);

  return (
    <div className="rounded-xl border border-gray-800 bg-[#15101d] px-3 py-2.5">
      <div className="flex items-center justify-between">
        <span
          className={`text-[8px] font-black uppercase tracking-widest ${
            isBlue ? "text-blue-400" : "text-red-400"
          }`}
        >
          {label}
        </span>

        <span className="text-xs font-black text-gray-300">
          {safeHP}
          <span className="text-gray-700"> / 100</span>
        </span>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-800">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            isBlue ? "bg-blue-500" : "bg-red-500"
          }`}
          style={{
            width: `${safeHP}%`,
          }}
        />
      </div>
    </div>
  );
}

function PlayerPreview({ player, label, color }) {
  const isBlue = color === "blue";

  return (
    <div
      className={`rounded-2xl border p-5 text-center ${
        isBlue
          ? "border-blue-500/20 bg-blue-950/10"
          : "border-red-500/20 bg-red-950/10"
      }`}
    >
      <div
        className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-lg font-black ${
          isBlue
            ? "bg-blue-500/10 text-blue-400"
            : "bg-red-500/10 text-red-400"
        }`}
      >
        {(player?.username || "P").charAt(0).toUpperCase()}
      </div>

      <p
        className={`mt-3 text-[9px] font-black uppercase tracking-[0.2em] ${
          isBlue ? "text-blue-400" : "text-red-400"
        }`}
      >
        {label}
      </p>

      <p className="mt-1 text-lg font-black">
        {player?.username || "Player"}
      </p>

      <p className="mt-2 text-xs font-bold text-gray-600">100 HP</p>
    </div>
  );
}

function SimpleState({
  title,
  message,
  buttonText,
  onClick,
  danger = false,
}) {
  return (
    <div className="min-h-screen bg-[#0d0715] px-4 text-white">
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#15101d] p-7 text-center">
          <p
            className={`text-[9px] font-black uppercase tracking-[0.25em] ${
              danger ? "text-red-400" : "text-purple-400"
            }`}
          >
            Ranked Mode
          </p>

          <h1 className="mt-2 text-xl font-black">{title}</h1>

          <p className="mt-3 text-sm leading-6 text-gray-600">{message}</p>

          {buttonText && onClick && (
            <button
              type="button"
              onClick={onClick}
              className={`mt-6 rounded-lg px-6 py-3 text-xs font-black uppercase tracking-widest transition ${
                danger
                  ? "bg-red-600 hover:bg-red-500"
                  : "bg-purple-600 hover:bg-purple-500"
              }`}
            >
              {buttonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function getScore(results, side) {
  return results.filter((result) => result.winner === side).length;
}

export default RankedMatch;