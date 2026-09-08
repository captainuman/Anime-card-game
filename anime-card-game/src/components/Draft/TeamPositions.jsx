import { positions } from "../../data/positions";
import { getPositionPower } from "../../utils/battleEngine";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const BACKEND_URL = API_BASE_URL.replace(/\/api\/?$/, "");

function TeamPositions({ player, currentTeam = {} }) {
  const normalizePower = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return 1;
    }

    return Math.min(100, Math.max(1, Math.round(number)));
  };

  const getImageUrl = (image) => {
    if (!image) {
      return null;
    }

    if (String(image).startsWith("http")) {
      return image;
    }

    return `${BACKEND_URL}${image}`;
  };

  const team = currentTeam || {};
  const filledPositions = Object.keys(team).length;
  const totalPositions = positions.length;

  return (
    <div className="mt-12">
      <div className="flex items-end justify-between mb-5">
        <div>
          <p className="text-[10px] text-cyan-400 font-bold tracking-[0.3em] uppercase">
            Team Roster
          </p>

          <h3 className="text-2xl font-black mt-1">{player} Positions</h3>
        </div>

        <p className="text-xs text-gray-500">
          {filledPositions} / {totalPositions} FILLED
        </p>
      </div>

      <div className="mb-6">
        <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 transition-all duration-700"
            style={{
              width: `${
                totalPositions ? (filledPositions / totalPositions) * 100 : 0
              }%`,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {positions.map((position) => {
          const card = team[position.id];

          const positionPower = card
            ? normalizePower(getPositionPower(card, position.id))
            : 1;

          const imageUrl = card ? getImageUrl(card.image) : null;

          return (
            <div
              key={position.id}
              className="relative overflow-hidden rounded-2xl border border-gray-700 bg-gradient-to-b from-gray-900 to-gray-950 transition-all duration-300 hover:border-cyan-500/50 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(6,182,212,0.12)]"
            >
              <div className="px-3 py-2 border-b border-gray-800 flex items-center gap-2">
                <span className="text-lg">{position.icon}</span>

                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {position.name}
                </span>
              </div>

              {card ? (
                <>
                  <div className="relative h-32 overflow-hidden bg-gray-800">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={card.name || "Anime character"}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black"
                        role="img"
                        aria-label={`${card.name || "Anime character"} image unavailable`}
                      >
                        <span
                          className="text-5xl opacity-40"
                          aria-hidden="true"
                        >
                          🎴
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                  </div>

                  <div className="p-3">
                    <h4 className="text-sm font-black truncate">
                      {card.name || "Unknown"}
                    </h4>

                    <p className="text-[9px] text-gray-500 truncate mt-0.5">
                      {card.anime || "Unknown Anime"}
                    </p>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[8px] uppercase tracking-wider text-gray-500">
                        Assigned
                      </span>

                      <span className="text-[9px] font-bold text-cyan-400">
                        {position.name}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between bg-gray-950 rounded-lg px-2 py-1.5 border border-gray-800">
                      <span className="text-[8px] text-gray-500">
                        {position.name.toUpperCase()}
                      </span>

                      <span className="text-[10px] font-black text-yellow-400">
                        {positionPower} / 100
                      </span>
                    </div>

                    <div className="mt-2">
                      <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 transition-all duration-700"
                          style={{
                            width: `${positionPower}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-44 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full border border-dashed border-gray-700 flex items-center justify-center text-gray-600 text-xl">
                    +
                  </div>

                  <p className="text-[9px] text-gray-600 mt-3 font-bold tracking-wider">
                    EMPTY
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

export default TeamPositions;
