import { useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const BACKEND_URL = API_BASE_URL.replace(/\/api\/?$/, "");

function AnimeCard({
  card,
  selected = false,
  small = false,
  onFlip,
}) {
  const [flipped, setFlipped] = useState(false);

  if (!card) {
    return null;
  }

  const imageUrl = card.image
    ? String(card.image).startsWith("http")
      ? card.image
      : `${BACKEND_URL}${card.image}`
    : null;

  const handleFlip = () => {
    const nextFlipped = !flipped;

    setFlipped(nextFlipped);
    onFlip?.(nextFlipped);
  };

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      handleFlip();
    }
  };

  return (
    <div
      className={`
        ${small ? "w-[220px]" : "w-[280px]"}
        aspect-[7.5/10]
        cursor-pointer
        [perspective:1500px]
        group
      `}
      onClick={handleFlip}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${card.name || "Anime character"} card. ${
        flipped ? "Show front" : "Show power profile"
      }`}
      aria-pressed={flipped}
    >
      <div
        className={`
          relative
          w-full
          h-full
          transition-transform
          duration-700
          ease-in-out
          [transform-style:preserve-3d]
          ${flipped ? "[transform:rotateY(180deg)]" : ""}
        `}
      >
        <div
          className={`
            absolute
            inset-0
            w-full
            h-full
            overflow-hidden
            rounded-2xl
            border-2
            ${
              selected
                ? "border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.35)]"
                : "border-slate-700 shadow-[0_12px_30px_rgba(0,0,0,0.6)]"
            }
            bg-gradient-to-b
            from-[#111827]
            via-[#080b12]
            to-[#020617]
            text-white
            [backface-visibility:hidden]
            transition-all
            duration-300
            group-hover:border-cyan-400/60
            group-hover:shadow-[0_0_30px_rgba(34,211,238,0.16)]
          `}
        >
          <div
            className="
              absolute
              -inset-[100%]
              z-30
              pointer-events-none
              rotate-12
              bg-gradient-to-r
              from-transparent
              via-white/[0.08]
              to-transparent
              group-hover:animate-card-shine
            "
          />

          <div
            className="
              absolute
              top-0
              left-0
              right-0
              h-[2px]
              bg-gradient-to-r
              from-cyan-500
              via-purple-500
              to-pink-500
            "
          />

          <div className="h-[35%] relative bg-gray-900 overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={card.name || "Anime character"}
                className="
                  w-full
                  h-full
                  object-cover
                  transition-transform
                  duration-700
                  group-hover:scale-105
                "
              />
            ) : (
              <div
                className="
                  w-full
                  h-full
                  flex
                  items-center
                  justify-center
                  bg-gradient-to-br
                  from-gray-900
                  via-gray-800
                  to-black
                "
                role="img"
                aria-label={`${card.name || "Anime character"} image unavailable`}
              >
                <div
                  className="text-5xl opacity-50"
                  aria-hidden="true"
                >
                  🎴
                </div>
              </div>
            )}

            <div
              className="
                absolute
                inset-0
                bg-gradient-to-t
                from-[#05070d]
                via-transparent
                to-transparent
              "
            />

            <div
              className="
                absolute
                inset-0
                bg-gradient-to-r
                from-black/30
                via-transparent
                to-black/30
              "
            />

            <div
              className="
                absolute
                bottom-0
                left-0
                right-0
                h-[2px]
                bg-gradient-to-r
                from-transparent
                via-cyan-400
                to-transparent
                shadow-[0_0_8px_rgba(34,211,238,0.7)]
              "
            />
          </div>

          <div
            className="
              px-3
              py-2.5
              border-b
              border-gray-800
              flex
              justify-between
              items-center
            "
          >
            <div className="min-w-0">
              <h2
                className="
                  text-lg
                  font-black
                  tracking-tight
                  text-white
                  truncate
                "
              >
                {card.name}
              </h2>

              <p
                className="
                  text-[8px]
                  text-cyan-400
                  uppercase
                  tracking-[0.15em]
                  mt-1
                "
              >
                {card.anime}
              </p>
            </div>

            <div
              className="
                shrink-0
                ml-2
                bg-gray-900/80
                border
                border-gray-700
                rounded-lg
                px-2
                py-1.5
                text-right
              "
            >
              <p
                className="
                  text-[6px]
                  text-gray-500
                  uppercase
                  tracking-widest
                "
              >
                Card ID
              </p>

              <p
                className="
                  text-[7px]
                  font-mono
                  text-gray-300
                  mt-0.5
                "
              >
                {card.id}
              </p>
            </div>
          </div>

          <div className="px-3 pt-2.5">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="
                  w-1
                  h-3
                  rounded-full
                  bg-cyan-400
                  shadow-[0_0_7px_rgba(34,211,238,0.7)]
                "
              />

              <h3
                className="
                  text-[8px]
                  font-bold
                  text-gray-400
                  tracking-[0.12em]
                "
              >
                CHARACTER INFORMATION
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <Info
                label="Position"
                value={card.position}
              />

              <Info
                label="Gender"
                value={card.gender}
              />

              <Info
                label="Race"
                value={card.race}
              />

              <Info
                label="Affiliation"
                value={card.affiliation}
              />
            </div>
          </div>

          <div className="absolute bottom-2.5 left-3 right-3">
            <div
              className="
                relative
                overflow-hidden
                bg-gray-900/90
                border
                border-gray-800
                rounded-lg
                p-2.5
              "
            >
              <div
                className="
                  absolute
                  left-0
                  top-0
                  bottom-0
                  w-[2px]
                  bg-gradient-to-b
                  from-cyan-400
                  via-purple-500
                  to-transparent
                "
              />

              <p
                className="
                  text-[7px]
                  text-cyan-400
                  uppercase
                  tracking-widest
                "
              >
                Famous Dialogue
              </p>

              <p
                className="
                  text-[8px]
                  italic
                  text-gray-300
                  mt-1
                  leading-relaxed
                  line-clamp-2
                "
              >
                "{card.famousDialogue || "—"}"
              </p>
            </div>
          </div>

          <CardCorners />
        </div>

        <div
          className="
            absolute
            inset-0
            w-full
            h-full
            overflow-hidden
            rounded-2xl
            border-2
            border-purple-500/50
            bg-gradient-to-b
            from-[#111827]
            via-[#080b12]
            to-[#020617]
            text-white
            [backface-visibility:hidden]
            [transform:rotateY(180deg)]
            p-3
          "
        >
          <div
            className="
              absolute
              top-0
              left-0
              right-0
              h-[2px]
              bg-gradient-to-r
              from-purple-500
              via-cyan-400
              to-pink-500
            "
          />

          <div className="text-center pb-2 border-b border-gray-800">
            <p
              className="
                text-[6px]
                text-purple-400
                uppercase
                tracking-[0.2em]
              "
            >
              Character Power Profile
            </p>
          </div>

          <div
            className="
              mt-2.5
              rounded-lg
              border
              border-yellow-400/30
              bg-gradient-to-r
              from-yellow-400/10
              via-transparent
              to-purple-500/10
              px-3
              py-1.5
            "
          >
            <div className="flex items-center justify-center gap-1.5">
              <p
                className="
                  text-sm
                  text-gray-400
                  uppercase
                  tracking-wider
                  font-semibold
                "
              >
                Overall
              </p>

              <span className="text-gray-600 text-xs">
                :
              </span>

              <p
                className="
                  text-sm
                  font-black
                  text-yellow-400
                "
              >
                {formatPower(card.overallPower)}
              </p>

              <span className="text-[7px] text-gray-600">
                /100
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2.5">
            <div className="border-r border-gray-800 pr-2">
              <SectionTitle title="GENERAL" />

              <div className="space-y-2">
                <Stat
                  name="Speed"
                  value={card.general?.speed}
                />

                <Stat
                  name="Strength"
                  value={card.general?.strength}
                />

                <Stat
                  name="Intelligence"
                  value={card.general?.intelligence}
                />

                <Stat
                  name="Leadership"
                  value={card.general?.leadership}
                />

                <Stat
                  name="Race"
                  value={card.general?.race}
                />
              </div>
            </div>

            <div>
              <SectionTitle title="ROLES" />

              <div className="space-y-2">
                <Stat
                  name="Swordsman"
                  value={card.roles?.swordsman}
                />

                <Stat
                  name="Mage"
                  value={card.roles?.mage}
                />

                <Stat
                  name="Warrior"
                  value={card.roles?.warrior}
                />

                <Stat
                  name="Tank"
                  value={card.roles?.tank}
                />

                <Stat
                  name="Healer"
                  value={card.roles?.healer}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 mt-2 border-t border-gray-800">
            <SectionTitle title="SPECIAL ROLE" />

            <div
              className="
                bg-gray-900/80
                border
                border-purple-500/30
                rounded-lg
                px-2
                py-1.5
              "
            >
              <div className="flex items-center justify-center gap-1.5">
                <p
                  className="
                    text-[8px]
                    text-gray-400
                    uppercase
                    tracking-wider
                    font-semibold
                  "
                >
                  {card.specialRole?.name || "—"}
                </p>

                {card.specialRole?.name && (
                  <>
                    <span className="text-gray-600 text-xs">
                      :
                    </span>

                    <p
                      className="
                        text-[9px]
                        font-black
                        text-yellow-400
                      "
                    >
                      {formatPower(
                        card.specialRole?.power
                      )}
                    </p>

                    <span className="text-[7px] text-gray-600">
                      /100
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-2.5">
            <SectionTitle title="POWER CATEGORIES" />

            <div className="flex flex-row gap-2 overflow-x-auto">
              {Array.isArray(card.powerCategories) &&
              card.powerCategories.length > 0 ? (
                card.powerCategories.map(
                  (power, index) => {
                    const value =
                      normalizePower(
                        power?.power
                      );

                    return (
                      <div
                        key={`${power?.name || "power"}-${index}`}
                        className="min-w-[65px] flex-1"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[6px] text-gray-400 truncate">
                            {power?.name || "—"}
                          </span>

                          <span className="text-[7px] font-bold text-gray-200">
                            {value}
                          </span>
                        </div>

                        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="
                              h-full
                              rounded-full
                              bg-gradient-to-r
                              from-cyan-500
                              via-blue-500
                              to-purple-500
                            "
                            style={{
                              width: `${value}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  }
                )
              ) : (
                <p className="text-[7px] text-gray-600">
                  No power categories
                </p>
              )}
            </div>
          </div>

          <div className="absolute bottom-1.5 left-0 right-0 text-center">
            <p className="text-[6px] text-gray-600 tracking-widest">
              CLICK TO FLIP ↻
            </p>
          </div>

          <CardCorners purple />
        </div>
      </div>
    </div>
  );
}

