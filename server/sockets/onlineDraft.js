const Card = require("../models/Card");
const { positions } = require("../data/positions");

const {
  getOnlineMatch,
  ONLINE_INITIAL_HP,
} = require("./onlineMatch");

const ONLINE_POSITIONS = positions;
const CARDS_PER_PLAYER = 10;
const MIN_CARDS_REQUIRED = CARDS_PER_PLAYER * 2;

function getAuthenticatedUserId(socket) {
  const userId =
    socket?.user?.id ||
    socket?.userId;

  if (!userId) {
    return null;
  }

  return String(userId);
}

function getMatchPlayer(socket, match) {
  if (
    !socket ||
    !match ||
    !Array.isArray(match.players)
  ) {
    return null;
  }

  const authenticatedUserId =
    getAuthenticatedUserId(socket);

  if (!authenticatedUserId) {
    return null;
  }

  return (
    match.players.find(
      (player) =>
        String(player.userId) ===
          authenticatedUserId &&
        String(player.socketId) ===
          String(socket.id),
    ) || null
  );
}

function isAuthenticatedMatchPlayer(
  socket,
  match,
) {
  return Boolean(
    getMatchPlayer(socket, match),
  );
}

function createPublicTeam(team) {
  const publicTeam = {};

  for (const [
    positionId,
    card,
  ] of Object.entries(team || {})) {
    publicTeam[positionId] = {
      id: card?.id || null,
      name: card?.name || "",
      anime: card?.anime || "",
      image: card?.image || "",
    };
  }

  return publicTeam;
}

function normalizeArena(arena) {
  if (!arena) {
    return null;
  }

  const id =
    arena?.id != null
      ? String(arena.id).trim()
      : "";

  const name = String(
    arena?.name || "",
  ).trim();

  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    image: String(arena?.image || ""),
  };
}

function hasValidCompletedTeam(team) {
  if (
    !team ||
    typeof team !== "object" ||
    Array.isArray(team)
  ) {
    return false;
  }

  const positionIds = Object.keys(team);

  if (
    positionIds.length !==
    CARDS_PER_PLAYER
  ) {
    return false;
  }

  const validPositionIds =
    new Set(
      ONLINE_POSITIONS.map(
        (position) => position.id,
      ),
    );

  if (
    positionIds.some(
      (positionId) =>
        !validPositionIds.has(positionId),
    )
  ) {
    return false;
  }

  const cardIds = positionIds
    .map(
      (positionId) =>
        team[positionId]?.id,
    )
    .filter(Boolean)
    .map(String);

  if (
    cardIds.length !==
    CARDS_PER_PLAYER
  ) {
    return false;
  }

  if (
    new Set(cardIds).size !==
    CARDS_PER_PLAYER
  ) {
    return false;
  }

  return ONLINE_POSITIONS.every(
    (position) =>
      Object.prototype.hasOwnProperty.call(
        team,
        position.id,
      ),
  );
}

