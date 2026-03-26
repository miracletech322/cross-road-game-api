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
    [{ $set: { maxScore: { $max: [{ $ifNull: ['$maxScore', 0] }, n] } } }],
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
  submitGameEnd,
  toGameInfo,
};
