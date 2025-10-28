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
        // Email validation regex
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'कृपया valid email address provide करें'
    }
  },
  
  password: {
    type: String,
    required: [true, 'Password आवश्यक है'],
    minlength: [6, 'Password कम से कम 6 characters का होना चाहिए'],
    select: false // Default में query में password नहीं आएगा
  },
  
  // User preferences और settings
  preferences: {
    language: {
      type: String,
      default: 'hi' // Default language Hindi
    },
    autoSave: {
      type: Boolean,
      default: true // Automatically save vocabulary
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
    }
  },
  
  // User profile information
  profile: {
    firstName: String,
    lastName: String,
    avatar: String, // Cloudinary URL
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
      default: 0 // Seconds में
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
      vocabulary: { type: Number, default: 0 }, // Percentage
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
  // Virtual fields include करने के लिए
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields - Database में store नहीं होते लेकिन query में available होते हैं
userSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName || ''} ${this.profile.lastName || ''}`.trim();
});

userSchema.virtual('accountAge').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24)); // Days में
});

userSchema.virtual('isPremium').get(function() {
  return this.subscription.type !== 'free' && 
         this.subscription.status === 'active' &&
         new Date() < this.subscription.currentPeriodEnd;
});

// Indexes - Database queries को fast करने के लिए
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'statistics.lastActivity': -1 });
userSchema.index({ 'subscription.currentPeriodEnd': 1 });

/**
 * Password hash करने का middleware
 * User save होने से पहले automatically password hash करेगा
 */
userSchema.pre('save', async function(next) {
  // अगर password modify नहीं हुआ है तो skip करें
  if (!this.isModified('password')) return next();
  
  try {
    // Salt generate करें
    const salt = await bcrypt.genSalt(12);
    // Password hash करें
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
 * Login के time पर use होगा
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Password reset token generate करने का method
 */
userSchema.methods.getResetPasswordToken = function() {
  // Random token generate करें
  const resetToken = require('crypto').randomBytes(20).toString('hex');
  
  // Token hash करें और database में save करें
  this.resetPasswordToken = require('crypto')
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Token expire time set करें (10 minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  
  return resetToken;
};

/**
 * User statistics update करने का method
 */
userSchema.methods.updateStatistics = function(activity) {
  const now = new Date();
  
  // Streak update करें
  const lastActivity = new Date(this.statistics.lastActivity);
  const isNewDay = now.toDateString() !== lastActivity.toDateString();
  
  if (isNewDay) {
    const dayDifference = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
    
    if (dayDifference === 1) {
      // Consecutive day
      this.statistics.streaks.current += 1;
    } else if (dayDifference > 1) {
      // Streak broken
      this.statistics.streaks.current = 1;
    }
    
    // Longest streak update करें
    if (this.statistics.streaks.current > this.statistics.streaks.longest) {
      this.statistics.streaks.longest = this.statistics.streaks.current;
    }
  }
  
  // Last activity update करें
  this.statistics.lastActivity = now;
  
  return this.save();
};

/**
 * JSON output से sensitive fields remove करने के लिए
 */
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  
  // Sensitive fields remove करें
  delete user.password;
  delete user.verificationToken;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpire;
  delete user.socialLogins;
  
  return user;
};

// Model create करें और export करें
module.exports = mongoose.model('User', userSchema);