async function initializeOnlineDraft(match) {
  if (!match) {
    throw new Error(
      "Online match not found.",
    );
  }

  if (
    !Array.isArray(match.players) ||
    match.players.length !== 2
  ) {
    throw new Error(
      "Online match must contain exactly two players.",
    );
  }

  const playerUserIds =
    match.players.map((player) =>
      String(player.userId),
    );

  if (
    new Set(playerUserIds).size !== 2
  ) {
    throw new Error(
      "Online match requires two different players.",
    );
  }

  const arena = normalizeArena(
    match.arena,
  );

  if (!arena) {
    throw new Error(
      "Match arena is missing.",
    );
  }

  if (
    match.phase === "draft" &&
    match.draft?.cardPool?.length > 0
  ) {
    return match;
  }

  const cards = await Card.find({
    anime: arena.name,
  }).lean();

  if (!Array.isArray(cards)) {
    throw new Error(
      "Unable to load arena cards.",
    );
  }

  const uniqueCards = [];
  const cardIds = new Set();

  for (const card of cards) {
    if (!card?.id) {
      continue;
    }

    const cardId = String(card.id);

    if (cardIds.has(cardId)) {
      continue;
    }

    cardIds.add(cardId);
    uniqueCards.push(card);
  }

  if (
    uniqueCards.length <
    MIN_CARDS_REQUIRED
  ) {
    throw new Error(
      `${arena.name} needs at least ${MIN_CARDS_REQUIRED} unique cards for online battle.`,
    );
  }

  match.arena = arena;

  match.draft = {
    cardPool: uniqueCards,
    usedCardIds: new Set(),
    players: {},
  };

  for (const player of match.players) {
    const userId = String(
      player.userId,
    );

    match.draft.players[userId] = {
      userId,
      socketId: String(
        player.socketId,
      ),
      username:
        String(
          player.username ||
            "Player",
        ).trim() || "Player",
      drawn: [],
      team: {},
      pendingCard: null,
      completed: false,
    };
  }

  match.player1Team = {};
  match.player2Team = {};

  match.player1HP =
    ONLINE_INITIAL_HP;
  match.player2HP =
    ONLINE_INITIAL_HP;

  match.player1Score = 0;
  match.player2Score = 0;

  match.currentBattle = 0;
  match.battleRevealed = false;
  match.nextBattleLocked = false;
  match.results = [];

  match.phase = "draft";

  return match;
}

function emitDraftStarted(
  io,
  roomId,
  match,
) {
  io.to(roomId).emit(
    "online-draft-started",
    {
      roomId,
      arena: match.arena,
      cardsPerPlayer:
        CARDS_PER_PLAYER,
    },
  );
}

