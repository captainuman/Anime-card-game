import { positions } from "../../data/positions";
import { getPositionPower } from "../../utils/battleEngine";

function PositionSelector({
  currentTeam,
  onSelectPosition,
}) {
  return (
    <div>
      <div className="mb-3 text-center">
        <p className="text-[9px] text-gray-600 uppercase tracking-[0.2em]">
          Choose an available position for your card
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {positions.map((position) => {
          const assigned =
            currentTeam?.[position.id];

          const assignedPower = assigned
            ? getPositionPower(
                assigned,
                position.id
              )
            : 0;

          return (
            <button
              key={position.id}
              type="button"
              disabled={!!assigned}
              onClick={() =>
                onSelectPosition(
                  position.id
                )
              }
              className={`
                relative
                min-h-[92px]
                px-2
                py-3
                rounded-xl
                border
                transition-all
                duration-200
                overflow-hidden
                flex
                flex-col
                items-center
                justify-center
                text-center

                ${
                  assigned
                    ? `
                      bg-gray-800/50
                      border-gray-800
                      opacity-40
                      cursor-not-allowed
                    `
                    : `
                      bg-gray-900/80
                      border-gray-700
                      hover:border-cyan-400/70
                      hover:bg-gray-800
                      hover:-translate-y-0.5
                      hover:shadow-[0_0_18px_rgba(34,211,238,0.10)]
                      active:scale-95
                    `
                }
              `}
            >
              {!assigned && (
                <div
                  className="
                    absolute
                    top-0
                    left-0
                    right-0
                    h-[2px]
                    bg-gradient-to-r
                    from-transparent
                    via-cyan-400
                    to-transparent
                  "
                />
              )}

              <div
                className={`
                  text-2xl
                  leading-none
                  ${
                    assigned
                      ? "grayscale"
                      : ""
                  }
                `}
              >
                {position.icon}
              </div>

              <div className="mt-1.5 text-[10px] font-black leading-tight">
                {position.name}
              </div>

              {!assigned && (
                <div className="mt-1.5 text-[7px] text-cyan-400 font-bold uppercase tracking-wider">
                  Available
                </div>
              )}

              {assigned && (
                <div className="mt-1.5 w-full">
                  <div className="text-[8px] text-gray-500 truncate px-1">
                    {assigned.name}
                  </div>

                  <div className="mt-1 flex items-center justify-center gap-1">
                    <span className="text-[8px] text-yellow-400">
                      ⚡
                    </span>

                    <span className="text-[10px] text-yellow-400 font-black">
                      {assignedPower}
                    </span>

                    <span className="text-[7px] text-gray-600">
                      /100
                    </span>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default PositionSelector;