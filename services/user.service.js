const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user.model');
const creditService = require('./credit.service');
const shopService = require('./shop.service');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = Number(process.env.PASSWORD_SALT_ROUNDS || 10);

function toPublicUser(userDoc) {
  if (!userDoc) return null;
  const obj = typeof userDoc.toObject === 'function' ? userDoc.toObject() : userDoc;

  return {
    id: obj._id?.toString ? obj._id.toString() : obj._id,
    email: obj.email,
    username: obj.username,
    role: obj.role,
    credits: typeof obj.credits === 'number' ? obj.credits : 0,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : email;
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

async function register({ email, username, password }) {
  if (!isNonEmptyString(email) || !isNonEmptyString(username) || !isNonEmptyString(password)) {
    const err = new Error('email, username and password are required');
    err.statusCode = 400;
    throw err;
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedUsername = username.trim();

  const existing = await User.findOne({
    $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
  }).select('_id');

  if (existing) {
    const err = new Error('email or username already exists');
    err.statusCode = 409;
    throw err;
  }

  // Users can only be registered with role="user".
  const safeRole = 'user';

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const created = await User.create({
    email: normalizedEmail,
    username: normalizedUsername,
    password: hashedPassword,
    role: safeRole,
  });

  return toPublicUser(created);
}

async function login({ email, username, password }) {
  if (!isNonEmptyString(password)) {
    const err = new Error('password is required');
    err.statusCode = 400;
    throw err;
  }

  const hasEmail = isNonEmptyString(email);
  const hasUsername = isNonEmptyString(username);

  if (hasEmail && hasUsername) {
    const err = new Error('Provide either email or username, not both');
    err.statusCode = 400;
    throw err;
  }

  if (!hasEmail && !hasUsername) {
    const err = new Error('email or username is required');
    err.statusCode = 400;
    throw err;
  }

  const query = hasEmail ? { email: normalizeEmail(email) } : { username: username.trim() };

  // password field is `select: false`, so we explicitly request it here
  const user = await User.findOne(query).select('+password');
  if (!user) {
    const err = new Error('invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    const err = new Error('invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const token = jwt.sign(
    { sub: user._id.toString(), role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    token,
    user: toPublicUser(user),
  };
}

async function getById(id) {
  if (!id) {
    const err = new Error('id is required');
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findById(id).select('email username role credits createdAt updatedAt');
  if (!user) {
    const err = new Error('user not found');
    err.statusCode = 404;
    throw err;
  }

  return toPublicUser(user);
}

async function listAll() {
  const users = await User.find().select('email username role credits createdAt updatedAt').sort({ createdAt: -1 });
  return users.map(toPublicUser);
}

async function updateById(id, { email, username, role, password }) {
  const user = await User.findById(id);
  if (!user) {
    const err = new Error('user not found');
    err.statusCode = 404;
    throw err;
  }

  const updates = {};
  if (typeof email !== 'undefined') updates.email = normalizeEmail(email);
  if (typeof username !== 'undefined') updates.username = username.trim();
  if (typeof role !== 'undefined') updates.role = role;

  if (typeof password !== 'undefined') {
    if (!isNonEmptyString(password)) {
      const err = new Error('password must be a non-empty string');
      err.statusCode = 400;
      throw err;
    }
    updates.password = await bcrypt.hash(password, SALT_ROUNDS);
  }

  if (updates.role && !['user', 'admin'].includes(updates.role)) {
    const err = new Error('invalid role');
    err.statusCode = 400;
    throw err;
  }

  // Uniqueness check only if we changed email or username.
  if (updates.email || updates.username) {
    const conflict = await User.findOne({
      _id: { $ne: id },
      $or: [
        updates.email ? { email: updates.email } : null,
        updates.username ? { username: updates.username } : null,
      ].filter(Boolean),
    }).select('_id');

    if (conflict) {
      const err = new Error('email or username already exists');
      err.statusCode = 409;
      throw err;
    }
  }

  await User.updateOne({ _id: id }, { $set: updates });

  const updated = await User.findById(id).select('email username role credits createdAt updatedAt');
  return toPublicUser(updated);
}

async function deleteById(id) {
  const deleted = await User.findByIdAndDelete(id).select('email username role credits');
  if (!deleted) {
    const err = new Error('user not found');
    err.statusCode = 404;
    throw err;
  }

  return toPublicUser(deleted);
}

async function getUserHistory(userId, { limit = 100 } = {}) {
  const exists = await User.findById(userId).select('_id');
  if (!exists) {
    const err = new Error('user not found');
    err.statusCode = 404;
    throw err;
  }
  const take = Math.min(Math.max(Number(limit) || 100, 1), 500);
  const [creditTransactions, shopPurchases] = await Promise.all([
    creditService.listTransactionsByUserId(userId, { limit: take }),
    shopService.listPurchasesByUserId(userId, { limit: take }),
  ]);
  return { creditTransactions, shopPurchases };
}

module.exports = {
  register,
  login,
  getById,
  listAll,
  updateById,
  deleteById,
  getUserHistory,
};

