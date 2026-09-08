import { useEffect, useMemo, useState } from "react";
import AnimeCard from "../AnimeCard";
import { getCards } from "../../api/cardApi";
import Navbar from "../Navbar";

function CardCollection({ cards = [], onBack }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [masterCards, setMasterCards] = useState([]);
  const [masterCardsLoading, setMasterCardsLoading] = useState(false);
  const [masterCardsError, setMasterCardsError] = useState("");

  useEffect(() => {
    if (!cards.length) {
      setMasterCards([]);
      setMasterCardsError("");
      return;
    }

    const loadMasterCards = async () => {
      try {
        setMasterCardsLoading(true);
        setMasterCardsError("");

        const data = await getCards();

        setMasterCards(
          Array.isArray(data)
            ? data
            : Array.isArray(data?.cards)
              ? data.cards
              : [],
        );
      } catch (error) {
        console.error("Failed to load master cards:", error);

        setMasterCardsError(
          error.message || "Failed to load card information.",
        );

        setMasterCards([]);
      } finally {
        setMasterCardsLoading(false);
      }
    };

    loadMasterCards();
  }, [cards.length]);

  const normalizePower = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return 1;
    }

    return Math.min(Math.max(Math.round(number), 1), 100);
  };

  const getAveragePower = (values = []) => {
    const numbers = values.map((value) => normalizePower(value));

    if (numbers.length === 0) {
      return 1;
    }

    return Math.round(
      numbers.reduce((sum, value) => sum + value, 0) / numbers.length,
    );
  };

  const getGeneralPower = (card) => {
    if (!card?.general) {
      return 1;
    }

    return getAveragePower(Object.values(card.general));
  };

  const getTotalRolePower = (card) => {
    if (!card?.roles) {
      return 1;
    }

    return getAveragePower(Object.values(card.roles));
  };

  const mergedCards = useMemo(() => {
    if (!cards.length) {
      return [];
    }

    if (!masterCards.length) {
      return cards;
    }

    const masterCardMap = new Map(
      masterCards.map((card) => [String(card.id), card]),
    );

    return cards.map((playerCard) => {
      const masterCard = masterCardMap.get(
        String(playerCard.cardId || playerCard.id),
      );

      if (!masterCard) {
        return playerCard;
      }

      return {
        ...masterCard,
        ...playerCard,
        id: masterCard.id,
        cardId: playerCard.cardId || masterCard.id,
        name: playerCard.name || masterCard.name,
        anime: playerCard.anime || masterCard.anime,
        image: playerCard.image || masterCard.image,
      };
    });
  }, [cards, masterCards]);

  const filteredAndSortedCards = useMemo(() => {
    let result = [...mergedCards];

    const query = search.trim().toLowerCase();

    if (query) {
      result = result.filter((card) => {
        const basicText = [
          card.name,
          card.anime,
          card.affiliation,
          card.position,
          card.gender,
          card.race,
          card.famousDialogue,
          card.id,
          card.cardId,
          card.overallPower,
          card.hp,
          card.rankedGamesUsed,
        ]
          .filter((value) => value !== undefined && value !== null)
          .join(" ")
          .toLowerCase();

        const generalText = card.general
          ? Object.entries(card.general)
              .map(([name, value]) => `${name} ${value}`)
              .join(" ")
              .toLowerCase()
          : "";

        const rolesText = card.roles
          ? Object.entries(card.roles)
              .map(([role, value]) => `${role} ${value}`)
              .join(" ")
              .toLowerCase()
          : "";

        const specialRoleText = card.specialRole
          ? [card.specialRole.name, card.specialRole.power]
              .filter((value) => value !== undefined && value !== null)
              .join(" ")
              .toLowerCase()
          : "";

        const powerCategoriesText = Array.isArray(card.powerCategories)
          ? card.powerCategories
              .map(
                (category) =>
                  `${category?.name || ""} ${category?.power ?? ""}`,
              )
              .join(" ")
              .toLowerCase()
          : "";

        return [
          basicText,
          generalText,
          rolesText,
          specialRoleText,
          powerCategoriesText,
        ]
          .join(" ")
          .includes(query);
      });
    }

    result.sort((a, b) => {
      let valueA;
      let valueB;

      switch (sortBy) {
        case "name":
          valueA = a.name || "";
          valueB = b.name || "";
          break;

        case "anime":
          valueA = a.anime || "";
          valueB = b.anime || "";
          break;

        case "affiliation":
          valueA = a.affiliation || "";
          valueB = b.affiliation || "";
          break;

        case "position":
          valueA = a.position || "";
          valueB = b.position || "";
          break;

        case "race":
          valueA = a.race || "";
          valueB = b.race || "";
          break;

        case "overallPower":
          valueA = normalizePower(a.overallPower);
          valueB = normalizePower(b.overallPower);
          break;

        case "general":
          valueA = getGeneralPower(a);
          valueB = getGeneralPower(b);
          break;

        case "roles":
          valueA = getTotalRolePower(a);
          valueB = getTotalRolePower(b);
          break;

        default:
          valueA = a.name || "";
          valueB = b.name || "";
      }

      const numericSort =
        sortBy === "overallPower" || sortBy === "general" || sortBy === "roles";

      if (numericSort) {
        return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
      }

      return sortOrder === "asc"
        ? String(valueA).localeCompare(String(valueB))
        : String(valueB).localeCompare(String(valueA));
    });

    return result;
  }, [mergedCards, search, sortBy, sortOrder]);

  const getSortLabel = () => {
    switch (sortBy) {
      case "name":
        return "Character Name";

      case "anime":
        return "Anime";

      case "affiliation":
        return "Affiliation";

      case "position":
        return "Position";

      case "race":
        return "Race";

      case "overallPower":
        return "Overall Power";

      case "general":
        return "General Power";

      case "roles":
        return "Total Role Power";

      default:
        return "Character Name";
    }
  };

  return (
    <div className="min-h-screen bg-[#D9DFFD] text-white px-4 sm:px-6 py-6 sm:py-10">
      <Navbar/>
      <div className="max-w-7xl mx-auto">
        {masterCardsLoading && cards.length > 0 && (
          <div className="mb-6 text-center text-[10px] uppercase tracking-[0.2em] text-gray-600">
            Loading card information...
          </div>
        )}

        {masterCardsError && cards.length > 0 && (
          <div className="max-w-2xl mx-auto mb-6 px-4 py-3 rounded-full bg-black border border-[#a88b4a]/30 text-[#c9b57d] text-center text-xs">
            {masterCardsError}
          </div>
        )}

        {cards.length > 0 && (
          <div className="mb-10">
            <div className="relative max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center rounded-2xl sm:rounded-full border border-[#7d6a3f]/70 bg-black overflow-hidden shadow-[0_0_25px_rgba(0,0,0,0.8)]">
                <div className="relative flex-1 min-w-0">
                  <span className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    ⌕
                  </span>

                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search character, anime, affiliation..."
                    className="w-full h-12 sm:h-11 bg-black pl-10 sm:pl-11 pr-10 text-[11px] text-gray-200 placeholder:text-gray-600 outline-none border-none"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="hidden sm:block w-px h-6 bg-[#7d6a3f]/50" />

                <div className="flex items-center border-t border-[#7d6a3f]/30 sm:border-t-0">
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    className="h-11 sm:h-10 w-full sm:w-44 bg-black px-4 text-[9px] tracking-[0.12em] uppercase text-gray-400 outline-none cursor-pointer appearance-none"
                  >
                    <option value="name">Character Name</option>

                    <option value="anime">Anime</option>

                    <option value="affiliation">Affiliation</option>

                    <option value="position">Position</option>

                    <option value="race">Race</option>

                    <option value="overallPower">Overall Power</option>

                    <option value="general">General Power</option>

                    <option value="roles">Total Role Power</option>
                  </select>

                  <button
                    type="button"
                    onClick={() =>
                      setSortOrder((current) =>
                        current === "asc" ? "dsc" : "asc",
                      )
                    }
                    className="h-11 sm:h-10 px-4 sm:px-5 border-l border-[#7d6a3f]/30 text-[9px] tracking-[0.12em] uppercase text-gray-400 hover:text-[#d8c18a] transition-colors whitespace-nowrap"
                    title={
                      sortOrder === "asc"
                        ? "Switch to descending"
                        : "Switch to ascending"
                    }
                  >
                    {sortOrder === "asc" ? "ASC ↑" : "DESC ↓"}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              {search && (
                <span className="px-3 py-1.5 rounded-full border border-[#7d6a3f]/40 bg-black text-[9px] tracking-[0.1em] text-gray-400">
                  SEARCH: <span className="text-[#d0b574]">"{search}"</span>
                </span>
              )}

              <div className="flex flex-wrap items-center justify-center gap-2 mt-3 sm:mb">
                <span className="px-3 py-1.5 rounded-full border border-white/[0.06] bg-black text-[9px] tracking-[0.1em] text-gray-600">
                  SHOWING:{" "}
                  <span className="text-gray-400">
                    {filteredAndSortedCards.length}
                  </span>{" "}
                  OF <span className="text-gray-400">{cards.length}</span> ANIME
                  CARDS
                </span>

                <span className="px-3 py-1.5 rounded-full border border-white/[0.06] bg-black text-[9px] tracking-[0.1em] text-gray-600">
                  SORT: <span className="text-gray-400">{getSortLabel()}</span>
                </span>

                <span className="px-3 py-1.5 rounded-full border border-white/[0.06] bg-black text-[9px] tracking-[0.1em] text-gray-600">
                  {sortOrder === "asc" ? "ASCENDING" : "DESCENDING"}
                </span>
              </div>
            </div>
          </div>
        )}

        {cards.length === 0 ? (
          <div className="text-center mt-20">
            <div className="text-5xl opacity-30">🎴</div>

            <h2 className="text-xl sm:text-2xl font-bold mt-5">
              No Cards Found
            </h2>

            <p className="text-gray-600 text-sm mt-2">
              Add your first character to MongoDB.
            </p>
          </div>
        ) : filteredAndSortedCards.length === 0 ? (
          <div className="text-center mt-20">
            <div className="text-5xl opacity-30">⌕</div>

            <h2 className="text-xl sm:text-2xl font-bold mt-5">
              No Cards Found
            </h2>

            <p className="text-gray-600 text-sm mt-2">
              Try a different search.
            </p>

            <button
              type="button"
              onClick={() => setSearch("")}
              className="mt-5 px-5 py-2 rounded-full border border-[#a88b4a]/50 text-[#d0b574] text-[10px] tracking-[0.15em] uppercase hover:bg-[#a88b4a]/10 transition-colors"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-10 justify-center">
            {filteredAndSortedCards.map((card) => (
              <AnimeCard key={card.cardId || card.id} card={card} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CardCollection;
