const mongoose = require('mongoose');

const shopPurchaseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['shield', 'buyback', 'character', 'adblock'],
      index: true,
    },
    creditsSpent: {
      type: Number,
      required: true,
      min: 1,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ShopPurchase', shopPurchaseSchema);
