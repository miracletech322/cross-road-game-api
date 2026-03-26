const User = require('../models/user.model');

function toGameInfo(userDoc, rank) {
  if (!userDoc) return null;
  const u = typeof userDoc.toObject === 'function' ? userDoc.toObject() : userDoc;
  return {
    creditRemaining: typeof u.credits === 'number' ? u.credits : 0,
    maxScore: typeof u.maxScore === 'number' ? u.maxScore : 0,
    shieldCount: typeof u.shieldCount === 'number' ? u.shieldCount : 0,
    boughtCharacters: Array.isArray(u.purchasedCharacterIds) ? u.purchasedCharacterIds : [],
    adblockStatus: Boolean(u.adblockEnabled),
    rank: typeof rank === 'number' ? rank : 1,
  };
}

async function getUserRank(userDoc) {
  // Rank is based on (maxScore desc, _id asc). This matches `/api/game/rank` tie-breaking.
  const score = typeof userDoc?.maxScore === 'number' ? userDoc.maxScore : 0;
  const userObjectId = userDoc?._id;
  if (!userObjectId) return 1;

  const higherCount = await User.countDocuments({
    $or: [
      { maxScore: { $gt: score } },
      { maxScore: score, _id: { $lt: userObjectId } },
    ],
  });

  return higherCount + 1;
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
  const rank = await getUserRank(user);
  return toGameInfo(user, rank);
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

  const rank = await getUserRank(updated);
  return {
    used: true,
    item: 'shield',
    ...toGameInfo(updated, rank),
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

  const rank = await getUserRank(updated);
  return { used: true, item: 'buyback', ...toGameInfo(updated, rank) };
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

  const rank = await getUserRank(updated);
  return toGameInfo(updated, rank);
}

async function getRank({ limit = 50 } = {}) {
  const take = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const users = await User.find()
    .select('username maxScore')
    .sort({ maxScore: -1, _id: 1 })
    .limit(take)
    .lean();

  return users.map((u, idx) => ({
    rank: idx + 1,
    userId: u._id?.toString ? u._id.toString() : String(u._id),
    username: u.username,
    maxScore: typeof u.maxScore === 'number' ? u.maxScore : 0,
  }));
}

module.exports = {
  getInfo,
  useShield,
  useBuyback,
  submitGameEnd,
  getRank,
  toGameInfo,
};
