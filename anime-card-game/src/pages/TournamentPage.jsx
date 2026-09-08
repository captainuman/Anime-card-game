import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import socket from "../socket";

import TournamentMenu from "../components/Tournament/TournamentMenu";
import TournamentLobby from "../components/Tournament/TournamentLobby";
import TournamentBracket from "../components/Tournament/TournamentBracket";
import TournamentMatch from "../components/Tournament/TournamentMatch";

function TournamentPage() {
  const { user, loading: authLoading } = useAuth();

  const [screen, setScreen] = useState("menu");
  const [tournament, setTournament] = useState(null);
  const [activeMatch, setActiveMatch] = useState(null);
  const [finalResult, setFinalResult] = useState(null);
  const [randomPlayers, setRandomPlayers] = useState(0);

  const currentUserId =
    user?.id ||
    user?._id ||
    user?.userId;

  const normalizeTournament = useCallback((data) => {
    if (!data) {
      return null;
    }

    return {
      tournamentId:
        data.tournamentId ||
        data.id ||
        null,

      code:
        data.code ||
        null,

      type:
        data.type ||
        "friend",

      arena:
        data.arena ||
        null,

      maxPlayers:
        Number(data.maxPlayers) || 4,

      host:
        data.host ||
        null,

      players:
        Array.isArray(data.players)
          ? data.players
          : [],

      status:
        data.status ||
        "waiting",

      currentRound:
        data.currentRound !== undefined
          ? Number(data.currentRound) || 0
          : 0,

      bracket:
        Array.isArray(data.bracket)
          ? data.bracket
          : [],

      matches:
        Array.isArray(data.matches)
          ? data.matches
          : [],
    };
  }, []);

  const updateTournament = useCallback(
    (data) => {
      if (!data) {
        return;
      }

      setTournament((previous) => {
        const normalized =
          normalizeTournament(data);

        if (!normalized) {
          return previous;
        }

        const nextTournament = {
          ...(previous || {}),
        };

        if (
          normalized.tournamentId
        ) {
          nextTournament.tournamentId =
            normalized.tournamentId;
        }

        if (
          data.code !== undefined
        ) {
          nextTournament.code =
            normalized.code;
        }

        if (
          data.type !== undefined
        ) {
          nextTournament.type =
            normalized.type;
        }

        if (
          data.arena !== undefined
        ) {
          nextTournament.arena =
            normalized.arena;
        }

        if (
          data.maxPlayers !== undefined
        ) {
          nextTournament.maxPlayers =
            normalized.maxPlayers;
        }

        if (
          data.host !== undefined
        ) {
          nextTournament.host =
            normalized.host;
        }

        if (
          data.players !== undefined &&
          Array.isArray(data.players)
        ) {
          nextTournament.players =
            data.players;
        }

        if (
          data.status !== undefined
        ) {
          nextTournament.status =
            normalized.status;
        }

        if (
          data.currentRound !== undefined
        ) {
          nextTournament.currentRound =
            normalized.currentRound;
        }

        if (
          data.bracket !== undefined &&
          Array.isArray(data.bracket)
        ) {
          nextTournament.bracket =
            data.bracket;
        }

        if (
          data.matches !== undefined &&
          Array.isArray(data.matches)
        ) {
          nextTournament.matches =
            data.matches;
        }

        if (
          !nextTournament.type
        ) {
          nextTournament.type =
            "friend";
        }

        if (
          !nextTournament.status
        ) {
          nextTournament.status =
            "waiting";
        }

        if (
          !nextTournament.maxPlayers
        ) {
          nextTournament.maxPlayers = 4;
        }

        if (
          nextTournament.currentRound ===
          undefined
        ) {
          nextTournament.currentRound = 0;
        }

        return nextTournament;
      });
    },
    [normalizeTournament],
  );

  const handleFriendCreated = useCallback(
    (data) => {
      const tournamentData =
        normalizeTournament(data);

      if (
        !tournamentData?.tournamentId
      ) {
        console.error(
          "Invalid tournament data:",
          data,
        );
        return;
      }

      setTournament(tournamentData);
      setActiveMatch(null);
      setFinalResult(null);
      setRandomPlayers(0);
      setScreen("lobby");
    },
    [normalizeTournament],
  );

  const handleJoinSuccess = useCallback(
    (data) => {
      const tournamentData =
        normalizeTournament(data);

      if (
        !tournamentData?.tournamentId
      ) {
        console.error(
          "Invalid joined tournament:",
          data,
        );
        return;
      }

      setTournament(tournamentData);
      setActiveMatch(null);
      setFinalResult(null);
      setRandomPlayers(0);
      setScreen("lobby");
    },
    [normalizeTournament],
  );

  const handleRandomSearching = useCallback(
    (data) => {
      const maxPlayers =
        Number(data?.maxPlayers) || 8;

      const count =
        Number(data?.playersSearching) || 0;

      const arena =
        data?.arena || null;

      setTournament({
        tournamentId: null,
        code: null,
        type: "random",
        arena,
        maxPlayers,
        host: null,
        players: [],
        status: "searching",
        currentRound: 0,
        bracket: [],
        matches: [],
      });

      setRandomPlayers(
        Math.min(
          Math.max(count, 0),
          maxPlayers,
        ),
      );

      setActiveMatch(null);
      setFinalResult(null);
      setScreen("random-waiting");
    },
    [],
  );

  const handleStarted = useCallback(
    (data) => {
      if (!data?.tournamentId) {
        return;
      }

      updateTournament(data);

      setActiveMatch(null);
      setFinalResult(null);
      setScreen("bracket");
    },
    [updateTournament],
  );

  const handleMatchFound = useCallback(
    (data) => {
      if (
        !data?.tournamentId ||
        !data?.roomId
      ) {
        return;
      }

      const belongsToMe =
        String(data?.player1?.userId) ===
          String(currentUserId) ||
        String(data?.player2?.userId) ===
          String(currentUserId);

      if (!belongsToMe) {
        return;
      }

      setActiveMatch((previous) => ({
        ...(previous || {}),
        ...data,

        tournamentId:
          data.tournamentId ||
          previous?.tournamentId ||
          tournament?.tournamentId ||
          null,

        arena:
          data.arena ||
          previous?.arena ||
          tournament?.arena ||
          null,
      }));

      setScreen("match");
    },
    [
      currentUserId,
      tournament?.tournamentId,
      tournament?.arena,
    ],
  );

  const handleMatchComplete = useCallback(
    (data) => {
      if (!data?.tournamentId) {
        return;
      }

      updateTournament(data);

      setActiveMatch(null);

      if (
        data.type ===
          "tournament-complete" ||
        data.tournamentComplete ||
        data.status === "complete"
      ) {
        setFinalResult(data);
        setScreen("complete");
        return;
      }

      setFinalResult(null);
      setScreen("bracket");
    },
    [updateTournament],
  );

  const handleRoundComplete = useCallback(
    (data) => {
      if (!data?.tournamentId) {
        return;
      }

      updateTournament(data);

      setActiveMatch(null);
      setFinalResult(null);
      setScreen("bracket");
    },
    [updateTournament],
  );

  const handleTournamentComplete =
    useCallback(
      (data) => {
        if (!data?.tournamentId) {
          return;
        }

        updateTournament(data);

        setFinalResult(data);
        setActiveMatch(null);
        setScreen("complete");
      },
      [updateTournament],
    );

  const handleBackToMenu = useCallback(() => {
    if (
      tournament?.tournamentId &&
      screen === "lobby"
    ) {
      socket.emit(
        "leave-friend-tournament",
        {
          tournamentId:
            tournament.tournamentId,
        },
      );
    }

    if (
      screen === "random-waiting"
    ) {
      socket.emit(
        "cancel-random-tournament",
        {
          userId: currentUserId,
        },
      );
    }

    setTournament(null);
    setActiveMatch(null);
    setFinalResult(null);
    setRandomPlayers(0);
    setScreen("menu");
  }, [
    tournament?.tournamentId,
    screen,
    currentUserId,
  ]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const handleFriendUpdated = (
      data,
    ) => {
      if (!data?.tournamentId) {
        return;
      }

      updateTournament(data);
    };

    const handleFriendJoined = (
      data,
    ) => {
      if (!data?.tournamentId) {
        return;
      }

      const tournamentData =
        normalizeTournament(data);

      if (!tournamentData) {
        return;
      }

      setTournament(tournamentData);
      setActiveMatch(null);
      setFinalResult(null);
      setRandomPlayers(0);
      setScreen("lobby");
    };

    const handleTournamentStarted = (
      data,
    ) => {
      handleStarted(data);
    };

    const handleRandomSearchingEvent = (
      data,
    ) => {
      handleRandomSearching(data);
    };

    const handleRandomFound = (
      data,
    ) => {
      if (!data?.tournamentId) {
        return;
      }

      const tournamentData =
        normalizeTournament(data);

      if (!tournamentData) {
        return;
      }

      setTournament(tournamentData);

      setRandomPlayers(
        Array.isArray(data.players)
          ? data.players.length
          : 0,
      );

      setActiveMatch(null);
      setFinalResult(null);
      setScreen("bracket");
    };

    const handleMatchCreated = (
      data,
    ) => {
      if (
        !data?.tournamentId ||
        !data?.roomId
      ) {
        return;
      }

      const belongsToMe =
        String(data?.player1?.userId) ===
          String(currentUserId) ||
        String(data?.player2?.userId) ===
          String(currentUserId);

      if (!belongsToMe) {
        return;
      }

      setActiveMatch((previous) => ({
        ...(previous || {}),
        ...data,

        arena:
          data.arena ||
          previous?.arena ||
          tournament?.arena ||
          null,
      }));
    };

    const handleTournamentMatchFound = (
      data,
    ) => {
      handleMatchFound(data);
    };

    const handleTournamentMatchComplete = (
      data,
    ) => {
      handleMatchComplete(data);
    };

    const handleTournamentRoundComplete = (
      data,
    ) => {
      handleRoundComplete(data);
    };

    const handleTournamentCompleted = (
      data,
    ) => {
      handleTournamentComplete(data);
    };

    const handleRandomCancelled = () => {
      setTournament(null);
      setRandomPlayers(0);
      setActiveMatch(null);
      setFinalResult(null);
      setScreen("menu");
    };

    const handleRoomError = (
      data = {},
    ) => {
      const errorTournamentId =
        typeof data === "object"
          ? data?.tournamentId
          : null;

      if (
        errorTournamentId &&
        tournament?.tournamentId &&
        String(errorTournamentId) !==
          String(tournament.tournamentId)
      ) {
        return;
      }

      console.error(
        "🔥 TOURNAMENT ERROR:",
        data,
      );
    };

    socket.on(
      "friend-tournament-updated",
      handleFriendUpdated,
    );

    socket.on(
      "friend-tournament-joined",
      handleFriendJoined,
    );

    socket.on(
      "tournament-started",
      handleTournamentStarted,
    );

    socket.on(
      "random-tournament-searching",
      handleRandomSearchingEvent,
    );

    socket.on(
      "random-tournament-found",
      handleRandomFound,
    );

    socket.on(
      "tournament-match-created",
      handleMatchCreated,
    );

    socket.on(
      "tournament-match-found",
      handleTournamentMatchFound,
    );

    socket.on(
      "tournament-match-complete",
      handleTournamentMatchComplete,
    );

    socket.on(
      "tournament-round-complete",
      handleTournamentRoundComplete,
    );

    socket.on(
      "tournament-complete",
      handleTournamentCompleted,
    );

    socket.on(
      "random-tournament-cancelled",
      handleRandomCancelled,
    );

    socket.on(
      "room-error",
      handleRoomError,
    );

    return () => {
      socket.off(
        "friend-tournament-updated",
        handleFriendUpdated,
      );

      socket.off(
        "friend-tournament-joined",
        handleFriendJoined,
      );

      socket.off(
        "tournament-started",
        handleTournamentStarted,
      );

      socket.off(
        "random-tournament-searching",
        handleRandomSearchingEvent,
      );

      socket.off(
        "random-tournament-found",
        handleRandomFound,
      );

      socket.off(
        "tournament-match-created",
        handleMatchCreated,
      );

      socket.off(
        "tournament-match-found",
        handleTournamentMatchFound,
      );

      socket.off(
        "tournament-match-complete",
        handleTournamentMatchComplete,
      );

      socket.off(
        "tournament-round-complete",
        handleTournamentRoundComplete,
      );

      socket.off(
        "tournament-complete",
        handleTournamentCompleted,
      );

      socket.off(
        "random-tournament-cancelled",
        handleRandomCancelled,
      );

      socket.off(
        "room-error",
        handleRoomError,
      );
    };
  }, [
    user,
    currentUserId,
    tournament?.tournamentId,
    tournament?.arena,
    normalizeTournament,
    updateTournament,
    handleRandomSearching,
    handleStarted,
    handleMatchFound,
    handleMatchComplete,
    handleRoundComplete,
    handleTournamentComplete,
  ]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl animate-pulse">
            🎴
          </div>

          <h2 className="text-2xl font-black mt-4">
            LOADING ACCOUNT...
          </h2>

          <p className="text-gray-500 mt-2">
            Restoring your session
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl">
            🔐
          </div>

          <h2 className="text-2xl font-black mt-4">
            LOGIN REQUIRED
          </h2>

          <p className="text-gray-500 mt-2">
            Please log in before entering tournament mode.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {screen === "menu" && (
        <TournamentMenu
          onBack={handleBackToMenu}
          onCreateSuccess={
            handleFriendCreated
          }
          onJoinSuccess={
            handleJoinSuccess
          }
          onRandomSearching={
            handleRandomSearching
          }
        />
      )}

      {screen === "lobby" && (
        <TournamentLobby
          tournament={tournament}
          user={user}
          onBack={handleBackToMenu}
          onStarted={handleStarted}
        />
      )}

      {screen === "random-waiting" && (
        <RandomTournamentWaiting
          tournament={tournament}
          playersSearching={
            randomPlayers
          }
          onCancel={
            handleBackToMenu
          }
        />
      )}

      {screen === "bracket" && (
        <TournamentBracket
          tournament={tournament}
          user={user}
          onMatchFound={
            handleMatchFound
          }
          onComplete={
            handleTournamentComplete
          }
          onBack={handleBackToMenu}
        />
      )}

      {screen === "match" && (
        <TournamentMatch
          match={activeMatch}
          user={user}
          onComplete={
            handleMatchComplete
          }
          onBack={handleBackToMenu}
        />
      )}

      {screen === "complete" && (
        <TournamentComplete
          result={finalResult}
          user={user}
          onBack={handleBackToMenu}
        />
      )}
    </>
  );
}

