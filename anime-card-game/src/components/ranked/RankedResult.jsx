function BattleResult({ result }) {
  if (!result) {
    return null;
  }

  const isDraw = result.winner === "draw";
  const isTraitor = Boolean(result.traitor);

  const player1Power = Math.max(
    1,
    Math.min(100, Number(result.player1Power) || 1),
  );

  const player2Power = Math.max(
    1,
    Math.min(100, Number(result.player2Power) || 1),
  );

  const powerDifference = Math.abs(player1Power - player2Power);

  const damage = Math.max(
    0,
    Math.min(
      100,
      Number(result.damage ?? powerDifference) || 0,
    ),
  );

  const player1HP = Math.max(
    0,
    Math.min(100, Number(result.player1HP ?? 100) || 0),
  );

  const player2HP = Math.max(
    0,
    Math.min(100, Number(result.player2HP ?? 100) || 0),
  );

  const damagedPlayer = result.damagedPlayer;

  const winnerName =
    result.winner === "player1"
      ? "PLAYER 1"
      : result.winner === "player2"
        ? "PLAYER 2"
        : "NONE";

  const damagedPlayerName =
    damagedPlayer === "player1"
      ? "PLAYER 1"
      : damagedPlayer === "player2"
        ? "PLAYER 2"
        : "NONE";

  return (
    <div className="mt-8 rounded-2xl border border-gray-800 bg-[#15101d] p-5 text-white md:p-7">
      <div className="text-center">
        <p className="text-[8px] font-black uppercase tracking-[0.25em] text-purple-400">
          Battle Result
        </p>

        {isDraw ? (
          <>
            <h2 className="mt-2 text-3xl font-black text-yellow-400">
              DRAW
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Both players had equal position power.
            </p>

            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-700">
              No HP lost
            </p>
          </>
        ) : isTraitor ? (
          <>
            <h2 className="mt-2 text-3xl font-black text-purple-400">
              TRAITOR
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              {winnerName} won this position.
            </p>

            <p className="mt-3 text-[9px] font-black uppercase tracking-widest text-yellow-400">
              Point To {result.pointTo === "player1"
                ? "Player 1"
                : result.pointTo === "player2"
                  ? "Player 2"
                  : "None"}
            </p>

            {damage > 0 && (
              <div className="mt-5">
                <p className="text-2xl font-black text-red-400">
                  {damagedPlayerName} -{damage} HP
                </p>

                <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-gray-700">
                  Traitor damage = power difference
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <h2
              className={`mt-2 text-3xl font-black ${
                result.winner === "player1"
                  ? "text-blue-400"
                  : "text-red-400"
              }`}
            >
              {winnerName} WINS
            </h2>

            <p className="mt-2 text-[9px] font-black uppercase tracking-widest text-purple-300">
              +1 Point
            </p>

            {damage > 0 && (
              <div className="mt-5">
                <p className="text-2xl font-black text-red-400">
                  {damagedPlayerName} -{damage} HP
                </p>

                <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-gray-700">
                  Damage = power difference
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mx-auto mt-7 max-w-xl rounded-xl border border-gray-800 bg-black/30 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest text-blue-400">
              Player 1
            </p>

            <p className="mt-1 text-2xl font-black text-blue-400">
              {player1Power}
            </p>
          </div>

          <div className="text-center">
            <p className="text-[8px] font-black uppercase tracking-widest text-gray-700">
              Position Power
            </p>

            <p className="mt-2 text-xs font-black text-gray-600">
              VS
            </p>
          </div>

          <div className="text-right">
            <p className="text-[8px] font-black uppercase tracking-widest text-red-400">
              Player 2
            </p>

            <p className="mt-1 text-2xl font-black text-red-400">
              {player2Power}
            </p>
          </div>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-gray-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 transition-all duration-700"
            style={{
              width: `${Math.min(
                100,
                ((player1Power + player2Power) / 200) * 100,
              )}%`,
            }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-[9px]">
          <span className="text-gray-700">
            Scale 1 - 100
          </span>

          {!isDraw && (
            <span className="text-gray-600">
              Difference{" "}
              <span className="font-black text-yellow-400">
                {powerDifference}
              </span>
            </span>
          )}
        </div>
      </div>

      <div className="mx-auto mt-6 grid max-w-xl grid-cols-2 gap-3">
        <HPPanel
          label="PLAYER 1"
          hp={player1HP}
          color="blue"
        />

        <HPPanel
          label="PLAYER 2"
          hp={player2HP}
          color="red"
        />
      </div>

      {result.matchEnded && (
        <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 py-3 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-red-400">
            Match Ended
          </p>
        </div>
      )}
    </div>
  );
}

function HPPanel({ label, hp, color }) {
  const safeHP = Math.max(
    0,
    Math.min(100, Number(hp) || 0),
  );

  const isBlue = color === "blue";

  return (
    <div
      className={`rounded-xl border bg-black/20 p-4 ${
        isBlue ? "border-blue-500/20" : "border-red-500/20"
      }`}
    >
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

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-800">
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

export default BattleResult;