import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  moduleProgress: [{
    moduleOrder: {
      type: Number,
      required: true
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    watchTime: {
      type: Number, // in seconds
      default: 0
    },
    lastWatched: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date,
      default: null
    },
    notes: [{
      content: String,
      timestamp: Number, // video timestamp in seconds
      createdAt: {
        type: Date,
        default: Date.now
      },
      updatedAt: {
        type: Date,
        default: Date.now
      }
    }],
    bookmarks: [{
      timestamp: Number, // video timestamp in seconds
      title: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  overallProgress: {
    type: Number, // percentage (0-100)
    default: 0
  },
  totalWatchTime: {
    type: Number, // in minutes
    default: 0
  },
  completedModules: {
    type: Number,
    default: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  
  // Learning analytics
  learningSessions: [{
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      default: null
    },
    duration: {
      type: Number, // in minutes
      default: 0
    },
    modulesWatched: [{
      moduleOrder: Number,
      watchTime: Number
    }],
    xpEarned: {
      type: Number,
      default: 0
    }
  }],
  
  // Streak tracking for this course
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastActivityDate: {
    type: Date,
    default: Date.now
  },
  
  // Course-specific achievements
  achievements: [{
    name: String,
    description: String,
    earnedAt: {
      type: Date,
      default: Date.now
    },
    icon: String
  }],
  
  // User preferences for this course
  preferences: {
    autoPlay: {
      type: Boolean,
      default: true
    },
    playbackSpeed: {
      type: Number,
      default: 1.0,
      min: 0.5,
      max: 2.0
    },
    showSubtitles: {
      type: Boolean,
      default: false
    },
    quality: {
      type: String,
      enum: ['auto', '1080p', '720p', '480p', '360p'],
      default: 'auto'
    }
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
progressSchema.index({ user: 1, course: 1 }, { unique: true });
progressSchema.index({ user: 1, lastAccessed: -1 });
progressSchema.index({ course: 1, overallProgress: -1 });
progressSchema.index({ user: 1, isCompleted: 1 });

// Virtual for formatted total watch time
progressSchema.virtual('formattedTotalWatchTime').get(function() {
  const hours = Math.floor(this.totalWatchTime / 60);
  const minutes = this.totalWatchTime % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

// Virtual for estimated completion time
progressSchema.virtual('estimatedCompletionTime').get(function() {
  if (this.overallProgress === 0) return null;
  
  const remainingProgress = 100 - this.overallProgress;
  const averageTimePerPercent = this.totalWatchTime / this.overallProgress;
  const estimatedMinutes = (remainingProgress * averageTimePerPercent) / 100;
  
  const hours = Math.floor(estimatedMinutes / 60);
  const minutes = Math.round(estimatedMinutes % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

// Method to update module progress
progressSchema.methods.updateModuleProgress = function(moduleOrder, watchTime, isCompleted = false) {
  let moduleProgress = this.moduleProgress.find(mp => mp.moduleOrder === moduleOrder);
  
  if (!moduleProgress) {
    moduleProgress = {
      moduleOrder,
      isCompleted: false,
      watchTime: 0,
      lastWatched: new Date(),
      completedAt: null,
      notes: [],
      bookmarks: []
    };
    this.moduleProgress.push(moduleProgress);
  }
  
  moduleProgress.watchTime += watchTime;
  moduleProgress.lastWatched = new Date();
  
  if (isCompleted && !moduleProgress.isCompleted) {
    moduleProgress.isCompleted = true;
    moduleProgress.completedAt = new Date();
    this.completedModules += 1;
  }
  
  this.lastAccessed = new Date();
  this.updateOverallProgress();
  
  return moduleProgress;
};

// Method to update overall progress
progressSchema.methods.updateOverallProgress = function() {
  if (this.moduleProgress.length === 0) {
    this.overallProgress = 0;
    return;
  }
  
  const completedModules = this.moduleProgress.filter(mp => mp.isCompleted).length;
  this.overallProgress = Math.round((completedModules / this.moduleProgress.length) * 100);
  
  // Check if course is completed
  if (this.overallProgress >= 100 && !this.isCompleted) {
    this.isCompleted = true;
    this.completedAt = new Date();
  }
  
  // Update total watch time
  this.totalWatchTime = Math.round(this.moduleProgress.reduce((total, mp) => total + mp.watchTime, 0) / 60);
};

// Method to add a learning session
progressSchema.methods.addLearningSession = function(startTime, endTime, modulesWatched, xpEarned) {
  const duration = Math.round((endTime - startTime) / (1000 * 60)); // Convert to minutes
  
  this.learningSessions.push({
    startTime,
    endTime,
    duration,
    modulesWatched,
    xpEarned
  });
  
  this.lastAccessed = new Date();
  this.updateStreak();
};

// Method to update streak
progressSchema.methods.updateStreak = function() {
  const today = new Date();
  const lastActivity = new Date(this.lastActivityDate);
  const daysSinceLastActivity = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
  
  if (daysSinceLastActivity === 1) {
    // Consecutive day
    this.currentStreak += 1;
    if (this.currentStreak > this.longestStreak) {
      this.longestStreak = this.currentStreak;
    }
  } else if (daysSinceLastActivity > 1) {
    // Streak broken
    this.currentStreak = 1;
  }
  
  this.lastActivityDate = today;
  return this.currentStreak;
};

// Method to add achievement
progressSchema.methods.addAchievement = function(name, description, icon) {
  const existingAchievement = this.achievements.find(achievement => achievement.name === name);
  if (!existingAchievement) {
    this.achievements.push({
      name,
      description,
      icon,
      earnedAt: new Date()
    });
    return true;
  }
  return false;
};

// Method to add note to a module
progressSchema.methods.addNote = function(moduleOrder, content, timestamp) {
  const moduleProgress = this.moduleProgress.find(mp => mp.moduleOrder === moduleOrder);
  
  if (moduleProgress) {
    moduleProgress.notes.push({
      content,
      timestamp,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return true;
  }
  
  return false;
};

// Method to add bookmark to a module
progressSchema.methods.addBookmark = function(moduleOrder, timestamp, title) {
  const moduleProgress = this.moduleProgress.find(mp => mp.moduleOrder === moduleOrder);
  
  if (moduleProgress) {
    moduleProgress.bookmarks.push({
      timestamp,
      title: title || `Bookmark at ${Math.floor(timestamp / 60)}:${(timestamp % 60).toString().padStart(2, '0')}`,
      createdAt: new Date()
    });
    return true;
  }
  
  return false;
};

// Method to get learning statistics
progressSchema.methods.getLearningStats = function() {
  const totalSessions = this.learningSessions.length;
  const totalSessionTime = this.learningSessions.reduce((total, session) => total + session.duration, 0);
  const averageSessionTime = totalSessions > 0 ? Math.round(totalSessionTime / totalSessions) : 0;
  const totalXPEarned = this.learningSessions.reduce((total, session) => total + session.xpEarned, 0);
  
  return {
    totalSessions,
    totalSessionTime,
    averageSessionTime,
    totalXPEarned,
    currentStreak: this.currentStreak,
    longestStreak: this.longestStreak,
    achievements: this.achievements.length
  };
};

export default mongoose.model('Progress', progressSchema); 