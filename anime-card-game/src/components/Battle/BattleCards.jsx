import BattleCard from "./BattleCard";

function BattleCards({ result }) {
  if (!result) {
    return null;
  }

  const player1Power = Math.max(
    1,
    Math.min(100, Number(result.player1Power) || 1),
  );

  const player2Power = Math.max(
    1,
    Math.min(100, Number(result.player2Power) || 1),
  );

  const damage = Math.max(
    0,
    Math.min(100, Number(result.damage) || 0),
  );

  const player1HP = Math.max(
    0,
    Math.min(100, Number(result.player1HP ?? 100)),
  );

  const player2HP = Math.max(
    0,
    Math.min(100, Number(result.player2HP ?? 100)),
  );

  const powerDifference = Math.abs(
    player1Power - player2Power,
  );

  const player1Damage =
    result.damagedPlayer === "player1" ? damage : 0;

  const player2Damage =
    result.damagedPlayer === "player2" ? damage : 0;

  const isDraw = result.winner === "draw";
  const isTraitor = Boolean(result.traitor);

  return (
    <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-[1fr_90px_1fr]">
      <div
        className={`rounded-2xl border bg-[#15101d] p-3 ${
          result.winner === "player1"
            ? "border-blue-400/60 shadow-[0_0_30px_rgba(59,130,246,0.12)]"
            : "border-blue-500/15"
        }`}
      >
        <BattleCard
          player="PLAYER 1"
          card={result.player1Card}
          power={player1Power}
          winner={result.winner === "player1"}
          hp={player1HP}
          damage={player1Damage}
          revealed
        />
      </div>

      <div className="flex flex-col items-center pt-16">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-purple-500/30 bg-black shadow-[0_0_35px_rgba(168,85,247,0.15)]">
          <div className="absolute inset-1 rounded-full border border-purple-500/10" />

          <span className="relative text-xl font-black">
            VS
          </span>
        </div>

        <div className="mt-5 w-full rounded-xl border border-gray-800 bg-black/30 p-3">
          <p className="text-center text-[8px] font-black uppercase tracking-widest text-gray-600">
            Position Power
          </p>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-lg font-black text-blue-400">
              {player1Power}
            </span>

            <span className="text-[8px] font-bold text-gray-700">
              VS
            </span>

            <span className="text-lg font-black text-red-400">
              {player2Power}
            </span>
          </div>

          <div className="mt-2 h-1 overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-red-500"
              style={{
                width: `${Math.min(
                  100,
                  ((player1Power + player2Power) / 200) * 100,
                )}%`,
              }}
            />
          </div>

          {!isDraw && (
            <p className="mt-2 text-center text-[8px] text-gray-700">
              Difference{" "}
              <span className="font-black text-yellow-400">
                {powerDifference}
              </span>
            </p>
          )}
        </div>

        <div className="mt-5 text-center">
          {isDraw ? (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400">
                Draw
              </p>

              <p className="mt-1 text-[8px] text-gray-700">
                Equal power
              </p>
            </div>
          ) : (
            <div>
              <p
                className={`text-[10px] font-black uppercase tracking-widest ${
                  result.winner === "player1"
                    ? "text-blue-400"
                    : "text-red-400"
                }`}
              >
                {result.winner === "player1"
                  ? "Player 1 Wins"
                  : "Player 2 Wins"}
              </p>

              <p className="mt-2 text-lg font-black text-red-400">
                {damage > 0 ? `-${damage} HP` : "0 HP"}
              </p>
            </div>
          )}
        </div>

        {isTraitor && (
          <div className="mt-4 w-full rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 text-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-purple-400">
              Traitor
            </p>

            <p className="mt-1 text-[8px] leading-4 text-gray-600">
              Winner damages own player.
            </p>

            <p className="mt-1 text-[8px] font-black text-yellow-400">
              Point →{" "}
              {result.pointTo === "player1"
                ? "PLAYER 1"
                : result.pointTo === "player2"
                  ? "PLAYER 2"
                  : "NONE"}
            </p>
          </div>
        )}

        <div className="mt-4 w-full rounded-xl border border-gray-800 bg-[#15101d] p-3">
          <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest">
            <span className="text-blue-400">
              P1 HP
            </span>

            <span className="text-gray-400">
              {player1HP}
            </span>
          </div>

          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{
                width: `${player1HP}%`,
              }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-[8px] font-black uppercase tracking-widest">
            <span className="text-red-400">
              P2 HP
            </span>

            <span className="text-gray-400">
              {player2HP}
            </span>
          </div>

          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full rounded-full bg-red-500"
              style={{
                width: `${player2HP}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div
        className={`rounded-2xl border bg-[#15101d] p-3 ${
          result.winner === "player2"
            ? "border-red-400/60 shadow-[0_0_30px_rgba(239,68,68,0.12)]"
            : "border-red-500/15"
        }`}
      >
        <BattleCard
          player="PLAYER 2"
          card={result.player2Card}
          power={player2Power}
          winner={result.winner === "player2"}
          hp={player2HP}
          damage={player2Damage}
          revealed
        />
      </div>
    </div>
  );
}

export default BattleCards;