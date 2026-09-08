import { useEffect, useState } from "react";
import { getCards } from "../../api/cardApi";
import CardCollection from "./CardCollection";

function AllCardsCollection() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCards = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getCards();

        const data = Array.isArray(response)
          ? response
          : response?.cards || [];

        setCards(data);
      } catch (loadError) {
        console.error(
          "Load all cards error:",
          loadError
        );

        setError(
          loadError.message ||
            "Failed to load the card collection."
        );
      } finally {
        setLoading(false);
      }
    };

    loadCards();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-5">
            🎴
          </div>

          <p className="text-gray-400">
            Loading card collection...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
        <div className="max-w-lg w-full p-6 rounded-2xl bg-red-950/30 border border-red-500/30 text-center">
          <div className="text-5xl mb-4">
            ⚠️
          </div>

          <h2 className="text-xl font-black text-red-400">
            Failed to Load Collection
          </h2>

          <p className="text-gray-400 mt-3">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-5 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 font-bold"
          >
            TRY AGAIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <CardCollection cards={cards} />
  );
}

export default AllCardsCollection;