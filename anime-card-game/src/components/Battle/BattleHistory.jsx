function BattleHistory({ results = [], currentBattle = 0 }) {
  if (!Array.isArray(results) || results.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto mt-8 max-w-5xl">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.25em] text-purple-400">
            Match
          </p>

          <h3 className="mt-1 text-xl font-black">
            Battle History
          </h3>
        </div>

        <span className="text-[9px] font-black uppercase tracking-widest text-gray-700">
          {results.length} / {Math.max(10, results.length)}
        </span>
      </div>

      <div className="space-y-3">
        {results.map((result, index) => {
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
            Math.min(
              100,
              Number(
                result.player1HP ??
                  result.player1Hp ??
                  100,
              ) || 0,
            ),
          );

          const player2HP = Math.max(
            0,
            Math.min(
              100,
              Number(
                result.player2HP ??
                  result.player2Hp ??
                  100,
              ) || 0,
            ),
          );

          const powerDifference = Math.abs(
            player1Power - player2Power,
          );

          const isDraw = result.winner === "draw";
          const isTraitor = Boolean(result.traitor);
          const isCurrent =
            Number(currentBattle) === index;

          const resultLabel = isDraw
            ? "Draw"
            : result.winner === "player1"
              ? "P1 Wins"
              : "P2 Wins";

          const resultColor = isDraw
            ? "text-yellow-400"
            : result.winner === "player1"
              ? "text-blue-400"
              : "text-red-400";

          const borderColor = isCurrent
            ? "border-purple-500/50"
            : isDraw
              ? "border-yellow-500/20"
              : isTraitor
                ? "border-purple-500/20"
                : "border-gray-800";

          return (
            <div
              key={`${result.position || index}-${index}`}
              className={`rounded-xl border bg-[#15101d] p-4 transition ${borderColor}`}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[9px] font-black ${
                      isCurrent
                        ? "bg-purple-600 text-white"
                        : "bg-black text-gray-500"
                    }`}
                  >
                    {index + 1}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black">
                        {result.positionName || `Round ${index + 1}`}
                      </h4>

                      {result.icon && (
                        <span className="text-sm">
                          {result.icon}
                        </span>
                      )}
                    </div>

                    <p className="mt-0.5 text-[9px] uppercase tracking-wider text-gray-700">
                      Round {index + 1}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-6 md:justify-end">
                  <div className="text-left md:text-right">
                    <p className="text-[8px] font-black uppercase tracking-widest text-gray-700">
                      Result
                    </p>

                    <p
                      className={`mt-1 text-[9px] font-black uppercase tracking-widest ${resultColor}`}
                    >
                      {resultLabel}
                    </p>
                  </div>

                  {damage > 0 && !isDraw && (
                    <div className="text-right">
                      <p className="text-[8px] font-black uppercase tracking-widest text-gray-700">
                        Damage
                      </p>

                      <p className="mt-1 text-sm font-black text-red-400">
                        -{damage}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 items-center gap-3 rounded-xl border border-gray-800 bg-black/20 p-3">
                <PowerBlock
                  label="P1"
                  power={player1Power}
                  color="blue"
                />

                <div className="text-center">
                  <p className="text-[8px] font-black uppercase tracking-widest text-gray-700">
                    Difference
                  </p>

                  <p className="mt-1 text-lg font-black text-yellow-400">
                    {powerDifference}
                  </p>

                  <p className="mt-1 text-[8px] text-gray-700">
                    / 100
                  </p>
                </div>

                <PowerBlock
                  label="P2"
                  power={player2Power}
                  color="red"
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <HPBlock
                  label="P1 HP"
                  hp={player1HP}
                  color="blue"
                />

                <HPBlock
                  label="P2 HP"
                  hp={player2HP}
                  color="red"
                />
              </div>

              {isTraitor && (
                <div className="mt-3 rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[8px] font-black uppercase tracking-widest text-purple-400">
                      Traitor Battle
                    </p>

                    <p className="text-[8px] font-black uppercase tracking-widest text-yellow-400">
                      Point →{" "}
                      {result.pointTo === "player1"
                        ? "P1"
                        : result.pointTo === "player2"
                          ? "P2"
                          : "None"}
                    </p>
                  </div>

                  <p className="mt-1 text-[8px] text-gray-600">
                    The winning card damages its own player.
                  </p>
                </div>
              )}

              {damage > 0 && !isDraw && (
                <p className="mt-3 text-center text-[8px] text-gray-700">
                  Power difference{" "}
                  <span className="font-black text-yellow-400">
                    {powerDifference}
                  </span>{" "}
                  dealt{" "}
                  <span className="font-black text-red-400">
                    {damage} HP damage
                  </span>
                  .
                </p>
              )}

              {(player1HP === 0 || player2HP === 0) && (
                <div className="mt-3 border-t border-red-500/10 pt-3 text-center">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-red-400">
                    Match Point Reached
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PowerBlock({ label, power, color }) {
  const isBlue = color === "blue";

  return (
    <div className="text-center">
      <p
        className={`text-[8px] font-black uppercase tracking-widest ${
          isBlue ? "text-blue-400" : "text-red-400"
        }`}
      >
        {label}
      </p>

      <p
        className={`mt-1 text-2xl font-black ${
          isBlue ? "text-blue-400" : "text-red-400"
        }`}
      >
        {power}
      </p>

      <div className="mx-auto mt-2 h-1 max-w-20 overflow-hidden rounded-full bg-gray-800">
        <div
          className={`h-full rounded-full ${
            isBlue ? "bg-blue-500" : "bg-red-500"
          }`}
          style={{
            width: `${power}%`,
          }}
        />
      </div>
    </div>
  );
}

function HPBlock({ label, hp, color }) {
  const isBlue = color === "blue";

  return (
    <div className="rounded-lg border border-gray-800 bg-black/20 p-3">
      <div className="flex items-center justify-between">
        <span
          className={`text-[8px] font-black uppercase tracking-widest ${
            isBlue ? "text-blue-400" : "text-red-400"
          }`}
        >
          {label}
        </span>

        <span className="text-[9px] font-black text-gray-400">
          {hp}
          <span className="text-gray-700"> / 100</span>
        </span>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isBlue ? "bg-blue-500" : "bg-red-500"
          }`}
          style={{
            width: `${hp}%`,
          }}
        />
      </div>
    </div>
  );
}

export default BattleHistory;