export const INITIAL_HP = 100;
export const MAX_POWER = 100;
export const MIN_POWER = 1;

function normalizePositionName(
  positionName
) {
  const value = String(
    positionName || ""
  )
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");

  switch (value) {
    case "captain":
      return "captain";
    case "vice-captain":
    case "vice captain":
      return "vice-captain";
    case "swordsman":
      return "swordsman";
    case "warrior":
      return "warrior";
    case "tank":
      return "tank";
    case "mage":
      return "mage";
    case "support":
      return "support";
    case "healer":
      return "healer";
    case "race":
      return "race";
    case "traitor":
      return "traitor";
    default:
      return value;
  }
}

export function normalizePower(
  value
) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return MIN_POWER;
  }

  return Math.max(
    MIN_POWER,
    Math.min(
      MAX_POWER,
      Math.round(number)
    )
  );
}

export function normalizeHP(
  value
) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return INITIAL_HP;
  }

  return Math.max(
    0,
    Math.min(
      INITIAL_HP,
      number
    )
  );
}

export function getPositionPower(
  card,
  positionName
) {
  if (!card) {
    return MIN_POWER;
  }

  const general =
    card.general || {};

  const roles =
    card.roles || {};

  const specialRole =
    card.specialRole || {};

  const overallPower =
    normalizePower(
      card.overallPower
    );

  const position =
    normalizePositionName(
      positionName
    );

  switch (position) {
    case "captain":
      return normalizePower(
        (
          overallPower +
          normalizePower(
            general.leadership
          )
        ) / 2
      );

    case "vice-captain":
      return normalizePower(
        (
          normalizePower(
            general.speed
          ) +
          normalizePower(
            general.strength
          ) +
          normalizePower(
            general.intelligence
          )
        ) / 3
      );

    case "swordsman":
      return normalizePower(
        roles.swordsman
      );

    case "warrior":
      return normalizePower(
        roles.warrior
      );

    case "tank":
      return normalizePower(
        roles.tank
      );

    case "mage":
      return normalizePower(
        roles.mage
      );

    case "support":
      return normalizePower(
        specialRole.power
      );

    case "healer":
      return normalizePower(
        roles.healer
      );

    case "race":
      return normalizePower(
        general.race
      );

    case "traitor": {
      const categories =
        Array.isArray(
          card.powerCategories
        )
          ? card.powerCategories
          : [];

      if (
        categories.length === 0
      ) {
        return MIN_POWER;
      }

      const total =
        categories.reduce(
          (sum, category) =>
            sum +
            normalizePower(
              category?.power
            ),
          0
        );

      return normalizePower(
        total /
          categories.length
      );
    }

    default:
      return overallPower;
  }
}

export function calculateDamage(
  player1Power,
  player2Power
) {
  const p1 =
    normalizePower(
      player1Power
    );

  const p2 =
    normalizePower(
      player2Power
    );

  return Math.abs(p1 - p2);
}

export function fightPosition({
  player1Card,
  player2Card,
  positionName,
  icon = "",
  traitor = false,
}) {
  const position =
    normalizePositionName(
      positionName
    );

  const player1Power =
    getPositionPower(
      player1Card,
      position
    );

  const player2Power =
    getPositionPower(
      player2Card,
      position
    );

  const isTraitor =
    traitor ||
    position === "traitor";

  if (
    player1Power ===
    player2Power
  ) {
    return {
      position,
      positionName: position,
      icon,
      player1Card,
      player2Card,
      player1Power,
      player2Power,
      winner: "draw",
      damage: 0,
      damagedPlayer: null,
      pointTo: null,
      traitor: isTraitor,
    };
  }

  const winner =
    player1Power >
    player2Power
      ? "player1"
      : "player2";

  const damage =
    calculateDamage(
      player1Power,
      player2Power
    );

  const damagedPlayer =
    isTraitor
      ? winner
      : winner === "player1"
        ? "player2"
        : "player1";

  const pointTo =
    isTraitor
      ? winner === "player1"
        ? "player2"
        : "player1"
      : winner;

  return {
    position,
    positionName: position,
    icon,
    player1Card,
    player2Card,
    player1Power,
    player2Power,
    winner,
    damage,
    damagedPlayer,
    pointTo,
    traitor: isTraitor,
  };
}

