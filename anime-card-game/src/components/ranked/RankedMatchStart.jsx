import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getRankedTeam } from "../../api/rankedTeamApi";
import AnimeCard from "../AnimeCard";
import { positions } from "../../data/positions";

const TEAM_SIZE = 10;

function RankedMatchStart() {
  const navigate = useNavigate();

  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadRankedTeam();
  }, []);

  async function loadRankedTeam() {
    try {
      setLoading(true);
      setError("");

      const data = await getRankedTeam();

      const cardIds = Array.isArray(
        data?.cardIds,
      )
        ? data.cardIds.map((cardId) =>
            String(cardId),
          )
        : [];

      const cards = Array.isArray(
        data?.cards,
      )
        ? data.cards
        : [];

      if (
        data?.isComplete !== true ||
        cardIds.length !== TEAM_SIZE ||
        new Set(cardIds).size !== TEAM_SIZE ||
        cards.length !== TEAM_SIZE
      ) {
        setTeam([]);

        setError(
          "Your ranked team is incomplete. Please select exactly 10 unique cards.",
        );

        return;
      }

      const validCards = cards.filter(
        (card) =>
          Number(card?.hp ?? 0) > 0,
      );

      if (
        validCards.length !== TEAM_SIZE
      ) {
        setTeam([]);

        setError(
          "One or more ranked team cards have no HP remaining. Please rebuild your ranked team.",
        );

        return;
      }

      setTeam(cards);
    } catch (err) {
      console.error(
        "Ranked match team error:",
        err,
      );

      setTeam([]);

      setError(
        err.message ||
          "Failed to load your ranked team.",
      );
    } finally {
      setLoading(false);
    }
  }

  function startBattle() {
    if (team.length !== TEAM_SIZE) {
      setError(
        "You need exactly 10 cards to start a ranked match.",
      );

      return;
    }

    navigate("/ranked-match/battle");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0715] text-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-gray-800 border-t-purple-500" />

          <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-gray-500">
            Loading ranked team
          </p>

          <p className="mt-2 text-[10px] text-gray-700">
            Checking your saved cards
          </p>
        </div>
      </div>
    );
  }

  const teamReady =
    team.length === TEAM_SIZE &&
    !error;

  return (
    <div className="min-h-screen bg-[#0d0715] px-3 py-6 text-white sm:px-5 lg:px-8">
      <div className="mx-auto max-w-6xl">

        <header className="mb-7 flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-purple-400">
              Ranked Mode
            </p>

            <h1 className="mt-1 text-2xl font-black sm:text-3xl">
              Your Ranked Team
            </h1>

            <p className="mt-2 max-w-lg text-xs leading-5 text-gray-600">
              Review your saved lineup before
              entering ranked matchmaking.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/ranked-team")
            }
            className="shrink-0 rounded-lg border border-gray-800 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 transition hover:border-purple-500/30 hover:text-white"
          >
            Edit Team
          </button>
        </header>

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-950/20 px-4 py-3">
            <p className="text-xs font-bold text-red-400">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/ranked-team")
              }
              className="mt-3 rounded-lg border border-red-500/20 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-red-400 transition hover:bg-red-500/10"
            >
              Rebuild Team
            </button>
          </div>
        )}

        {teamReady ? (
          <>
            <section className="mb-5 rounded-2xl border border-gray-800 bg-[#120b1a] p-4 sm:p-5">

              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-400">
                    Saved Lineup
                  </p>

                  <h2 className="mt-1 text-xl font-black">
                    10 / 10 Cards
                  </h2>

                  <p className="mt-1 text-xs text-gray-600">
                    Your ranked team is ready.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-green-500/20 bg-green-500/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-green-400">
                    Ready
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {team.map(
                  (card, index) => {
                    const position =
                      positions[index];

                    return (
                      <div
                        key={
                          card.cardId ||
                          card.id ||
                          `ranked-card-${index}`
                        }
                        className={`rounded-xl border bg-black/20 p-3 ${
                          index % 2 === 0
                            ? "border-blue-500/10"
                            : "border-red-500/10"
                        }`}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-600 text-[9px] font-black">
                              {index + 1}
                            </span>

                            <div>
                              <p className="text-[8px] font-black uppercase tracking-widest text-gray-600">
                                Position
                              </p>

                              <p className="text-xs font-black text-purple-300">
                                {position?.name ||
                                  "Position"}
                              </p>
                            </div>
                          </div>

                          <span className="text-[8px] font-black uppercase tracking-widest text-gray-700">
                            HP {Number(
                              card.hp ?? 0,
                            )}
                          </span>
                        </div>

                        <div className="flex justify-center">
                          <AnimeCard
                            card={card}
                            small
                          />
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-purple-500/15 bg-[#120b1a] p-5 text-center">

              <p className="text-[8px] font-black uppercase tracking-[0.25em] text-purple-400">
                Ranked Matchmaking
              </p>

              <h2 className="mt-2 text-xl font-black">
                Find Your Opponent
              </h2>

              <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-gray-600">
                Your saved team will be used for
                the match. Make sure your lineup
                is exactly how you want it.
              </p>

              <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/ranked-team",
                    )
                  }
                  className="rounded-lg border border-gray-700 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 transition hover:border-purple-500/30 hover:text-white"
                >
                  Edit Team
                </button>

                <button
                  type="button"
                  onClick={startBattle}
                  className="rounded-lg bg-blue-600 px-8 py-3 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-blue-500"
                >
                  Find Ranked Opponent
                </button>
              </div>
            </section>
          </>
        ) : (
          !error && (
            <div className="rounded-2xl border border-gray-800 bg-[#120b1a] px-5 py-16 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-purple-400">
                Ranked Mode
              </p>

              <h2 className="mt-2 text-xl font-black">
                No Ranked Team
              </h2>

              <p className="mt-2 text-xs text-gray-600">
                Build your 10-card ranked team
                before entering matchmaking.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate("/ranked-team")
                }
                className="mt-6 rounded-lg bg-purple-600 px-6 py-3 text-[10px] font-black uppercase tracking-widest transition hover:bg-purple-500"
              >
                Build Ranked Team
              </button>
            </div>
          )
        )}

        <div className="mt-5 text-center">
          <p className="text-[9px] text-gray-700">
            Ranked matches use your saved 10-card lineup.
          </p>
        </div>

      </div>
    </div>
  );
}

export default RankedMatchStart;