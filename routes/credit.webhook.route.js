const router = require('express').Router();

const creditService = require('../services/credit.service');

/**
 * @openapi
 * /api/credits/webhook:
 *   post:
 *     tags: [Credits]
 *     summary: Stripe webhook endpoint (no auth)
 *     description: Stripe will call this endpoint when checkout payment succeeds/fails/expiring.
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/', async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    if (!sig) {
      return res.status(400).json({ message: 'Missing stripe-signature header' });
    }
    const result = await creditService.handleStripeWebhook(req.body, sig);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
