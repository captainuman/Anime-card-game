import { useNavigate } from "react-router-dom";
import Navbar from "../Navbar";

function Manage() {
  const navigate = useNavigate();

  const actions = [
    {
      title: "ADD CARD",
      subtitle: "CREATE CHARACTER",
      description:
        "Create a new anime character card and add it directly to the master card database.",
      label: "ADD",
      route: "/admin/add-card",
      accent: "purple",
      number: "01",
    },
    {
      title: "EDIT CARDS",
      subtitle: "MODIFY DATABASE",
      description:
        "Select an existing character card to update its information, ratings, stats, or remove it.",
      label: "EDIT",
      route: "/admin/cards/edit",
      accent: "blue",
      number: "02",
    },
    {
      title: "BULK ADD",
      subtitle: "IMPORT CHARACTERS",
      description:
        "Add multiple anime character cards to the database in a single operation.",
      label: "BULK",
      route: "/admin/bulk-add",
      accent: "green",
      number: "03",
    },
  ];

  const accentStyles = {
    purple: {
      border: "hover:border-purple-500/70",
      icon: "bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20",
      text: "text-purple-400",
      glow:
        "group-hover:shadow-[0_0_40px_rgba(168,85,247,0.12)]",
    },
    blue: {
      border: "hover:border-blue-500/70",
      icon: "bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20",
      text: "text-blue-400",
      glow:
        "group-hover:shadow-[0_0_40px_rgba(59,130,246,0.12)]",
    },
    green: {
      border: "hover:border-emerald-500/70",
      icon:
        "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20",
      text: "text-emerald-400",
      glow:
        "group-hover:shadow-[0_0_40px_rgba(16,185,129,0.12)]",
    },
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#5C1911] px-4 pb-16 pt-10 text-white sm:px-6 lg:px-10">
      <Navbar />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-purple-700/10 blur-[120px]" />
        <div className="absolute right-[-120px] top-1/4 h-[420px] w-[420px] rounded-full bg-blue-700/10 blur-[140px]" />
        <div className="absolute bottom-[-180px] left-1/3 h-[420px] w-[420px] rounded-full bg-red-700/5 blur-[140px]" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-14">
          <div className="mt-5 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-2xl font-black tracking-[-0.04em] sm:text-2xl lg:text-2xl">
                CARD
                <span className="text-purple-500"> CONTROL</span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-500 sm:text-base">
                Manage the master anime card database. Create new cards,
                modify existing characters, or import multiple cards at once.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {actions.map((action) => {
            const style = accentStyles[action.accent];

            return (
              <button
                key={action.route}
                type="button"
                onClick={() => navigate(action.route)}
                aria-label={`${action.title}: ${action.description}`}
                className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-[#201E1F] p-7 text-left transition-all duration-500 hover:-translate-y-2 ${style.border} ${style.glow}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.025] via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />

                <div className="relative">
                  <div className="mb-10 flex items-start justify-between">
                    <div
                      className={`flex h-16 min-w-16 items-center justify-center rounded-2xl border border-white/10 px-4 text-sm font-black tracking-[0.15em] transition-all duration-300 ${style.icon}`}
                      aria-hidden="true"
                    >
                      {action.label}
                    </div>

                    <span className="text-xs font-black tracking-[0.25em] text-gray-700 transition-colors group-hover:text-gray-500">
                      {action.number}
                    </span>
                  </div>

                  <p
                    className={`text-[10px] font-black tracking-[0.3em] ${style.text}`}
                  >
                    {action.subtitle}
                  </p>

                  <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
                    {action.title}
                  </h2>

                  <p className="mt-4 min-h-[84px] text-sm leading-7 text-gray-500">
                    {action.description}
                  </p>

                  <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-600 transition-colors group-hover:text-gray-400">
                      Open Module
                    </span>

                    <span
                      className={`text-sm font-black uppercase tracking-[0.15em] transition duration-300 group-hover:translate-x-1 ${style.text}`}
                      aria-hidden="true"
                    >
                      Open
                    </span>
                  </div>

                  <div className="absolute bottom-0 left-0 h-px w-0 bg-gradient-to-r from-transparent to-transparent transition-all duration-500 group-hover:w-full" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Manage;