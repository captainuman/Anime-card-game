import { useEffect, useState } from "react";
import {
  getRankedTeam,
  saveRankedTeam,
} from "../../api/rankedTeamApi";
import { getCardCollection } from "../../api/profileApi";
import { positions } from "../../data/positions";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const BACKEND_URL = API_BASE_URL.replace(/\/api\/?$/, "");

function getImageUrl(image) {
  if (!image) {
    return "";
  }

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  return `${BACKEND_URL}${image.startsWith("/") ? image : `/${image}`}`;
}

function MyRankedTeam() {
  const [collection, setCollection] = useState([]);
  const [team, setTeam] = useState(
    Array(positions.length).fill(null),
  );

  const [activePosition, setActivePosition] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadTeam();
  }, []);

  async function loadTeam() {
    try {
      setLoading(true);
      setError("");

      const [collectionData, teamData] = await Promise.all([
        getCardCollection(),
        getRankedTeam(),
      ]);

      const cards = Array.isArray(collectionData?.cards)
        ? collectionData.cards
        : [];

      const teamIds = Array.isArray(
        teamData?.rankedTeam?.cardIds,
      )
        ? teamData.rankedTeam.cardIds
        : [];

      const loadedTeam = Array(positions.length).fill(null);

      teamIds
        .slice(0, positions.length)
        .forEach((cardId, index) => {
          const card = cards.find(
            (item) =>
              String(item.cardId) === String(cardId),
          );

          if (card) {
            loadedTeam[index] = card.cardId;
          }
        });

      setCollection(cards);
      setTeam(loadedTeam);
    } catch (err) {
      console.error(
        "Failed to load ranked team:",
        err,
      );

      setError(
        err.message || "Failed to load ranked team.",
      );
    } finally {
      setLoading(false);
    }
  }

  function selectCard(cardId) {
    setError("");
    setSuccess("");

    const card = collection.find(
      (item) => String(item.cardId) === String(cardId),
    );

    if (!card) {
      setError("Selected card could not be found.");
      return;
    }

    if (Number(card.hp) <= 0) {
      setError(
        `${card.name || "This card"} has no HP remaining and cannot be used in ranked mode.`,
      );
      return;
    }

    const alreadyUsedIndex = team.findIndex(
      (id) => String(id) === String(cardId),
    );

    if (
      alreadyUsedIndex !== -1 &&
      alreadyUsedIndex !== activePosition
    ) {
      setError(
        "This card is already assigned to another position.",
      );

      return;
    }

    setTeam((previous) => {
      const updated = [...previous];

      updated[activePosition] = card.cardId;

      return updated;
    });

    if (activePosition < positions.length - 1) {
      setActivePosition(
        (previous) => previous + 1,
      );
    }
  }

  function removeCard(positionIndex) {
    setError("");
    setSuccess("");

    setTeam((previous) => {
      const updated = [...previous];

      updated[positionIndex] = null;

      return updated;
    });

    setActivePosition(positionIndex);
  }

  function clearTeam() {
    setTeam(Array(positions.length).fill(null));
    setActivePosition(0);
    setError("");
    setSuccess("");
  }

  async function handleSave() {
    setError("");
    setSuccess("");

    const missingPosition = team.findIndex(
      (cardId) => !cardId,
    );

    if (missingPosition !== -1) {
      setError(
        `Assign a card to ${positions[missingPosition].name} before saving.`,
      );

      setActivePosition(missingPosition);

      return;
    }

    const uniqueCards = new Set(
      team.map((cardId) => String(cardId)),
    );

    if (uniqueCards.size !== positions.length) {
      setError(
        "Each position must have a different card.",
      );

      return;
    }

    const invalidCard = team.find((cardId) => {
      const card = getCard(cardId);
      return !card || Number(card.hp) <= 0;
    });

    if (invalidCard) {
      setError(
        "Every ranked team card must have HP greater than 0.",
      );

      return;
    }

    try {
      setSaving(true);

      await saveRankedTeam(team);

      setSuccess(
        "Ranked lineup saved successfully.",
      );
    } catch (err) {
      console.error(
        "Failed to save ranked team:",
        err,
      );

      setError(
        err.message || "Failed to save ranked team.",
      );
    } finally {
      setSaving(false);
    }
  }

  function getCard(cardId) {
    return collection.find(
      (item) =>
        String(item.cardId) === String(cardId),
    );
  }

  const assignedCount = team.filter(Boolean).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl animate-pulse">
            ⚔️
          </div>

          <h2 className="text-2xl font-black mt-5">
            LOADING RANKED TEAM...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-xs text-red-400 font-black tracking-[0.3em] uppercase">
            RANKED MODE
          </p>

          <h1 className="text-4xl sm:text-5xl font-black mt-2">
            ⚔️ RANKED TEAM
          </h1>

          <p className="text-sm text-gray-500 mt-3">
            Assign one card to every battle position.
          </p>
        </div>

        <section className="rounded-3xl bg-gray-900 border border-gray-800 p-5 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <p className="text-[9px] text-red-400 font-black tracking-widest uppercase">
                BATTLE LINEUP
              </p>

              <h2 className="text-xl font-black mt-1">
                YOUR {positions.length} POSITIONS
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`px-4 py-2 rounded-xl border text-sm font-black ${
                  assignedCount === positions.length
                    ? "bg-green-950/30 border-green-500/30 text-green-400"
                    : "bg-gray-950 border-gray-800 text-gray-400"
                }`}
              >
                {assignedCount}/{positions.length} READY
              </div>

              <button
                type="button"
                onClick={clearTeam}
                className="px-4 py-2 rounded-xl bg-gray-950 border border-gray-800 hover:border-red-500/40 text-xs font-black text-gray-400 hover:text-red-400 transition"
              >
                CLEAR
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-3">
            {positions.map((position, index) => {
              const card = getCard(team[index]);
              const active = activePosition === index;

              return (
                <div
                  key={position.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActivePosition(index)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" ||
                      event.key === " "
                    ) {
                      event.preventDefault();
                      setActivePosition(index);
                    }
                  }}
                  className={`relative rounded-2xl overflow-hidden border transition text-left cursor-pointer ${
                    active
                      ? "border-red-500 ring-2 ring-red-500/20"
                      : card
                        ? "border-green-500/30"
                        : "border-gray-800 hover:border-gray-600"
                  }`}
                >
                  <div className="bg-gray-950 px-2 py-3 text-center">
                    <div className="text-2xl">
                      {position.icon}
                    </div>

                    <p className="text-[9px] font-black uppercase mt-1 truncate">
                      {position.name}
                    </p>

                    <p className="text-[8px] text-gray-600 mt-1">
                      #{index + 1}
                    </p>
                  </div>

                  {card ? (
                    <div className="relative">
                      {card.image ? (
                        <img
                          src={getImageUrl(card.image)}
                          alt={card.name}
                          className="w-full aspect-[3/4] object-cover"
                        />
                      ) : (
                        <div
                          className="w-full aspect-[3/4] flex items-center justify-center text-4xl"
                          role="img"
                          aria-label={`${card.name || "Anime character"} image unavailable`}
                        >
                          🎴
                        </div>
                      )}

                      <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2">
                        <p className="text-[10px] font-black truncate">
                          {card.name}
                        </p>

                        <p className="text-[8px] text-green-400 font-bold mt-1">
                          POWER{" "}
                          {card.overallPower ?? "-"}
                        </p>
                      </div>

                      <button
                        type="button"
                        aria-label={`Remove ${card.name || "card"} from ${position.name}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          removeCard(index);
                        }}
                        onKeyDown={(event) => {
                          event.stopPropagation();
                        }}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-xs font-black"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="w-full aspect-[3/4] flex flex-col items-center justify-center bg-gray-950">
                      <div className="text-4xl opacity-30">
                        🎴
                      </div>

                      <p className="text-[8px] text-gray-600 font-black uppercase mt-2 text-center px-1">
                        SELECT CARD
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl bg-gray-950 border border-gray-800 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-[9px] text-cyan-400 font-black tracking-widest uppercase">
                  CURRENT POSITION
                </p>

                <h3 className="text-lg font-black mt-1">
                  {positions[activePosition].icon}{" "}
                  {positions[activePosition].name}
                </h3>
              </div>

              <div className="text-xs text-gray-500">
                Select a card below for this position.
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-950/20 border border-red-500/20 p-3 text-center">
              <p className="text-sm text-red-400 font-bold">
                {error}
              </p>
            </div>
          )}

          {success && (
            <div className="mt-4 rounded-xl bg-green-950/20 border border-green-500/20 p-3 text-center">
              <p className="text-sm text-green-400 font-bold">
                {success}
              </p>
            </div>
          )}

          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={handleSave}
              disabled={
                saving ||
                assignedCount !== positions.length
              }
              className={`px-8 py-4 rounded-xl text-sm font-black transition ${
                saving ||
                assignedCount !== positions.length
                  ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-500 text-white"
              }`}
            >
              {saving
                ? "💾 SAVING..."
                : assignedCount === positions.length
                  ? "💾 SAVE RANKED LINEUP"
                  : `ASSIGN ${
                      positions.length -
                      assignedCount
                    } MORE`}
            </button>
          </div>
        </section>

        <section className="rounded-3xl bg-gray-900 border border-gray-800 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[9px] text-cyan-400 font-black tracking-widest uppercase">
                COLLECTION
              </p>

              <h2 className="text-xl font-black mt-1">
                SELECT CARD FOR{" "}
                {positions[activePosition].icon}{" "}
                {positions[activePosition].name}
              </h2>
            </div>

            <span className="px-3 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-xs text-gray-500 font-black">
              {collection.length} CARDS
            </span>
          </div>

          {collection.length === 0 ? (
            <div className="rounded-2xl bg-gray-950 border border-gray-800 p-12 text-center">
              <div className="text-5xl">🎴</div>

              <h3 className="text-xl font-black mt-4">
                NO CARDS
              </h3>

              <p className="text-sm text-gray-500 mt-2">
                Collect cards before creating a ranked
                team.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {collection.map((card) => {
                const selectedIndex = team.findIndex(
                  (id) =>
                    String(id) ===
                    String(card.cardId),
                );

                const selected =
                  selectedIndex !== -1;

                const selectedForCurrentPosition =
                  String(team[activePosition]) ===
                  String(card.cardId);

                const unavailable =
                  Number(card.hp) <= 0;

                return (
                  <button
                    key={card.cardId}
                    type="button"
                    onClick={() =>
                      selectCard(card.cardId)
                    }
                    disabled={unavailable}
                    className={`text-left rounded-2xl overflow-hidden bg-gray-950 border transition ${
                      selectedForCurrentPosition
                        ? "border-green-500 ring-2 ring-green-500/20"
                        : selected
                          ? "border-yellow-500/40"
                          : unavailable
                            ? "border-gray-900 opacity-50 cursor-not-allowed"
                            : "border-gray-800 hover:border-gray-600"
                    }`}
                  >
                    <div className="relative">
                      {card.image ? (
                        <img
                          src={getImageUrl(card.image)}
                          alt={card.name}
                          className="w-full aspect-[3/4] object-cover"
                        />
                      ) : (
                        <div
                          className="w-full aspect-[3/4] flex items-center justify-center text-5xl"
                          role="img"
                          aria-label={`${card.name || "Anime character"} image unavailable`}
                        >
                          🎴
                        </div>
                      )}

                      {selected && (
                        <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-black/80 text-[8px] font-black">
                          {positions[selectedIndex].icon}{" "}
                          {positions[selectedIndex].name}
                        </div>
                      )}

                      {selectedForCurrentPosition && (
                        <div className="absolute inset-0 bg-green-950/30 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-xl font-black">
                            ✓
                          </div>
                        </div>
                      )}

                      {unavailable && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="rounded-lg bg-red-950/90 border border-red-500/30 px-3 py-2 text-[9px] font-black text-red-400">
                            NO HP
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-3">
                      <p className="text-sm font-black truncate">
                        {card.name}
                      </p>

                      <p className="text-[9px] text-gray-500 truncate mt-1">
                        {card.anime}
                      </p>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-[8px] text-gray-600 font-black">
                          HP
                        </span>

                        <span
                          className={`text-xs font-black ${
                            unavailable
                              ? "text-red-400"
                              : "text-green-400"
                          }`}
                        >
                          {Number(card.hp) || 0}/100
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default MyRankedTeam;