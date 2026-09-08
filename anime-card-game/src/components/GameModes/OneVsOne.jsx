function OneVsOne({
  onSelectMode,
  onBack,
}) {
  return (
    <div
      className="
        min-h-screen
        bg-[#030712]
        text-white
        flex
        items-center
        justify-center
        p-6
        relative
        overflow-hidden
      "
    >
      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="absolute inset-0 pointer-events-none">

        <div
          className="
            absolute
            -left-40
            top-1/4
            w-[500px]
            h-[500px]
            rounded-full
            bg-blue-600/10
            blur-[120px]
          "
        />

        <div
          className="
            absolute
            -right-40
            bottom-1/4
            w-[500px]
            h-[500px]
            rounded-full
            bg-red-600/10
            blur-[120px]
          "
        />

        <div
          className="
            absolute
            inset-0
            opacity-[0.04]
            bg-[linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)]
            bg-[size:45px_45px]
          "
        />

      </div>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <div className="w-full max-w-6xl relative z-10">

        {/* TITLE */}

        <div className="text-center mb-12">

          <p
            className="
              text-xs
              font-bold
              tracking-[0.4em]
              text-gray-500
              mb-4
            "
          >
            BATTLE MODE
          </p>

          <h1
            className="
              text-6xl
              md:text-7xl
              font-black
            "
          >
            <span className="text-blue-400">
              1
            </span>

            <span className="text-gray-500 mx-4">
              VS
            </span>

            <span className="text-red-400">
              1
            </span>
          </h1>

          <p className="text-gray-500 mt-4">
            Choose your battle
          </p>

        </div>

        {/* =================================================
            LOCAL
        ================================================= */}

        <div>

          <div className="flex items-center gap-3 mb-5">

            <div className="h-px flex-1 bg-gray-800" />

            <span
              className="
                text-xs
                font-black
                tracking-[0.3em]
                text-gray-500
              "
            >
              LOCAL
            </span>

            <div className="h-px flex-1 bg-gray-800" />

          </div>

          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-2
              gap-6
            "
          >

            {/* PVP */}

            <button
              onClick={() =>
                onSelectMode("pvp")
              }
              className="
                group
                rounded-3xl
                p-8
                bg-gradient-to-br
                from-blue-950/80
                to-gray-950
                border-2
                border-blue-500/30
                hover:border-blue-400
                hover:-translate-y-2
                hover:shadow-[0_0_45px_rgba(59,130,246,0.25)]
                transition-all
                duration-500
              "
            >

              <div
                className="
                  w-24
                  h-24
                  mx-auto
                  rounded-2xl
                  flex
                  items-center
                  justify-center
                  bg-blue-500/10
                  border
                  border-blue-400/30
                  group-hover:scale-110
                  transition
                "
              >
                <span className="text-5xl">
                  ⚔️
                </span>
              </div>

              <p
                className="
                  mt-6
                  text-xs
                  font-bold
                  tracking-[0.3em]
                  text-blue-400
                "
              >
                LOCAL
              </p>

              <h2 className="text-2xl font-black mt-2">
                PLAYER VS PLAYER
              </h2>

              <p className="text-gray-500 mt-2">
                Two players on the same device
              </p>

            </button>


            {/* COMPUTER */}

            <button
              onClick={() =>
                onSelectMode("computer")
              }
              className="
                group
                rounded-3xl
                p-8
                bg-gradient-to-br
                from-red-950/80
                to-gray-950
                border-2
                border-red-500/30
                hover:border-red-400
                hover:-translate-y-2
                hover:shadow-[0_0_45px_rgba(239,68,68,0.25)]
                transition-all
                duration-500
              "
            >

              <div
                className="
                  w-24
                  h-24
                  mx-auto
                  rounded-2xl
                  flex
                  items-center
                  justify-center
                  bg-red-500/10
                  border
                  border-red-400/30
                  group-hover:scale-110
                  transition
                "
              >
                <span className="text-5xl">
                  🤖
                </span>
              </div>

              <p
                className="
                  mt-6
                  text-xs
                  font-bold
                  tracking-[0.3em]
                  text-red-400
                "
              >
                LOCAL
              </p>

              <h2 className="text-2xl font-black mt-2">
                PLAYER VS COMPUTER
              </h2>

              <p className="text-gray-500 mt-2">
                Battle against the AI
              </p>

            </button>

          </div>

        </div>


        {/* =================================================
            ONLINE
        ================================================= */}

        <div className="mt-12">

          <div className="flex items-center gap-3 mb-5">

            <div className="h-px flex-1 bg-gray-800" />

            <span
              className="
                text-xs
                font-black
                tracking-[0.3em]
                text-cyan-400
              "
            >
              ONLINE
            </span>

            <div className="h-px flex-1 bg-gray-800" />

          </div>


          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-2
              gap-6
            "
          >

            {/* RANDOM */}

            <button
              onClick={() =>
                onSelectMode("online-random")
              }
              className="
                group
                relative
                rounded-3xl
                p-8
                bg-gradient-to-br
                from-cyan-950/80
                via-blue-950/30
                to-gray-950
                border-2
                border-cyan-500/30
                hover:border-cyan-400
                hover:-translate-y-2
                hover:shadow-[0_0_45px_rgba(34,211,238,0.25)]
                transition-all
                duration-500
              "
            >

              <div
                className="
                  w-24
                  h-24
                  mx-auto
                  rounded-2xl
                  flex
                  items-center
                  justify-center
                  bg-cyan-500/10
                  border
                  border-cyan-400/30
                  group-hover:scale-110
                  transition
                "
              >
                <span className="text-5xl">
                  🌐
                </span>
              </div>

              <p
                className="
                  mt-6
                  text-xs
                  font-bold
                  tracking-[0.3em]
                  text-cyan-400
                "
              >
                ONLINE
              </p>

              <h2 className="text-2xl font-black mt-2">
                RANDOM MATCH
              </h2>

              <p className="text-gray-500 mt-2">
                Find a random player online
              </p>

              <div
                className="
                  mt-5
                  text-cyan-400
                  text-xs
                  font-bold
                  tracking-widest
                "
              >
                🔎 FIND OPPONENT
              </div>

            </button>


            {/* FRIEND */}

            <button
              onClick={() =>
                onSelectMode("online-friend")
              }
              className="
                group
                relative
                rounded-3xl
                p-8
                bg-gradient-to-br
                from-purple-950/80
                via-purple-950/30
                to-gray-950
                border-2
                border-purple-500/30
                hover:border-purple-400
                hover:-translate-y-2
                hover:shadow-[0_0_45px_rgba(168,85,247,0.25)]
                transition-all
                duration-500
              "
            >

              <div
                className="
                  w-24
                  h-24
                  mx-auto
                  rounded-2xl
                  flex
                  items-center
                  justify-center
                  bg-purple-500/10
                  border
                  border-purple-400/30
                  group-hover:scale-110
                  transition
                "
              >
                <span className="text-5xl">
                  👥
                </span>
              </div>

              <p
                className="
                  mt-6
                  text-xs
                  font-bold
                  tracking-[0.3em]
                  text-purple-400
                "
              >
                ONLINE
              </p>

              <h2 className="text-2xl font-black mt-2">
                PLAY WITH FRIEND
              </h2>

              <p className="text-gray-500 mt-2">
                Create or join a private room
              </p>

              <div
                className="
                  mt-5
                  text-purple-400
                  text-xs
                  font-bold
                  tracking-widest
                "
              >
                🔐 PRIVATE ROOM
              </div>

            </button>

          </div>

        </div>


        {/* BACK */}

        <div className="text-center mt-10">

          <button
            onClick={onBack}
            className="
              px-6
              py-3
              rounded-xl
              bg-gray-900
              border
              border-gray-800
              text-gray-400
              hover:text-white
              hover:border-gray-600
              transition
            "
          >
            ← BACK
          </button>

        </div>

      </div>

    </div>
  );
}

export default OneVsOne;