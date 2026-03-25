const mongoose = require('mongoose');

const stripeEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StripeEvent', stripeEventSchema);
