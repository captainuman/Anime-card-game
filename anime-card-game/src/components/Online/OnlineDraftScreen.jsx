import { useEffect, useMemo, useState } from "react";
import socket from "../../socket";

import PositionSelector from "../Draft/PositionSelector";
import TeamPositions from "../Draft/TeamPositions";
import AnimeCard from "../AnimeCard";

import { positions } from "../../data/positions";

const CARDS_PER_PLAYER = 10;

function OnlineDraftScreen({
  match,
  user,
  arena,
  onComplete,
  onBack,
}) {
  const currentUserId =
    user?.id || user?._id || user?.userId;

  const players = Array.isArray(match?.players)
    ? match.players
    : [];

  const opponent =
    players.find(
      (player) =>
        String(player?.userId) !==
        String(currentUserId),
    ) || null;

  const isPlayer1 =
    String(players[0]?.userId) ===
    String(currentUserId);

  const selectedArena =
    match?.arena || arena || null;

  const [currentCard, setCurrentCard] =
    useState(null);

  const [team, setTeam] = useState({});

  const [drawnCount, setDrawnCount] =
    useState(0);

  const [revealed, setRevealed] =
    useState(false);

  const [opponentProgress, setOpponentProgress] =
    useState(0);

  const [status, setStatus] = useState(
    "Draw a card to begin.",
  );

  const [error, setError] = useState("");

  const [assigning, setAssigning] =
    useState(false);

  const [disconnected, setDisconnected] =
    useState(false);

  const theme = useMemo(() => {
    if (isPlayer1) {
      return {
        accent: "text-blue-400",
        border: "border-blue-500/20",
        strongBorder:
          "border-blue-500/40",
        background: "bg-blue-950/10",
        button:
          "bg-blue-600 hover:bg-blue-500",
        progress: "bg-blue-500",
      };
    }

    return {
      accent: "text-red-400",
      border: "border-red-500/20",
      strongBorder:
        "border-red-500/40",
      background: "bg-red-950/10",
      button:
        "bg-red-600 hover:bg-red-500",
      progress: "bg-red-500",
    };
  }, [isPlayer1]);

  useEffect(() => {
    setCurrentCard(null);
    setTeam({});
    setDrawnCount(0);
    setRevealed(false);
    setOpponentProgress(0);
    setAssigning(false);
    setError("");
    setDisconnected(false);

    setStatus(
      selectedArena?.name
        ? `${selectedArena.name} draft started.`
        : "Draw a card to begin.",
    );
  }, [
    match?.roomId,
    selectedArena?.name,
  ]);

  useEffect(() => {
    if (
      !match?.roomId ||
      !currentUserId
    ) {
      return;
    }

    const roomId = String(match.roomId);
    const userId = String(currentUserId);

    const handleDraftStarted = (
      data = {},
    ) => {
      if (
        data?.roomId &&
        String(data.roomId) !== roomId
      ) {
        return;
      }

      const serverArena =
        data?.arena || selectedArena;

      setStatus(
        serverArena?.name
          ? `${serverArena.name} draft started.`
          : "Draft started.",
      );

      setError("");
      setDisconnected(false);

      setCurrentCard(null);
      setRevealed(false);
      setAssigning(false);
      setDrawnCount(0);
      setOpponentProgress(0);
      setTeam({});
    };

    const handleCardDrawn = ({
      roomId: eventRoomId,
      card,
      drawnCount: count,
    } = {}) => {
      if (
        eventRoomId &&
        String(eventRoomId) !== roomId
      ) {
        return;
      }

      if (!card) {
        return;
      }

      setCurrentCard(card);

      setDrawnCount(
        Math.min(
          CARDS_PER_PLAYER,
          Number(count) || 0,
        ),
      );

      setRevealed(false);
      setAssigning(false);
      setError("");

      setStatus(
        "Reveal your card, then choose a position.",
      );
    };

    const handleOpponentProgress = ({
      userId: progressUserId,
      drawnCount: count,
    } = {}) => {
      if (
        String(progressUserId) === userId
      ) {
        return;
      }

      setOpponentProgress(
        Math.min(
          CARDS_PER_PLAYER,
          Number(count) || 0,
        ),
      );
    };

    const handleTeamUpdated = ({
      userId: updatedUserId,
      team: updatedTeam,
      filled,
      completed,
    } = {}) => {
      const isMe =
        String(updatedUserId) === userId;

      if (isMe) {
        const safeTeam =
          updatedTeam || {};

        const teamSize =
          Object.keys(
            safeTeam,
          ).length;

        setTeam(safeTeam);
        setAssigning(false);
        setCurrentCard(null);
        setRevealed(false);

        setDrawnCount(
          Math.min(
            CARDS_PER_PLAYER,
            Number(filled) ||
              teamSize ||
              0,
          ),
        );

        setStatus(
          completed ||
            teamSize >=
              positions.length
            ? "Team complete. Waiting for opponent..."
            : "Card assigned. Draw your next card.",
        );

        return;
      }

      setOpponentProgress(
        Math.min(
          CARDS_PER_PLAYER,
          Number(filled) || 0,
        ),
      );
    };

    const handleDraftComplete = ({
      roomId: eventRoomId,
    } = {}) => {
      if (
        eventRoomId &&
        String(eventRoomId) !== roomId
      ) {
        return;
      }

      setCurrentCard(null);
      setRevealed(false);
      setAssigning(false);
      setOpponentProgress(
        CARDS_PER_PLAYER,
      );

      setStatus(
        "Both teams are complete. Preparing battle...",
      );
    };

    const handleBattleReady = ({
      roomId: eventRoomId,
    } = {}) => {
      if (
        eventRoomId &&
        String(eventRoomId) !== roomId
      ) {
        return;
      }

      setCurrentCard(null);
      setRevealed(false);
      setAssigning(false);
      setStatus("Battle is ready.");

      onComplete?.();
    };

    const handleRoomError = (
      message,
    ) => {
      setAssigning(false);
      setError(
        message ||
          "Online draft error.",
      );
      setStatus("Action failed.");
    };

    const handleOpponentLeft = () => {
      setDisconnected(true);
      setAssigning(false);
      setStatus(
        "Opponent disconnected.",
      );
      setError(
        "The opponent left the match.",
      );
    };

    socket.on(
      "online-draft-started",
      handleDraftStarted,
    );

    socket.on(
      "online-card-drawn",
      handleCardDrawn,
    );

    socket.on(
      "opponent-draft-progress",
      handleOpponentProgress,
    );

    socket.on(
      "online-team-updated",
      handleTeamUpdated,
    );

    socket.on(
      "online-draft-complete",
      handleDraftComplete,
    );

    socket.on(
      "online-battle-ready",
      handleBattleReady,
    );

    socket.on(
      "room-error",
      handleRoomError,
    );

    socket.on(
      "opponent-left",
      handleOpponentLeft,
    );

    return () => {
      socket.off(
        "online-draft-started",
        handleDraftStarted,
      );

      socket.off(
        "online-card-drawn",
        handleCardDrawn,
      );

      socket.off(
        "opponent-draft-progress",
        handleOpponentProgress,
      );

      socket.off(
        "online-team-updated",
        handleTeamUpdated,
      );

      socket.off(
        "online-draft-complete",
        handleDraftComplete,
      );

      socket.off(
        "online-battle-ready",
        handleBattleReady,
      );

      socket.off(
        "room-error",
        handleRoomError,
      );

      socket.off(
        "opponent-left",
        handleOpponentLeft,
      );
    };
  }, [
    match?.roomId,
    currentUserId,
    selectedArena?.name,
    onComplete,
  ]);

  const handleDraw = () => {
    if (
      !match?.roomId ||
      disconnected ||
      assigning
    ) {
      return;
    }

    if (!socket.connected) {
      setError(
        "Socket is not connected.",
      );
      return;
    }

    if (currentCard) {
      setStatus(
        "Assign your current card first.",
      );
      return;
    }

    if (
      drawnCount >=
      CARDS_PER_PLAYER
    ) {
      setStatus(
        "You already drew all 10 cards.",
      );
      return;
    }

    setError("");
    setStatus("Drawing card...");

    socket.emit(
      "online-draw-card",
      {
        roomId: match.roomId,
      },
    );
  };

  const handleReveal = () => {
    if (
      !currentCard ||
      disconnected
    ) {
      return;
    }

    setRevealed(true);

    setStatus(
      "Card revealed. Choose a position.",
    );
  };

  const handleCardFlip = (
    isFlipped,
  ) => {
    setRevealed(
      Boolean(isFlipped),
    );
  };

  const handlePositionSelect = (
    positionId,
  ) => {
    if (
      !currentCard ||
      disconnected ||
      assigning
    ) {
      return;
    }

    if (!revealed) {
      setStatus(
        "Reveal the card first.",
      );
      return;
    }

    if (team[positionId]) {
      setStatus(
        "That position is already filled.",
      );
      return;
    }

    setAssigning(true);
    setError("");
    setStatus("Assigning card...");

    socket.emit(
      "online-select-position",
      {
        roomId: match.roomId,
        positionId,
      },
    );
  };

  const handleLeave = () => {
    if (match?.roomId) {
      socket.emit(
        "leave-online-match",
        {
          roomId: match.roomId,
        },
      );
    }

    onBack?.();
  };

  const myTeamSize =
    Object.keys(team).length;

  const myTeamComplete =
    myTeamSize >=
    positions.length;

  const opponentComplete =
    opponentProgress >=
    CARDS_PER_PLAYER;

  return (
    <div className="min-h-screen bg-[#0d0715] px-3 py-5 text-white sm:px-5">
      <div className="mx-auto max-w-6xl">

        <div className="mb-5 flex items-center justify-between">
          <div>
            <p
              className={`text-[9px] font-bold uppercase tracking-[0.25em] ${theme.accent}`}
            >
              Online Draft
            </p>

            <h1 className="mt-1 text-2xl font-black sm:text-3xl">
              Build Your Team
            </h1>

            <p className="mt-1 text-xs text-gray-600">
              {selectedArena?.name ||
                "Online Arena"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLeave}
            className="rounded-lg border border-gray-800 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 transition hover:border-red-500/30 hover:text-red-400"
          >
            Leave
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <ProgressCard
            label="YOU"
            value={drawnCount}
            max={10}
            color="blue"
          />

          <ProgressCard
            label={
              opponent?.username ||
              "OPPONENT"
            }
            value={opponentProgress}
            max={10}
            color="red"
          />
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-500/20 bg-red-950/20 px-4 py-3 text-center text-xs font-bold text-red-400">
            {error}
          </div>
        )}

        <div className="grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">

          <div
            className={`rounded-2xl border ${theme.border} ${theme.background} p-4`}
          >
            <div className="mb-4 text-center">
              <p
                className={`text-[9px] font-black uppercase tracking-[0.25em] ${theme.accent}`}
              >
                Current Card
              </p>

              <p className="mt-1 text-xs text-gray-600">
                {currentCard
                  ? "Reveal and assign"
                  : "Draw your next card"}
              </p>
            </div>

            {currentCard ? (
              <>
                <div className="flex justify-center">
                  <div
                    className="origin-top scale-[0.76]"
                    onClick={
                      !revealed
                        ? handleReveal
                        : undefined
                    }
                  >
                    <AnimeCard
                      key={currentCard.id}
                      card={currentCard}
                      onFlip={handleCardFlip}
                    />
                  </div>
                </div>

                <div className="-mt-16 text-center">
                  {!revealed && (
                    <p
                      className={`text-[9px] font-bold uppercase tracking-widest ${theme.accent}`}
                    >
                      Click card to reveal
                    </p>
                  )}

                  {revealed && !assigning && (
                    <p className="text-[9px] font-bold uppercase tracking-widest text-green-400">
                      Card revealed
                    </p>
                  )}

                  {assigning && (
                    <p className="text-[9px] font-bold uppercase tracking-widest text-yellow-400">
                      Assigning...
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div
                  className={`mx-auto flex aspect-[7.5/10] w-[210px] items-center justify-center rounded-2xl border border-dashed ${theme.strongBorder} bg-black/20`}
                >
                  <div className="text-center">
                    <div className="mx-auto h-12 w-12 rounded-xl border border-gray-800 bg-black/30" />

                    <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-gray-600">
                      {myTeamComplete
                        ? "Draft Complete"
                        : "No Card"}
                    </p>
                  </div>
                </div>

                {!myTeamComplete && (
                  <button
                    type="button"
                    onClick={handleDraw}
                    disabled={disconnected}
                    className={`mt-4 w-full rounded-lg py-3 text-xs font-black uppercase tracking-widest text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 ${theme.button}`}
                  >
                    Draw Card
                  </button>
                )}
              </>
            )}
          </div>

          <div className="rounded-2xl border border-gray-800 bg-black/20 p-4">

            <div className="mb-5 text-center">
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-purple-400">
                Team Formation
              </p>

              <h2 className="mt-1 text-xl font-black">
                Select Position
              </h2>

              <p className="mt-1 text-xs text-gray-600">
                {revealed
                  ? "Choose an empty position for your card."
                  : "Reveal your card to continue."}
              </p>
            </div>

            {revealed &&
            currentCard ? (
              <div className="min-h-[280px]">
                <PositionSelector
                  currentTeam={team}
                  onSelectPosition={
                    handlePositionSelect
                  }
                />
              </div>
            ) : (
              <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-gray-800 bg-[#100a17]">
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 rounded-full border border-purple-500/20 bg-purple-500/5" />

                  <p className="mt-4 text-sm font-black text-gray-600">
                    POSITION SELECTOR
                  </p>

                  <p className="mt-2 max-w-xs text-xs leading-5 text-gray-700">
                    Draw and reveal a card before
                    choosing its position.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-gray-800 bg-black/20 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p
                className={`text-[9px] font-black uppercase tracking-[0.2em] ${theme.accent}`}
              >
                Your Team
              </p>

              <p className="mt-1 text-sm font-black">
                {myTeamSize} /{" "}
                {positions.length} Positions
              </p>
            </div>

            <span
              className={`rounded-lg border px-3 py-1.5 text-[9px] font-black uppercase tracking-widest ${
                myTeamComplete
                  ? "border-green-500/20 bg-green-500/5 text-green-400"
                  : "border-gray-800 text-gray-600"
              }`}
            >
              {myTeamComplete
                ? "Complete"
                : "In Progress"}
            </span>
          </div>

          <TeamPositions
            player="YOU"
            currentTeam={team}
          />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StatusBox
            label="Your Status"
            value={
              myTeamComplete
                ? "Team complete"
                : status
            }
            color="blue"
          />

          <StatusBox
            label="Opponent"
            value={
              disconnected
                ? "Disconnected"
                : opponentComplete
                  ? "Team complete"
                  : `${opponentProgress}/10 cards`
            }
            color="red"
          />
        </div>

        {myTeamComplete &&
          opponentComplete && (
            <div className="mt-5 rounded-xl border border-green-500/20 bg-green-950/10 px-4 py-3 text-center">
              <p className="text-xs font-black uppercase tracking-widest text-green-400">
                Both Teams Complete
              </p>

              <p className="mt-1 text-xs text-gray-600">
                Preparing battle...
              </p>
            </div>
          )}
      </div>
    </div>
  );
}

function ProgressCard({
  label,
  value,
  max,
  color,
}) {
  const isBlue = color === "blue";

  const percentage =
    Math.min(
      (value / Math.max(max, 1)) *
        100,
      100,
    );

  return (
    <div className="rounded-xl border border-gray-800 bg-black/20 px-4 py-3">
      <div className="flex items-center justify-between">
        <span
          className={`text-[9px] font-black uppercase tracking-widest ${
            isBlue
              ? "text-blue-400"
              : "text-red-400"
          }`}
        >
          {label}
        </span>

        <span className="text-xs font-black text-gray-400">
          {value}/{max}
        </span>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-900">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isBlue
              ? "bg-blue-500"
              : "bg-red-500"
          }`}
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

function StatusBox({
  label,
  value,
  color,
}) {
  const isBlue = color === "blue";

  return (
    <div className="rounded-xl border border-gray-800 bg-black/20 px-4 py-3">
      <p
        className={`text-[8px] font-black uppercase tracking-widest ${
          isBlue
            ? "text-blue-400"
            : "text-red-400"
        }`}
      >
        {label}
      </p>

      <p className="mt-1 text-xs font-bold text-gray-400">
        {value}
      </p>
    </div>
  );
}

export default OnlineDraftScreen;