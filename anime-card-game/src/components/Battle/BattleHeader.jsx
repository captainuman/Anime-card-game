function BattleHeader({
  currentBattle = 0,
  totalBattles = 0,
  positionName = "",
  icon = "",
}) {
  return (
    <div className="text-center mb-8">
      <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
        BATTLE {currentBattle + 1} / {totalBattles}
      </p>

      <h2 className="text-4xl md:text-5xl font-black mt-2 text-white">
        {icon} {positionName}
      </h2>

      <p className="text-xs text-gray-600 mt-2 uppercase tracking-widest">
        Power Scale: 1 - 100
      </p>
    </div>
  );
}

export default BattleHeader;