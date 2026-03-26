const User = require('../models/user.model');
const ShopPurchase = require('../models/shopPurchase.model');

const COSTS = {
  shield: Number(process.env.SHIELD_CREDIT_COST ?? 10),
  buyback: Number(process.env.BUYBACK_CREDIT_COST ?? 15),
  character: Number(process.env.CHARACTER_CREDIT_COST ?? 50),
  adblock: Number(process.env.ADBLOCK_CREDIT_COST ?? 20),
};

function getCost(type) {
  const c = COSTS[type];
  if (!Number.isFinite(c) || c < 1) {
    const err = new Error(`Invalid shop price for ${type}`);
    err.statusCode = 500;
    throw err;
  }
  return Math.floor(c);
}

async function recordPurchase(userId, type, creditsSpent, meta) {
  const doc = await ShopPurchase.create({
    userId,
    type,
    creditsSpent,
    meta: meta && Object.keys(meta).length ? meta : undefined,
  });
  return doc._id.toString();
}

/**
 * Buy shield: +1 shield count, deduct credits.
 */
async function buyShield(userId) {
  const cost = getCost('shield');
  const user = await User.findOneAndUpdate(
    { _id: userId, credits: { $gte: cost } },
    { $inc: { credits: -cost, shieldCount: 1 } },
    { new: true }
  ).select('_id');

  if (!user) {
    const err = new Error('Insufficient credits');
    err.statusCode = 402;
    throw err;
  }

  const purchaseId = await recordPurchase(userId, 'shield', cost, {});
  return { type: 'shield', creditsSpent: cost, purchaseId };
}

/**
 * Buy character: must pass characterId; cannot buy same character twice (atomic $nin + $addToSet).
 */
async function buyCharacter(userId, characterId) {
  if (typeof characterId !== 'string' || !characterId.trim()) {
    const err = new Error('characterId is required');
    err.statusCode = 400;
    throw err;
  }
  const id = characterId.trim();

  const cost = getCost('character');
  const user = await User.findOneAndUpdate(
    {
      _id: userId,
      credits: { $gte: cost },
      purchasedCharacterIds: { $nin: [id] },
    },
    { $inc: { credits: -cost }, $addToSet: { purchasedCharacterIds: id } },
    { new: true }
  ).select('_id');

  if (!user) {
    const u = await User.findById(userId).select('credits purchasedCharacterIds');
    if (!u) {
      const err = new Error('user not found');
      err.statusCode = 404;
      throw err;
    }
    if ((u.purchasedCharacterIds || []).includes(id)) {
      const err = new Error('Character already owned');
      err.statusCode = 409;
      throw err;
    }
    const err = new Error('Insufficient credits');
    err.statusCode = 402;
    throw err;
  }

  const purchaseId = await recordPurchase(userId, 'character', cost, { characterId: id });
  return { type: 'character', creditsSpent: cost, characterId: id, purchaseId };
}

/**
 * Buy adblock: one-time unlock.
 */
async function buyAdblock(userId) {
  const u = await User.findById(userId).select('adblockEnabled');
  if (!u) {
    const err = new Error('user not found');
    err.statusCode = 404;
    throw err;
  }
  if (u.adblockEnabled) {
    const err = new Error('Adblock already purchased');
    err.statusCode = 409;
    throw err;
  }

  const cost = getCost('adblock');
  const user = await User.findOneAndUpdate(
    { _id: userId, credits: { $gte: cost }, adblockEnabled: false },
    { $inc: { credits: -cost }, $set: { adblockEnabled: true } },
    { new: true }
  ).select('_id');

  if (!user) {
    const err = new Error('Insufficient credits');
    err.statusCode = 402;
    throw err;
  }

  const purchaseId = await recordPurchase(userId, 'adblock', cost, {});
  return { type: 'adblock', creditsSpent: cost, purchaseId };
}

module.exports = {
  buyShield,
  buyCharacter,
  buyAdblock,
  COSTS,
};
