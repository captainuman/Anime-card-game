function BattleResult({ result }) {
  if (!result) {
    return null;
  }

  const isDraw =
    result.winner === "draw";

  const isTraitor =
    Boolean(result.traitor);

  const player1Power = Math.max(
    1,
    Math.min(
      100,
      Number(result.player1Power) || 1
    )
  );

  const player2Power = Math.max(
    1,
    Math.min(
      100,
      Number(result.player2Power) || 1
    )
  );

  const powerDifference =
    Math.abs(
      player1Power -
      player2Power
    );

  const damage = Math.max(
    0,
    Math.min(
      100,
      Number(
        result.damage ??
          powerDifference
      ) || 0
    )
  );

  const player1HP = Math.max(
    0,
    Math.min(
      100,
      Number(
        result.player1HP ?? 100
      ) || 0
    )
  );

  const player2HP = Math.max(
    0,
    Math.min(
      100,
      Number(
        result.player2HP ?? 100
      ) || 0
    )
  );

  const damagedPlayer =
    result.damagedPlayer;

  return (
    <div className="text-center mt-10">
      {isDraw && (
        <div>
          <h2 className="text-3xl font-black text-yellow-400">
            🤝 DRAW
          </h2>

          <p className="text-gray-400 mt-2">
            Both players have equal power.
          </p>

          <p className="text-gray-500 mt-1">
            No HP lost.
          </p>
        </div>
      )}

      {!isDraw &&
        isTraitor && (
          <div>
            <h2 className="text-3xl font-black text-purple-400">
              🗡️ TRAITOR!
            </h2>

            <p className="text-gray-300 mt-2">
              {result.winner ===
              "player1"
                ? "PLAYER 1"
                : "PLAYER 2"}{" "}
              won the battle.
            </p>

            <p className="text-yellow-400 font-bold mt-3">
              Point →{" "}
              {result.pointTo ===
              "player1"
                ? "PLAYER 1"
                : result.pointTo ===
                  "player2"
                  ? "PLAYER 2"
                  : "NONE"}
            </p>

            {damage > 0 && (
              <div className="mt-5">
                <p className="text-red-400 font-black text-2xl">
                  💥{" "}
                  {damagedPlayer ===
                  "player1"
                    ? "PLAYER 1"
                    : "PLAYER 2"}{" "}
                  -{damage} HP
                </p>

                <p className="text-gray-500 text-sm mt-1">
                  Traitor damage = Power Difference
                </p>
              </div>
            )}
          </div>
        )}

      {!isDraw &&
        !isTraitor && (
          <div>
            <h2 className="text-3xl font-black text-green-400">
              🏆{" "}
              {result.winner ===
              "player1"
                ? "PLAYER 1"
                : "PLAYER 2"}{" "}
              WINS
            </h2>

            <p className="text-gray-400 mt-2">
              +1 POINT
            </p>

            {damage > 0 && (
              <div className="mt-5">
                <p className="text-red-400 font-black text-2xl">
                  💥{" "}
                  {damagedPlayer ===
                  "player1"
                    ? "PLAYER 1"
                    : "PLAYER 2"}{" "}
                  -{damage} HP
                </p>

                <p className="text-gray-500 text-sm mt-1">
                  Damage = Power Difference
                </p>
              </div>
            )}
          </div>
        )}

      <div className="mt-6 max-w-xl mx-auto px-5 py-4 rounded-xl bg-black/40 border border-white/10">
        <p className="text-xs text-gray-500 uppercase tracking-widest">
          Position Power
        </p>

        <div className="flex justify-center items-center gap-5 mt-2">
          <span className="text-2xl font-black text-blue-400">
            {player1Power}
          </span>

          <span className="text-gray-600">
            VS
          </span>

          <span className="text-2xl font-black text-red-400">
            {player2Power}
          </span>
        </div>

        <p className="text-xs text-gray-600 mt-1">
          Power Scale: 1 - 100
        </p>

        {!isDraw && (
          <p className="text-xs text-gray-500 mt-2">
            Difference:{" "}
            <span className="text-yellow-400 font-bold">
              {powerDifference}
            </span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto mt-8">
        <div className="bg-blue-950/50 border border-blue-500/30 rounded-xl p-4">
          <p className="text-blue-400 font-bold text-sm">
            PLAYER 1 HP
          </p>

          <p className="text-3xl font-black mt-1">
            {player1HP}

            <span className="text-gray-500 text-lg">
              {" "} / 100
            </span>
          </p>

          <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-700"
              style={{
                width: `${player1HP}%`,
              }}
            />
          </div>
        </div>

        <div className="bg-red-950/50 border border-red-500/30 rounded-xl p-4">
          <p className="text-red-400 font-bold text-sm">
            PLAYER 2 HP
          </p>

          <p className="text-3xl font-black mt-1">
            {player2HP}

            <span className="text-gray-500 text-lg">
              {" "} / 100
            </span>
          </p>

          <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all duration-700"
              style={{
                width: `${player2HP}%`,
              }}
            />
          </div>
        </div>
      </div>

      {result.matchEnded && (
        <div className="mt-6 text-red-400 font-black text-lg">
          💀 MATCH ENDED
        </div>
      )}
    </div>
  );
}

export default BattleResult;