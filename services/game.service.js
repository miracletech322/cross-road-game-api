const User = require('../models/user.model');

function toGameInfo(userDoc) {
  if (!userDoc) return null;
  const u = typeof userDoc.toObject === 'function' ? userDoc.toObject() : userDoc;
  return {
    creditRemaining: typeof u.credits === 'number' ? u.credits : 0,
    maxScore: typeof u.maxScore === 'number' ? u.maxScore : 0,
    shieldCount: typeof u.shieldCount === 'number' ? u.shieldCount : 0,
    boughtCharacters: Array.isArray(u.purchasedCharacterIds) ? u.purchasedCharacterIds : [],
    adblockStatus: Boolean(u.adblockEnabled),
  };
}

async function getInfo(userId) {
  const user = await User.findById(userId).select(
    'credits maxScore shieldCount purchasedCharacterIds adblockEnabled'
  );
  if (!user) {
    const err = new Error('user not found');
    err.statusCode = 404;
    throw err;
  }
  return toGameInfo(user);
}

async function useShield(userId) {
  const updated = await User.findOneAndUpdate(
    { _id: userId, shieldCount: { $gte: 1 } },
    { $inc: { shieldCount: -1 } },
    { new: true }
  ).select(
    'credits maxScore shieldCount purchasedCharacterIds adblockEnabled'
  );

  if (!updated) {
    const err = new Error('No shield available');
    err.statusCode = 402;
    throw err;
  }

  return {
    used: true,
    item: 'shield',
    ...toGameInfo(updated),
  };
}

async function useBuyback(userId) {
  const cost = Number(process.env.BUYBACK_CREDIT_COST ?? 15);
  if (!Number.isFinite(cost) || cost < 1) {
    const err = new Error('Invalid buyback cost configuration');
    err.statusCode = 500;
    throw err;
  }

  // Revive consumes credits directly (no token purchase).
  const updated = await User.findOneAndUpdate(
    { _id: userId, credits: { $gte: cost } },
    { $inc: { credits: -cost } },
    { new: true }
  ).select('credits maxScore shieldCount purchasedCharacterIds adblockEnabled');

  if (!updated) {
    const err = new Error('Insufficient credits');
    err.statusCode = 402;
    throw err;
  }

  // Optional audit record (keeps ShopPurchase history consistent).
  const ShopPurchase = require('../models/shopPurchase.model');
  try {
    await ShopPurchase.create({
      userId,
      type: 'buyback',
      creditsSpent: cost,
      meta: { action: 'revive' },
    });
  } catch {
    // Audit record failure should not break game revive flow.
  }

  return { used: true, item: 'buyback', ...toGameInfo(updated) };
}

async function submitGameEnd(userId, { maxScore: scoreRaw }) {
  const score = Number(scoreRaw);
  if (!Number.isFinite(score) || score < 0) {
    const err = new Error('maxScore must be a non-negative number');
    err.statusCode = 400;
    throw err;
  }

  const n = Math.floor(score);

  const updated = await User.findOneAndUpdate(
    { _id: userId },
    { $max: { maxScore: n } },
    { new: true }
  ).select('credits maxScore shieldCount purchasedCharacterIds adblockEnabled');

  if (!updated) {
    const err = new Error('user not found');
    err.statusCode = 404;
    throw err;
  }

  return toGameInfo(updated);
}

module.exports = {
  getInfo,
  useShield,
  useBuyback,
  submitGameEnd,
  toGameInfo,
};
