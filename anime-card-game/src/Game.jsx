import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getCards } from "./api/cardApi.js";
import { positions } from "./data/positions";
import { arenas } from "./data/arenas";

import { drawRandomCard } from "./utils/randomDraw";
import { createComputerTeam } from "./utils/computerAI.js";
import { executeBattle, resetHP, INITIAL_HP } from "./utils/battleEngine";

import socket from "./socket";

import ArenaSelection from "./components/ArenaSelection";
import DraftScreen from "./components/Draft/DraftScreen";
import BattleScreen from "./components/Battle/BattleScreen";
import FinalMatch from "./components/Battle/FinalMatch";

import OnlineLobby from "./components/Online/OnlineLobby";
import OnlineMatchRoom from "./components/Online/OnlineMatchRoom";
import OnlineArenaSelection from "./components/Online/OnlineArenaSelection";
import OnlineDraftScreen from "./components/Online/OnlineDraftScreen";
import OnlineBattleScreen from "./components/Online/OnlineBattleScreen";

import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar.jsx";

const MAX_HP = 100;
const TOTAL_CARDS_PER_TEAM = positions.length;

function Game() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [cards, setCards] = useState([]);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [cardsError, setCardsError] = useState("");

  const [matchMode, setMatchMode] = useState(null);
  const [phase, setPhase] = useState("mode");

  const [onlineMode, setOnlineMode] = useState(null);
  const [onlineMatch, setOnlineMatch] = useState(null);
  const [selectedArena, setSelectedArena] = useState(null);

  const [player1Drawn, setPlayer1Drawn] = useState([]);
  const [player1Team, setPlayer1Team] = useState({});
  const [player1CurrentCard, setPlayer1CurrentCard] = useState(null);

  const [player2Drawn, setPlayer2Drawn] = useState([]);
  const [player2Team, setPlayer2Team] = useState({});
  const [player2CurrentCard, setPlayer2CurrentCard] = useState(null);

  const [battleResults, setBattleResults] = useState([]);
  const [currentBattle, setCurrentBattle] = useState(0);

  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);

  const [player1HP, setPlayer1HP] = useState(INITIAL_HP);
  const [player2HP, setPlayer2HP] = useState(INITIAL_HP);

  const [currentDamage, setCurrentDamage] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const loadCards = async () => {
    try {
      setCardsLoading(true);
      setCardsError("");

      const data = await getCards();

      if (!Array.isArray(data)) {
        throw new Error("Invalid card data received from server.");
      }

      setCards(data);
    } catch (error) {
      console.error("Failed to load cards:", error);

      setCardsError(error.message || "Failed to load cards from server.");
    } finally {
      setCardsLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const arenaCards = useMemo(() => {
    if (!selectedArena) {
      return [];
    }

    const arenaAnime = String(selectedArena.name || "")
      .trim()
      .toLowerCase();

    if (!arenaAnime) {
      return [];
    }

    return cards.filter(
      (card) =>
        String(card?.anime || "")
          .trim()
          .toLowerCase() === arenaAnime,
    );
  }, [cards, selectedArena]);

  const resetDraft = () => {
    setPlayer1Drawn([]);
    setPlayer1Team({});
    setPlayer1CurrentCard(null);

    setPlayer2Drawn([]);
    setPlayer2Team({});
    setPlayer2CurrentCard(null);

    setRevealed(false);
  };

  const resetBattle = () => {
    setBattleResults([]);
    setCurrentBattle(0);

    setPlayer1Score(0);
    setPlayer2Score(0);

    setPlayer1HP(INITIAL_HP);
    setPlayer2HP(INITIAL_HP);

    setCurrentDamage(0);
    setRevealed(false);
  };

  const clearOnlineState = () => {
    setOnlineMatch(null);
    setOnlineMode(null);
    setSelectedArena(null);

    resetDraft();
    resetBattle();
  };

  const leaveOnlineMatch = () => {
    if (onlineMatch?.roomId) {
      socket.emit("leave-online-match", {
        roomId: onlineMatch.roomId,
      });
    }

    clearOnlineState();
  };

  const handleSelectMatchMode = (mode) => {
    if (!mode) {
      return;
    }

    if (mode === "ranked") {
      navigate("/ranked-team");
      return;
    }

    if (mode === "tournament") {
      navigate("/tournament");
      return;
    }

    if (mode === "random" || mode === "friend") {
      setOnlineMode(mode);
      setMatchMode("online");
      setOnlineMatch(null);
      setSelectedArena(null);

      resetDraft();
      resetBattle();

      setPhase("online-arena");

      return;
    }

    if (mode === "cpu") {
      setOnlineMode(null);
      setOnlineMatch(null);
      setMatchMode("computer");
      setSelectedArena(null);

      resetDraft();
      resetBattle();

      setPhase("arena");

      return;
    }

    if (mode === "pvp") {
      setOnlineMode(null);
      setOnlineMatch(null);
      setMatchMode("pvp");
      setSelectedArena(null);

      resetDraft();
      resetBattle();

      setPhase("arena");
    }
  };

  const handleOnlineArenaSelected = (arena) => {
    if (!arena) {
      return;
    }

    const normalizedArenaName = String(arena.name || "")
      .trim()
      .toLowerCase();

    if (!normalizedArenaName) {
      console.error("Invalid online arena:", arena);

      return;
    }

    const matchingCards = cards.filter(
      (card) =>
        String(card?.anime || "")
          .trim()
          .toLowerCase() === normalizedArenaName,
    );

    if (matchingCards.length < 20) {
      window.alert(
        `${arena.name} has only ${matchingCards.length} cards.\n\nOnline battle requires at least 20 unique cards.`,
      );

      return;
    }

    const normalizedArena = {
      id: arena?.id != null ? String(arena.id) : "",
      name: String(arena.name).trim(),
      image: arena?.image || "",
    };

    if (!normalizedArena.id) {
      window.alert("Selected arena has no valid ID.");

      return;
    }

    setSelectedArena(normalizedArena);

    resetDraft();
    resetBattle();

    setPhase("online");
  };

  const handleOnlineMatchFound = (match) => {
    if (!match?.roomId) {
      console.error("Invalid online match:", match);

      return;
    }

    if (!match?.arena) {
      console.error("Online match has no arena:", match);

      return;
    }

    if (selectedArena?.id) {
      const selectedArenaId = String(selectedArena.id);

      const matchedArenaId = String(match.arena?.id || "");

      if (matchedArenaId && matchedArenaId !== selectedArenaId) {
        console.error("Arena mismatch:", {
          selectedArena,
          matchedArena: match.arena,
        });

        return;
      }
    }

    const normalizedMatch = {
      ...match,
      arena: {
        id: match.arena?.id != null ? String(match.arena.id) : "",
        name: String(match.arena?.name || "").trim(),
        image: match.arena?.image || "",
      },
    };

    setOnlineMatch(normalizedMatch);
    setSelectedArena(normalizedMatch.arena);

    resetDraft();
    resetBattle();

    setPhase("online-match");
  };

  const handleSelectArena = (arena) => {
    if (!arena) {
      return;
    }

    const animeName = String(arena.name || "")
      .trim()
      .toLowerCase();

    const matchingCards = cards.filter(
      (card) =>
        String(card?.anime || "")
          .trim()
          .toLowerCase() === animeName,
    );

    const requiredCards =
      matchMode === "pvp" ? TOTAL_CARDS_PER_TEAM * 2 : TOTAL_CARDS_PER_TEAM;

    if (matchingCards.length < requiredCards) {
      window.alert(
        `${arena.name} has only ${matchingCards.length} cards.\n\nThis mode requires at least ${requiredCards} unique cards.`,
      );

      return;
    }

    setSelectedArena(arena);

    resetDraft();
    resetBattle();

    setPhase("player1");
  };

  const handleDrawCard = () => {
    if (!selectedArena || arenaCards.length === 0) {
      return;
    }

    if (phase === "player1") {
      if (player1Drawn.length >= TOTAL_CARDS_PER_TEAM) {
        return;
      }

      if (player1CurrentCard) {
        return;
      }

      const card = drawRandomCard(arenaCards, player1Drawn);

      if (!card) {
        return;
      }

      setPlayer1CurrentCard(card);
      setRevealed(false);

      return;
    }

    if (phase === "player2") {
      if (player2Drawn.length >= TOTAL_CARDS_PER_TEAM) {
        return;
      }

      if (player2CurrentCard) {
        return;
      }

      const unavailableIds = new Set(player1Drawn.map((card) => card.id));

      const availableForPlayer2 = arenaCards.filter(
        (card) => !unavailableIds.has(card.id),
      );

      const card = drawRandomCard(availableForPlayer2, player2Drawn);

      if (!card) {
        return;
      }

      setPlayer2CurrentCard(card);
      setRevealed(false);
    }
  };

  const handleSelectPosition = (positionId) => {
    if (!positionId) {
      return;
    }

    if (phase === "player1") {
      if (!player1CurrentCard || player1Team[positionId]) {
        return;
      }

      const newTeam = {
        ...player1Team,
        [positionId]: player1CurrentCard,
      };

      setPlayer1Team(newTeam);

      setPlayer1Drawn((previous) => [...previous, player1CurrentCard]);

      setPlayer1CurrentCard(null);
      setRevealed(false);

      if (Object.keys(newTeam).length === positions.length) {
        if (matchMode === "pvp") {
          setPhase("player1Complete");
        }

        if (matchMode === "computer") {
          setPhase("computerDraft");
        }
      }

      return;
    }

    if (phase === "player2") {
      if (!player2CurrentCard || player2Team[positionId]) {
        return;
      }

      const newTeam = {
        ...player2Team,
        [positionId]: player2CurrentCard,
      };

      setPlayer2Team(newTeam);

      setPlayer2Drawn((previous) => [...previous, player2CurrentCard]);

      setPlayer2CurrentCard(null);
      setRevealed(false);

      if (Object.keys(newTeam).length === positions.length) {
        setPhase("ready");
      }
    }
  };

  const startPlayer2 = () => {
    setPlayer2CurrentCard(null);
    setRevealed(false);
    setPhase("player2");
  };

  const startComputerDraft = () => {
    if (!selectedArena) {
      return;
    }

    if (arenaCards.length < TOTAL_CARDS_PER_TEAM) {
      return;
    }

    try {
      const computer = createComputerTeam(arenaCards);

      if (!computer || !computer.team) {
        throw new Error("Computer team creation failed.");
      }

      setPlayer2Drawn(Array.isArray(computer.drawn) ? computer.drawn : []);

      setPlayer2Team(computer.team);

      setPlayer2CurrentCard(null);
      setRevealed(false);

      setPhase("ready");
    } catch (error) {
      console.error("Computer draft failed:", error);
    }
  };

  const calculateBattle = ({
    battleIndex,
    currentPlayer1HP,
    currentPlayer2HP,
  }) => {
    const position = positions[battleIndex];

    if (!position) {
      return null;
    }

    const player1Card = player1Team[position.id];

    const player2Card = player2Team[position.id];

    if (!player1Card || !player2Card) {
      return null;
    }

    const result = executeBattle({
      player1Card,
      player2Card,
      positionName: position.id,
      icon: position.icon,
      player1HP: currentPlayer1HP,
      player2HP: currentPlayer2HP,
    });

    if (!result) {
      return null;
    }

    return {
      ...result,
      position: position.id,
      positionName: position.name,
      icon: position.icon,
      player1Card,
      player2Card,
    };
  };

  const startBattle = () => {
    if (Object.keys(player1Team).length !== positions.length) {
      return;
    }

    if (Object.keys(player2Team).length !== positions.length) {
      return;
    }

    const hp = resetHP();

    const startingPlayer1HP = Math.max(
      0,
      Math.min(MAX_HP, Number(hp.player1HP) || 0),
    );

    const startingPlayer2HP = Math.max(
      0,
      Math.min(MAX_HP, Number(hp.player2HP) || 0),
    );

    setPlayer1HP(startingPlayer1HP);

    setPlayer2HP(startingPlayer2HP);

    setBattleResults([]);
    setCurrentBattle(0);

    setPlayer1Score(0);
    setPlayer2Score(0);

    setCurrentDamage(0);
    setRevealed(false);

    const firstBattle = calculateBattle({
      battleIndex: 0,
      currentPlayer1HP: startingPlayer1HP,
      currentPlayer2HP: startingPlayer2HP,
    });

    if (!firstBattle) {
      return;
    }

    setBattleResults([firstBattle]);

    setPlayer1HP(firstBattle.player1HP);

    setPlayer2HP(firstBattle.player2HP);

    setCurrentDamage(firstBattle.damage || 0);

    if (firstBattle.pointTo === "player1") {
      setPlayer1Score(1);
    }

    if (firstBattle.pointTo === "player2") {
      setPlayer2Score(1);
    }

    if (positions.length === 1) {
      setPhase("battleComplete");
      return;
    }

    setPhase("battle");
  };

  const nextBattle = () => {
    const nextBattleIndex = currentBattle + 1;

    if (nextBattleIndex >= positions.length) {
      setPhase("battleComplete");
      return;
    }

    const nextResult = calculateBattle({
      battleIndex: nextBattleIndex,
      currentPlayer1HP: player1HP,
      currentPlayer2HP: player2HP,
    });

    if (!nextResult) {
      return;
    }

    setBattleResults((previous) => [...previous, nextResult]);

    setCurrentBattle(nextBattleIndex);

    setPlayer1HP(nextResult.player1HP);

    setPlayer2HP(nextResult.player2HP);

    setCurrentDamage(nextResult.damage || 0);

    if (nextResult.pointTo === "player1") {
      setPlayer1Score((score) => score + 1);
    }

    if (nextResult.pointTo === "player2") {
      setPlayer2Score((score) => score + 1);
    }

    if (nextBattleIndex === positions.length - 1) {
      setPhase("battleComplete");
      return;
    }

    setRevealed(false);
  };

  const resetGame = () => {
    leaveOnlineMatch();
    setMatchMode(null);
    setPhase("mode");
  };

  const backToHome = () => {
    leaveOnlineMatch();
    navigate("/");
  };

  if (cardsLoading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-6 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-900/10 blur-[140px]" />
          <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-purple-900/10 blur-[120px]" />
        </div>

        <div className="relative text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-[1px]">
            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-black text-xs font-black tracking-[0.15em] text-blue-400">
              CARD
            </div>
          </div>

          <h2 className="mt-5 text-2xl font-black tracking-tight">
            LOADING CARDS
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            Connecting to the Anime Battle database
          </p>

          <div className="mx-auto mt-6 h-1 w-44 overflow-hidden rounded-full bg-white/5">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-500" />
          </div>
        </div>
      </div>
    );
  }

  if (cardsError) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-6 text-white">
        <div className="relative w-full max-w-lg rounded-3xl border border-red-500/20 bg-[#080808] p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 text-xs font-black tracking-widest text-red-400">
            ERROR
          </div>

          <p className="mt-5 text-[9px] font-black uppercase tracking-[0.3em] text-red-400">
            Card Database
          </p>

          <h2 className="mt-2 text-2xl font-black">FAILED TO LOAD CARDS</h2>

          <p className="mt-3 text-sm leading-6 text-gray-500">{cardsError}</p>

          <button
            type="button"
            onClick={loadCards}
            className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-7 py-3 text-xs font-black uppercase tracking-[0.15em] text-red-300 transition hover:border-red-500/40 hover:bg-red-500/15 hover:text-white"
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }

  if (phase === "mode") {
    const gameModes = [
      {
        id: "ranked",
        number: "01",
        title: "Ranked Match",
        description:
          "Battle another player with your ranked team and climb the leaderboard.",
        badge: "ONLINE",
        accent: "purple",
      },
      {
        id: "random",
        number: "02",
        title: "Random Match",
        description:
          "Choose an arena and find another player for a random online battle.",
        badge: "ONLINE",
        accent: "blue",
      },
      {
        id: "tournament",
        number: "03",
        title: "Tournament",
        description: "Enter a tournament and compete through multiple rounds.",
        badge: "COMPETITIVE",
        accent: "red",
      },
      {
        id: "friend",
        number: "04",
        title: "Friend Match",
        description:
          "Choose an arena and play an online match with your friend.",
        badge: "ONLINE",
        accent: "cyan",
      },
      {
        id: "cpu",
        number: "05",
        title: "Player vs CPU",
        description:
          "Build your team and challenge the computer in a local battle.",
        badge: "LOCAL",
        accent: "green",
      },
      {
        id: "pvp",
        number: "06",
        title: "Player vs Player",
        description:
          "Two players build their teams and battle locally on the same device.",
        badge: "LOCAL",
        accent: "orange",
      },
    ];

    const accentStyles = {
      purple: {
        border: "hover:border-purple-500/50",
        text: "text-purple-400",
        glow: "hover:shadow-[0_0_50px_rgba(168,85,247,0.10)]",
      },
      blue: {
        border: "hover:border-blue-500/50",
        text: "text-blue-400",
        glow: "hover:shadow-[0_0_50px_rgba(59,130,246,0.10)]",
      },
      red: {
        border: "hover:border-red-500/50",
        text: "text-red-400",
        glow: "hover:shadow-[0_0_50px_rgba(239,68,68,0.10)]",
      },
      cyan: {
        border: "hover:border-cyan-500/50",
        text: "text-cyan-400",
        glow: "hover:shadow-[0_0_50px_rgba(6,182,212,0.10)]",
      },
      green: {
        border: "hover:border-emerald-500/50",
        text: "text-emerald-400",
        glow: "hover:shadow-[0_0_50px_rgba(16,185,129,0.10)]",
      },
      orange: {
        border: "hover:border-orange-500/50",
        text: "text-orange-400",
        glow: "hover:shadow-[0_0_50px_rgba(249,115,22,0.10)]",
      },
    };

    return (
      <div className="relative min-h-screen overflow-hidden bg-[#E03C5F] px-4  text-white sm:px-6 lg:px-8">
        <Navbar/>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-15%] h-[550px] w-[550px] -translate-x-1/2 rounded-full bg-purple-900/10 blur-[150px] " />

          <div className="absolute bottom-[-15%] left-[-10%] h-[400px] w-[400px] rounded-full bg-blue-900/10 blur-[140px]" />

          <div className="absolute right-[-10%] top-[35%] h-[400px] w-[400px] rounded-full bg-red-900/5 blur-[140px]" />

          <div
            className="absolute inset-0 opacity-[0.018] "
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "42px 42px",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl mb-5">
          <div className="mb-10 text-center">
            <h1 className="mt-5 text-4xl font-black text-[#C1B4AC] tracking-[-0.04em] sm:text-4xl lg:text-4xl">
              CHOOSE YOUR BATTLE MODE
            </h1>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {gameModes.map((mode) => {
              const style = accentStyles[mode.accent];

              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => handleSelectMatchMode(mode.id)}
                  className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-[#201E1F] p-7 text-left transition-all duration-500 hover:-translate-y-1 ${style.border} ${style.glow}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.025] via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />

                  <div className="relative">
                    <div className="mb-8 flex items-start justify-between">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-sm font-black ${style.text}`}
                      >
                        {mode.number}
                      </div>

                      <span className="rounded-full border border-white/5 bg-white/[0.025] px-3 py-1 text-[8px] font-black tracking-[0.16em] text-gray-600">
                        {mode.badge}
                      </span>
                    </div>

                    <p
                      className={`text-[9px] font-black uppercase tracking-[0.25em] ${style.text}`}
                    >
                      Game Mode
                    </p>

                    <h2 className="mt-2 text-2xl font-black">{mode.title}</h2>

                    <p className="mt-3 min-h-[72px] text-sm leading-6 text-gray-500">
                      {mode.description}
                    </p>

                    <div className="mt-7 flex items-center justify-between border-t border-white/5 pt-5">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-700 transition group-hover:text-gray-400">
                        Enter Mode
                      </span>

                      <span
                        className={`text-xs font-black tracking-widest transition duration-300 group-hover:translate-x-1 ${style.text}`}
                      >
                        PLAY
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "online-arena") {
    return (
      <OnlineArenaSelection
        mode={onlineMode}
        arenas={arenas}
        user={user}
        onSelected={handleOnlineArenaSelected}
        onBack={() => {
          setSelectedArena(null);
          setOnlineMode(null);
          setMatchMode(null);

          resetDraft();
          resetBattle();

          setPhase("mode");
        }}
      />
    );
  }

  if (phase === "online") {
    return (
      <OnlineLobby
        mode={onlineMode}
        arena={selectedArena}
        user={user}
        onMatched={handleOnlineMatchFound}
        onBack={() => {
          leaveOnlineMatch();
          setPhase("mode");
        }}
      />
    );
  }

  if (phase === "online-match") {
    return (
      <OnlineMatchRoom
        match={onlineMatch}
        user={user}
        onReady={(data) => {
          console.log("GAME RECEIVED ONLINE DRAFT START:", data);

          setPhase("online-draft");
        }}
        onBack={() => {
          leaveOnlineMatch();
          setPhase("mode");
        }}
      />
    );
  }

  if (phase === "online-draft") {
    return (
      <OnlineDraftScreen
        match={onlineMatch}
        user={user}
        arena={selectedArena}
        onComplete={() => {
          console.log("ONLINE BATTLE READY → MOVING TO BATTLE");

          setPhase("online-battle");
        }}
        onBack={() => {
          leaveOnlineMatch();
          setPhase("mode");
        }}
      />
    );
  }

  if (phase === "online-battle") {
    return (
      <OnlineBattleScreen
        match={onlineMatch}
        user={user}
        onComplete={(data) => {
          setBattleResults(Array.isArray(data?.results) ? data.results : []);

          setPlayer1HP(Number(data?.player1HP) || 0);

          setPlayer2HP(Number(data?.player2HP) || 0);

          setPlayer1Score(Number(data?.player1Score) || 0);

          setPlayer2Score(Number(data?.player2Score) || 0);

          setPhase("battleComplete");
        }}
        onBack={() => {
          leaveOnlineMatch();
          setPhase("mode");
        }}
      />
    );
  }

  if (phase === "arena") {
    return (
      <div className="min-h-screen bg-black text-white">
        <ArenaSelection onSelect={handleSelectArena} />
      </div>
    );
  }

  const arenaImage = selectedArena?.image || "";

  return (
    <div
      className="min-h-screen bg-gray-950 bg-cover bg-center bg-fixed p-6 text-white"
      style={{
        backgroundImage: arenaImage
          ? `linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.92)), url(${arenaImage})`
          : undefined,
      }}
    >
      {(phase === "player1" || phase === "player1Complete") && (
        <DraftScreen
          player="PLAYER 1"
          currentCard={player1CurrentCard}
          currentTeam={player1Team}
          drawnCount={player1Drawn.length}
          onDraw={handleDrawCard}
          onSelectPosition={handleSelectPosition}
          revealed={revealed}
          setRevealed={setRevealed}
        />
      )}

      {phase === "player1Complete" && (
        <div className="mt-10 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-green-400">
            Draft Complete
          </p>

          <h2 className="mt-2 text-3xl font-black text-green-400">
            PLAYER 1 TEAM COMPLETE
          </h2>

          <p className="mt-2 text-gray-500">
            Player 2, get ready to build your team.
          </p>

          <button
            type="button"
            onClick={startPlayer2}
            className="mt-6 rounded-xl bg-blue-600 px-8 py-4 text-sm font-black uppercase tracking-widest transition hover:bg-blue-500"
          >
            CONTINUE TO PLAYER 2
          </button>
        </div>
      )}

      {phase === "player2" && (
        <DraftScreen
          player="PLAYER 2"
          currentCard={player2CurrentCard}
          currentTeam={player2Team}
          drawnCount={player2Drawn.length}
          onDraw={handleDrawCard}
          onSelectPosition={handleSelectPosition}
          revealed={revealed}
          setRevealed={setRevealed}
        />
      )}

      {phase === "computerDraft" && (
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-black/70 p-10 text-center">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-purple-400">
              Computer Draft
            </p>

            <h2 className="mt-3 text-3xl font-black">COMPUTER IS BUILDING</h2>

            <p className="mt-1 text-2xl font-black text-purple-400">
              {selectedArena?.name || "ANIME"} TEAM
            </p>

            <p className="mt-4 text-sm text-gray-500">
              Selecting only cards from {selectedArena?.name}.
            </p>

            <button
              type="button"
              onClick={startComputerDraft}
              className="mt-6 rounded-xl bg-purple-600 px-8 py-4 text-sm font-black uppercase tracking-widest transition hover:bg-purple-500"
            >
              BUILD COMPUTER TEAM
            </button>
          </div>
        </div>
      )}

      {phase === "ready" && (
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="w-full max-w-xl rounded-3xl border border-green-500/20 bg-black/75 p-10 text-center">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-green-400">
              Battle Ready
            </p>

            <h2 className="mt-3 text-3xl font-black text-green-400">
              BOTH TEAMS ARE READY
            </h2>

            <p className="mt-3 text-gray-400">{selectedArena?.name} Arena</p>

            <p className="mt-1 text-sm text-gray-600">
              {positions.length} positions will battle.
            </p>

            <button
              type="button"
              onClick={startBattle}
              className="mt-7 rounded-xl bg-red-600 px-10 py-5 text-lg font-black uppercase tracking-widest transition hover:bg-red-500"
            >
              START BATTLE
            </button>
          </div>
        </div>
      )}

      {phase === "battle" && (
        <BattleScreen
          result={battleResults[currentBattle]}
          results={battleResults}
          currentBattle={currentBattle}
          totalBattles={positions.length}
          player1HP={player1HP}
          player2HP={player2HP}
          currentDamage={currentDamage}
          onNextBattle={nextBattle}
        />
      )}

      {phase === "battleComplete" && (
        <FinalMatch
          player1Score={player1Score}
          player2Score={player2Score}
          player1HP={player1HP}
          player2HP={player2HP}
          results={battleResults}
          onPlayAgain={resetGame}
        />
      )}
    </div>
  );
}

export default Game;
