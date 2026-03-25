const creditService = require('../services/credit.service');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const createCheckoutSession = asyncHandler(async (req, res) => {
  const { credits } = req.body || {};
  const result = await creditService.createCheckoutSession(req.user.id, { credits });
  return res.status(201).json(result);
});

const getBalance = asyncHandler(async (req, res) => {
  const result = await creditService.getBalance(req.user.id);
  return res.json(result);
});

const listMyTransactions = asyncHandler(async (req, res) => {
  const limit = req.query.limit;
  const transactions = await creditService.listMyTransactions(req.user.id, { limit });
  return res.json({ transactions });
});

const listAllTransactions = asyncHandler(async (req, res) => {
  const limit = req.query.limit;
  const transactions = await creditService.listAllTransactions({ limit });
  return res.json({ transactions });
});

module.exports = {
  createCheckoutSession,
  getBalance,
  listMyTransactions,
  listAllTransactions,
};
