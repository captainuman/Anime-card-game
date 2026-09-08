const INITIAL_HP = 100;
const MAX_POWER = 100;
const MIN_POWER = 1;

function normalizePower(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return MIN_POWER;
  }

  return Math.max(
    MIN_POWER,
    Math.min(MAX_POWER, Math.round(number)),
  );
}

function normalizeHP(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return INITIAL_HP;
  }

  return Math.max(
    0,
    Math.min(INITIAL_HP, Math.round(number)),
  );
}

function getPositionPower(card, positionId) {
  if (!card) {
    return MIN_POWER;
  }

  const general = card.general || {};
  const roles = card.roles || {};
  const specialRole = card.specialRole || {};

  const overallPower = normalizePower(card.overallPower);

  switch (positionId) {
    case "captain":
      return normalizePower(
        (overallPower + normalizePower(general.leadership)) / 2,
      );

    case "vice-captain":
      return normalizePower(
        (
          normalizePower(general.speed) +
          normalizePower(general.strength) +
          normalizePower(general.intelligence)
        ) / 3,
      );

    case "swordsman":
      return normalizePower(roles.swordsman);

    case "warrior":
      return normalizePower(roles.warrior);

    case "tank":
      return normalizePower(roles.tank);

    case "mage":
      return normalizePower(roles.mage);

    case "support":
      return normalizePower(specialRole.power);

    case "healer":
      return normalizePower(roles.healer);

    case "race":
      return normalizePower(general.race);

    case "traitor": {
      const categories = Array.isArray(card.powerCategories)
        ? card.powerCategories
        : [];

      if (categories.length === 0) {
        return MIN_POWER;
      }

      const total = categories.reduce(
        (sum, category) => sum + normalizePower(category?.power),
        0,
      );

      return normalizePower(total / categories.length);
    }

    default:
      return overallPower;
  }
}

function calculateDamage(player1Power, player2Power) {
  return Math.abs(
    normalizePower(player1Power) - normalizePower(player2Power),
  );
}

function executeOnlineBattle({
  player1Card,
  player2Card,
  positionId,
  positionName = "",
  icon = "",
  player1HP = INITIAL_HP,
  player2HP = INITIAL_HP,
}) {
  const safePlayer1HP = normalizeHP(player1HP);
  const safePlayer2HP = normalizeHP(player2HP);

  const player1Power = getPositionPower(player1Card, positionId);
  const player2Power = getPositionPower(player2Card, positionId);

  const previousPlayer1HP = safePlayer1HP;
  const previousPlayer2HP = safePlayer2HP;

  if (player1Power === player2Power) {
    return {
      position: positionId,
      positionName,
      icon,
      player1Card,
      player2Card,
      player1Power,
      player2Power,
      winner: "draw",
      damage: 0,
      damagedPlayer: null,
      pointTo: null,
      traitor: false,
      previousPlayer1HP,
      previousPlayer2HP,
      player1HP: safePlayer1HP,
      player2HP: safePlayer2HP,
      matchEnded: false,
    };
  }

  const winner =
    player1Power > player2Power
      ? "player1"
      : "player2";

  const damage = calculateDamage(player1Power, player2Power);
  const isTraitor = positionId === "traitor";

  let newPlayer1HP = safePlayer1HP;
  let newPlayer2HP = safePlayer2HP;
  let damagedPlayer = null;
  let pointTo = winner;

  if (!isTraitor) {
    if (winner === "player1") {
      newPlayer2HP = Math.max(0, safePlayer2HP - damage);
      damagedPlayer = "player2";
    } else {
      newPlayer1HP = Math.max(0, safePlayer1HP - damage);
      damagedPlayer = "player1";
    }
  } else {
    pointTo = winner === "player1" ? "player2" : "player1";

    if (winner === "player1") {
      newPlayer1HP = Math.max(0, safePlayer1HP - damage);
      damagedPlayer = "player1";
    } else {
      newPlayer2HP = Math.max(0, safePlayer2HP - damage);
      damagedPlayer = "player2";
    }
  }

  const matchEnded =
    newPlayer1HP === 0 ||
    newPlayer2HP === 0;

  return {
    position: positionId,
    positionName,
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
    previousPlayer1HP,
    previousPlayer2HP,
    player1HP: newPlayer1HP,
    player2HP: newPlayer2HP,
    matchEnded,
  };
}

module.exports = {
  INITIAL_HP,
  MAX_POWER,
  MIN_POWER,
  normalizePower,
  normalizeHP,
  getPositionPower,
  calculateDamage,
  executeOnlineBattle,
};
