import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCardsBulk } from "../../api/cardApi";
import { cards } from "../../data/cards";

function BulkAddCards() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const handleBulkAdd = async () => {
    if (loading) {
      return;
    }

    if (!Array.isArray(cards) || cards.length === 0) {
      setSuccess(false);
      setMessage("No cards are available for bulk upload.");
      return;
    }

    try {
      setLoading(true);
      setSuccess(false);
      setMessage("");

      const response = await createCardsBulk(cards);

      setSuccess(true);
      setMessage(
        `${response?.count ?? cards.length} cards added successfully!`,
      );
    } catch (error) {
      setSuccess(false);
      setMessage(error?.message || "Bulk upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0715] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-purple-400">
              Admin Panel / Import
            </p>

            <h1 className="mt-1 text-2xl font-black sm:text-3xl">
              Bulk Add Cards
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600">
              Import the prepared anime card dataset into the master database.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/admin/manage")}
            className="rounded-lg border border-gray-800 bg-[#15101d] px-5 py-3 text-[9px] font-black uppercase tracking-widest text-gray-400 transition hover:border-purple-500/30 hover:text-white"
          >
            Back
          </button>
        </header>

        {message && (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 ${
              success
                ? "border-green-500/20 bg-green-500/5"
                : "border-red-500/20 bg-red-500/5"
            }`}
          >
            <p
              className={`text-[9px] font-black uppercase tracking-widest ${
                success ? "text-green-400" : "text-red-400"
              }`}
            >
              {success ? "Import Complete" : "Import Error"}
            </p>

            <p className="mt-1 text-sm text-gray-400">
              {message}
            </p>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          <section className="rounded-2xl border border-gray-800 bg-[#15101d] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.25em] text-gray-600">
                  Dataset
                </p>

                <h2 className="mt-1 text-xl font-black">
                  Character Import
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  These cards are loaded from the local card dataset and will
                  be sent to the backend bulk creation endpoint.
                </p>
              </div>

              <div className="shrink-0 rounded-xl border border-purple-500/20 bg-purple-500/5 px-4 py-3 text-center">
                <p className="text-xl font-black text-purple-400">
                  {cards.length}
                </p>

                <p className="text-[8px] font-bold uppercase tracking-widest text-gray-600">
                  Cards
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <InfoItem
                label="Source"
                value="Local Card Dataset"
              />

              <InfoItem
                label="Operation"
                value="Bulk Create"
              />

              <InfoItem
                label="Available"
                value={`${cards.length} characters`}
              />

              <InfoItem
                label="Status"
                value={loading ? "Uploading" : "Ready"}
              />
            </div>

            <div className="mt-5 rounded-xl border border-gray-800 bg-black/20 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-gray-700">
                    Import Summary
                  </p>

                  <p className="mt-1 text-sm font-bold text-gray-400">
                    {cards.length} character cards ready
                  </p>
                </div>

                <span className="rounded-md border border-gray-800 px-2 py-1 text-[8px] font-bold uppercase tracking-widest text-gray-700">
                  JSON Dataset
                </span>
              </div>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-gray-800">
                <div className="h-full w-full rounded-full bg-purple-600" />
              </div>
            </div>
          </section>

          <aside className="rounded-2xl border border-gray-800 bg-[#15101d] p-5 lg:self-start">
            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-purple-400">
              Bulk Operation
            </p>

            <h2 className="mt-1 text-lg font-black">
              Import Database
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Send the complete local card dataset to the backend.
            </p>

            <div className="my-5 border-t border-gray-800" />

            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">
                Cards Ready
              </span>

              <span className="text-2xl font-black text-white">
                {cards.length}
              </span>
            </div>

            <button
              type="button"
              onClick={handleBulkAdd}
              disabled={loading || cards.length === 0}
              className="mt-5 w-full rounded-xl bg-purple-600 px-5 py-3.5 text-[9px] font-black uppercase tracking-widest text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading
                ? "Adding Cards..."
                : `Add ${cards.length} Cards`}
            </button>

            <p className="mt-3 text-center text-[8px] leading-5 text-gray-700">
              Use this only when the local dataset is ready for database
              insertion.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-black/20 p-3.5">
      <p className="text-[8px] font-black uppercase tracking-widest text-gray-700">
        {label}
      </p>

      <p className="mt-1.5 text-sm font-bold text-gray-400">
        {value}
      </p>
    </div>
  );
}

export default BulkAddCards;
