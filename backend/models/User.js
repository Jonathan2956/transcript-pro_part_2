const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Model - User data के लिए MongoDB schema
 * यह schema users की सभी information store करता है
 */
const userSchema = new mongoose.Schema({
  // Basic user information
  username: {
    type: String,
    required: [true, 'Username आवश्यक है'],
    unique: true,
    trim: true,
    minlength: [3, 'Username कम से कम 3 characters का होना चाहिए'],
    maxlength: [30, 'Username 30 characters से ज्यादा का नहीं हो सकता'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username में केवल letters, numbers और underscore allowed हैं']
  },
  
  email: {
    type: String,
    required: [true, 'Email आवश्यक है'],
    unique: true,
    lowercase: true,
    validate: {
      validator: function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'कृपया valid email address provide करें'
    }
  },
  
  password: {
    type: String,
    required: [true, 'Password आवश्यक है'],
    minlength: [6, 'Password कम से कम 6 characters का होना चाहिए'],
    select: false
  },
  
  // User preferences और settings
  preferences: {
    language: {
      type: String,
      default: 'hi'
    },
    autoSave: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ['dark', 'light', 'auto'],
      default: 'dark'
    },
    playbackSpeed: {
      type: Number,
      min: 0.25,
      max: 2.0,
      default: 1.0
    },
    autoScroll: {
      type: Boolean,
      default: true
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    
    // NEW: Pronunciation preferences
    pronunciation: {
      enabled: { type: Boolean, default: true },
      sentenceEnabled: { type: Boolean, default: true },
      phraseEnabled: { type: Boolean, default: true },
      sentenceLanguage: { 
        type: String, 
        enum: ['auto', 'en', 'hi', 'es', 'fr', 'de'], 
        default: 'auto' 
      },
      phraseLanguage: { 
        type: String, 
        enum: ['auto', 'en', 'hi', 'es', 'fr', 'de'], 
        default: 'auto' 
      },
      autoDetect: { type: Boolean, default: true },
      skipHindiOriginal: { type: Boolean, default: true }
    }
  },
  
  // User profile information
  profile: {
    firstName: String,
    lastName: String,
    avatar: String,
    bio: {
      type: String,
      maxlength: 500
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    dateOfBirth: Date,
    country: String,
    timezone: String
  },
  
  // Learning statistics और progress
  statistics: {
    totalVideosWatched: { 
      type: Number, 
      default: 0 
    },
    totalTimeSpent: { 
      type: Number, 
      default: 0
    },
    wordsLearned: { 
      type: Number, 
      default: 0 
    },
    phrasesLearned: { 
      type: Number, 
      default: 0 
    },
    streaks: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastActivity: Date
    },
    accuracy: {
      vocabulary: { type: Number, default: 0 },
      comprehension: { type: Number, default: 0 }
    },
    lastActivity: { 
      type: Date, 
      default: Date.now 
    }
  },
  
  // Subscription और payment information
  subscription: {
    type: {
      type: String,
      enum: ['free', 'premium', 'pro'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'canceled', 'expired', 'past_due'],
      default: 'active'
    },
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String
  },
  
  // Account verification और security
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  
  // Social login information
  socialLogins: {
    google: {
      id: String,
      email: String
    },
    facebook: {
      id: String,
      email: String
    }
  },

  // NEW: Pronunciation settings for specific videos
  pronunciationSettings: {
    type: Map,
    of: Object,
    default: {}
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields
userSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName || ''} ${this.profile.lastName || ''}`.trim();
});

userSchema.virtual('accountAge').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

userSchema.virtual('isPremium').get(function() {
  return this.subscription.type !== 'free' && 
         this.subscription.status === 'active' &&
         new Date() < this.subscription.currentPeriodEnd;
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'statistics.lastActivity': -1 });
userSchema.index({ 'subscription.currentPeriodEnd': 1 });

/**
 * Password hash करने का middleware
 */
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * UpdatedAt timestamp update करने का middleware
 */
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

/**
 * Password compare करने का method
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Password reset token generate करने का method
 */
userSchema.methods.getResetPasswordToken = function() {
  const resetToken = require('crypto').randomBytes(20).toString('hex');
  
  this.resetPasswordToken = require('crypto')
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  
  return resetToken;
};

/**
 * User statistics update करने का method
 */
userSchema.methods.updateStatistics = function(activity) {
  const now = new Date();
  
  const lastActivity = new Date(this.statistics.lastActivity);
  const isNewDay = now.toDateString() !== lastActivity.toDateString();
  
  if (isNewDay) {
    const dayDifference = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
    
    if (dayDifference === 1) {
      this.statistics.streaks.current += 1;
    } else if (dayDifference > 1) {
      this.statistics.streaks.current = 1;
    }
    
    if (this.statistics.streaks.current > this.statistics.streaks.longest) {
      this.statistics.streaks.longest = this.statistics.streaks.current;
    }
  }
  
  this.statistics.lastActivity = now;
  
  return this.save();
};

/**
 * NEW: Pronunciation preferences update करने का method
 */
userSchema.methods.updatePronunciationPreferences = function(preferences) {
  if (preferences.enabled !== undefined) {
    this.preferences.pronunciation.enabled = preferences.enabled;
  }
  if (preferences.sentenceEnabled !== undefined) {
    this.preferences.pronunciation.sentenceEnabled = preferences.sentenceEnabled;
  }
  if (preferences.phraseEnabled !== undefined) {
    this.preferences.pronunciation.phraseEnabled = preferences.phraseEnabled;
  }
  if (preferences.sentenceLanguage !== undefined) {
    this.preferences.pronunciation.sentenceLanguage = preferences.sentenceLanguage;
  }
  if (preferences.phraseLanguage !== undefined) {
    this.preferences.pronunciation.phraseLanguage = preferences.phraseLanguage;
  }
  if (preferences.autoDetect !== undefined) {
    this.preferences.pronunciation.autoDetect = preferences.autoDetect;
  }
  if (preferences.skipHindiOriginal !== undefined) {
    this.preferences.pronunciation.skipHindiOriginal = preferences.skipHindiOriginal;
  }
  
  this.updatedAt = Date.now();
  return this.save();
};

/**
 * NEW: Pronunciation preferences get करने का method
 */
userSchema.methods.getPronunciationPreferences = function() {
  return {
    enabled: this.preferences.pronunciation.enabled,
    sentenceEnabled: this.preferences.pronunciation.sentenceEnabled,
    phraseEnabled: this.preferences.pronunciation.phraseEnabled,
    sentenceLanguage: this.preferences.pronunciation.sentenceLanguage,
    phraseLanguage: this.preferences.pronunciation.phraseLanguage,
    autoDetect: this.preferences.pronunciation.autoDetect,
    skipHindiOriginal: this.preferences.pronunciation.skipHindiOriginal
  };
};

/**
 * JSON output से sensitive fields remove करने के लिए
 */
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  
  delete user.password;
  delete user.verificationToken;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpire;
  delete user.socialLogins;
  
  return user;
};

module.exports = mongoose.model('User', userSchema);
