const adService = require('../services/ad.service');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const listAds = asyncHandler(async (req, res) => {
  const { limit } = req.query || {};
  const ads = await adService.listAds({ limit });
  return res.json({ ads });
});

const listActiveAds = asyncHandler(async (req, res) => {
  const { placement, limit } = req.query || {};
  const ads = await adService.listActiveAds({ placement, limit });
  return res.json({ ads });
});

const createAd = asyncHandler(async (req, res) => {
  const ad = await adService.createAd(req.body || {});
  return res.status(201).json({ ad });
});

const listActiveAdsForMe = asyncHandler(async (req, res) => {
  const { placement, limit } = req.query || {};
  const ads = await adService.listActiveAdsForUser(req.user.id, { placement, limit });
  return res.json({ ads });
});

const updateAd = asyncHandler(async (req, res) => {
  const ad = await adService.updateAdById(req.params.id, req.body || {});
  return res.json({ ad });
});

const deleteAd = asyncHandler(async (req, res) => {
  const ad = await adService.deleteAdById(req.params.id);
  return res.json({ ad });
});

module.exports = {
  listAds,
  listActiveAds,
  listActiveAdsForMe,
  createAd,
  updateAd,
  deleteAd,
};

