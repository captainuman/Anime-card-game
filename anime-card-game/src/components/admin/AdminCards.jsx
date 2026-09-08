import { useEffect, useState } from "react";
import { getCards, deleteCard } from "../../api/cardApi";
import { useNavigate } from "react-router-dom";
import AnimeCard from "../AnimeCard";

function AdminCards() {
  const navigate = useNavigate();

  const [cards, setCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    loadCards();
  }, []);

  useEffect(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      setFilteredCards(cards);
      return;
    }

    const filtered = cards.filter((card) => {
      return (
        String(card?.name || "")
          .toLowerCase()
          .includes(query) ||
        String(card?.anime || "")
          .toLowerCase()
          .includes(query) ||
        String(card?.id || "")
          .toLowerCase()
          .includes(query)
      );
    });

    setFilteredCards(filtered);
  }, [search, cards]);

  const loadCards = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getCards();

      const data = Array.isArray(response)
        ? response
        : Array.isArray(response?.cards)
          ? response.cards
          : [];

      setCards(data);
      setFilteredCards(data);
    } catch (loadError) {
      console.error("Load cards error:", loadError);
      setError(loadError.message || "Failed to load cards.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (card) => {
    if (!card?.id) {
      setError("Unable to delete card: missing card ID.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${card.name || "this card"}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(card.id);
      setError("");

      await deleteCard(card.id);

      setCards((previous) => previous.filter((item) => item.id !== card.id));
    } catch (deleteError) {
      console.error("Delete card error:", deleteError);

      setError(deleteError.message || "Failed to delete card.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-700/10 blur-[130px]" />
        <div className="absolute right-[-160px] top-1/4 h-[450px] w-[450px] rounded-full bg-purple-700/10 blur-[150px]" />
        <div className="absolute bottom-[-180px] left-1/3 h-[420px] w-[420px] rounded-full bg-red-700/5 blur-[140px]" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-blue-500">
              Admin Panel / Card Database
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              EDIT CARDS
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Select a card to open the card editor or remove it from the master
              database.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/admin/manage")}
            className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-white/10 bg-[#080808] px-6 py-3.5 text-sm font-black tracking-[0.15em] text-gray-300 transition-all duration-300 hover:-translate-x-1 hover:border-blue-500/60 hover:bg-[#101010] hover:text-white hover:shadow-[0_0_30px_rgba(59,130,246,0.12)] md:w-auto"
          >
            <span className="absolute left-0 top-0 h-full w-[3px] bg-blue-500 transition-all duration-300 group-hover:w-1" />

            <span className="text-lg text-blue-400 transition-transform duration-300 group-hover:-translate-x-1">
              ←
            </span>

            <span>MANAGE</span>
          </button>
        </header>

        {error && (
          <div className="mb-8 rounded-2xl border border-red-500/30 bg-red-950/20 p-5 text-red-400">
            <p className="text-[10px] font-black uppercase tracking-[0.25em]">
              Error
            </p>

            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}

        <section className="mb-10 rounded-3xl border border-white/10 bg-[#080808] p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <label htmlFor="admin-card-search" className="sr-only">
                Search cards
              </label>

              <input
                id="admin-card-search"
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by card ID, character or anime..."
                className="w-full rounded-xl border border-white/10 bg-black px-4 py-3.5 text-sm text-white placeholder:text-gray-700 outline-none transition focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-start">
              <div className="rounded-xl border border-white/5 bg-black px-4 py-3 text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">
                  Total
                </p>

                <p className="mt-1 text-lg font-black text-white">
                  {cards.length}
                </p>
              </div>

              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">
                  Showing
                </p>

                <p className="mt-1 text-lg font-black text-blue-400">
                  {filteredCards.length}
                </p>
              </div>

              <button
                type="button"
                onClick={loadCards}
                disabled={loading}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3.5 text-sm font-black tracking-wide text-gray-300 transition hover:border-blue-500/50 hover:bg-blue-500/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "LOADING" : "REFRESH"}
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-white/10 bg-[#080808]">
            <div className="text-center">
              <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-blue-500" />

              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">
                Loading Cards
              </p>
            </div>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-[#080808] px-6 py-20 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">
              Card Database
            </p>

            <h2 className="mt-3 text-xl font-black text-gray-300">
              {search ? "NO CARDS FOUND" : "NO CARDS AVAILABLE"}
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              {search
                ? "Try another character, anime, or card ID."
                : "There are currently no cards in the database."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCards.map((card) => (
              <div
                key={card.id}
                className="group relative rounded-3xl border border-white/10 bg-[#070707] p-4 transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-[0_0_40px_rgba(59,130,246,0.08)]"
              >
                <div className="mb-4 flex items-center justify-between px-1">
                  <span className="max-w-[70%] truncate text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">
                    {card.anime || "Unknown Anime"}
                  </span>

                  <span className="text-[9px] font-bold text-gray-700">
                    {card.id || "NO ID"}
                  </span>
                </div>

                <div className="flex justify-center overflow-hidden rounded-2xl bg-black/70 p-2">
                  <AnimeCard card={card} small />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-white/5 bg-black px-3 py-2.5">
                    <p className="text-[9px] font-black uppercase tracking-wider text-gray-600">
                      HP
                    </p>

                    <p className="mt-1 text-sm font-black text-green-400">
                      {card.hp ?? 1}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-black px-3 py-2.5">
                    <p className="text-[9px] font-black uppercase tracking-wider text-gray-600">
                      Power
                    </p>

                    <p className="mt-1 text-sm font-black text-purple-400">
                      {card.overallPower ?? 1}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/edit-card/${card.id}`)}
                    aria-label={`Edit ${card.name || "card"}`}
                    className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-xs font-black tracking-[0.12em] text-white transition hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-950/30"
                  >
                    EDIT CARD
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(card)}
                    disabled={deletingId === card.id}
                    aria-label={`Delete ${card.name || "card"}`}
                    className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-xs font-black tracking-[0.12em] text-red-400 transition hover:border-red-500/50 hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {deletingId === card.id ? "..." : "DELETE"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredCards.length > 0 && (
          <div className="mt-10 flex items-center justify-center">
            <div className="rounded-full border border-white/5 bg-[#080808] px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600">
              Showing {filteredCards.length} of {cards.length} cards
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminCards;
