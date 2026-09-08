import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const isAdmin =
    isAuthenticated && user?.role === "admin";

  const navItems = isAdmin
    ? [
        {
          name: "GAME",
          path: "/game",
        },
        {
          name: "COLLECTION",
          path: "/admin/cards",
        },
        {
          name: "DRAW",
          path: "/draw",
        },
        {
          name: "MANAGE",
          path: "/admin/manage",
        },
      ]
    : [
        {
          name: "GAME",
          path: "/game",
        },
        {
          name: "COLLECTION",
          path: "/collection",
        },
        {
          name: "DRAW",
          path: "/draw",
        },
      ];

  const isActive = (path) => {
    return (
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
    );
  };

  return (
    <>
      {/* Desktop */}
      <nav className="fixed left-0 right-0 top-0 z-50 hidden px-6 pt-3 md:block">
        <div className="mx-auto max-w-7xl">
          <div className="relative flex h-14 items-center rounded-full border border-red-600/60 bg-[#781A66]/95 px-6 shadow-[0_10px_30px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            {/* Logo */}
            <Link
              to="/"
              className="flex min-w-[210px] items-center"
            >
              <span className="font-serif text-[19px] font-bold italic text-[#d8bd7b]">
                Anime
              </span>

              <span className="ml-2 font-serif text-[11px] font-bold uppercase tracking-[0.14em] text-[#eee9dc]">
                Battles
              </span>
            </Link>

            {/* Navigation */}
            <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-9">
              {navItems.map((item) => {
                const active = isActive(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative py-2 text-[8px] font-bold uppercase tracking-[0.22em] transition ${
                      active
                        ? "text-[#e2cb91]"
                        : "text-[#6f6c66] hover:text-[#d5d1c8]"
                    }`}
                  >
                    {item.name}

                    {active && (
                      <span className="absolute -bottom-1 left-1/2 h-px w-9 -translate-x-1/2 bg-[#d2b66f]" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Profile */}
            <div className="ml-auto">
              {isAuthenticated ? (
                <Link
                  to="/profile"
                  className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 transition ${
                    isActive("/profile")
                      ? "bg-[#f1eee6] text-black"
                      : "bg-[#eeeae1] text-black hover:bg-white"
                  }`}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black">
                    <span className="text-[8px] font-black text-[#d5bb78]">
                      {user?.username?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>

                  <span className="max-w-28 truncate text-[8px] font-black uppercase tracking-[0.17em]">
                    {user?.username || "PROFILE"}
                  </span>
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="rounded-full bg-[#eeeae1] px-4 py-2.5 text-[8px] font-black uppercase tracking-[0.2em] text-black transition hover:bg-white"
                >
                  ENTER
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="border-t border-gray-800 bg-[#0d0715]/98 backdrop-blur-xl">
          <div
            className={`mx-auto grid h-14 max-w-lg ${
              isAuthenticated
                ? isAdmin
                  ? "grid-cols-5"
                  : "grid-cols-4"
                : "grid-cols-2"
            }`}
          >
            {navItems.map((item) => {
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex h-full items-center justify-center text-[8px] font-bold uppercase tracking-[0.15em] transition ${
                    active
                      ? "text-purple-400"
                      : "text-gray-600 hover:text-gray-300"
                  }`}
                >
                  {item.name}

                  {active && (
                    <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
                  )}
                </Link>
              );
            })}

            {isAuthenticated ? (
              <Link
                to="/profile"
                className={`relative flex h-full items-center justify-center text-[8px] font-bold uppercase tracking-[0.15em] transition ${
                  isActive("/profile")
                    ? "text-purple-400"
                    : "text-gray-600 hover:text-gray-300"
                }`}
              >
                PROFILE

                {isActive("/profile") && (
                  <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
                )}
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex h-full items-center justify-center text-[8px] font-bold uppercase tracking-[0.15em] text-gray-600 transition hover:text-gray-300"
              >
                ENTER
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Page spacing */}
      <div className="hidden h-20 md:block" />
      <div className="h-14 md:hidden" />
    </>
  );
}

export default Navbar;
