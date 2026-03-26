const mongoose = require('mongoose');

const adSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    // What kind of ad should be shown.
    type: {
      type: String,
      required: true,
      enum: ['banner', 'interstitial', 'rewarded', 'video'],
      index: true,
    },
    // Where the ad is shown in the game (e.g. "main", "reward", "gameover").
    placement: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    linkUrl: {
      type: String,
      trim: true,
      default: '',
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    // Used to order ads in the client.
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    // Optional extra data for ad SDK integrations.
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ad', adSchema);

