const mongoose = require('mongoose');

const creditTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    credits: {
      type: Number,
      required: true,
      min: 1,
    },
    amountCents: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'usd',
      uppercase: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    stripeCheckoutSessionId: {
      type: String,
      sparse: true,
      unique: true,
      index: true,
    },
    stripePaymentIntentId: {
      type: String,
      sparse: true,
      index: true,
    },
    stripeCustomerId: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CreditTransaction', creditTransactionSchema);
