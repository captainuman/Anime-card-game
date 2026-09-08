import { useEffect, useRef, useState } from "react";
import AnimeCard from "./AnimeCard";

function CardReveal({ card, onReveal }) {
  const [flipping, setFlipping] = useState(false);
  const [flipCount, setFlipCount] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const flipIntervalRef = useRef(null);
  const revealTimeoutRef = useRef(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (flipIntervalRef.current) {
        clearInterval(flipIntervalRef.current);
        flipIntervalRef.current = null;
      }

      if (revealTimeoutRef.current) {
        clearTimeout(revealTimeoutRef.current);
        revealTimeoutRef.current = null;
      }
    };
  }, []);

  if (!card) return null;

  const handleReveal = () => {
    if (!mountedRef.current || flipping || revealed) return;

    if (flipIntervalRef.current) {
      clearInterval(flipIntervalRef.current);
      flipIntervalRef.current = null;
    }

    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }

    setFlipping(true);
    setFlipCount(0);

    let count = 0;

    flipIntervalRef.current = setInterval(() => {
      if (!mountedRef.current) {
        clearInterval(flipIntervalRef.current);
        flipIntervalRef.current = null;
        return;
      }

      count += 1;
      setFlipCount(count);

      if (count >= 10) {
        clearInterval(flipIntervalRef.current);
        flipIntervalRef.current = null;

        revealTimeoutRef.current = setTimeout(() => {
          revealTimeoutRef.current = null;

          if (!mountedRef.current) return;

          setFlipping(false);
          setRevealed(true);
          onReveal?.();
        }, 350);
      }
    }, 350);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="text-center mb-5">
        <p className="text-[10px] text-cyan-400 uppercase tracking-[0.35em] font-bold mb-2">
          Card Drawn
        </p>

        <h1 className="text-4xl md:text-5xl font-black">
          {card.name}
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          {card.anime}
        </p>
      </div>

      <div
        className="relative w-[340px] h-[600px]"
        style={{
          perspective: "1200px",
        }}
      >
        {!revealed ? (
          <div
            className={`
              absolute
              inset-0
              rounded-2xl
              border-2
              border-yellow-500
              bg-gradient-to-br
              from-gray-950
              via-gray-900
              to-black
              flex
              items-center
              justify-center
              transition-transform
              duration-300
              ${flipping ? "animate-card-flip" : ""}
            `}
            aria-live={flipping ? "polite" : "off"}
          >
            <div
              className="
                absolute
                inset-3
                rounded-xl
                border
                border-yellow-500/30
              "
            />

            <div className="text-center relative z-10">
              <div
                className="text-8xl mb-6"
                aria-hidden="true"
              >
                🎴
              </div>

              <h2 className="text-3xl font-black tracking-[0.3em]">
                ANIME
              </h2>

              <h3 className="text-xl font-bold text-yellow-400 tracking-[0.4em] mt-2">
                BATTLE
              </h3>

              {flipping && (
                <div className="mt-10">
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest">
                    Revealing
                  </p>

                  <p
                    className="text-3xl font-black text-yellow-400 mt-1"
                    aria-label={`Card reveal ${flipCount} of 10`}
                  >
                    {flipCount}
                    <span
                      className="text-gray-600 text-lg"
                      aria-hidden="true"
                    >
                      {" "}
                      / 10
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            className="
              absolute
              inset-0
              flex
              items-center
              justify-center
              animate-[cardReveal_0.7s_ease-out]
            "
          >
            <AnimeCard card={card} />
          </div>
        )}
      </div>

      {!flipping && !revealed && (
        <button
          onClick={handleReveal}
          aria-label={`Reveal ${card.name || "anime"} card`}
          className="
            mt-6
            px-8
            py-3
            rounded-xl
            bg-yellow-500
            hover:bg-yellow-400
            text-black
            font-black
            tracking-wider
            shadow-[0_0_25px_rgba(234,179,8,0.25)]
            transition-all
            duration-300
            hover:scale-105
            active:scale-95
          "
        >
          🎴 REVEAL CARD
        </button>
      )}

      {flipping && (
        <p
          className="
            mt-6
            text-yellow-400
            font-bold
            animate-pulse
          "
          aria-live="polite"
        >
          ⚡ REVEALING CARD...
        </p>
      )}

      {revealed && (
        <div
          className="
            mt-6
            px-6
            py-2
            rounded-full
            bg-cyan-500/10
            border
            border-cyan-500/30
          "
          role="status"
          aria-live="polite"
        >
          <p className="text-cyan-400 text-xs font-black tracking-widest">
            ✓ CARD REVEALED
          </p>
        </div>
      )}
    </div>
  );
}

export default CardReveal;
