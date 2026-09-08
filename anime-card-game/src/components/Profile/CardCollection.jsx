import { useEffect, useState } from "react";

import { getCardCollection } from "../../api/profileApi";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const BACKEND_URL = API_BASE_URL.replace(/\/api\/?$/, "");

const getImageUrl = (image) => {
  if (!image) {
    return "";
  }

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("data:") ||
    image.startsWith("blob:")
  ) {
    return image;
  }

  return `${BACKEND_URL}${image.startsWith("/") ? "" : "/"}${image}`;
};

function CardCollection() {
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCollection = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getCardCollection();

      console.log("Player card collection response:", data);

      const collectionData =
        data?.cards || data?.stats
          ? data
          : data?.collection ||
            data?.data ||
            data?.result ||
            {};

      setCollection(collectionData);
    } catch (err) {
      console.error("Failed to load card collection:", err);

      setError(
        err.message || "Failed to load card collection.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollection();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl animate-pulse">🎴</div>

          <h2 className="text-2xl font-black mt-4">
            LOADING COLLECTION...
          </h2>

          <p className="text-gray-500 mt-2">
            Loading your anime cards
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex items-center justify-center px-4">
        <div className="w-full max-w-lg text-center">
          <div className="text-6xl">⚠️</div>

          <h2 className="text-2xl font-black text-red-400 mt-4">
            COLLECTION ERROR
          </h2>

          <p className="text-gray-500 mt-3">{error}</p>

          <button
            type="button"
            onClick={loadCollection}
            className="mt-6 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-black transition"
          >
            🔄 RETRY
          </button>
        </div>
      </div>
    );
  }

  const cards = Array.isArray(collection?.cards)
    ? collection.cards
    : [];

  const availableDraws =
    Number(collection?.stats?.availableDraws) || 0;

  return (
    <div className="min-h-screen bg-[#030712] text-white px-4 py-8">
      <div className="w-full max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-xs text-cyan-400 font-black tracking-[0.3em] uppercase">
            CARD COLLECTION
          </p>

          <h1 className="text-4xl sm:text-5xl font-black mt-2">
            🎴 MY CARDS
          </h1>

          <p className="text-gray-500 mt-3">
            Your collected anime characters
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl bg-gray-950 border border-cyan-500/20 p-5 text-center">
            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black">
              AVAILABLE DRAWS
            </p>

            <p className="text-4xl font-black text-cyan-400 mt-2">
              {availableDraws}
            </p>

            <p className="text-xs text-gray-600 mt-1">
              Ready to unlock
            </p>
          </div>

          <div className="rounded-2xl bg-gray-950 border border-purple-500/20 p-5 text-center">
            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black">
              TOTAL CARDS
            </p>

            <p className="text-4xl font-black text-purple-400 mt-2">
              {cards.length}
            </p>

            <p className="text-xs text-gray-600 mt-1">
              Cards in your collection
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-black">
              COLLECTION
            </p>

            <h2 className="text-2xl font-black mt-1">
              {cards.length}{" "}
              <span className="text-gray-600">CARDS</span>
            </h2>
          </div>

          <button
            type="button"
            onClick={loadCollection}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🔄 REFRESH
          </button>
        </div>

        {cards.length === 0 ? (
          <div className="rounded-3xl bg-gray-950 border border-gray-800 p-12 text-center">
            <div className="text-7xl opacity-30">🎴</div>

            <h2 className="text-2xl font-black mt-5">
              NO CARDS YET
            </h2>

            <p className="text-gray-500 mt-2">
              Win 5 ranked matches to earn your first card draw.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {cards.map((card, index) => {
              const hp = Math.max(
                0,
                Math.min(100, Number(card?.hp) || 0),
              );

              const imageUrl = getImageUrl(card?.image);

              const cardKey =
                card?.cardId ||
                card?.id ||
                `${card?.name || "card"}-${index}`;

              return (
                <div
                  key={cardKey}
                  className="overflow-hidden rounded-2xl bg-gray-950 border border-gray-800 hover:border-cyan-500/40 transition-all"
                >
                  <div className="h-72 bg-gray-900 overflow-hidden">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={card.name || "Anime character"}
                        className="w-full h-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                          event.currentTarget.nextElementSibling.style.display =
                            "flex";
                        }}
                      />
                    ) : null}

                    <div
                      className={`w-full h-full items-center justify-center text-7xl ${
                        imageUrl ? "hidden" : "flex"
                      }`}
                      role="img"
                      aria-label={`${card.name || "Anime character"} image unavailable`}
                    >
                      🎴
                    </div>
                  </div>

                  <div className="p-4">
                    <p className="text-[9px] text-cyan-400 font-black tracking-widest uppercase">
                      {card.anime || "UNKNOWN ANIME"}
                    </p>

                    <h3 className="text-xl font-black mt-1">
                      {card.name || "Unknown Character"}
                    </h3>

                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black">
                          CARD HP
                        </span>

                        <span
                          className={`text-xs font-black ${
                            hp <= 25
                              ? "text-red-400"
                              : hp <= 50
                                ? "text-yellow-400"
                                : "text-green-400"
                          }`}
                        >
                          {hp}/100
                        </span>
                      </div>

                      <div
                        className="h-2 bg-gray-900 rounded-full overflow-hidden"
                        role="progressbar"
                        aria-valuenow={hp}
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-label={`${card.name || "Card"} HP`}
                      >
                        <div
                          className="h-full bg-green-500 transition-all"
                          style={{
                            width: `${hp}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="rounded-xl bg-gray-900 border border-gray-800 p-3 text-center">
                        <p className="text-[8px] text-gray-600 uppercase tracking-widest font-black">
                          GAMES USED
                        </p>

                        <p className="text-lg font-black mt-1">
                          {Number(card.rankedGamesUsed) || 0}
                        </p>
                      </div>

                      <div className="rounded-xl bg-gray-900 border border-gray-800 p-3 text-center">
                        <p className="text-[8px] text-gray-600 uppercase tracking-widest font-black">
                          STATUS
                        </p>

                        <p
                          className={`text-sm font-black mt-1 ${
                            hp > 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {hp > 0 ? "ACTIVE" : "EXHAUSTED"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default CardCollection;