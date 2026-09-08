import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile } from "../../api/profileApi";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../Navbar";

function ProfilePage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const profileData = await getProfile();

      setProfile(profileData?.user || null);
      setStats(profileData?.stats || null);
    } catch (err) {
      console.error("Profile loading error:", err);

      setError(err.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#16051f] px-4 text-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-pulse rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/10 shadow-[0_0_30px_rgba(217,70,239,0.12)]" />

          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.35em] text-fuchsia-200/60">
            Loading profile
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#16051f] px-4 text-white">
        <div className="w-full max-w-md rounded-3xl border border-fuchsia-400/20 bg-[#1c0926] p-8 text-center shadow-[0_20px_70px_rgba(0,0,0,0.4)]">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-pink-300">
            System Error
          </p>

          <h2 className="mt-2 text-2xl font-black">PROFILE ERROR</h2>

          <p className="mt-3 text-sm leading-6 text-fuchsia-100/45">{error}</p>

          <button
            type="button"
            onClick={loadProfile}
            className="mt-6 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 px-7 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-white transition hover:from-fuchsia-500 hover:to-purple-500"
          >
            TRY AGAIN
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#16051f] text-white">
        <p className="text-sm text-fuchsia-100/45">Profile not found.</p>
      </div>
    );
  }

  const wins = Number(stats?.wins || 0);
  const losses = Number(stats?.losses || 0);
  const draws = Number(stats?.draws || 0);

  const totalMatches = Number(stats?.totalMatches) || wins + losses + draws;

  const winPercentage =
    stats?.winPercentage !== undefined
      ? Number(stats.winPercentage)
      : totalMatches > 0
        ? (wins / totalMatches) * 100
        : 0;

  const rating = Number(stats?.rating || 1000);
  const rank = getRankFromRating(rating);

  const availableDraws = Number(stats?.availableDraws || 0);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#19051f] px-3 pb-12 pt-6 text-white sm:px-5 lg:px-8">
      <Navbar/> 
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-12%] top-[-10%] h-[500px] w-[500px] rounded-full bg-fuchsia-500/20 blur-[150px]" />

        <div className="absolute right-[-12%] top-[10%] h-[550px] w-[550px] rounded-full bg-purple-600/20 blur-[170px]" />

        <div className="absolute bottom-[-18%] left-[25%] h-[500px] w-[500px] rounded-full bg-pink-500/15 blur-[150px]" />

        <div className="absolute left-[45%] top-[40%] h-[280px] w-[280px] rounded-full bg-violet-500/10 blur-[120px]" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
      </div>

      <div className="relative mx-auto w-full max-w-[1500px]">
        <ProfileHeader
          profile={profile}
          rating={rating}
          rank={rank}
          availableDraws={availableDraws}
          onLogout={() => setShowLogout(true)}
        />

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-5">
            <RankedStatistics
              wins={wins}
              losses={losses}
              draws={draws}
              totalMatches={totalMatches}
              winPercentage={winPercentage}
              rating={rating}
              rank={rank}
            />

            <Rewards availableDraws={availableDraws} />
          </div>

          <PlayerSummary
            profile={profile}
            rating={rating}
            rank={rank}
            totalMatches={totalMatches}
          />
        </div>
      </div>

      {showLogout && (
        <LogoutModal
          onCancel={() => setShowLogout(false)}
          onConfirm={handleLogout}
        />
      )}
    </div>
  );
}

