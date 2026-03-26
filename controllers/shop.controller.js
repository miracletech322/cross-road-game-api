const shopService = require('../services/shop.service');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const buyShield = asyncHandler(async (req, res) => {
  const result = await shopService.buyShield(req.user.id);
  return res.json(result);
});

/** Revive after death (buyback): deduct credits if enough. */
const reviveBuyback = asyncHandler(async (req, res) => {
  const result = await shopService.reviveBuyback(req.user.id);
  return res.json(result);
});

const buyCharacter = asyncHandler(async (req, res) => {
  const { characterId } = req.body || {};
  const result = await shopService.buyCharacter(req.user.id, characterId);
  return res.json(result);
});

const buyAdblock = asyncHandler(async (req, res) => {
  const result = await shopService.buyAdblock(req.user.id);
  return res.json(result);
});

module.exports = {
  buyShield,
  reviveBuyback,
  buyCharacter,
  buyAdblock,
};
