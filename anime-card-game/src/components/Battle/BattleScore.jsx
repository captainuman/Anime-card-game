function BattleScore({
  player1HP = 100,
  player2HP = 100,
}) {
  const safePlayer1HP = Math.max(
    0,
    Math.min(
      100,
      Number(player1HP) || 0
    )
  );

  const safePlayer2HP = Math.max(
    0,
    Math.min(
      100,
      Number(player2HP) || 0
    )
  );

  return (
    <div className="max-w-3xl mx-auto mb-10">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
        <div className="text-center">
          <p className="text-blue-400 font-black tracking-widest">
            PLAYER 1
          </p>

          <p className="text-5xl font-black mt-2">
            {safePlayer1HP}
            <span className="text-xl text-gray-500 font-bold">
              {" "} / 100
            </span>
          </p>

          <div className="mt-3 h-3 bg-gray-800 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-700"
              style={{
                width: `${safePlayer1HP}%`,
              }}
            />
          </div>

          <p className="text-xs text-gray-500 mt-1">
            HP
          </p>
        </div>

        <div className="text-3xl font-black text-gray-600">
          VS
        </div>

        <div className="text-center">
          <p className="text-red-400 font-black tracking-widest">
            PLAYER 2
          </p>

          <p className="text-5xl font-black mt-2">
            {safePlayer2HP}
            <span className="text-xl text-gray-500 font-bold">
              {" "} / 100
            </span>
          </p>

          <div className="mt-3 h-3 bg-gray-800 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full bg-red-500 rounded-full transition-all duration-700"
              style={{
                width: `${safePlayer2HP}%`,
              }}
            />
          </div>

          <p className="text-xs text-gray-500 mt-1">
            HP
          </p>
        </div>
      </div>

      {(safePlayer1HP <= 25 ||
        safePlayer2HP <= 25) && (
        <div className="text-center mt-5 text-red-400 font-black animate-pulse">
          ⚠️ CRITICAL HP
        </div>
      )}
    </div>
  );
}

export default BattleScore;