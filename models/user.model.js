const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // never return password by default
    },
    role: {
      type: String,
      required: true,
      enum: ['user', 'admin'],
      default: 'user',
    },
    credits: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    /** Best score ever (updated on game end). */
    maxScore: {
      type: Number,
      default: 0,
      min: 0,
    },
    /** Shields owned (incremented when purchasing shield). */
    shieldCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    /** Character ids the user has purchased (unique). */
    purchasedCharacterIds: {
      type: [String],
      default: ['chat_1'],
    },
    /** True after purchasing adblock once. */
    adblockEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('User', userSchema);

