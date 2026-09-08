function FinalMatch({
  player1Score,
  player2Score,
  player1HP,
  player2HP,
  results = [],
  onPlayAgain,
}) {
  const MAX_HP = 100;
  const MAX_POWER = 100;

  const safePlayer1HP = Math.max(
    0,
    Math.min(
      MAX_HP,
      Number(player1HP) || 0
    )
  );

  const safePlayer2HP = Math.max(
    0,
    Math.min(
      MAX_HP,
      Number(player2HP) || 0
    )
  );

  const player1Wins =
    safePlayer1HP >
    safePlayer2HP;

  const player2Wins =
    safePlayer2HP >
    safePlayer1HP;

  const draw =
    safePlayer1HP ===
    safePlayer2HP;

  const hpDifference =
    Math.abs(
      safePlayer1HP -
      safePlayer2HP
    );

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="text-center mb-10">
        <p className="text-gray-400 uppercase tracking-[0.3em] font-bold">
          MATCH COMPLETE
        </p>

        <h1 className="text-5xl md:text-6xl font-black mt-3">
          🏆 FINAL RESULT
        </h1>
      </div>

      <div className="text-center mb-10">
        {player1Wins && (
          <>
            <div className="text-6xl mb-4">
              🔵
            </div>

            <h2 className="text-4xl font-black text-blue-400">
              PLAYER 1 WINS!
            </h2>

            <p className="text-gray-400 mt-3">
              PLAYER 1 has more HP remaining
            </p>
          </>
        )}

        {player2Wins && (
          <>
            <div className="text-6xl mb-4">
              🔴
            </div>

            <h2 className="text-4xl font-black text-red-400">
              PLAYER 2 WINS!
            </h2>

            <p className="text-gray-400 mt-3">
              PLAYER 2 has more HP remaining
            </p>
          </>
        )}

        {draw && (
          <>
            <div className="text-6xl mb-4">
              🤝
            </div>

            <h2 className="text-4xl font-black text-yellow-400">
              MATCH DRAW!
            </h2>

            <p className="text-gray-400 mt-3">
              Both players have the same HP
            </p>
          </>
        )}
      </div>

      <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 items-center text-center mb-10">
        <div className="bg-blue-950/60 border border-blue-500/30 rounded-2xl p-6">
          <p className="text-blue-400 font-bold text-lg">
            PLAYER 1
          </p>

          <p className="text-6xl font-black mt-2">
            {safePlayer1HP}
          </p>

          <p className="text-gray-500">
            HP REMAINING
          </p>

          <div className="mt-5 h-4 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-700"
              style={{
                width: `${safePlayer1HP}%`,
              }}
            />
          </div>
        </div>

        <div className="text-center">
          <p className="text-3xl font-black text-gray-500">
            VS
          </p>

          <div className="mt-3">
            <p className="text-xs text-gray-500">
              HP DIFFERENCE
            </p>

            <p
              className={`text-3xl font-black ${
                hpDifference === 0
                  ? "text-yellow-400"
                  : "text-red-400"
              }`}
            >
              {hpDifference}
            </p>
          </div>
        </div>

        <div className="bg-red-950/60 border border-red-500/30 rounded-2xl p-6">
          <p className="text-red-400 font-bold text-lg">
            PLAYER 2
          </p>

          <p className="text-6xl font-black mt-2">
            {safePlayer2HP}
          </p>

          <p className="text-gray-500">
            HP REMAINING
          </p>

          <div className="mt-5 h-4 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full transition-all duration-700"
              style={{
                width: `${safePlayer2HP}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto bg-black/50 border border-white/10 rounded-2xl p-6 mb-12">
        <h3 className="text-center text-xl font-black text-gray-300 mb-5">
          ⭐ BATTLE POINTS
        </h3>

        <div className="grid grid-cols-3 items-center text-center">
          <div>
            <p className="text-blue-400 font-bold">
              PLAYER 1
            </p>

            <p className="text-4xl font-black mt-1">
              {player1Score}
            </p>

            <p className="text-xs text-gray-500">
              POINTS
            </p>
          </div>

          <div className="text-gray-600 font-black">
            VS
          </div>

          <div>
            <p className="text-red-400 font-bold">
              PLAYER 2
            </p>

            <p className="text-4xl font-black mt-1">
              {player2Score}
            </p>

            <p className="text-xs text-gray-500">
              POINTS
            </p>
          </div>
        </div>
      </div>

      {Array.isArray(results) &&
        results.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-black text-center mb-5">
              ⚔️ MATCH BREAKDOWN
            </h3>

            <div className="space-y-3">
              {results.map(
                (result, index) => {
                  if (!result) {
                    return null;
                  }

                  const player1Power =
                    Math.max(
                      0,
                      Math.min(
                        MAX_POWER,
                        Number(
                          result.player1Power
                        ) || 0
                      )
                    );

                  const player2Power =
                    Math.max(
                      0,
                      Math.min(
                        MAX_POWER,
                        Number(
                          result.player2Power
                        ) || 0
                      )
                    );

                  const damage =
                    Math.max(
                      0,
                      Math.min(
                        MAX_POWER,
                        Number(
                          result.damage
                        ) || 0
                      )
                    );

                  const powerDifference =
                    Math.abs(
                      player1Power -
                      player2Power
                    );

                  return (
                    <div
                      key={`${result.position || index}-${index}`}
                      className="bg-black/60 border border-white/10 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-bold">
                            {result.icon}{" "}
                            {result.positionName}
                          </p>

                          <p className="text-xs text-gray-500 mt-1">
                            Battle {index + 1}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 font-black text-lg">
                          <span
                            className={
                              result.winner ===
                              "player1"
                                ? "text-blue-400"
                                : "text-gray-400"
                            }
                          >
                            {player1Power}
                          </span>

                          <span className="text-gray-600">
                            -
                          </span>

                          <span
                            className={
                              result.winner ===
                              "player2"
                                ? "text-red-400"
                                : "text-gray-400"
                            }
                          >
                            {player2Power}
                          </span>
                        </div>

                        <div className="text-right font-bold">
                          {result.winner ===
                            "draw" && (
                            <span className="text-yellow-400">
                              🤝 DRAW
                            </span>
                          )}

                          {result.winner !==
                            "draw" &&
                            !result.traitor && (
                              <span>
                                {result.winner ===
                                "player1"
                                  ? "🔵 P1"
                                  : "🔴 P2"}
                              </span>
                            )}

                          {result.traitor && (
                            <span className="text-purple-400">
                              🗡️ TRAITOR
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 text-center text-[10px] text-gray-600">
                        POWER SCALE: 1 - 100
                      </div>

                      {result.winner !==
                        "draw" &&
                        damage > 0 && (
                          <div className="mt-4 pt-3 border-t border-white/10 flex justify-between text-sm">
                            <span className="text-gray-500">
                              POWER DIFFERENCE
                            </span>

                            <span className="text-yellow-400 font-black">
                              {powerDifference}
                            </span>
                          </div>
                        )}

                      {result.winner !==
                        "draw" &&
                        damage > 0 && (
                          <div className="mt-2 flex justify-between text-sm">
                            <span className="text-gray-500">
                              DAMAGE
                            </span>

                            <span className="text-red-400 font-black">
                              -{damage} HP
                            </span>
                          </div>
                        )}

                      {result.traitor && (
                        <div className="mt-3 text-center text-xs text-purple-400 font-bold">
                          🗡️ Winning card damaged its own player.
                        </div>
                      )}

                      {result.matchEnded && (
                        <div className="mt-3 text-center text-red-500 font-black text-sm">
                          💀 MATCH ENDED
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}

      <div className="text-center mt-12">
        <button
          onClick={onPlayAgain}
          className="px-10 py-5 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black text-xl transition hover:scale-105 shadow-lg"
        >
          🔄 PLAY AGAIN
        </button>
      </div>
    </div>
  );
}

export default FinalMatch;
