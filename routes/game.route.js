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
 * /api/game/rank:
 *   get:
 *     tags: [Game]
 *     summary: Public leaderboard by max score (no auth)
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 200
 *         description: Max rows to return
 *     responses:
 *       200:
 *         description: Leaderboard rows
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ranking:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RankRow'
 *               required: [ranking]
 */
router.get('/rank', gameController.getRank);

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

/**
 * @openapi
 * /api/game/use/shield:
 *   post:
 *     tags: [Game]
 *     summary: Use one shield token (decreases shieldCount by 1)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shield used; returns updated game info
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/GameInfoResponse'
 *                 - type: object
 *                   properties:
 *                     used: { type: boolean, example: true }
 *                     item: { type: string, example: shield }
 *                   required: [used, item]
 *       402:
 *         description: No shield available
 */
router.post('/use/shield', authenticate, gameController.useShield);

/**
 * @openapi
 * /api/game/use/buyback:
 *   post:
 *     tags: [Game]
 *     summary: Revive (deducts credits if enough)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Revive successful; returns updated game info
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/GameInfoResponse'
 *                 - type: object
 *                   properties:
 *                     used: { type: boolean, example: true }
 *                     item: { type: string, example: buyback }
 *                   required: [used, item]
 *       402:
 *         description: Insufficient credits
 */
router.post('/use/buyback', authenticate, gameController.useBuyback);

module.exports = router;
