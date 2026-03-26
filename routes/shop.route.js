const router = require('express').Router();

const shopController = require('../controllers/shop.controller');
const { authenticate } = require('../middleware/user.middleware');

/**
 * @openapi
 * tags:
 *   - name: Shop
 *     description: In-game purchases (deducts credits). Remaining balance is returned only from GET /api/game/info.
 */

/**
 * @openapi
 * /api/shop/shield:
 *   post:
 *     tags: [Shop]
 *     summary: Buy one shield (+1 shield count, deducts credits)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Purchase successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShopPurchaseResponse'
 *       402:
 *         description: Insufficient credits
 */
router.post('/shield', authenticate, shopController.buyShield);

/**
 * @openapi
 * /api/shop/character:
 *   post:
 *     tags: [Shop]
 *     summary: Buy a character (requires characterId; cannot buy twice)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [characterId]
 *             properties:
 *               characterId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Purchase successful
 *       402:
 *         description: Insufficient credits
 *       409:
 *         description: Character already owned
 */
router.post('/character', authenticate, shopController.buyCharacter);

/**
 * @openapi
 * /api/shop/adblock:
 *   post:
 *     tags: [Shop]
 *     summary: Buy adblock (one-time; sets adblockStatus true)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Purchase successful
 *       402:
 *         description: Insufficient credits
 *       409:
 *         description: Already purchased
 */
router.post('/adblock', authenticate, shopController.buyAdblock);

module.exports = router;
