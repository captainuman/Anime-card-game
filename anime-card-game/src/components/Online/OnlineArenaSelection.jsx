import { useState } from "react";

function OnlineArenaSelection({
  mode,
  arenas = [],
  user,
  onSelected,
  onBack,
}) {
  const [error, setError] = useState("");

  const handleSelect = (arena) => {
    if (!arena) {
      setError("Invalid arena selected.");
      return;
    }

    const arenaId =
      arena?.id != null
        ? String(arena.id)
        : "";

    const arenaName = String(
      arena?.name || "",
    ).trim();

    if (!arenaId || !arenaName) {
      setError("Selected arena is invalid.");
      return;
    }

    const normalizedArena = {
      id: arenaId,
      name: arenaName,
      image: arena?.image || "",
    };

    setError("");

    onSelected?.(normalizedArena);
  };

  return (
    <div className="min-h-screen bg-[#0d0715] px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">

        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-purple-400">
              {mode === "random"
                ? "Random Match"
                : "Friend Match"}
            </p>

            <h1 className="mt-2 text-2xl font-black sm:text-3xl">
              Select Arena
            </h1>

            <p className="mt-2 text-xs text-gray-600">
              Choose your battlefield before finding
              an opponent.
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-gray-800 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 transition hover:border-purple-500/30 hover:text-white"
          >
            Back
          </button>
        </div>

        {user && (
          <div className="mb-6 rounded-lg border border-gray-800 bg-black/20 px-4 py-3">
            <span className="text-[9px] uppercase tracking-widest text-gray-600">
              Playing as
            </span>

            <span className="ml-2 text-xs font-bold text-gray-300">
              {user?.username ||
                user?.name ||
                "Player"}
            </span>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-950/20 px-4 py-3 text-center text-xs font-bold text-red-400">
            {error}
          </div>
        )}

        {!Array.isArray(arenas) ||
        arenas.length === 0 ? (
          <div className="rounded-2xl border border-gray-800 bg-black/20 px-6 py-16 text-center">
            <div className="mx-auto h-12 w-12 rounded-full border border-purple-500/20 bg-purple-500/5" />

            <h2 className="mt-5 text-xl font-black">
              No Arenas Available
            </h2>

            <p className="mt-2 text-xs text-gray-600">
              Arena data could not be loaded.
            </p>

            <button
              type="button"
              onClick={onBack}
              className="mt-6 rounded-lg border border-gray-700 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-400 transition hover:border-purple-500/30 hover:text-white"
            >
              Back
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {arenas.map((arena) => {
              const arenaId =
                arena?.id != null
                  ? String(arena.id)
                  : "";

              const arenaName = String(
                arena?.name || "",
              ).trim();

              const isValid =
                Boolean(
                  arenaId &&
                    arenaName,
                );

              return (
                <button
                  key={
                    arenaId ||
                    arenaName
                  }
                  type="button"
                  onClick={() =>
                    handleSelect(arena)
                  }
                  disabled={!isValid}
                  className="group overflow-hidden rounded-2xl border border-gray-800 bg-[#15101d] text-left transition duration-300 hover:-translate-y-1 hover:border-purple-500/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                >
                  <div className="relative h-48 overflow-hidden bg-black sm:h-52">
                    {arena?.image ? (
                      <img
                        src={arena.image}
                        alt={arenaName}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-[#110b18]">
                        <div className="h-16 w-16 rounded-full border border-purple-500/20 bg-purple-500/5" />
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black via-black/60 to-transparent" />

                    <div className="absolute bottom-3 left-4">
                      <span className="text-[8px] font-black uppercase tracking-[0.25em] text-purple-300">
                        Arena
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h2 className="text-lg font-black">
                      {arenaName ||
                        "Unknown Arena"}
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-gray-600">
                      Battle in{" "}
                      {arenaName ||
                        "this arena"}.
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-gray-800 pt-3">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600">
                        Select
                      </span>

                      <span className="text-xs font-black text-purple-400 transition group-hover:text-white">
                        →
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

export default OnlineArenaSelection;