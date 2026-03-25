const Stripe = require('stripe');

const User = require('../models/user.model');
const CreditTransaction = require('../models/creditTransaction.model');
const StripeEvent = require('../models/stripeEvent.model');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

const CREDIT_PRICE_CENTS_PER_UNIT = Number(process.env.CREDIT_PRICE_CENTS_PER_UNIT || 1);
const MIN_CREDITS = Number(process.env.CREDIT_PURCHASE_MIN || 1);
const MAX_CREDITS = Number(process.env.CREDIT_PURCHASE_MAX || 100000);

function getStripeOrThrow() {
  if (!stripe) {
    const err = new Error('Stripe is not configured (STRIPE_SECRET_KEY)');
    err.statusCode = 500;
    throw err;
  }
  return stripe;
}

function getPaymentUrls() {
  // Base URL for Stripe success/cancel redirects (Unity game or universal link / custom scheme).
  const base = process.env.FRONTEND_URL || process.env.GAME_CLIENT_URL || 'http://localhost:3001';
  const successPath = process.env.STRIPE_SUCCESS_PATH || '/payment/success';
  const cancelPath = process.env.STRIPE_CANCEL_PATH || '/payment/cancel';
  return {
    successUrl: `${base.replace(/\/$/, '')}${successPath.startsWith('/') ? successPath : `/${successPath}`}?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${base.replace(/\/$/, '')}${cancelPath.startsWith('/') ? cancelPath : `/${cancelPath}`}`,
  };
}

function formatTransaction(t, { withUser } = { withUser: false }) {
  if (!t) return null;
  const id = t._id?.toString ? t._id.toString() : String(t._id);
  const uid = t.userId;
  let userIdStr;
  let user;
  if (withUser && uid && typeof uid === 'object' && uid.email) {
    userIdStr = uid._id?.toString ? uid._id.toString() : String(uid._id);
    user = { email: uid.email, username: uid.username };
  } else {
    userIdStr = uid?.toString ? uid.toString() : String(uid);
  }
  return {
    id,
    userId: userIdStr,
    ...(user ? { user } : {}),
    credits: t.credits,
    amountCents: t.amountCents,
    currency: t.currency,
    status: t.status,
    stripeCheckoutSessionId: t.stripeCheckoutSessionId,
    stripePaymentIntentId: t.stripePaymentIntentId,
    stripeCustomerId: t.stripeCustomerId,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

async function createCheckoutSession(userId, { credits }) {
  const creditsNum = Number(credits);
  if (!Number.isFinite(creditsNum) || creditsNum < MIN_CREDITS || creditsNum > MAX_CREDITS) {
    const err = new Error(`credits must be between ${MIN_CREDITS} and ${MAX_CREDITS}`);
    err.statusCode = 400;
    throw err;
  }

  const totalCents = Math.round(creditsNum * CREDIT_PRICE_CENTS_PER_UNIT);
  if (!Number.isFinite(totalCents) || totalCents < 1) {
    const err = new Error('Invalid payment amount');
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findById(userId).select('email username');
  if (!user) {
    const err = new Error('user not found');
    err.statusCode = 404;
    throw err;
  }

  const s = getStripeOrThrow();
  const { successUrl, cancelUrl } = getPaymentUrls();

  const session = await s.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Game credits',
            description: `${creditsNum} credits`,
          },
          unit_amount: totalCents,
        },
        quantity: 1,
      },
    ],
    customer_email: user.email,
    client_reference_id: userId,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId: String(userId),
      credits: String(creditsNum),
    },
    payment_intent_data: {
      metadata: {
        userId: String(userId),
        credits: String(creditsNum),
      },
    },
  });

  await CreditTransaction.create({
    userId,
    credits: creditsNum,
    amountCents: totalCents,
    currency: 'usd',
    status: 'pending',
    stripeCheckoutSessionId: session.id,
  });

  return {
    url: session.url,
    sessionId: session.id,
  };
}

async function getBalance(userId) {
  const user = await User.findById(userId).select('credits');
  if (!user) {
    const err = new Error('user not found');
    err.statusCode = 404;
    throw err;
  }
  return { credits: user.credits ?? 0 };
}

async function listMyTransactions(userId, { limit = 50 } = {}) {
  const take = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const rows = await CreditTransaction.find({ userId })
    .sort({ createdAt: -1 })
    .limit(take)
    .lean();
  return rows.map((t) => formatTransaction(t));
}

async function listAllTransactions({ limit = 100 } = {}) {
  const take = Math.min(Math.max(Number(limit) || 100, 1), 500);
  const rows = await CreditTransaction.find()
    .populate('userId', 'email username')
    .sort({ createdAt: -1 })
    .limit(take)
    .lean();

  return rows.map((t) => formatTransaction(t, { withUser: true }));
}

/**
 * Handle Stripe webhook (raw body required). Returns true if handled.
 */
async function handleStripeWebhook(rawBody, signature) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    const err = new Error('Stripe webhook is not configured (STRIPE_WEBHOOK_SECRET)');
    err.statusCode = 500;
    throw err;
  }

  const s = getStripeOrThrow();
  let event;
  try {
    event = s.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (e) {
    const err = new Error('Webhook signature verification failed');
    err.statusCode = 400;
    throw err;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const sessionId = session.id;

    const pi = session.payment_intent;
    const paymentIntentId = typeof pi === 'string' ? pi : pi?.id;
    const customerId =
      typeof session.customer === 'string' ? session.customer : session.customer?.id || undefined;

    const tx = await CreditTransaction.findOneAndUpdate(
      { stripeCheckoutSessionId: sessionId, status: 'pending' },
      {
        $set: {
          status: 'completed',
          stripePaymentIntentId: paymentIntentId || undefined,
          stripeCustomerId: customerId || undefined,
        },
      },
      { new: true }
    );

    if (!tx) {
      const existing = await CreditTransaction.findOne({ stripeCheckoutSessionId: sessionId });
      if (existing?.status === 'completed') {
        return { received: true, duplicate: true };
      }
      return { received: true, skipped: 'unknown session' };
    }

    try {
      await User.updateOne({ _id: tx.userId }, { $inc: { credits: tx.credits } });
    } catch (err) {
      await CreditTransaction.updateOne({ _id: tx._id }, { $set: { status: 'pending' } });
      throw err;
    }

    try {
      await StripeEvent.create({ eventId: event.id });
    } catch (e) {
      if (e && e.code === 11000) {
        return { received: true, completed: true, duplicateEvent: true };
      }
      throw e;
    }

    return { received: true, completed: true };
  }

  return { received: true, ignored: event.type };
}

module.exports = {
  createCheckoutSession,
  getBalance,
  listMyTransactions,
  listAllTransactions,
  handleStripeWebhook,
};
