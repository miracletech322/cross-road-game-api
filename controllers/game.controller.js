const gameService = require('../services/game.service');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const getInfo = asyncHandler(async (req, res) => {
  const info = await gameService.getInfo(req.user.id);
  return res.json(info);
});

const submitGameEnd = asyncHandler(async (req, res) => {
  const { maxScore } = req.body || {};
  const info = await gameService.submitGameEnd(req.user.id, { maxScore });
  return res.json(info);
});

module.exports = {
  getInfo,
  submitGameEnd,
};
