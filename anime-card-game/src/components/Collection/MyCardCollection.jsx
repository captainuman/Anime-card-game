import { useEffect, useState } from "react";
import CardCollection from "../Collection/CardCollection";
import CardDraw from "../Profile/CardDraw";
import AnimeCard from "../AnimeCard";
import { getCardCollection } from "../../api/profileApi";
import Navbar from "../Navbar";

const MyCardCollection = () => {
  const [cards, setCards] = useState([]);
  const [availableDraws, setAvailableDraws] = useState(0);
  const [obtainedCard, setObtainedCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCollection();
  }, []);

  const loadCollection = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getCardCollection();

      if (Array.isArray(data?.cards)) {
        setCards(data.cards);
      } else {
        setCards([]);
      }

      setAvailableDraws(Number(data?.stats?.availableDraws) || 0);
    } catch (err) {
      console.error("Failed to load card collection:", err);

      setError(err?.message || "Failed to load card collection");
    } finally {
      setLoading(false);
    }
  };

  const handleCardDrawn = async (data) => {
    const card = data?.card || null;

    if (card) {
      setObtainedCard(card);
    }

    setAvailableDraws(Number(data?.remainingDraws) || 0);

    await loadCollection();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050509] px-6 py-12 text-white">
        <div className="mx-auto flex min-h-[400px] max-w-7xl items-center justify-center">
          <div className="text-center">
            <div className="mb-4 animate-pulse text-4xl">🎴</div>

            <p className="text-gray-500">Loading your card collection...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050509] px-6 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-500/20 bg-[#12070D] p-6 text-center">
            <h2 className="text-xl font-semibold text-red-400">
              Failed to load collection
            </h2>

            <p className="mt-2 text-sm text-red-300/70">{error}</p>

            <button
              type="button"
              onClick={loadCollection}
              className="
                mt-5
                rounded-lg
                border
                border-red-500/40
                bg-black
                px-6
                py-2.5
                text-xs
                font-bold
                uppercase
                tracking-wider
                text-red-400
                transition
                hover:border-purple-500/60
                hover:text-purple-300
              "
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050509] text-white">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-purple-700/10 blur-[120px]" />

        <div className="pointer-events-none absolute right-[-150px] top-[500px] h-[500px] w-[500px] rounded-full bg-red-700/10 blur-[140px]" />

        <div className="pointer-events-none absolute left-1/3 top-[900px] h-96 w-96 rounded-full bg-blue-700/10 blur-[130px]" />

        <div className="relative mx-auto max-w-7xl">

          {obtainedCard && (
            <section className="mb-16 px-4 sm:px-6 lg:px-8">
              <div className="mb-6 flex items-center gap-4">
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-[0.35em] text-purple-400">
                    Latest Acquisition
                  </p>

                  <h2 className="mt-1 font-serif text-xl tracking-wide text-white">
                    Obtained Card
                  </h2>
                </div>

                <div className="h-px flex-1 bg-gradient-to-r from-purple-500/30 via-red-500/20 to-transparent" />

                <span className="hidden text-[8px] uppercase tracking-[0.2em] text-gray-600 sm:block">
                  Added to collection
                </span>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-[#071525] via-[#0A0713] to-[#1A0824]">
                <div className="pointer-events-none absolute left-[-100px] top-[-100px] h-80 w-80 rounded-full bg-purple-600/10 blur-[110px]" />

                <div className="pointer-events-none absolute bottom-[-120px] right-[-100px] h-80 w-80 rounded-full bg-red-600/10 blur-[110px]" />

                <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/5 blur-[100px]" />

                <div className="pointer-events-none absolute inset-3 rounded-xl border border-white/[0.03]" />

                <div className="relative flex flex-col items-center px-5 py-10 sm:px-8">
                  <div className="mb-8 text-center">
                    <div className="mb-3 flex items-center justify-center gap-3">
                      <span className="h-px w-10 bg-gradient-to-r from-transparent to-red-500/50" />

                      <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-red-400">
                        Card Obtained
                      </span>

                      <span className="h-px w-10 bg-gradient-to-l from-transparent to-purple-500/50" />
                    </div>

                    <h3 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                      {obtainedCard.name || "Unknown Character"}
                    </h3>

                    <p className="mt-2 text-[9px] uppercase tracking-[0.3em] text-purple-400">
                      {obtainedCard.anime || "Unknown Anime"}
                    </p>
                  </div>

                  <div className="animate-[obtainedCard_0.8s_ease-out]">
                    <AnimeCard card={obtainedCard} />
                  </div>

                  <div className="mt-8 flex items-center gap-3 rounded-full border border-purple-500/20 bg-black/50 px-5 py-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-green-500/30 text-[10px] text-green-400">
                      ✓
                    </span>

                    <span className="text-[8px] font-bold uppercase tracking-[0.25em] text-gray-500">
                      Added to your collection
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* MY CARDS */}

          <section className="pb-14">
            <div className="w-full overflow-hidden rounded-t-2xl border-t border-purple-500/10 bg-gradient-to-b from-[#0A0713] to-[#050509]">
              <CardCollection cards={cards} />
            </div>
          </section>
        </div>
      </div>

      <style>{`
        @keyframes obtainedCard {
          0% {
            opacity: 0;
            transform: scale(0.82) rotateY(20deg);
            filter: blur(8px);
          }

          60% {
            opacity: 1;
            transform: scale(1.03) rotateY(-4deg);
            filter: blur(0);
          }

          100% {
            opacity: 1;
            transform: scale(1) rotateY(0deg);
            filter: blur(0);
          }
        }
      `}</style>
    </div>
  );
};

export default MyCardCollection;
