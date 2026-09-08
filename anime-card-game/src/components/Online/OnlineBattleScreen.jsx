import { useEffect, useState } from "react";
import socket from "../../socket";
import BattleCard from "../Battle/BattleCard";
import BattleHistory from "../Battle/BattleHistory";

const MAX_HP = 100;
const MAX_POWER = 100;
const DEFAULT_TOTAL_BATTLES = 10;

function OnlineBattleScreen({
  match,
  onComplete,
  onBack,
}) {
  const [currentBattle, setCurrentBattle] = useState(0);
  const [totalBattles, setTotalBattles] = useState(
    DEFAULT_TOTAL_BATTLES,
  );
  const [position, setPosition] = useState(null);
  const [result, setResult] = useState(null);
  const [results, setResults] = useState([]);
  const [player1HP, setPlayer1HP] = useState(MAX_HP);
  const [player2HP, setPlayer2HP] = useState(MAX_HP);
  const [player1Score, setPlayer1Score] =
    useState(0);
  const [player2Score, setPlayer2Score] =
    useState(0);
  const [fighting, setFighting] = useState(false);
  const [waitingNext, setWaitingNext] =
    useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [showExitWarning, setShowExitWarning] =
    useState(false);

  const safeNumber = (
    value,
    fallback = 0,
  ) => {
    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : fallback;
  };

  const applyBattleState = ({
    currentBattle: battleIndex = 0,
    totalBattles: total =
      DEFAULT_TOTAL_BATTLES,
    position: serverPosition = null,
    player1HP: p1HP = MAX_HP,
    player2HP: p2HP = MAX_HP,
    player1Score: p1Score = 0,
    player2Score: p2Score = 0,
    result: battleResult = null,
    results: serverResults = [],
  } = {}) => {
    setCurrentBattle(
      Math.max(
        0,
        safeNumber(battleIndex, 0),
      ),
    );

    setTotalBattles(
      Math.max(
        1,
        safeNumber(
          total,
          DEFAULT_TOTAL_BATTLES,
        ),
      ),
    );

    if (serverPosition) {
      setPosition(serverPosition);
    }

    setPlayer1HP(
      Math.max(
        0,
        Math.min(
          MAX_HP,
          safeNumber(p1HP, MAX_HP),
        ),
      ),
    );

    setPlayer2HP(
      Math.max(
        0,
        Math.min(
          MAX_HP,
          safeNumber(p2HP, MAX_HP),
        ),
      ),
    );

    setPlayer1Score(
      Math.max(
        0,
        safeNumber(p1Score, 0),
      ),
    );

    setPlayer2Score(
      Math.max(
        0,
        safeNumber(p2Score, 0),
      ),
    );

    if (battleResult) {
      setResult(battleResult);

      setPosition({
        id: battleResult.position,
        name: battleResult.positionName,
        icon: battleResult.icon,
      });

      setRevealed(true);
    }

    setResults(
      Array.isArray(serverResults)
        ? serverResults
        : [],
    );

    setLoading(false);
    setFighting(false);
    setWaitingNext(false);
  };

  useEffect(() => {
    if (!match?.roomId) {
      return;
    }

    const roomId = String(match.roomId);

    const handleBattleReady = (
      data = {},
    ) => {
      if (
        data?.roomId &&
        String(data.roomId) !== roomId
      ) {
        return;
      }

      applyBattleState({
        ...data,
        result: null,
      });

      setResult(null);
      setRevealed(false);
      setError("");
    };

    const handleBattleState = (
      data = {},
    ) => {
      if (
        data?.roomId &&
        String(data.roomId) !== roomId
      ) {
        return;
      }

      applyBattleState(data);
      setError("");
    };

    const handleBattleResult = (
      data = {},
    ) => {
      if (
        data?.roomId &&
        String(data.roomId) !== roomId
      ) {
        return;
      }

      if (!data?.result) {
        return;
      }

      applyBattleState(data);
      setError("");
      setRevealed(true);
    };

    const handleNextBattle = (
      data = {},
    ) => {
      if (
        data?.roomId &&
        String(data.roomId) !== roomId
      ) {
        return;
      }

      applyBattleState({
        ...data,
        result: null,
      });

      setResult(null);
      setRevealed(false);
      setError("");
    };

    const handleMatchComplete = (
      data = {},
    ) => {
      if (
        data?.roomId &&
        String(data.roomId) !== roomId
      ) {
        return;
      }

      const finalResults =
        Array.isArray(data?.results)
          ? data.results
          : [];

      const finalPlayer1HP = Math.max(
        0,
        Math.min(
          MAX_HP,
          safeNumber(data?.player1HP, 0),
        ),
      );

      const finalPlayer2HP = Math.max(
        0,
        Math.min(
          MAX_HP,
          safeNumber(data?.player2HP, 0),
        ),
      );

      const finalPlayer1Score =
        Math.max(
          0,
          safeNumber(data?.player1Score, 0),
        );

      const finalPlayer2Score =
        Math.max(
          0,
          safeNumber(data?.player2Score, 0),
        );

      setResults(finalResults);
      setPlayer1HP(finalPlayer1HP);
      setPlayer2HP(finalPlayer2HP);
      setPlayer1Score(finalPlayer1Score);
      setPlayer2Score(finalPlayer2Score);
      setFighting(false);
      setWaitingNext(false);
      setLoading(false);

      onComplete?.({
        results: finalResults,
        player1HP: finalPlayer1HP,
        player2HP: finalPlayer2HP,
        player1Score: finalPlayer1Score,
        player2Score: finalPlayer2Score,
      });
    };

    const handleRoomError = (
      message,
    ) => {
      setFighting(false);
      setWaitingNext(false);
      setLoading(false);
      setError(
        message ||
          "Online battle error.",
      );
    };

    const handleOpponentLeft = () => {
      setFighting(false);
      setWaitingNext(false);
      setLoading(false);

      setError(
        "Opponent disconnected. The match has ended.",
      );
    };

    socket.on(
      "online-battle-ready",
      handleBattleReady,
    );

    socket.on(
      "online-battle-state",
      handleBattleState,
    );

    socket.on(
      "online-battle-result",
      handleBattleResult,
    );

    socket.on(
      "online-next-battle",
      handleNextBattle,
    );

    socket.on(
      "online-match-complete",
      handleMatchComplete,
    );

    socket.on(
      "room-error",
      handleRoomError,
    );

    socket.on(
      "opponent-left",
      handleOpponentLeft,
    );

    socket.emit(
      "online-get-battle-state",
      {
        roomId,
      },
    );

    return () => {
      socket.off(
        "online-battle-ready",
        handleBattleReady,
      );

      socket.off(
        "online-battle-state",
        handleBattleState,
      );

      socket.off(
        "online-battle-result",
        handleBattleResult,
      );

      socket.off(
        "online-next-battle",
        handleNextBattle,
      );

      socket.off(
        "online-match-complete",
        handleMatchComplete,
      );

      socket.off(
        "room-error",
        handleRoomError,
      );

      socket.off(
        "opponent-left",
        handleOpponentLeft,
      );
    };
  }, [match?.roomId, onComplete]);

  const handleFight = () => {
    if (
      !match?.roomId ||
      loading ||
      fighting ||
      result
    ) {
      return;
    }

    if (!socket.connected) {
      setError(
        "Socket is not connected.",
      );
      return;
    }

    setFighting(true);
    setError("");

    socket.emit("online-fight", {
      roomId: match.roomId,
    });
  };

  const handleNext = () => {
    if (
      !result ||
      waitingNext ||
      result.matchEnded
    ) {
      return;
    }

    if (!socket.connected) {
      setError(
        "Socket is not connected.",
      );
      return;
    }

    setWaitingNext(true);
    setError("");

    socket.emit(
      "online-next-battle",
      {
        roomId: match.roomId,
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

  const handleExitConfirm = () => {
    setShowExitWarning(false);
    handleLeave();
  };

  const player1Power = Math.max(
    1,
    Math.min(
      MAX_POWER,
      safeNumber(
        result?.player1Power,
        1,
      ),
    ),
  );

  const player2Power = Math.max(
    1,
    Math.min(
      MAX_POWER,
      safeNumber(
        result?.player2Power,
        1,
      ),
    ),
  );

  const damage = Math.max(
    0,
    Math.min(
      MAX_POWER,
      safeNumber(
        result?.damage,
        0,
      ),
    ),
  );

  const isDraw =
    result?.winner === "draw";

  const isTraitor =
    Boolean(result?.traitor);

  const player1Won =
    result?.winner === "player1";

  const player2Won =
    result?.winner === "player2";

  const player1Damage =
    result?.damagedPlayer === "player1"
      ? damage
      : 0;

  const player2Damage =
    result?.damagedPlayer === "player2"
      ? damage
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0715] px-4 text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-gray-800 border-t-purple-500" />

            <h2 className="mt-5 text-lg font-black">
              PREPARING BATTLE
            </h2>

            <p className="mt-2 text-xs text-gray-600">
              Connecting to battle server
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0715] px-4 py-5 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">

        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-purple-400">
              Online Battle
            </p>

            <h2 className="mt-1 text-xl font-black sm:text-2xl">
              Round {currentBattle + 1}
              <span className="ml-2 text-gray-600">
                / {totalBattles}
              </span>
            </h2>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowExitWarning(true)
            }
            className="rounded-lg border border-gray-800 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 transition hover:border-red-500/40 hover:text-red-400"
          >
            Exit
          </button>
        </div>

        <div className="mb-6 text-center">
          <span className="text-xs font-black uppercase tracking-[0.3em] text-purple-300">
            {position?.name || "BATTLE"}
          </span>
        </div>

        <div className="mx-auto mb-6 grid max-w-4xl grid-cols-[1fr_80px_1fr] items-center gap-3">
          <OnlineHP
            label="PLAYER 1"
            hp={player1HP}
            side="blue"
          />

          <div className="text-center">
            <p className="text-[8px] font-bold uppercase tracking-widest text-gray-700">
              SCORE
            </p>

            <p className="mt-1 text-lg font-black">
              <span className="text-blue-400">
                {player1Score}
              </span>

              <span className="mx-1.5 text-gray-700">
                -
              </span>

              <span className="text-red-400">
                {player2Score}
              </span>
            </p>
          </div>

          <OnlineHP
            label="PLAYER 2"
            hp={player2HP}
            side="red"
          />
        </div>

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_110px_1fr]">

          <div className="flex justify-center">
            <div className="w-fit">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                  PLAYER 1
                </span>

                <span className="text-xs font-black text-blue-300">
                  {player1Power}
                </span>
              </div>

              <div className="rounded-xl border border-blue-500/20 bg-black/20 p-2">
                <BattleCard
                  card={
                    result?.player1Card ||
                    null
                  }
                  power={player1Power}
                  player="PLAYER 1"
                  winner={
                    revealed &&
                    player1Won
                  }
                  revealed={revealed}
                  hp={player1HP}
                  damage={player1Damage}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center pt-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-purple-500/30 bg-black shadow-[0_0_30px_rgba(168,85,247,0.12)]">
              <span className="text-lg font-black text-white">
                VS
              </span>
            </div>

            {revealed && (
              <div className="mt-4 text-center">
                {isDraw ? (
                  <p className="text-[9px] font-black uppercase tracking-widest text-yellow-400">
                    Draw
                  </p>
                ) : isTraitor ? (
                  <p className="text-[9px] font-black uppercase tracking-widest text-purple-400">
                    Traitor
                  </p>
                ) : (
                  <p
                    className={`text-[9px] font-black uppercase tracking-widest ${
                      player1Won
                        ? "text-blue-400"
                        : "text-red-400"
                    }`}
                  >
                    {player1Won
                      ? "P1 Wins"
                      : "P2 Wins"}
                  </p>
                )}

                {damage > 0 && (
                  <p className="mt-2 text-xs font-black text-red-400">
                    -{damage} HP
                  </p>
                )}
              </div>
            )}

            {!revealed && (
              <button
                type="button"
                onClick={handleFight}
                disabled={fighting}
                className="mt-5 rounded-lg bg-blue-600 px-8 py-3 text-xs font-black uppercase tracking-widest transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {fighting
                  ? "Fighting..."
                  : "Fight"}
              </button>
            )}

            {revealed && (
              <button
                type="button"
                onClick={handleNext}
                disabled={
                  waitingNext ||
                  result?.matchEnded
                }
                className="mt-5 rounded-lg bg-purple-600 px-7 py-3 text-xs font-black uppercase tracking-widest transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {result?.matchEnded
                  ? "Match Ended"
                  : waitingNext
                    ? "Waiting..."
                    : currentBattle ===
                        totalBattles - 1
                      ? "Finish Match"
                      : "Next Battle"}
              </button>
            )}
          </div>

          <div className="flex justify-center">
            <div className="w-fit">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-red-400">
                  PLAYER 2
                </span>

                <span className="text-xs font-black text-red-300">
                  {player2Power}
                </span>
              </div>

              <div className="rounded-xl border border-red-500/20 bg-black/20 p-2">
                <BattleCard
                  card={
                    result?.player2Card ||
                    null
                  }
                  power={player2Power}
                  player="PLAYER 2"
                  winner={
                    revealed &&
                    player2Won
                  }
                  revealed={revealed}
                  hp={player2HP}
                  damage={player2Damage}
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-auto mt-6 max-w-xl rounded-lg border border-red-500/20 bg-red-950/20 px-4 py-3 text-center text-xs font-bold text-red-400">
            {error}
          </div>
        )}

        {revealed && results.length > 0 && (
          <div className="mx-auto mt-7 max-w-5xl border-t border-gray-800 pt-5">
            <BattleHistory
              results={results}
              currentBattle={currentBattle}
            />
          </div>
        )}

        <button
          type="button"
          onClick={() =>
            setShowExitWarning(true)
          }
          className="mx-auto mt-7 block text-[10px] font-bold uppercase tracking-widest text-gray-600 transition hover:text-red-400"
        >
          Leave Match
        </button>
      </div>

      {showExitWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-red-500/20 bg-[#160e20] p-6 shadow-2xl">
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-red-400">
              Leave Battle
            </p>

            <h2 className="mt-2 text-xl font-black">
              Are you sure?
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              Leaving this online match will
              disconnect you from the battle.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setShowExitWarning(false)
                }
                className="rounded-lg border border-gray-700 py-3 text-xs font-bold uppercase tracking-widest text-gray-400 transition hover:bg-white/5 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleExitConfirm
                }
                className="rounded-lg bg-red-600 py-3 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-red-500"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OnlineHP({
  label,
  hp,
  side,
}) {
  const safeHP = Math.max(
    0,
    Math.min(
      MAX_HP,
      Number(hp) || 0,
    ),
  );

  const isBlue = side === "blue";

  return (
    <div className="rounded-lg border border-gray-800 bg-black/20 px-3 py-2">
      <div className="flex items-center justify-between">
        <span
          className={`text-[8px] font-black uppercase tracking-widest ${
            isBlue
              ? "text-blue-400"
              : "text-red-400"
          }`}
        >
          {label}
        </span>

        <span className="text-[10px] font-black text-gray-300">
          {safeHP}
        </span>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-800">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            isBlue
              ? "bg-blue-500"
              : "bg-red-500"
          }`}
          style={{
            width: `${safeHP}%`,
          }}
        />
      </div>
    </div>
  );
}

export default OnlineBattleScreen;