function ProfileHeader({ profile, rating, rank, availableDraws, onLogout }) {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-fuchsia-400/20 bg-gradient-to-br from-[#32103e] via-[#210a2d] to-[#15071e] shadow-[0_20px_80px_rgba(76,29,149,0.18)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,114,182,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.18),transparent_40%)]" />

      <div className="absolute right-[-80px] top-[-90px] h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />

      <div className="relative p-5 sm:p-7 lg:p-8">
        <div className="flex flex-col gap-7 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-col items-center gap-5 sm:flex-row">
            <div className="relative shrink-0">
              <div className="h-24 w-24 rounded-[26px] bg-gradient-to-br from-pink-300 via-fuchsia-500 to-purple-700 p-[1px] shadow-[0_0_45px_rgba(217,70,239,0.22)] sm:h-28 sm:w-28">
                <div className="flex h-full w-full items-center justify-center rounded-[25px] bg-[#17071f] text-4xl font-black sm:text-5xl">
                  {profile.username?.charAt(0)?.toUpperCase() || "U"}
                </div>
              </div>

              <div className="absolute -bottom-2 -right-2 rounded-lg border border-pink-300/20 bg-[#17071f] px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-pink-200">
                {rank}
              </div>
            </div>

            <div className="min-w-0 text-center sm:text-left">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-pink-300">
                PLAYER PROFILE
              </p>

              <h1 className="mt-1 truncate text-3xl font-black tracking-tight text-white sm:text-4xl">
                {profile.username || "PLAYER"}
              </h1>

              <p className="mt-2 max-w-[350px] truncate text-xs text-fuchsia-100/40">
                {profile.email || ""}
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                <Tag label={`${rating} RATING`} highlight />

                <Tag label={rank} />

                <Tag label={`${availableDraws} DRAWS`} />
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto xl:flex-col 2xl:flex-row">
            <div className="grid flex-1 grid-cols-3 gap-2">
              <MiniStat label="RATING" value={rating} />

              <MiniStat label="RANK" value={rank} />

              <MiniStat label="DRAWS" value={availableDraws} />
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="h-[54px] rounded-2xl border border-white/10 bg-white/[0.04] px-6 text-[9px] font-black uppercase tracking-[0.2em] text-fuchsia-100/55 transition hover:border-pink-300/30 hover:bg-pink-300/10 hover:text-pink-100"
            >
              LOGOUT
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function RankedStatistics({
  wins,
  losses,
  draws,
  totalMatches,
  winPercentage,
  rating,
  rank,
}) {
  return (
    <section className="rounded-[28px] border border-fuchsia-400/15 bg-[#210a2d] p-5 shadow-[0_15px_50px_rgba(76,29,149,0.12)] sm:p-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-pink-300">
            RANKED ARENA
          </p>

          <h2 className="mt-1 text-xl font-black">BATTLE RECORD</h2>
        </div>

        <div className="flex items-center justify-center gap-5 sm:justify-end">
          <div className="text-right">
            <p className="text-[8px] font-black uppercase tracking-widest text-fuchsia-100/30">
              RATING
            </p>

            <p className="text-xl font-black text-fuchsia-300">{rating}</p>
          </div>

          <div className="h-8 w-px bg-white/10" />

          <div className="text-right">
            <p className="text-[8px] font-black uppercase tracking-widest text-fuchsia-100/30">
              RANK
            </p>

            <p className="text-xl font-black text-pink-300">{rank}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="WINS" value={wins} type="win" />

        <StatCard label="LOSSES" value={losses} type="loss" />

        <StatCard label="DRAWS" value={draws} type="draw" />

        <StatCard label="MATCHES" value={totalMatches} type="normal" />
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[8px] font-black tracking-widest text-fuchsia-100/30">
            WIN RATE
          </span>

          <span className="text-[8px] font-black text-pink-300">
            {winPercentage.toFixed(1)}%
          </span>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-black/40">
          <div
            className="h-full rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 transition-all duration-700"
            style={{
              width: `${Math.min(100, Math.max(0, winPercentage))}%`,
            }}
          />
        </div>
      </div>
    </section>
  );
}

function Rewards({ availableDraws }) {
  return (
    <section className="rounded-[28px] border border-fuchsia-400/15 bg-[#210a2d] p-5 shadow-[0_15px_50px_rgba(76,29,149,0.12)] sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-pink-300">
            REWARDS
          </p>

          <h2 className="mt-1 text-xl font-black">CARD DRAWS</h2>
        </div>

        <div className="rounded-xl border border-fuchsia-400/20 bg-fuchsia-400/10 px-4 py-2 text-center">
          <p className="text-[8px] font-black uppercase tracking-widest text-fuchsia-100/35">
            AVAILABLE
          </p>

          <p className="mt-1 text-2xl font-black text-pink-300">
            {availableDraws}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-pink-300/10 bg-gradient-to-br from-pink-400/10 via-fuchsia-400/5 to-purple-500/10 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-white/90">KEEP PLAYING</p>

            <p className="mt-1 max-w-lg text-xs leading-6 text-fuchsia-100/40">
              Ranked victories contribute toward your card draw rewards. Every
              five ranked wins earns an additional draw.
            </p>
          </div>

          <div className="shrink-0 rounded-xl border border-pink-300/15 bg-[#17071f] px-4 py-3 text-center">
            <p className="text-[8px] font-black uppercase tracking-widest text-fuchsia-100/30">
              REWARD
            </p>

            <p className="mt-1 text-sm font-black text-pink-200">
              +1 DRAW / 5 WINS
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function PlayerSummary({ profile, rating, rank, totalMatches }) {
  const joinedDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <section className="rounded-[28px] border border-fuchsia-400/15 bg-[#210a2d] p-6 shadow-[0_15px_50px_rgba(76,29,149,0.12)]">
      <p className="text-[9px] font-black uppercase tracking-[0.25em] text-pink-300">
        PLAYER
      </p>

      <h2 className="mt-1 text-xl font-black">ACCOUNT</h2>

      <div className="mt-5 space-y-1">
        <AccountRow label="USERNAME" value={profile.username || "Player"} />

        <AccountRow label="EMAIL" value={profile.email || "—"} />

        <AccountRow label="RANK" value={rank} />

        <AccountRow label="RATING" value={rating} />

        <AccountRow label="MATCHES" value={totalMatches} />

        <AccountRow label="JOINED" value={joinedDate} />
      </div>

      <div className="mt-5 rounded-2xl border border-pink-300/10 bg-gradient-to-br from-fuchsia-500/10 to-purple-500/10 p-5">
        <p className="text-[8px] font-black uppercase tracking-widest text-fuchsia-100/30">
          CURRENT RANK
        </p>

        <p className="mt-2 text-3xl font-black text-pink-300">{rank}</p>

        <p className="mt-1 text-xs text-fuchsia-100/40">
          {rating} ranked rating points
        </p>
      </div>
    </section>
  );
}

function StatCard({ label, value, type }) {
  const textColor =
    type === "win"
      ? "text-emerald-300"
      : type === "loss"
        ? "text-rose-300"
        : type === "draw"
          ? "text-amber-300"
          : "text-fuchsia-300";

  return (
    <div className="min-w-0 rounded-2xl border border-white/5 bg-[#17071f] p-4">
      <span className={`text-[8px] font-black tracking-widest ${textColor}`}>
        {label}
      </span>

      <p className="mt-3 text-2xl font-black sm:text-3xl">{value}</p>
    </div>
  );
}

function AccountRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 py-3 last:border-0">
      <span className="shrink-0 text-[8px] font-black tracking-widest text-fuchsia-100/25">
        {label}
      </span>

      <span className="max-w-[190px] truncate text-right text-[10px] font-bold text-fuchsia-100/55">
        {value}
      </span>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="flex min-h-[54px] min-w-0 flex-col justify-center rounded-2xl border border-pink-300/10 bg-black/20 px-3 py-2.5 text-center">
      <p className="truncate text-[7px] font-black tracking-widest text-fuchsia-100/25">
        {label}
      </p>

      <p className="mt-0.5 truncate text-sm font-black text-pink-100 sm:text-base">
        {value}
      </p>
    </div>
  );
}

function Tag({ label, highlight = false }) {
  return (
    <span
      className={`rounded-lg border px-2.5 py-1 text-[8px] font-black tracking-widest ${
        highlight
          ? "border-pink-300/20 bg-pink-300/10 text-pink-200"
          : "border-white/10 bg-white/[0.03] text-fuchsia-100/45"
      }`}
    >
      {label}
    </span>
  );
}

function LogoutModal({ onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#100315]/80 px-4 backdrop-blur-md">
      <div className="w-full max-w-[380px] rounded-3xl border border-fuchsia-400/20 bg-[#210a2d] p-6 shadow-[0_25px_100px_rgba(0,0,0,0.65)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-pink-300/20 bg-pink-300/10 text-[9px] font-black tracking-widest text-pink-200">
          EXIT
        </div>

        <div className="mt-5 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-pink-300">
            SESSION
          </p>

          <h2 className="mt-1 text-2xl font-black">LOG OUT?</h2>

          <p className="mt-3 text-sm leading-6 text-fuchsia-100/40">
            Are you sure you want to leave your Anime Card Battle session?
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 rounded-xl border border-white/10 bg-white/[0.03] text-[9px] font-black uppercase tracking-widest text-fuchsia-100/45 transition hover:bg-white/[0.06] hover:text-white"
          >
            CANCEL
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="h-11 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 text-[9px] font-black uppercase tracking-widest text-white transition hover:from-fuchsia-500 hover:to-purple-500"
          >
            LOG OUT
          </button>
        </div>
      </div>
    </div>
  );
}

function getRankFromRating(rating) {
  const value = Number(rating || 0);

  if (value >= 2500) {
    return "Diamond";
  }

  if (value >= 2000) {
    return "Platinum";
  }

  if (value >= 1500) {
    return "Gold";
  }

  if (value >= 1000) {
    return "Silver";
  }

  return "Bronze";
}

export default ProfilePage;
