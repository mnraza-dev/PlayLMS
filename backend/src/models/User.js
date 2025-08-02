import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  
  // Gamification fields
  xp: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  streak: {
    current: {
      type: Number,
      default: 0
    },
    longest: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  badges: [{
    name: String,
    description: String,
    earnedAt: {
      type: Date,
      default: Date.now
    },
    icon: String
  }],
  
  // Learning statistics
  totalCoursesEnrolled: {
    type: Number,
    default: 0
  },
  totalCoursesCompleted: {
    type: Number,
    default: 0
  },
  totalVideosWatched: {
    type: Number,
    default: 0
  },
  totalWatchTime: {
    type: Number, // in minutes
    default: 0
  },
  
  // Preferences
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'private', 'friends'],
        default: 'public'
      },
      showProgress: {
        type: Boolean,
        default: true
      }
    }
  },
  
  // Social features
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  
  // Timestamps
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ xp: -1 }); // For leaderboards
userSchema.index({ 'streak.current': -1 }); // For streak leaderboards

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for profile completion percentage
userSchema.virtual('profileCompletion').get(function() {
  const fields = ['firstName', 'lastName', 'bio', 'avatar'];
  const completedFields = fields.filter(field => this[field]);
  return Math.round((completedFields.length / fields.length) * 100);
});

// Pre-save middleware to hash password
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

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to add XP and handle leveling
userSchema.methods.addXP = function(amount) {
  this.xp += amount;
  
  // Calculate new level (simple formula: level = floor(sqrt(xp/100)) + 1)
  const newLevel = Math.floor(Math.sqrt(this.xp / 100)) + 1;
  
  if (newLevel > this.level) {
    this.level = newLevel;
    return { leveledUp: true, newLevel, xpGained: amount };
  }
  
  return { leveledUp: false, xpGained: amount };
};

// Method to update streak
userSchema.methods.updateStreak = function() {
  const now = new Date();
  const lastActivity = new Date(this.streak.lastActivity);
  const daysSinceLastActivity = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
  
  if (daysSinceLastActivity === 1) {
    // Consecutive day
    this.streak.current += 1;
    if (this.streak.current > this.streak.longest) {
      this.streak.longest = this.streak.current;
    }
  } else if (daysSinceLastActivity > 1) {
    // Streak broken
    this.streak.current = 1;
  }
  
  this.streak.lastActivity = now;
  return this.streak.current;
};

// Method to add badge
userSchema.methods.addBadge = function(badgeName, description, icon) {
  const existingBadge = this.badges.find(badge => badge.name === badgeName);
  if (!existingBadge) {
    this.badges.push({
      name: badgeName,
      description,
      icon,
      earnedAt: new Date()
    });
    return true;
  }
  return false;
};

// Method to get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  return {
    _id: this._id,
    username: this.username,
    firstName: this.firstName,
    lastName: this.lastName,
    avatar: this.avatar,
    bio: this.bio,
    xp: this.xp,
    level: this.level,
    streak: this.streak,
    badges: this.badges,
    totalCoursesEnrolled: this.totalCoursesEnrolled,
    totalCoursesCompleted: this.totalCoursesCompleted,
    totalVideosWatched: this.totalVideosWatched,
    totalWatchTime: this.totalWatchTime,
    createdAt: this.createdAt,
    profileCompletion: this.profileCompletion
  };
};

export default mongoose.model('User', userSchema); 