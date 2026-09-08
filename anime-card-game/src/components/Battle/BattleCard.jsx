const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const BACKEND_URL = API_BASE_URL.replace(/\/api\/?$/, "");

function BattleCard({
  player,
  card,
  power,
  winner,
  revealed,
  hp = 100,
  damage = 0,
}) {
  if (!card) {
    return (
      <div className="flex h-[400px] w-[450px] items-center justify-center rounded-2xl border border-gray-800 bg-[#15101d] text-sm font-bold uppercase tracking-widest text-gray-600">
        No Card
      </div>
    );
  }

  const imageUrl = card.image
    ? card.image.startsWith("http")
      ? card.image
      : `${BACKEND_URL}${card.image}`
    : null;

  const safePower = Math.max(
    1,
    Math.min(100, Number(power) || 1),
  );

  const safeDamage = Math.max(
    0,
    Math.min(100, Number(damage) || 0),
  );

  const safeHp = Math.max(
    0,
    Math.min(100, Number(hp) || 0),
  );

  const powerColor =
    safePower <= 25
      ? "text-red-400"
      : safePower <= 50
        ? "text-yellow-400"
        : safePower <= 75
          ? "text-blue-400"
          : "text-purple-400";

  const powerBarColor =
    safePower <= 25
      ? "bg-red-500"
      : safePower <= 50
        ? "bg-yellow-400"
        : safePower <= 75
          ? "bg-blue-500"
          : "bg-purple-500";

  return (
    <div
      className={`relative w-[450px] overflow-hidden rounded-2xl border bg-[#120c19] transition-all duration-500 ${
        winner
          ? "border-yellow-400/70 shadow-[0_0_35px_rgba(250,204,21,0.18)]"
          : "border-gray-800"
      }`}
    >
      {!revealed && (
        <div className="flex h-[400px] flex-col items-center justify-center bg-gradient-to-br from-[#15101d] to-black">
          <div className="h-24 w-24 rounded-2xl border border-purple-500/20 bg-purple-500/5 shadow-[0_0_30px_rgba(168,85,247,0.08)]" />

          <p className="mt-5 text-sm font-black uppercase tracking-[0.2em] text-gray-400">
            {player || "Player"}
          </p>

          <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.25em] text-gray-700">
            Card Hidden
          </p>
        </div>
      )}

      {revealed && (
        <>
          <div className="relative">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={card.name || "Anime character"}
                className="block h-52 w-full object-cover object-center"
                onError={(event) => {
                  event.currentTarget.style.display = "none";

                  const fallback =
                    event.currentTarget.nextElementSibling;

                  if (fallback) {
                    fallback.hidden = false;
                  }
                }}
              />
            ) : null}

            <div
              className="flex h-52 w-full items-center justify-center bg-gradient-to-br from-[#1a1222] to-black"
              hidden={Boolean(imageUrl)}
              role="img"
              aria-label={`${
                card.name || "Anime character"
              } image unavailable`}
            >
              <div className="text-center">
                <div className="mx-auto h-14 w-14 rounded-xl border border-gray-800 bg-black/30" />

                <p className="mt-3 text-[9px] font-black uppercase tracking-widest text-gray-700">
                  Image Unavailable
                </p>
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black via-black/40 to-transparent" />

            <div className="absolute left-3 top-3 rounded-lg border border-white/10 bg-black/70 px-3 py-1.5">
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-300">
                {player || "Player"}
              </p>
            </div>

            {winner && (
              <div className="absolute right-3 top-3 rounded-lg border border-yellow-400/30 bg-yellow-400 px-3 py-1.5">
                <p className="text-[8px] font-black uppercase tracking-widest text-black">
                  Winner
                </p>
              </div>
            )}
          </div>

          <div className="p-5">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-purple-400">
                  {player || "Player"}
                </p>

                <h3 className="mt-1 truncate text-xl font-black text-white">
                  {card.name}
                </h3>

                <p className="mt-0.5 truncate text-xs text-gray-600">
                  {card.anime}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-700">
                  Power
                </p>

                <p
                  className={`mt-1 text-xl font-black ${powerColor}`}
                >
                  {safePower}
                  <span className="text-xs text-gray-700"> / 100</span>
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-600">
                  Position Power
                </span>

                <span className={`text-[9px] font-black ${powerColor}`}>
                  {safePower}%
                </span>
              </div>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-800">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${powerBarColor}`}
                  style={{
                    width: `${safePower}%`,
                  }}
                  role="progressbar"
                  aria-label="Position power"
                  aria-valuemin="1"
                  aria-valuemax="100"
                  aria-valuenow={safePower}
                />
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-gray-800 bg-black/20 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-600">
                  HP
                </span>

                <span className="text-xs font-black text-gray-300">
                  {safeHp}
                  <span className="text-gray-700"> / 100</span>
                </span>
              </div>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-800">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    safeHp <= 25
                      ? "bg-red-500"
                      : safeHp <= 50
                        ? "bg-yellow-400"
                        : "bg-blue-500"
                  }`}
                  style={{
                    width: `${safeHp}%`,
                  }}
                  role="progressbar"
                  aria-label="Card HP"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-valuenow={safeHp}
                />
              </div>
            </div>

            {safeDamage > 0 && (
              <div className="mt-3 flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-gray-600">
                    Damage Taken
                  </p>

                  <p className="mt-0.5 text-lg font-black text-red-400">
                    -{safeDamage} HP
                  </p>
                </div>

                <div className="h-8 w-px bg-red-500/10" />

                <p className="text-[8px] font-bold uppercase tracking-widest text-gray-700">
                  This Round
                </p>
              </div>
            )}

            {winner && (
              <div className="mt-4 rounded-lg border border-yellow-400/20 bg-yellow-400/5 py-2.5 text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-yellow-400">
                  Round Winner
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default BattleCard;