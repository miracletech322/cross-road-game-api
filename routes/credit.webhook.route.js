const router = require('express').Router();

const creditService = require('../services/credit.service');

router.post('/', async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    if (!sig) {
      return res.status(400).json({ message: 'Missing stripe-signature header' });
    }
    const result = await creditService.handleStripeWebhook(req.body, sig);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
