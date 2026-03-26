const router = require('express').Router();

const userRoutes = require('./user.route');
const creditRoutes = require('./credit.route');
const shopRoutes = require('./shop.route');
const gameRoutes = require('./game.route');
const adRoutes = require('./ad.route');

router.use('/users', userRoutes);
router.use('/credits', creditRoutes);
router.use('/shop', shopRoutes);
router.use('/game', gameRoutes);
router.use('/ads', adRoutes);

module.exports = router;

