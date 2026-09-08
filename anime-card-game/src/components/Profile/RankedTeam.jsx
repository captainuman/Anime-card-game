import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getCardCollection } from "../../api/profileApi";

import {
  getRankedTeam,
  saveRankedTeam,
  clearRankedTeam,
} from "../../api/rankedTeamApi";

import AnimeCard from "../AnimeCard";
import { positions } from "../../data/positions";
import { getPositionPower } from "../../utils/battleEngine";

const MAX_TEAM_SIZE = 10;

function normalizePower(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 1;
  }

  return Math.max(1, Math.min(100, Math.round(number)));
}

function RankedTeam() {
  const navigate = useNavigate();

  const [collection, setCollection] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const [collectionData, rankedTeamData] = await Promise.all([
        getCardCollection(),
        getRankedTeam(),
      ]);

      const cards = Array.isArray(collectionData?.cards)
        ? collectionData.cards
        : [];

      const existingTeam = Array.isArray(rankedTeamData?.cardIds)
        ? rankedTeamData.cardIds
        : Array.isArray(rankedTeamData?.rankedTeam?.cardIds)
          ? rankedTeamData.rankedTeam.cardIds
          : [];

      setCollection(cards);

      const ownedIds = new Set(
        cards.map((card) => String(card.cardId)).filter(Boolean),
      );

      const validSelectedIds = existingTeam
        .map((id) => String(id))
        .filter(
          (id, index, array) => ownedIds.has(id) && array.indexOf(id) === index,
        )
        .filter((id) => {
          const card = cards.find((item) => String(item.cardId) === id);

          return Number(card?.hp ?? 0) > 0;
        })
        .slice(0, MAX_TEAM_SIZE);

      setSelectedIds(validSelectedIds);
    } catch (err) {
      console.error("Ranked team loading error:", err);

      setError(err.message || "Failed to load ranked team.");
    } finally {
      setLoading(false);
    }
  }

  const selectedCards = useMemo(() => {
    const cardMap = new Map(
      collection.map((card) => [String(card.cardId), card]),
    );

    return selectedIds.map((id) => cardMap.get(String(id))).filter(Boolean);
  }, [collection, selectedIds]);

  function toggleCard(cardId) {
    const id = String(cardId);

    setError("");
    setSuccess("");

    if (selectedIds.includes(id)) {
      setSelectedIds((previous) =>
        previous.filter((selectedId) => selectedId !== id),
      );

      return;
    }

    if (selectedIds.length >= MAX_TEAM_SIZE) {
      setError("Your ranked team can contain exactly 10 unique cards.");

      return;
    }

    const card = collection.find((item) => String(item.cardId) === id);

    if (!card) {
      setError("Selected card is not in your collection.");

      return;
    }

    if (Number(card.hp ?? 0) <= 0) {
      setError(
        "This card has no HP remaining and cannot be used in ranked mode.",
      );

      return;
    }

    setSelectedIds((previous) => {
      if (previous.includes(id) || previous.length >= MAX_TEAM_SIZE) {
        return previous;
      }

      return [...previous, id];
    });
  }

  function handleDragStart(event, cardId) {
    const id = String(cardId);

    setDraggedId(id);
    setDragOverId(null);

    event.dataTransfer.effectAllowed = "move";

    event.dataTransfer.setData("text/plain", id);
  }

  function handleDragOver(event, cardId) {
    event.preventDefault();

    const targetId = String(cardId);

    if (!draggedId || draggedId === targetId) {
      return;
    }

    event.dataTransfer.dropEffect = "move";
    setDragOverId(targetId);
  }

  function handleDrop(event, targetId) {
    event.preventDefault();

    const sourceId = draggedId || event.dataTransfer.getData("text/plain");

    const target = String(targetId);

    if (!sourceId || sourceId === target) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    setSelectedIds((previous) => {
      const sourceIndex = previous.indexOf(sourceId);

      const targetIndex = previous.indexOf(target);

      if (sourceIndex === -1 || targetIndex === -1) {
        return previous;
      }

      const next = [...previous];

      [next[sourceIndex], next[targetIndex]] = [
        next[targetIndex],
        next[sourceIndex],
      ];

      return next;
    });

    setError("");
    setSuccess("");
    setDraggedId(null);
    setDragOverId(null);
  }

  function handleDragEnd() {
    setDraggedId(null);
    setDragOverId(null);
  }

  async function handleSave() {
    setError("");
    setSuccess("");

    if (selectedIds.length !== MAX_TEAM_SIZE) {
      setError(`You must select exactly ${MAX_TEAM_SIZE} cards.`);

      return;
    }

    const uniqueIds = new Set(selectedIds);

    if (uniqueIds.size !== MAX_TEAM_SIZE) {
      setError("Your ranked team must contain 10 unique cards.");

      return;
    }

    try {
      setSaving(true);

      const data = await saveRankedTeam(selectedIds);

      setSuccess(data?.message || "Ranked team saved successfully.");
    } catch (err) {
      console.error("Save ranked team error:", err);

      setError(err.message || "Failed to save ranked team.");
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    if (selectedIds.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to clear your ranked team?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setClearing(true);
      setError("");
      setSuccess("");

      const data = await clearRankedTeam();

      setSelectedIds([]);
      setSuccess(data?.message || "Ranked team cleared successfully.");
    } catch (err) {
      console.error("Clear ranked team error:", err);

      setError(err.message || "Failed to clear ranked team.");
    } finally {
      setClearing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0715] text-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-gray-800 border-t-purple-500" />

          <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-gray-500">
            Loading ranked team
          </p>
        </div>
      </div>
    );
  }

  const isComplete = selectedIds.length === MAX_TEAM_SIZE;

  return (
    <div className="min-h-screen bg-[#0d0715] px-3 py-6 text-white sm:px-5 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-purple-400">
              Ranked Mode
            </p>

            <h1 className="mt-1 text-2xl font-black sm:text-3xl">
              Build Your Ranked Team
            </h1>

            <p className="mt-2 max-w-lg text-xs leading-5 text-gray-600">
              Select 10 unique cards and arrange them into your ranked
              positions.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/game")}
            className="shrink-0 rounded-lg border border-gray-800 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 transition hover:border-purple-500/30 hover:text-white"
          >
            Back
          </button>
        </header>

        <section className="mb-5 rounded-2xl border border-gray-800 bg-[#120b1a] p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-600">
                  Team Size
                </p>

                <p className="mt-1 text-2xl font-black">
                  {selectedIds.length}
                  <span className="text-gray-700"> / {MAX_TEAM_SIZE}</span>
                </p>
              </div>

              <div className="h-10 w-px bg-gray-800" />

              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-600">
                  Status
                </p>

                <span
                  className={`mt-1 inline-block rounded-full border px-3 py-1 text-[8px] font-black uppercase tracking-widest ${
                    isComplete
                      ? "border-green-500/20 bg-green-500/5 text-green-400"
                      : "border-yellow-500/20 bg-yellow-500/5 text-yellow-400"
                  }`}
                >
                  {isComplete ? "Ready" : "Incomplete"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleClear}
                disabled={clearing || saving || selectedIds.length === 0}
                className="rounded-lg border border-gray-800 px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-gray-500 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                {clearing ? "Clearing..." : "Clear"}
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving || clearing || !isComplete}
                className="rounded-lg bg-purple-600 px-5 py-2.5 text-[9px] font-black uppercase tracking-widest transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:bg-gray-800 disabled:text-gray-600"
              >
                {saving ? "Saving..." : "Save Team"}
              </button>

              {isComplete && (
                <button
                  type="button"
                  onClick={() => navigate("/ranked-match/start")}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-[9px] font-black uppercase tracking-widest transition hover:bg-blue-500"
                >
                  Start Ranked
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-gray-900">
            <div
              className={`h-full transition-all duration-300 ${
                isComplete ? "bg-green-500" : "bg-purple-500"
              }`}
              style={{
                width: `${(selectedIds.length / MAX_TEAM_SIZE) * 100}%`,
              }}
            />
          </div>
        </section>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-950/20 px-4 py-3 text-xs font-bold text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-xl border border-green-500/20 bg-green-950/20 px-4 py-3 text-xs font-bold text-green-400">
            {success}
          </div>
        )}

        <section className="mb-5 rounded-2xl border border-gray-800 bg-[#120b1a] p-4 sm:p-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-red-400">
                Ranked Lineup
              </p>

              <h2 className="mt-1 text-lg font-black">Your Team</h2>

              <p className="mt-1 text-xs text-gray-600">
                Drag a card onto another card to swap their positions.
              </p>
            </div>

            <div className="rounded-lg border border-purple-500/10 bg-purple-500/5 px-3 py-2 text-[8px] font-black uppercase tracking-widest text-purple-300">
              Drag to swap
            </div>
          </div>

          {selectedCards.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-800 bg-black/20 py-10 text-center">
              <p className="text-sm font-bold text-gray-600">
                Your ranked team is empty
              </p>

              <p className="mt-1 text-xs text-gray-700">
                Select cards from your collection below.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {selectedCards.map((card, index) => {
                const position = positions[index];

                const positionPower = position
                  ? normalizePower(getPositionPower(card, position.id))
                  : 1;

                const isDragging = draggedId === String(card.cardId);

                const isDragOver = dragOverId === String(card.cardId);

                return (
                  <div
                    key={card.cardId}
                    draggable
                    onDragStart={(event) => handleDragStart(event, card.cardId)}
                    onDragOver={(event) => handleDragOver(event, card.cardId)}
                    onDrop={(event) => handleDrop(event, card.cardId)}
                    onDragEnd={handleDragEnd}
                    className={`cursor-grab rounded-xl border bg-black/20 px-4 py-4 transition-all duration-200 active:cursor-grabbing ${
                      isDragging
                        ? "scale-[0.98] border-purple-500/40 opacity-50"
                        : isDragOver
                          ? "border-blue-500/60 bg-blue-500/5 shadow-[0_0_20px_rgba(59,130,246,0.10)]"
                          : "border-gray-800 hover:border-purple-500/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-600 text-xs font-black">
                        {index + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-black text-white">
                          {card.name || "Unknown"}
                        </h3>

                        <p className="mt-0.5 truncate text-[10px] text-gray-600">
                          {card.anime || "Unknown Anime"}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-[8px] font-black uppercase tracking-widest text-gray-600">
                          Position
                        </p>

                        <p className="mt-1 text-xs font-black text-blue-400">
                          {position?.name || "Position"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-gray-800 pt-3">
                      <span className="text-[8px] font-black uppercase tracking-widest text-gray-600">
                        Position Power
                      </span>

                      <span className="text-sm font-black text-yellow-400">
                        {positionPower}
                        <span className="ml-1 text-[8px] text-gray-600">
                          / 100
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-800 bg-[#120b1a] p-4 sm:p-5">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-400">
                Collection
              </p>

              <h2 className="mt-1 text-lg font-black">
                Select Your Characters
              </h2>

              <p className="mt-1 text-xs text-gray-600">
                Select a card to add it to your ranked team.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-lg border border-gray-800 bg-black/20 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-gray-600">
                {collection.length} Owned
              </span>

              <span className="rounded-lg border border-blue-500/10 bg-blue-500/5 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-blue-400">
                {selectedIds.length} Selected
              </span>
            </div>
          </div>

          {collection.length === 0 ? (
            <div className="rounded-xl border border-gray-800 bg-black/20 py-12 text-center">
              <h3 className="text-lg font-black">No Cards Available</h3>

              <p className="mt-2 text-xs text-gray-600">
                Collect cards before creating a ranked team.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {collection.map((card) => {
                const cardId = String(card.cardId);

                const selected = selectedIds.includes(cardId);

                const hp = Math.max(0, Math.min(100, Number(card.hp ?? 100)));

                const exhausted = hp <= 0;

                const maxReached = selectedIds.length >= MAX_TEAM_SIZE;

                const disabled = exhausted || (!selected && maxReached);

                return (
                  <div
                    key={card.cardId}
                    className={`relative flex justify-center transition ${
                      disabled ? "opacity-40" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleCard(card.cardId)}
                      disabled={disabled}
                      className={`relative rounded-2xl transition ${
                        selected
                          ? "ring-2 ring-red-500 shadow-[0_0_25px_rgba(239,68,68,0.12)]"
                          : !disabled
                            ? "hover:-translate-y-1"
                            : ""
                      }`}
                      aria-label={
                        exhausted
                          ? `${card.name || "Anime card"} is exhausted`
                          : selected
                            ? `Remove ${card.name || "Anime card"} from ranked team`
                            : `Add ${card.name || "Anime card"} to ranked team`
                      }
                    >
                      <AnimeCard card={card} />

                      {selected && (
                        <div className="absolute right-3 top-3 z-20 rounded-md bg-red-600 px-2 py-1 text-[8px] font-black uppercase tracking-wider shadow-lg">
                          Selected
                        </div>
                      )}

                      {exhausted && (
                        <div className="absolute inset-0 z-30 flex items-center justify-center rounded-2xl bg-black/60">
                          <span className="rounded-md bg-red-600 px-3 py-1.5 text-[8px] font-black uppercase tracking-widest">
                            No HP
                          </span>
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="mt-5 text-center">
          <p className="text-[9px] text-gray-700">
            Ranked mode requires exactly 10 unique cards.
          </p>
        </div>
      </div>
    </div>
  );
}

export default RankedTeam;
