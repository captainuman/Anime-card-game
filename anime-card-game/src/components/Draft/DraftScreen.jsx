import PositionSelector from "./PositionSelector";
import TeamPositions from "./TeamPositions";
import AnimeCard from "../AnimeCard";
import { positions } from "../../data/positions";

function DraftScreen({
  player,
  currentCard,
  currentTeam,
  drawnCount = 0,
  onDraw,
  onSelectPosition,
  revealed = false,
  setRevealed,
}) {
  const MAX_CARDS = positions.length;

  const safeDrawnCount = Math.max(
    0,
    Math.min(
      Number(drawnCount) || 0,
      MAX_CARDS,
    ),
  );

  const draftComplete =
    safeDrawnCount >= MAX_CARDS;

  const waitingForReveal =
    Boolean(currentCard) && !revealed;

  const waitingForPosition =
    Boolean(currentCard) && revealed;

  const teamSize = Object.keys(
    currentTeam || {},
  ).length;

  const handleDraw = () => {
    if (draftComplete || currentCard) {
      return;
    }

    if (typeof onDraw === "function") {
      onDraw();
    }
  };

  const handleCardFlip = (isFlipped) => {
    if (typeof setRevealed === "function") {
      setRevealed(Boolean(isFlipped));
    }
  };

  const handlePositionSelect = (position) => {
    if (!currentCard || !revealed) {
      return;
    }

    if (typeof onSelectPosition === "function") {
      onSelectPosition(position);
    }
  };

  return (
    <div className="relative w-full overflow-hidden  px-2 pb-6 text-white sm:px-3 md:px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full  blur-[150px]" />

        <div className="absolute right-[-160px] top-[15%] h-[450px] w-[450px] rounded-full bg-pink-600/10 blur-[140px]" />

        <div className="absolute bottom-[-180px] left-1/3 h-[420px] w-[420px] rounded-full bg-blue-600/10 blur-[140px]" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />
      </div>

      <div className="relative w-full rounded-3xl border border-purple-400/15 bg-[#20182b]/90 p-3 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:p-4 lg:p-5">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-pink-400 shadow-[0_0_12px_rgba(244,114,182,0.7)]" />

              <span className="text-[10px] font-black uppercase tracking-[0.28em] text-pink-300 sm:text-xs">
                {player}
              </span>
            </div>

            <h2 className="text-2xl font-black leading-none tracking-tight text-white sm:text-3xl lg:text-4xl">
              BUILD YOUR TEAM
            </h2>

            <p className="mt-2 text-xs font-medium text-gray-400">
              Draw <span className="text-blue-400">→</span>{" "}
              Reveal{" "}
              <span className="text-pink-400">→</span>{" "}
              Assign
            </p>
          </div>

          <div className="w-full rounded-2xl border border-gray-700/80 bg-[#292433] p-4 lg:w-[285px]">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-400">
                Draft Progress
              </span>

              <span className="text-sm font-black text-blue-400">
                {safeDrawnCount}
                <span className="text-gray-500">
                  /{MAX_CARDS}
                </span>
              </span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500"
                style={{
                  width: `${
                    (safeDrawnCount /
                      MAX_CARDS) *
                    100
                  }%`,
                }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span className="text-[8px] font-bold uppercase tracking-wider text-gray-500">
                Cards selected
              </span>

              <span className="text-[8px] font-black uppercase tracking-wider text-pink-300/60">
                {teamSize}/{MAX_CARDS} assigned
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-gray-700/80 bg-[#292433] p-4 shadow-lg">
            <div className="mb-4 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-blue-400">
                Current Card
              </p>

              <h3 className="mt-1 text-base font-black text-white">
                {currentCard
                  ? "YOUR DRAW"
                  : "READY"}
              </h3>
            </div>

            {currentCard ? (
              <>
                <div className="flex justify-center">
                  <AnimeCard
                    key={currentCard.id}
                    card={currentCard}
                    onFlip={handleCardFlip}
                  />
                </div>

                <div className="mt-4 rounded-xl border border-gray-700 bg-[#211c29] px-4 py-3 text-center">
                  {waitingForReveal && (
                    <p className="animate-pulse text-[10px] font-black uppercase tracking-[0.16em] text-blue-400">
                      Click card to reveal
                    </p>
                  )}

                  {waitingForPosition && (
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-pink-400">
                      Card revealed
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="mx-auto flex aspect-[7.5/10] w-[210px] items-center justify-center rounded-2xl border border-dashed border-gray-600 bg-[#211c29]">
                  <div className="px-5 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-600 bg-[#30293a] text-[9px] font-black uppercase tracking-widest text-gray-500">
                      CARD
                    </div>

                    <p className="mt-4 text-[9px] font-black uppercase tracking-[0.18em] text-gray-500">
                      {draftComplete
                        ? "DRAFT COMPLETE"
                        : "DRAW A CARD"}
                    </p>
                  </div>
                </div>

                {!draftComplete && (
                  <button
                    type="button"
                    onClick={handleDraw}
                    className="mx-auto mt-4 block w-[210px] rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3 text-xs font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-blue-950/30 transition hover:-translate-y-0.5 hover:from-blue-500 hover:to-cyan-400 active:scale-[0.98]"
                  >
                    DRAW CARD
                  </button>
                )}
              </>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-700/80 bg-[#292433] p-4 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-pink-400">
                  Team Formation
                </p>

                <h3 className="mt-1 text-lg font-black text-white sm:text-xl">
                  SELECT POSITION
                </h3>
              </div>

              <div className="rounded-lg border border-gray-700 bg-[#211c29] px-3 py-2">
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-500">
                  Assigned
                </p>

                <p className="mt-0.5 text-sm font-black text-pink-400">
                  {teamSize}/{MAX_CARDS}
                </p>
              </div>
            </div>

            <div className="mt-5 min-h-[300px]">
              {waitingForPosition ? (
                <div className="w-full">
                  <PositionSelector
                    currentTeam={currentTeam}
                    onSelectPosition={
                      handlePositionSelect
                    }
                  />
                </div>
              ) : (
                <div className="flex min-h-[280px] w-full items-center justify-center rounded-2xl border border-dashed border-gray-700 bg-[#211c29]">
                  <div className="max-w-sm px-5 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-600 bg-[#30293a] text-[9px] font-black uppercase tracking-widest text-gray-500">
                      SLOT
                    </div>

                    <h4 className="mt-4 text-base font-black text-gray-400">
                      SELECT A POSITION
                    </h4>

                    <p className="mt-2 text-xs leading-6 text-gray-500">
                      Draw and reveal a card to unlock the
                      position selector.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-gray-700/70 pt-5">
          <TeamPositions
            player={player}
            currentTeam={currentTeam}
          />
        </div>
      </div>
    </div>
  );
}

export default DraftScreen;