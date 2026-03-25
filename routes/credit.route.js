const router = require('express').Router();

const creditController = require('../controllers/credit.controller');
const { authenticate, requireAdmin } = require('../middleware/user.middleware');

/**
 * @openapi
 * tags:
 *   - name: Credits
 *     description: Stripe credit purchases (game client) and balance / transactions
 */

/**
 * @openapi
 * /api/credits/checkout-session:
 *   post:
 *     tags: [Credits]
 *     summary: Create Stripe Checkout session (Unity/game opens returned url in browser)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [credits]
 *             properties:
 *               credits:
 *                 type: integer
 *                 minimum: 1
 *                 example: 100
 *     responses:
 *       201:
 *         description: Stripe Checkout URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   format: uri
 *                 sessionId:
 *                   type: string
 */
router.post('/checkout-session', authenticate, creditController.createCheckoutSession);

/**
 * @openapi
 * /api/credits/balance:
 *   get:
 *     tags: [Credits]
 *     summary: Current user credit balance
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 credits:
 *                   type: number
 */
router.get('/balance', authenticate, creditController.getBalance);

/**
 * @openapi
 * /api/credits/transactions/me:
 *   get:
 *     tags: [Credits]
 *     summary: Current user credit transactions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Transactions
 */
router.get('/transactions/me', authenticate, creditController.listMyTransactions);

/**
 * @openapi
 * /api/credits/transactions:
 *   get:
 *     tags: [Credits]
 *     summary: All credit transactions (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Transactions
 *       403:
 *         description: Admin only
 */
router.get('/transactions', authenticate, requireAdmin, creditController.listAllTransactions);

module.exports = router;
