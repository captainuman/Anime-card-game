export function drawRandomCard(
  cards,
  drawnCards
) {
  const availableCards =
    cards.filter(
      (card) =>
        !drawnCards.some(
          (drawn) =>
            drawn.id === card.id
        )
    );

  if (
    availableCards.length === 0
  ) {
    return null;
  }

  const randomIndex =
    Math.floor(
      Math.random() *
        availableCards.length
    );

  return availableCards[
    randomIndex
  ];
}