export function applyBattleDamage({
  player1HP = INITIAL_HP,
  player2HP = INITIAL_HP,
  result,
}) {
  let newPlayer1HP =
    normalizeHP(player1HP);

  let newPlayer2HP =
    normalizeHP(player2HP);

  if (!result) {
    return {
      player1HP: newPlayer1HP,
      player2HP: newPlayer2HP,
      damage: 0,
      damagedPlayer: null,
    };
  }

  if (
    result.winner ===
    "draw"
  ) {
    return {
      player1HP: newPlayer1HP,
      player2HP: newPlayer2HP,
      damage: 0,
      damagedPlayer: null,
    };
  }

  const damage = Math.max(
    0,
    Math.min(
      MAX_POWER,
      Number(result.damage) || 0
    )
  );

  if (
    result.traitor
  ) {
    if (
      result.winner ===
      "player1"
    ) {
      newPlayer1HP =
        Math.max(
          0,
          newPlayer1HP -
            damage
        );
    } else {
      newPlayer2HP =
        Math.max(
          0,
          newPlayer2HP -
            damage
        );
    }

    return {
      player1HP: newPlayer1HP,
      player2HP: newPlayer2HP,
      damage,
      damagedPlayer:
        result.winner,
    };
  }

  if (
    result.winner ===
    "player1"
  ) {
    newPlayer2HP =
      Math.max(
        0,
        newPlayer2HP -
          damage
      );
  } else {
    newPlayer1HP =
      Math.max(
        0,
        newPlayer1HP -
          damage
      );
  }

  return {
    player1HP: newPlayer1HP,
    player2HP: newPlayer2HP,
    damage,
    damagedPlayer:
      result.winner ===
      "player1"
        ? "player2"
        : "player1",
  };
}

export function checkMatchWinner(
  player1HP,
  player2HP
) {
  const p1 =
    normalizeHP(player1HP);

  const p2 =
    normalizeHP(player2HP);

  if (
    p1 === 0 &&
    p2 === 0
  ) {
    return "draw";
  }

  if (p1 === 0) {
    return "player2";
  }

  if (p2 === 0) {
    return "player1";
  }

  return null;
}

export function getFinalMatchResult({
  player1HP,
  player2HP,
}) {
  const p1 =
    normalizeHP(player1HP);

  const p2 =
    normalizeHP(player2HP);

  if (p1 > p2) {
    return "player1";
  }

  if (p2 > p1) {
    return "player2";
  }

  return "draw";
}

export function getFinalMatchDetails({
  player1HP,
  player2HP,
}) {
  const p1 =
    normalizeHP(player1HP);

  const p2 =
    normalizeHP(player2HP);

  const winner =
    getFinalMatchResult({
      player1HP: p1,
      player2HP: p2,
    });

  return {
    winner,
    player1HP: p1,
    player2HP: p2,
    hpDifference:
      Math.abs(p1 - p2),
    remainingHP:
      winner === "player1"
        ? p1
        : winner === "player2"
          ? p2
          : p1,
    losingPlayer:
      winner === "player1"
        ? "player2"
        : winner === "player2"
          ? "player1"
          : null,
  };
}

export function resetHP() {
  return {
    player1HP: INITIAL_HP,
    player2HP: INITIAL_HP,
  };
}

export function executeBattle({
  player1Card,
  player2Card,
  positionName,
  icon = "",
  traitor = false,
  player1HP = INITIAL_HP,
  player2HP = INITIAL_HP,
}) {
  const safePlayer1HP =
    normalizeHP(
      player1HP
    );

  const safePlayer2HP =
    normalizeHP(
      player2HP
    );

  const result =
    fightPosition({
      player1Card,
      player2Card,
      positionName,
      icon,
      traitor,
    });

  const hpResult =
    applyBattleDamage({
      player1HP:
        safePlayer1HP,
      player2HP:
        safePlayer2HP,
      result,
    });

  const matchWinner =
    checkMatchWinner(
      hpResult.player1HP,
      hpResult.player2HP
    );

  return {
    ...result,
    previousPlayer1HP:
      safePlayer1HP,
    previousPlayer2HP:
      safePlayer2HP,
    player1HP:
      hpResult.player1HP,
    player2HP:
      hpResult.player2HP,
    damage:
      hpResult.damage,
    damagedPlayer:
      hpResult.damagedPlayer,
    matchWinner,
    matchEnded:
      matchWinner !== null,
  };
}
