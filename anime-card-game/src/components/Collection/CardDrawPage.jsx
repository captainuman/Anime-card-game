import { useCallback, useEffect, useMemo, useState } from "react";
import CardDraw from "../../components/Profile/CardDraw";
import { getCardCollection } from "../../api/profileApi";
import { getRankedTeam } from "../../api/rankedTeamApi";
import { positions } from "../../data/positions";
import AnimeCard from "../AnimeCard";
import Navbar from "../Navbar";

function CardDrawPage() {
  const [availableDraws, setAvailableDraws] = useState(0);
  const [collection, setCollection] = useState([]);
  const [rankedTeamIds, setRankedTeamIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [collectionData, rankedTeamData] = await Promise.all([
        getCardCollection(),
        getRankedTeam(),
      ]);

      const ownedCards = Array.isArray(collectionData?.cards)
        ? collectionData.cards
        : [];

      const savedIds = Array.isArray(rankedTeamData?.cardIds)
        ? rankedTeamData.cardIds
        : [];

      setAvailableDraws(
        Number(collectionData?.stats?.availableDraws) || 0,
      );

      setCollection(ownedCards);

      setRankedTeamIds(
        savedIds.map((cardId) => String(cardId)),
      );
    } catch (err) {
      console.error("Failed to load card draw data:", err);

      setError(
        err?.message || "Failed to load card draw data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const rankedTeamCards = useMemo(() => {
    if (
      rankedTeamIds.length === 0 ||
      collection.length === 0
    ) {
      return [];
    }

    const cardMap = new Map(
      collection.map((card) => [
        String(card.cardId || card.id),
        card,
      ]),
    );

    return rankedTeamIds
      .map((cardId) => cardMap.get(String(cardId)))
      .filter(Boolean);
  }, [rankedTeamIds, collection]);

  const rankedTeamByPosition = useMemo(() => {
    return positions.map((position, index) => ({
      ...position,
      card: rankedTeamCards[index] || null,
    }));
  }, [rankedTeamCards]);

  const handleCardDrawn = async (data) => {
    setAvailableDraws(
      Number(data?.remainingDraws) || 0,
    );

    await loadData();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#acb9bf]">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-700">
          Loading Draw System
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#acb9bf] px-5">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.25em] text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={loadData}
            className="mt-5 rounded-full border border-gray-600/40 px-5 py-2 text-[9px] uppercase tracking-[0.2em] text-gray-800 transition-all hover:bg-black/10"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#acb9bf] text-white">
      <Navbar/> 
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-15%] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-white/20 blur-[140px]" />

        <div className="absolute left-[-15%] top-[30%] h-[400px] w-[400px] rounded-full bg-[#b1bdc3]/30 blur-[120px]" />

        <div className="absolute bottom-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-[#f4f6f6]/25 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 pb-32 pt-8 sm:px-8 md:pb-16 md:pt-4">
        <section className="relative overflow-hidden rounded-[28px] border border-[#c5a96a]/15 bg-gradient-to-br from-[#0b0710] via-[#090909] to-[#0b0714] shadow-[0_0_60px_rgba(0,0,0,0.65)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.08),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.06),transparent_40%)]" />

          <div className="relative p-6 sm:p-10">
            <CardDraw
              availableDraws={availableDraws}
              onCardDrawn={handleCardDrawn}
            />
          </div>
        </section>

        <section className="relative mt-8 overflow-hidden rounded-[28px] border border-blue-500/15 bg-[#D8CAC1] p-5 sm:p-7">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-600/[0.05] via-transparent to-purple-500/[0.04]" />

          <div className="relative">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-400">
                  COMPETITIVE LOADOUT
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  MY RANKED TEAM
                </h2>

                <p className="mt-2 max-w-2xl text-xs leading-6 text-gray-600">
                  Your saved ranked lineup and the position assigned to
                  every character.
                </p>
              </div>

              <div
                className={`rounded-lg border px-3 py-1.5 text-[9px] font-black uppercase tracking-widest ${
                  rankedTeamCards.length === 10
                    ? "border-green-500/20 bg-green-500/5 text-green-400"
                    : "border-yellow-500/20 bg-yellow-500/5 text-yellow-400"
                }`}
              >
                {rankedTeamCards.length} / 10
              </div>
            </div>

            {rankedTeamCards.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/40 px-6 py-12 text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-700">
                  NO SAVED RANKED TEAM
                </p>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-600">
                  Create and save your 10-card ranked team to see the
                  assigned positions here.
                </p>
              </div>
            ) : (
              <div className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rankedTeamByPosition.map((position) => (
                  <RankedPositionCard
                    key={position.id}
                    position={position}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function RankedPositionCard({ position }) {
  const card = position.card;

  if (!card) {
    return (
      <div className="min-w-0">
        <div className="mb-2 text-center">
          <p className="truncate text-[8px] font-black uppercase tracking-[0.15em] text-gray-700">
            {position.name}
          </p>
        </div>

        <div className="flex aspect-[3/4] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/50">
          <span className="text-[10px] font-black text-gray-800">
            EMPTY
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="group min-w-0">
      <div className="mb-2 text-center">
        <p className="truncate text-[8px] font-black uppercase tracking-[0.12em] text-blue-400">
          {position.name}
        </p>

        <p className="mt-0.5 text-[8px] text-gray-700">
          POSITION
        </p>
      </div>

      <div className="flex justify-center overflow-hidden rounded-2xl border border-white/5 bg-black/60 p-1 transition-all duration-300 group-hover:border-blue-500/30 group-hover:shadow-[0_0_25px_rgba(59,130,246,0.08)]">
        <AnimeCard card={card} small />
      </div>
    </div>
  );
}

export default CardDrawPage;