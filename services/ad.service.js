const Ad = require('../models/ad.model');
const User = require('../models/user.model');

const TYPE_VALUES = ['banner', 'interstitial', 'rewarded', 'video'];

function normalizeString(v) {
  return typeof v === 'string' ? v.trim() : v;
}

function validateAdPayload(payload, { partial = false } = {}) {
  const p = payload || {};

  if (!partial) {
    if (!normalizeString(p.title)) {
      const err = new Error('title is required');
      err.statusCode = 400;
      throw err;
    }
    if (!normalizeString(p.type) || !TYPE_VALUES.includes(p.type)) {
      const err = new Error(`type must be one of: ${TYPE_VALUES.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }
    if (!normalizeString(p.placement)) {
      const err = new Error('placement is required');
      err.statusCode = 400;
      throw err;
    }
    if (!normalizeString(p.imageUrl)) {
      const err = new Error('imageUrl is required');
      err.statusCode = 400;
      throw err;
    }
  } else {
    if (typeof p.type !== 'undefined') {
      if (!normalizeString(p.type) || !TYPE_VALUES.includes(p.type)) {
        const err = new Error(`type must be one of: ${TYPE_VALUES.join(', ')}`);
        err.statusCode = 400;
        throw err;
      }
    }
  }

  const update = {};
  if (typeof p.title !== 'undefined') update.title = normalizeString(p.title);
  if (typeof p.type !== 'undefined') update.type = p.type;
  if (typeof p.placement !== 'undefined') update.placement = normalizeString(p.placement);
  if (typeof p.imageUrl !== 'undefined') update.imageUrl = normalizeString(p.imageUrl);
  if (typeof p.linkUrl !== 'undefined') update.linkUrl = normalizeString(p.linkUrl);
  if (typeof p.enabled !== 'undefined') update.enabled = Boolean(p.enabled);
  if (typeof p.sortOrder !== 'undefined') {
    const num = Number(p.sortOrder);
    if (!Number.isFinite(num)) {
      const err = new Error('sortOrder must be a number');
      err.statusCode = 400;
      throw err;
    }
    update.sortOrder = Math.trunc(num);
  }
  if (typeof p.meta !== 'undefined') update.meta = p.meta && typeof p.meta === 'object' ? p.meta : {};

  return update;
}

async function listAds({ limit = 100 } = {}) {
  const take = Math.min(Math.max(Number(limit) || 100, 1), 500);
  const rows = await Ad.find()
    .sort({ enabled: -1, sortOrder: -1, createdAt: -1 })
    .limit(take)
    .lean();
  return rows.map((a) => ({
    id: a._id?.toString ? a._id.toString() : String(a._id),
    title: a.title,
    type: a.type,
    placement: a.placement,
    imageUrl: a.imageUrl,
    linkUrl: a.linkUrl,
    enabled: Boolean(a.enabled),
    sortOrder: typeof a.sortOrder === 'number' ? a.sortOrder : 0,
    meta: a.meta && typeof a.meta === 'object' ? a.meta : {},
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }));
}

async function listActiveAds({ placement, limit = 50 } = {}) {
  const take = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const query = { enabled: true };
  if (placement) query.placement = placement;

  const rows = await Ad.find(query)
    .sort({ sortOrder: -1, createdAt: -1 })
    .limit(take)
    .lean();

  return rows.map((a) => ({
    id: a._id?.toString ? a._id.toString() : String(a._id),
    title: a.title,
    type: a.type,
    placement: a.placement,
    imageUrl: a.imageUrl,
    linkUrl: a.linkUrl,
    enabled: Boolean(a.enabled),
    sortOrder: typeof a.sortOrder === 'number' ? a.sortOrder : 0,
    meta: a.meta && typeof a.meta === 'object' ? a.meta : {},
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }));
}

async function listActiveAdsForUser(userId, { placement, limit = 50 } = {}) {
  const user = await User.findById(userId).select('adblockEnabled');
  if (!user) {
    const err = new Error('user not found');
    err.statusCode = 404;
    throw err;
  }
  if (user.adblockEnabled) return [];
  return listActiveAds({ placement, limit });
}

async function createAd(payload) {
  const update = validateAdPayload(payload, { partial: false });
  const created = await Ad.create(update);
  return {
    id: created._id.toString(),
    title: created.title,
    type: created.type,
    placement: created.placement,
    imageUrl: created.imageUrl,
    linkUrl: created.linkUrl,
    enabled: Boolean(created.enabled),
    sortOrder: typeof created.sortOrder === 'number' ? created.sortOrder : 0,
    meta: created.meta && typeof created.meta === 'object' ? created.meta : {},
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
  };
}

async function updateAdById(id, payload) {
  const update = validateAdPayload(payload, { partial: true });
  const updated = await Ad.findByIdAndUpdate(id, { $set: update }, { new: true });

  if (!updated) {
    const err = new Error('ad not found');
    err.statusCode = 404;
    throw err;
  }

  return {
    id: updated._id.toString(),
    title: updated.title,
    type: updated.type,
    placement: updated.placement,
    imageUrl: updated.imageUrl,
    linkUrl: updated.linkUrl,
    enabled: Boolean(updated.enabled),
    sortOrder: typeof updated.sortOrder === 'number' ? updated.sortOrder : 0,
    meta: updated.meta && typeof updated.meta === 'object' ? updated.meta : {},
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

async function deleteAdById(id) {
  const deleted = await Ad.findByIdAndDelete(id);
  if (!deleted) {
    const err = new Error('ad not found');
    err.statusCode = 404;
    throw err;
  }
  return {
    id: deleted._id.toString(),
    title: deleted.title,
    type: deleted.type,
    placement: deleted.placement,
    imageUrl: deleted.imageUrl,
    linkUrl: deleted.linkUrl,
    enabled: Boolean(deleted.enabled),
    sortOrder: typeof deleted.sortOrder === 'number' ? deleted.sortOrder : 0,
    meta: deleted.meta && typeof deleted.meta === 'object' ? deleted.meta : {},
    createdAt: deleted.createdAt,
    updatedAt: deleted.updatedAt,
  };
}

module.exports = {
  listAds,
  listActiveAds,
  listActiveAdsForUser,
  createAd,
  updateAdById,
  deleteAdById,
};