function RandomTournamentWaiting({
  tournament,
  playersSearching = 0,
  onCancel,
}) {
  const maxPlayers =
    Number(tournament?.maxPlayers) || 8;

  const safePlayers = Math.min(
    Math.max(
      Number(playersSearching) || 0,
      0,
    ),
    maxPlayers,
  );

  const remaining = Math.max(
    maxPlayers - safePlayers,
    0,
  );

  const progress =
    maxPlayers > 0
      ? (safePlayers / maxPlayers) * 100
      : 0;

  const arena =
    tournament?.arena || null;

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#030712] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-xl text-center bg-gray-950 border border-cyan-500/20 rounded-3xl p-8">
        <div className="text-6xl animate-pulse">
          🌐
        </div>

        <p className="text-xs text-cyan-400 font-black tracking-[0.3em] mt-5">
          RANDOM TOURNAMENT
        </p>

        <h1 className="text-3xl font-black mt-2">
          FINDING PLAYERS
        </h1>

        {arena && (
          <div className="mt-5 inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20">
            {arena.image ? (
              <img
                src={arena.image}
                alt={arena.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-900 flex items-center justify-center text-2xl">
                🏟️
              </div>
            )}

            <div className="text-left">
              <p className="text-[8px] text-gray-600 uppercase tracking-widest">
                SELECTED ARENA
              </p>

              <p className="text-sm text-cyan-400 font-black">
                {arena.name}
              </p>
            </div>
          </div>
        )}

        <p className="text-gray-500 text-sm mt-5">
          {safePlayers} / {maxPlayers} players found
        </p>

        <div className="mt-7 h-2 bg-gray-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-500 transition-all duration-500"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <p className="text-xs text-gray-600 mt-3">
          Waiting for{" "}
          <span className="text-white font-bold">
            {remaining}
          </span>{" "}
          more player
          {remaining !== 1
            ? "s"
            : ""}
          ...
        </p>

        <button
          type="button"
          onClick={onCancel}
          className="
            mt-7
            px-6
            py-3
            rounded-xl
            bg-gray-900
            border
            border-gray-800
            text-gray-400
            hover:text-white
            font-bold
            transition
          "
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}

function TournamentComplete({
  result,
  user,
  onBack,
}) {
  const winner =
    result?.winner;

  const currentUserId =
    user?.id ||
    user?._id ||
    user?.userId;

  const isWinner =
    winner?.userId &&
    String(winner.userId) ===
      String(currentUserId);

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#030712] text-white flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl">
          🏆
        </div>

        <p className="text-xs text-yellow-400 font-black tracking-[0.35em] mt-5">
          TOURNAMENT COMPLETE
        </p>

        <h1 className="text-4xl md:text-6xl font-black mt-2">
          {isWinner
            ? "YOU ARE THE CHAMPION!"
            : "TOURNAMENT CHAMPION"}
        </h1>

        {winner && (
          <div className="mt-7">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-yellow-400 flex items-center justify-center text-2xl font-black text-black">
              {(winner.username ||
                "P")
                .charAt(0)
                .toUpperCase()}
            </div>

            <h2 className="text-2xl font-black mt-3">
              {winner.username ||
                "Champion"}
            </h2>
          </div>
        )}

        <button
          type="button"
          onClick={onBack}
          className="
            mt-8
            px-8
            py-4
            rounded-xl
            bg-blue-600
            hover:bg-blue-500
            font-black
            transition
          "
        >
          🏆 RETURN TO TOURNAMENTS
        </button>
      </div>
    </div>
  );
}

export default TournamentPage;