const router = require('express').Router();

const gameController = require('../controllers/game.controller');
const { authenticate } = require('../middleware/user.middleware');

/**
 * @openapi
 * tags:
 *   - name: Game
 *     description: Player game state and session end
 */

/**
 * @openapi
 * /api/game/info:
 *   get:
 *     tags: [Game]
 *     summary: Current player stats (credits, max score, inventory)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Game info
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GameInfoResponse'
 */
router.get('/info', authenticate, gameController.getInfo);

/**
 * @openapi
 * /api/game/end:
 *   post:
 *     tags: [Game]
 *     summary: Report game finished; updates maxScore if higher
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [maxScore]
 *             properties:
 *               maxScore:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Updated game info (same shape as GET /game/info)
 */
router.post('/end', authenticate, gameController.submitGameEnd);

module.exports = router;
