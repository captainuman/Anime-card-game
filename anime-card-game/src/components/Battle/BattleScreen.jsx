import { useState } from "react";
import BattleHistory from "./BattleHistory";
import BattleCard from "./BattleCard";

const MAX_POWER = 100;
const MAX_HP = 100;

function BattleScreen({
  result,
  results = [],
  currentBattle,
  totalBattles,
  player1HP = MAX_HP,
  player2HP = MAX_HP,
  currentDamage,
  onNextBattle,
  onExit,
}) {
  const [revealed, setRevealed] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);

  if (!result) {
    return null;
  }

  const safePlayer1HP = Math.max(
    0,
    Math.min(MAX_HP, Number(player1HP) || 0),
  );

  const safePlayer2HP = Math.max(
    0,
    Math.min(MAX_HP, Number(player2HP) || 0),
  );

  const safePlayer1Power = Math.max(
    1,
    Math.min(
      MAX_POWER,
      Number(result.player1Power) || 1,
    ),
  );

  const safePlayer2Power = Math.max(
    1,
    Math.min(
      MAX_POWER,
      Number(result.player2Power) || 1,
    ),
  );

  const safeDamage = Math.max(
    0,
    Math.min(
      MAX_POWER,
      Number(
        currentDamage ?? result.damage,
      ) || 0,
    ),
  );

  const isDraw = result.winner === "draw";
  const player1Won = result.winner === "player1";
  const player2Won = result.winner === "player2";

  const player1Damage =
    result.damagedPlayer === "player1"
      ? safeDamage
      : 0;

  const player2Damage =
    result.damagedPlayer === "player2"
      ? safeDamage
      : 0;

  const handleNextBattle = () => {
    setRevealed(false);
    onNextBattle?.();
  };

  const handleExitConfirm = () => {
    setShowExitWarning(false);
    onExit?.();
  };

  return (
    <div className="min-h-screen  px-4 py-6 text-white">
      <div className="mx-auto max-w-6xl">

        <div className="mb- flex items-center justify-between">
          <div>
            <h1 className="mt-1 text-2xl font-black">
              Round {currentBattle + 1}
              <span className="ml-2 text-gray-600">
                / {totalBattles}
              </span>
            </h1>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowExitWarning(true)
            }
            className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-400 transition hover:bg-red-500/10"
          >
            Exit
          </button>
        </div>

        <div className="mb-7 text-center">
          <span className="rounded-full border border-purple-500/20 bg-purple-500/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-purple-300">
            {result.positionName}
          </span>
        </div>

        <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_90px_1fr]">

          <div
            className={`rounded-2xl border bg-[#15101d] p-4 ${
              revealed && player1Won
                ? "border-blue-400/70 shadow-[0_0_30px_rgba(59,130,246,0.15)]"
                : "border-blue-500/20"
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-400">
                  Player 1
                </p>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="origin-top scale-[0.68]">
                <BattleCard
                  card={result.player1Card}
                  power={safePlayer1Power}
                  player="PLAYER 1"
                  winner={
                    revealed && player1Won
                  }
                  revealed={revealed}
                  hp={safePlayer1HP}
                  damage={player1Damage}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-purple-500/30 bg-black shadow-[0_0_35px_rgba(168,85,247,0.15)]">
              <div className="absolute inset-1 rounded-full border border-purple-500/10" />

              <span className="relative text-xl font-black text-white">
                VS
              </span>
            </div>

            <div className="mt-4 text-center">
              {!revealed ? (
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600">
                  Ready
                </span>
              ) : isDraw ? (
                <span className="text-[9px] font-black uppercase tracking-widest text-yellow-400">
                  Draw
                </span>
              ) : (
                <span
                  className={`text-[9px] font-black uppercase tracking-widest ${
                    player1Won
                      ? "text-blue-400"
                      : "text-red-400"
                  }`}
                >
                  {player1Won
                    ? "Player 1 Wins"
                    : "Player 2 Wins"}
                </span>
              )}

              {revealed && safeDamage > 0 && (
                <p className="mt-2 text-xs font-black text-red-400">
                  -{safeDamage} HP
                </p>
              )}
            </div>
          </div>

          <div
            className={`rounded-2xl border bg-[#15101d] p-4 ${
              revealed && player2Won
                ? "border-red-400/70 shadow-[0_0_30px_rgba(239,68,68,0.15)]"
                : "border-red-500/20"
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-red-400">
                  Player 2
                </p>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="origin-top scale-[0.68]">
                <BattleCard
                  card={result.player2Card}
                  power={safePlayer2Power}
                  player="PLAYER 2"
                  winner={
                    revealed && player2Won
                  }
                  revealed={revealed}
                  hp={safePlayer2HP}
                  damage={player2Damage}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-7 flex justify-center">
          {!revealed ? (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="rounded-lg bg-blue-600 px-12 py-3 text-xs font-black uppercase tracking-widest transition hover:bg-blue-500"
            >
              Fight
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNextBattle}
              className="rounded-lg bg-purple-600 px-10 py-3 text-xs font-black uppercase tracking-widest transition hover:bg-purple-500"
            >
              {currentBattle === totalBattles - 1
                ? "Finish Match"
                : "Next Battle"}
            </button>
          )}
        </div>

        {revealed && results.length > 0 && (
          <div className="mt-8 rounded-2xl border border-purple-500/10 bg-[#120c19] p-4">
            <BattleHistory
              results={results}
              currentBattle={currentBattle}
            />
          </div>
        )}
      </div>

      {showExitWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-purple-500/20 bg-[#160e20] p-6 shadow-2xl">

            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-red-400">
              Forfeit Match
            </p>

            <h2 className="mt-2 text-xl font-black">
              Are you sure?
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              Leaving the battle will count as a
              forfeit and your opponent will be
              declared the winner.
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
                onClick={handleExitConfirm}
                className="rounded-lg bg-red-600 py-3 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-red-500"
              >
                Forfeit
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default BattleScreen;