function registerOnlineDraft(
  io,
  socket,
) {
  socket.on(
    "initialize-online-draft",
    async ({ roomId } = {}) => {
      try {
        if (!roomId) {
          socket.emit(
            "room-error",
            "Room ID is required.",
          );
          return;
        }

        const match =
          getOnlineMatch(roomId);

        if (!match) {
          socket.emit(
            "room-error",
            "Online match not found.",
          );
          return;
        }

        if (
          !isAuthenticatedMatchPlayer(
            socket,
            match,
          )
        ) {
          socket.emit(
            "room-error",
            "You are not authorized for this match.",
          );
          return;
        }

        if (!match.arena) {
          socket.emit(
            "room-error",
            "Arena has not been selected.",
          );
          return;
        }

        if (
          match.phase === "draft" &&
          match.draft?.cardPool?.length > 0
        ) {
          emitDraftStarted(
            io,
            roomId,
            match,
          );
          return;
        }

        await initializeOnlineDraft(
          match,
        );

        emitDraftStarted(
          io,
          roomId,
          match,
        );
      } catch (error) {
        console.error(
          "Initialize online draft failed:",
          error,
        );

        socket.emit(
          "room-error",
          error.message ||
            "Failed to initialize online draft.",
        );
      }
    },
  );

  socket.on(
    "online-draw-card",
    ({ roomId } = {}) => {
      try {
        if (!roomId) {
          socket.emit(
            "room-error",
            "Room ID is required.",
          );
          return;
        }

        const match =
          getOnlineMatch(roomId);

        if (!match) {
          socket.emit(
            "room-error",
            "Online match not found.",
          );
          return;
        }

        if (
          !isAuthenticatedMatchPlayer(
            socket,
            match,
          )
        ) {
          socket.emit(
            "room-error",
            "You are not authorized for this match.",
          );
          return;
        }

        if (
          match.phase !== "draft"
        ) {
          socket.emit(
            "room-error",
            `Draft is not active. Current phase: ${match.phase}`,
          );
          return;
        }

        const player =
          getMatchPlayer(
            socket,
            match,
          );

        if (!player) {
          socket.emit(
            "room-error",
            "You are not part of this match.",
          );
          return;
        }

        const playerDraft =
          match.draft?.players?.[
            String(player.userId)
          ];

        if (!playerDraft) {
          socket.emit(
            "room-error",
            "Your draft state could not be found.",
          );
          return;
        }

        if (playerDraft.completed) {
          socket.emit(
            "room-error",
            "Your team is already complete.",
          );
          return;
        }

        if (
          playerDraft.drawn.length >=
          CARDS_PER_PLAYER
        ) {
          socket.emit(
            "room-error",
            `You already drew all ${CARDS_PER_PLAYER} cards.`,
          );
          return;
        }

        if (playerDraft.pendingCard) {
          socket.emit(
            "room-error",
            "Assign your current card first.",
          );
          return;
        }

        const availableCards =
          match.draft.cardPool.filter(
            (card) =>
              !match.draft.usedCardIds.has(
                String(card.id),
              ),
          );

        if (
          availableCards.length === 0
        ) {
          socket.emit(
            "room-error",
            "No cards remaining.",
          );
          return;
        }

        const randomIndex =
          Math.floor(
            Math.random() *
              availableCards.length,
          );

        const card =
          availableCards[randomIndex];

        if (!card) {
          socket.emit(
            "room-error",
            "Failed to draw card.",
          );
          return;
        }

        const cardId = String(
          card.id,
        );

        match.draft.usedCardIds.add(
          cardId,
        );

        playerDraft.drawn.push(
          cardId,
        );

        playerDraft.pendingCard =
          card;

        socket.emit(
          "online-card-drawn",
          {
            roomId,
            card,
            drawnCount:
              playerDraft.drawn.length,
            remaining:
              CARDS_PER_PLAYER -
              playerDraft.drawn.length,
          },
        );

        socket
          .to(roomId)
          .emit(
            "opponent-draft-progress",
            {
              userId:
                player.userId,
              username:
                player.username,
              drawnCount:
                playerDraft.drawn.length,
            },
          );
      } catch (error) {
        console.error(
          "Online draw failed:",
          error,
        );

        socket.emit(
          "room-error",
          "Failed to draw card.",
        );
      }
    },
  );

  socket.on(
    "online-select-position",
    ({ roomId, positionId } = {}) => {
      try {
        if (!roomId) {
          socket.emit(
            "room-error",
            "Room ID is required.",
          );
          return;
        }

        const match =
          getOnlineMatch(roomId);

        if (!match) {
          socket.emit(
            "room-error",
            "Online match not found.",
          );
          return;
        }

        if (
          !isAuthenticatedMatchPlayer(
            socket,
            match,
          )
        ) {
          socket.emit(
            "room-error",
            "You are not authorized for this match.",
          );
          return;
        }

        if (
          match.phase !== "draft"
        ) {
          socket.emit(
            "room-error",
            `Draft is not active. Current phase: ${match.phase}`,
          );
          return;
        }

        const position =
          ONLINE_POSITIONS.find(
            (item) =>
              String(item.id) ===
              String(positionId),
          );

        if (!position) {
          socket.emit(
            "room-error",
            "Invalid position.",
          );
          return;
        }

        const player =
          getMatchPlayer(
            socket,
            match,
          );

        if (!player) {
          socket.emit(
            "room-error",
            "You are not part of this match.",
          );
          return;
        }

        const playerDraft =
          match.draft?.players?.[
            String(player.userId)
          ];

        if (!playerDraft) {
          socket.emit(
            "room-error",
            "Your draft state could not be found.",
          );
          return;
        }

        if (playerDraft.completed) {
          socket.emit(
            "room-error",
            "Your team is already complete.",
          );
          return;
        }

        if (
          !playerDraft.pendingCard
        ) {
          socket.emit(
            "room-error",
            "Draw a card first.",
          );
          return;
        }

        if (
          playerDraft.team[
            position.id
          ]
        ) {
          socket.emit(
            "room-error",
            "That position is already filled.",
          );
          return;
        }

        const card =
          playerDraft.pendingCard;

        if (!card?.id) {
          socket.emit(
            "room-error",
            "The pending card is invalid.",
          );
          return;
        }

        if (
          !playerDraft.drawn.includes(
            String(card.id),
          )
        ) {
          socket.emit(
            "room-error",
            "The pending card is not part of your draft.",
          );
          return;
        }

        playerDraft.team[
          position.id
        ] = card;

        playerDraft.pendingCard =
          null;

        const teamSize =
          Object.keys(
            playerDraft.team,
          ).length;

        playerDraft.completed =
          teamSize ===
          ONLINE_POSITIONS.length;

        io.to(roomId).emit(
          "online-team-updated",
          {
            userId:
              player.userId,
            username:
              player.username,
            team:
              createPublicTeam(
                playerDraft.team,
              ),
            filled: teamSize,
            completed:
              playerDraft.completed,
          },
        );

        socket
          .to(roomId)
          .emit(
            "opponent-draft-progress",
            {
              userId:
                player.userId,
              username:
                player.username,
              drawnCount: teamSize,
            },
          );

        const allComplete =
          match.players.length ===
            2 &&
          match.players.every(
            (item) => {
              const draftPlayer =
                match.draft
                  ?.players?.[
                  String(
                    item.userId,
                  )
                ];

              return (
                draftPlayer?.completed ===
                true
              );
            },
          );

        if (!allComplete) {
          return;
        }

        const player1 =
          match.players[0];

        const player2 =
          match.players[1];

        const player1Draft =
          match.draft.players[
            String(player1.userId)
          ];

        const player2Draft =
          match.draft.players[
            String(player2.userId)
          ];

        if (
          !player1Draft ||
          !player2Draft
        ) {
          socket.emit(
            "room-error",
            "Both player draft states are required.",
          );
          return;
        }

        if (
          !hasValidCompletedTeam(
            player1Draft.team,
          ) ||
          !hasValidCompletedTeam(
            player2Draft.team,
          )
        ) {
          socket.emit(
            "room-error",
            "Both teams must contain exactly 10 unique cards.",
          );
          return;
        }

        const player1CardIds =
          Object.values(
            player1Draft.team,
          ).map((card) =>
            String(card.id),
          );

        const player2CardIds =
          Object.values(
            player2Draft.team,
          ).map((card) =>
            String(card.id),
          );

        const combinedCardIds = [
          ...player1CardIds,
          ...player2CardIds,
        ];

        if (
          new Set(
            combinedCardIds,
          ).size !==
          CARDS_PER_PLAYER * 2
        ) {
          socket.emit(
            "room-error",
            "Players cannot use the same card in the same match.",
          );
          return;
        }

        match.player1Team =
          player1Draft.team;

        match.player2Team =
          player2Draft.team;

        match.phase = "battle";

        match.currentBattle = 0;

        match.player1HP =
          ONLINE_INITIAL_HP;

        match.player2HP =
          ONLINE_INITIAL_HP;

        match.player1Score = 0;
        match.player2Score = 0;

        match.results = [];

        match.battleRevealed = false;
        match.nextBattleLocked = false;

        io.to(roomId).emit(
          "online-draft-complete",
          {
            roomId,
            arena: match.arena,
            message:
              "Both teams are complete.",
          },
        );

        io.to(roomId).emit(
          "online-battle-ready",
          {
            roomId,
            arena: match.arena,
            currentBattle: 0,
            totalBattles:
              ONLINE_POSITIONS.length,
            position:
              ONLINE_POSITIONS[0],
            player1HP:
              match.player1HP,
            player2HP:
              match.player2HP,
            player1Score: 0,
            player2Score: 0,
            tournamentId:
              match.tournamentId ||
              null,
            tournamentMatchId:
              match.tournamentMatchId ||
              null,
          },
        );
      } catch (error) {
        console.error(
          "Online position assignment failed:",
          error,
        );

        socket.emit(
          "room-error",
          error.message ||
            "Failed to assign card.",
        );
      }
    },
  );
}

module.exports = {
  registerOnlineDraft,
  initializeOnlineDraft,
  createPublicTeam,
  normalizeArena,
  CARDS_PER_PLAYER,
  MIN_CARDS_REQUIRED,
};