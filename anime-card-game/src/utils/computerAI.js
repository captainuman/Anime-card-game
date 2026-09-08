import { positions } from "../data/positions";
import { getPositionPower } from "./battleEngine";
import { drawRandomCard } from "./randomDraw";

export function createComputerTeam(
  cards
) {
  const computerDrawn = [];
  const computerTeam = {};

  if (
    !Array.isArray(cards) ||
    cards.length === 0
  ) {
    return {
      drawn: [],
      team: {},
    };
  }

  for (
    let i = 0;
    i < positions.length;
    i++
  ) {
    const card =
      drawRandomCard(
        cards,
        computerDrawn
      );

    if (!card) {
      break;
    }

    computerDrawn.push(card);
  }

  const remainingCards = [
    ...computerDrawn,
  ];

  const remainingPositions = [
    ...positions,
  ];

  while (
    remainingCards.length > 0 &&
    remainingPositions.length > 0
  ) {
    let bestCard = null;
    let bestPosition = null;
    let bestPower = -1;

    remainingCards.forEach(
      (card) => {
        remainingPositions.forEach(
          (position) => {
            const power =
              getPositionPower(
                card,
                position.name
              );

            if (
              power > bestPower
            ) {
              bestPower = power;
              bestCard = card;
              bestPosition = position;
            }
          }
        );
      }
    );

    if (
      !bestCard ||
      !bestPosition
    ) {
      break;
    }

    computerTeam[
      bestPosition.id
    ] = bestCard;

    const cardIndex =
      remainingCards.indexOf(
        bestCard
      );

    if (cardIndex !== -1) {
      remainingCards.splice(
        cardIndex,
        1
      );
    }

    const positionIndex =
      remainingPositions.indexOf(
        bestPosition
      );

    if (positionIndex !== -1) {
      remainingPositions.splice(
        positionIndex,
        1
      );
    }
  }

  return {
    drawn: computerDrawn,
    team: computerTeam,
  };
}
