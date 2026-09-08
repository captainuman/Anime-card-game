import { useState } from "react";
import { createCardsBulk } from "../../api/cardApi";
import { cards } from "../../data/cards";

function BulkAddCards() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleBulkAdd = async () => {
    if (loading) {
      return;
    }

    if (!Array.isArray(cards) || cards.length === 0) {
      setMessage("No cards are available for bulk upload.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      console.log("Cards being uploaded:", cards);

      const response = await createCardsBulk(cards);

      console.log("Bulk upload success:", response);

      setMessage(
        `${response?.count ?? cards.length} cards added successfully!`,
      );
    } catch (error) {
      console.error("Bulk add error:", error);

      setMessage(error.message || "Bulk upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const isSuccess = message.includes("successfully");

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-green-700/10 blur-[130px]" />
        <div className="absolute right-[-160px] top-1/4 h-[450px] w-[450px] rounded-full bg-blue-700/10 blur-[150px]" />
        <div className="absolute bottom-[-180px] left-1/3 h-[420px] w-[420px] rounded-full bg-purple-700/10 blur-[150px]" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-green-400">
              Admin Panel / Import
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              BULK ADD CARDS
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500">
              Import your prepared anime character card dataset into the master
              database in one operation.
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-white/10 bg-[#080808] px-6 py-3.5 text-sm font-black tracking-[0.15em] text-gray-300 transition-all duration-300 hover:-translate-x-1 hover:border-green-500/60 hover:bg-[#101010] hover:text-white hover:shadow-[0_0_30px_rgba(34,197,94,0.12)] sm:w-auto"
          >
            <span className="absolute left-0 top-0 h-full w-[3px] bg-green-500 transition-all duration-300 group-hover:w-1" />

            <span className="text-lg text-green-400 transition-transform duration-300 group-hover:-translate-x-1">
              ←
            </span>

            <span>BACK</span>
          </button>
        </header>

        {message && (
          <div
            className={`mb-8 rounded-2xl border p-5 ${
              isSuccess
                ? "border-green-500/30 bg-green-950/20 text-green-400"
                : "border-red-500/30 bg-red-950/20 text-red-400"
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-black ${
                  isSuccess
                    ? "border-green-500/20 bg-green-500/10"
                    : "border-red-500/20 bg-red-500/10"
                }`}
              >
                {isSuccess ? "OK" : "!"}
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em]">
                  {isSuccess ? "Import Complete" : "Import Error"}
                </p>

                <p className="mt-1 text-sm leading-6 opacity-80">{message}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#080808] p-7 sm:p-9">
            <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-green-500/5 blur-[100px]" />

            <div className="relative">
              <div className="mb-8 flex items-start justify-between gap-5">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-600">
                    Dataset Ready
                  </p>

                  <h2 className="mt-2 text-2xl font-black">CHARACTER IMPORT</h2>

                  <p className="mt-2 max-w-lg text-sm leading-6 text-gray-500">
                    The cards below are loaded from your local card dataset and
                    will be sent to the bulk creation endpoint.
                  </p>
                </div>

                <div className="hidden rounded-2xl border border-green-500/20 bg-green-500/5 px-5 py-3 text-center sm:block">
                  <p className="text-2xl font-black text-green-400">
                    {cards.length}
                  </p>

                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-600">
                    Cards
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <InfoItem label="Source" value="Local Card Dataset" />

                <InfoItem label="Operation" value="Bulk Create" />

                <InfoItem
                  label="Available"
                  value={`${cards.length} characters`}
                />

                <InfoItem
                  label="Status"
                  value={loading ? "Uploading" : "Ready"}
                />
              </div>

              <div className="mt-8 rounded-2xl border border-white/5 bg-black/60 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-600">
                      Import Summary
                    </p>

                    <p className="mt-2 text-sm font-bold text-gray-300">
                      {cards.length} character cards are ready.
                    </p>
                  </div>

                  <div className="rounded-full border border-white/10 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-gray-500">
                    JSON Dataset
                  </div>
                </div>

                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-gray-900">
                  <div className="h-full w-full rounded-full bg-gradient-to-r from-green-500 via-emerald-400 to-blue-500" />
                </div>
              </div>
            </div>
          </section>

          <aside className="rounded-3xl border border-white/10 bg-[#080808] p-6 lg:sticky lg:top-8 lg:self-start">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-green-400">
              Bulk Operation
            </p>

            <h2 className="mt-2 text-xl font-black">IMPORT DATABASE</h2>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              This will send the complete card dataset to the backend bulk
              creation endpoint.
            </p>

            <div className="my-6 border-t border-white/5" />

            <div className="flex items-end justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Cards Ready
              </span>

              <span className="text-3xl font-black text-white">
                {cards.length}
              </span>
            </div>

            <button
              type="button"
              onClick={handleBulkAdd}
              disabled={loading || cards.length === 0}
              className="mt-7 w-full rounded-2xl bg-gradient-to-r from-emerald-700 to-green-500 px-6 py-4 text-sm font-black tracking-[0.08em] text-white shadow-xl shadow-green-950/30 transition-all duration-300 hover:-translate-y-0.5 hover:from-emerald-600 hover:to-green-400 hover:shadow-green-950/50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            >
              {loading
                ? "ADDING CHARACTERS..."
                : `ADD ${cards.length} CHARACTERS`}
            </button>

            <p className="mt-4 text-center text-[10px] leading-5 text-gray-700">
              Only use this operation when the local dataset is ready to be
              inserted into the master database.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/50 p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">
        {label}
      </p>

      <p className="mt-2 text-sm font-bold text-gray-300">{value}</p>
    </div>
  );
}

export default BulkAddCards;
