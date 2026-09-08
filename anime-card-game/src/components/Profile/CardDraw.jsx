import { useEffect, useRef, useState } from "react";
import { drawCard } from "../../api/profileApi";
import AnimeCard from "../AnimeCard";

function CardDraw({ availableDraws = 0, onCardDrawn }) {
  const [drawing, setDrawing] = useState(false);
  const [error, setError] = useState("");
  const [drawnCard, setDrawnCard] = useState(null);
  const [revealStep, setRevealStep] = useState(0);

  const timersRef = useRef([]);

  const clearTimers = () => {
    timersRef.current.forEach((timer) => {
      clearTimeout(timer);
    });

    timersRef.current = [];
  };

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  const getApiData = (response) => {
    if (!response) {
      return null;
    }

    if (response?.data?.card) {
      return response.data;
    }

    if (response?.card) {
      return response;
    }

    return null;
  };

  const handleDraw = async () => {
    if (drawing || Number(availableDraws) <= 0) {
      return;
    }

    clearTimers();

    setDrawing(true);
    setError("");
    setDrawnCard(null);
    setRevealStep(0);

    try {
      const response = await drawCard();
      const data = getApiData(response);
      const card = data?.card || null;

      if (!card) {
        throw new Error(
          data?.message || response?.message || "No card was returned.",
        );
      }

      setDrawnCard(card);
      setRevealStep(1);

      timersRef.current.push(
        setTimeout(() => {
          setRevealStep(2);
        }, 3000),
      );

      timersRef.current.push(
        setTimeout(() => {
          setRevealStep(3);
        }, 6000),
      );

      timersRef.current.push(
        setTimeout(() => {
          setRevealStep(4);
        }, 9000),
      );

      timersRef.current.push(
        setTimeout(() => {
          setDrawing(false);
          setRevealStep(5);

          onCardDrawn?.({
            ...data,
            card,
          });
        }, 12000),
      );
    } catch (err) {
      setDrawing(false);
      setRevealStep(0);
      setDrawnCard(null);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to draw a card.",
      );
    }
  };

  const resetReveal = () => {
    clearTimers();

    setDrawing(false);
    setDrawnCard(null);
    setRevealStep(0);
    setError("");
  };

  const getPositionName = (position) => {
    if (!position) {
      return "UNKNOWN";
    }

    return String(position)
      .replace(/-/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const canDraw = !drawing && Number(availableDraws) > 0;

  return (
    <section className="w-full">
      <div className="mb-8 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-red-500">
          Card Draw
        </p>

        <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
          DRAW YOUR CARD
        </h2>

        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="text-xs text-gray-600">Available draws</span>

          <span className="text-xs font-black text-purple-400">
            {Number(availableDraws)}
          </span>
        </div>
      </div>

      {!drawnCard && !drawing && (
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={handleDraw}
            disabled={!canDraw}
            className={`
              group
              relative
              min-w-[220px]
              overflow-hidden
              rounded-xl
              border
              px-8
              py-4
              text-[10px]
              font-bold
              uppercase
              tracking-[0.25em]
              transition-all
              duration-300
              ${
                canDraw
                  ? "border-red-500/60 bg-black text-red-400 hover:-translate-y-0.5 hover:border-purple-500 hover:text-purple-300 hover:shadow-[0_0_35px_rgba(168,85,247,0.2)]"
                  : "cursor-not-allowed border-gray-900 bg-black text-gray-700"
              }
            `}
          >
            <span className="relative z-10">
              {Number(availableDraws) > 0 ? "DRAW CARD" : "NO DRAWS AVAILABLE"}
            </span>

            {canDraw && (
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-red-500/10 to-purple-500/20 transition-transform duration-700 group-hover:translate-x-full" />
            )}
          </button>

          {error && (
            <p className="mt-4 text-center text-xs text-red-400">{error}</p>
          )}
        </div>
      )}

      {drawing && drawnCard && (
        <div className="flex flex-col items-center">
          <div className="relative aspect-[7.5/10] w-[280px] [perspective:1500px]">
            <div className="absolute inset-0 overflow-hidden rounded-2xl border border-purple-500/40 bg-black text-white shadow-[0_0_60px_rgba(168,85,247,0.18)]">
              <div className="absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-red-600 via-purple-600 to-red-500" />

              <div className="absolute left-0 top-0 h-24 w-24 bg-red-600/10 blur-3xl" />

              <div className="absolute bottom-0 right-0 h-28 w-28 bg-purple-600/10 blur-3xl" />

              <div className="absolute inset-0 flex items-center justify-center">
                {revealStep === 1 && (
                  <div
                    key="anime"
                    className="animate-[revealText_0.8s_ease-out] px-6 text-center"
                  >
                    <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-red-500/40 bg-red-500/5">
                      <span className="text-lg text-red-400">◈</span>
                    </div>

                    <p className="mb-4 text-[8px] uppercase tracking-[0.4em] text-red-400">
                      ANIME
                    </p>

                    <h3 className="text-2xl font-black uppercase tracking-tight text-white">
                      {drawnCard.anime || "UNKNOWN ANIME"}
                    </h3>

                    <div className="mx-auto mt-5 h-px w-16 bg-gradient-to-r from-red-500 to-purple-500" />
                  </div>
                )}

                {revealStep === 2 && (
                  <div
                    key="position"
                    className="animate-[revealText_0.8s_ease-out] px-6 text-center"
                  >
                    <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-purple-500/40 bg-purple-500/5">
                      <span className="text-lg text-purple-400">⚔</span>
                    </div>

                    <p className="mb-4 text-[8px] uppercase tracking-[0.4em] text-purple-400">
                      POSITION
                    </p>

                    <h3 className="text-2xl font-black uppercase tracking-tight text-white">
                      {getPositionName(drawnCard.position)}
                    </h3>

                    <div className="mx-auto mt-5 h-px w-16 bg-gradient-to-r from-purple-500 to-red-500" />
                  </div>
                )}

                {revealStep === 3 && (
                  <div
                    key="affiliation"
                    className="animate-[revealText_0.8s_ease-out] px-6 text-center"
                  >
                    <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-red-500/40 bg-red-500/5">
                      <span className="text-lg text-red-400">✦</span>
                    </div>

                    <p className="mb-4 text-[8px] uppercase tracking-[0.4em] text-red-400">
                      AFFILIATION
                    </p>

                    <h3 className="text-2xl font-black uppercase leading-tight tracking-tight text-white">
                      {drawnCard.affiliation || "UNKNOWN AFFILIATION"}
                    </h3>

                    <div className="mx-auto mt-5 h-px w-16 bg-gradient-to-r from-red-500 to-purple-500" />
                  </div>
                )}

                {revealStep >= 4 && (
                  <div
                    key="final"
                    className="animate-[finalReveal_1s_ease-out] px-5 text-center"
                  >
                    <div className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-purple-500/50 bg-black shadow-[0_0_45px_rgba(168,85,247,0.2)]">
                      <div className="absolute inset-2 rounded-full border border-red-500/20" />

                      <span className="text-5xl">🎴</span>
                    </div>

                    <p className="mt-7 text-[8px] uppercase tracking-[0.4em] text-purple-400">
                      CARD READY
                    </p>

                    <p className="mt-2 text-[9px] tracking-[0.2em] text-gray-700">
                      REVEALING...
                    </p>
                  </div>
                )}
              </div>

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-red-950/10 via-transparent to-purple-950/10" />

              <div className="absolute left-3 top-3 h-5 w-5 border-l border-t border-red-500/50" />

              <div className="absolute right-3 top-3 h-5 w-5 border-r border-t border-purple-500/50" />

              <div className="absolute bottom-3 left-3 h-5 w-5 border-b border-l border-purple-500/50" />

              <div className="absolute bottom-3 right-3 h-5 w-5 border-b border-r border-red-500/50" />

              <div className="absolute left-0 top-1/2 h-16 w-1 -translate-y-1/2 bg-gradient-to-b from-transparent via-red-500/40 to-transparent" />

              <div className="absolute right-0 top-1/2 h-16 w-1 -translate-y-1/2 bg-gradient-to-b from-transparent via-purple-500/40 to-transparent" />
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-[8px] uppercase tracking-[0.3em] text-gray-700">
              {revealStep === 1 && "IDENTIFYING ANIME"}

              {revealStep === 2 && "IDENTIFYING POSITION"}

              {revealStep === 3 && "IDENTIFYING AFFILIATION"}

              {revealStep >= 4 && "CARD REVEAL"}
            </p>
          </div>
        </div>
      )}

      {!drawing && drawnCard && (
        <div className="flex flex-col items-center">
          <div className="mb-7 text-center">
            <p className="text-[9px] uppercase tracking-[0.4em] text-red-500">
              CARD OBTAINED
            </p>

            <h3 className="mt-2 text-2xl font-black tracking-tight text-white">
              {drawnCard.name || "Unknown Character"}
            </h3>

            <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-purple-400">
              {drawnCard.anime || "Unknown Anime"}
            </p>
          </div>

          <div className="animate-[cardReveal_0.8s_ease-out]">
            <AnimeCard card={drawnCard} />
          </div>

          <div className="mt-7 rounded-xl border border-purple-500/20 bg-black px-6 py-3 text-center shadow-[0_0_25px_rgba(168,85,247,0.06)]">
            <p className="text-[8px] uppercase tracking-[0.25em] text-purple-400">
              ✓ Card added to your collection
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleDraw}
              disabled={Number(availableDraws) <= 0}
              className="
                rounded-lg
                border
                border-purple-500/40
                bg-black
                px-6
                py-3
                text-[9px]
                font-bold
                uppercase
                tracking-[0.2em]
                text-purple-400
                transition-all
                duration-300
                hover:border-red-500/60
                hover:text-red-400
                hover:shadow-[0_0_25px_rgba(239,68,68,0.12)]
                disabled:cursor-not-allowed
                disabled:border-gray-800
                disabled:text-gray-700
              "
            >
              NEXT DRAW
            </button>
          </div>

          {error && (
            <p className="mt-4 text-center text-xs text-red-400">{error}</p>
          )}
        </div>
      )}

      <style>{`
        @keyframes revealText {
          0% {
            opacity: 0;
            transform: scale(0.7);
            filter: blur(14px);
          }

          55% {
            opacity: 1;
            transform: scale(1.08);
            filter: blur(0);
          }

          100% {
            opacity: 1;
            transform: scale(1);
            filter: blur(0);
          }
        }

        @keyframes finalReveal {
          0% {
            opacity: 0;
            transform: scale(0.5) rotate(-5deg);
            filter: blur(12px);
          }

          60% {
            opacity: 1;
            transform: scale(1.08) rotate(2deg);
            filter: blur(0);
          }

          100% {
            opacity: 1;
            transform: scale(1) rotate(0);
            filter: blur(0);
          }
        }

        @keyframes cardReveal {
          0% {
            opacity: 0;
            transform: scale(0.75) rotateY(90deg);
          }

          60% {
            opacity: 1;
            transform: scale(1.04) rotateY(-8deg);
          }

          100% {
            opacity: 1;
            transform: scale(1) rotateY(0deg);
          }
        }
      `}</style>
    </section>
  );
}

export default CardDraw;