function normalizePower(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 1;
  }

  return Math.min(
    100,
    Math.max(
      1,
      Math.round(number)
    )
  );
}

function formatPower(value) {
  return normalizePower(value);
}

function Info({
  label,
  value,
}) {
  return (
    <div
      className="
        bg-gray-900/80
        border
        border-gray-800
        rounded-lg
        p-1.5
        transition-all
        duration-300
        hover:border-cyan-400/30
        hover:bg-gray-800/80
      "
    >
      <p
        className="
          text-[6px]
          uppercase
          tracking-wider
          text-cyan-400/50
        "
      >
        {label}
      </p>

      <p
        className="
          text-[7px]
          font-semibold
          text-gray-200
          mt-0.5
          truncate
        "
      >
        {value || "—"}
      </p>
    </div>
  );
}

function SectionTitle({ title }) {
  return (
    <div className="flex items-center justify-center mb-1.5">
      <h3
        className="
          text-[7px]
          font-bold
          text-gray-400
          tracking-widest
        "
      >
        {title}
      </h3>
    </div>
  );
}

function Stat({
  name,
  value = 1,
}) {
  const safeValue =
    normalizePower(value);

  return (
    <div>
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-[6px] text-gray-500">
          {name}
        </span>

        <span className="text-[7px] font-bold text-gray-300">
          {safeValue}
        </span>
      </div>

      <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="
            h-full
            rounded-full
            bg-gradient-to-r
            from-cyan-500
            via-blue-500
            to-purple-500
          "
          style={{
            width: `${safeValue}%`,
          }}
        />
      </div>
    </div>
  );
}

function CardCorners({
  purple = false,
}) {
  const borderColor = purple
    ? "border-purple-400/50"
    : "border-cyan-400/50";

  return (
    <>
      <div
        className={`
          absolute
          top-2
          left-2
          w-3
          h-3
          border-l
          border-t
          ${borderColor}
          pointer-events-none
        `}
      />

      <div
        className={`
          absolute
          top-2
          right-2
          w-3
          h-3
          border-r
          border-t
          ${borderColor}
          pointer-events-none
        `}
      />

      <div
        className={`
          absolute
          bottom-2
          left-2
          w-3
          h-3
          border-l
          border-b
          ${borderColor}
          pointer-events-none
        `}
      />

      <div
        className={`
          absolute
          bottom-2
          right-2
          w-3
          h-3
          border-r
          border-b
          ${borderColor}
          pointer-events-none
        `}
      />
    </>
  );
}

export default AnimeCard;
