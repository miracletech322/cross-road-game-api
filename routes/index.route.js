const router = require('express').Router();

const userRoutes = require('./user.route');
const creditRoutes = require('./credit.route');

router.use('/users', userRoutes);
router.use('/credits', creditRoutes);

module.exports = router;

