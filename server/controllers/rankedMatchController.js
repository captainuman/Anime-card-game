async function startRankedMatch(req, res) {
  return res.status(410).json({
    message:
      "The HTTP ranked match system has been retired. Ranked matches are now handled through Socket.IO PvP.",
  });
}

async function finishRankedMatch(req, res) {
  return res.status(410).json({
    message:
      "The HTTP ranked match system has been retired. Ranked match results are now processed through Socket.IO PvP.",
  });
}

module.exports = {
  startRankedMatch,
  finishRankedMatch,
};