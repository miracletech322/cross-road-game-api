const userService = require('../services/user.service');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const register = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body || {};
  const user = await userService.register({ email, username, password });
  return res.status(201).json({ user });
});

const login = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body || {};
  const result = await userService.login({ email, username, password });
  return res.json(result);
});

const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getById(req.user.id);
  return res.json({ user });
});

const listUsers = asyncHandler(async (req, res) => {
  const users = await userService.listAll();
  return res.json({ users });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getById(req.params.id);
  return res.json({ user });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateById(req.params.id, req.body || {});
  return res.json({ user });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await userService.deleteById(req.params.id);
  return res.json({ user });
});

module.exports = {
  register,
  login,
  getMe,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
};

