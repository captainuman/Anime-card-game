import { arenas } from "../data/arenas";

function ArenaSelection({ onSelect }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-15%] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-purple-700/10 blur-[150px]" />

        <div className="absolute bottom-[-15%] left-[-10%] h-[450px] w-[450px] rounded-full bg-blue-700/10 blur-[140px]" />

        <div className="absolute right-[-10%] top-[30%] h-[400px] w-[400px] rounded-full bg-red-700/5 blur-[140px]" />

        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <header className="mb-12 text-center">
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-5xl lg:text-6xl">
            SELECT
            <span className="text-yellow-400"> ARENA</span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-gray-600 sm:text-base">
            Choose the battlefield where your anime card battle will take place.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {arenas.map((arena, index) => (
            <button
              key={arena.id}
              type="button"
              onClick={() => onSelect(arena)}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#080808] text-left transition-all duration-500 hover:-translate-y-2 hover:border-yellow-400/50 hover:shadow-[0_20px_60px_rgba(234,179,8,0.10)]"
            >
              <div className="relative h-64 overflow-hidden bg-gray-950">
                <img
                  src={arena.image}
                  alt={arena.name}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                <div className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/70 text-[10px] font-black text-gray-400 backdrop-blur-sm">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/70 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-gray-300 backdrop-blur-sm">
                  AVAILABLE
                </div>

                <div className="absolute bottom-5 left-5 right-5">
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-yellow-400">
                    Battlefield
                  </p>

                  <h2 className="mt-1 text-2xl font-black tracking-tight text-white">
                    {arena.name}
                  </h2>
                </div>
              </div>

              <div className="p-5">
                <p className="min-h-[72px] text-sm leading-6 text-gray-500">
                  {arena.description}
                </p>

                <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-5">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-700 transition-colors group-hover:text-gray-400">
                    Enter Battlefield
                  </span>

                  <span className="text-xs font-black uppercase tracking-[0.18em] text-yellow-400 transition-transform duration-300 group-hover:translate-x-1">
                    Select
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-800">
            Choose carefully
          </p>

          <p className="mt-2 text-[9px] text-gray-700">
            Your selected arena determines the available anime card pool.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ArenaSelection;
