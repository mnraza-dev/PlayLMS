import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Module title is required'],
    trim: true,
    maxlength: [200, 'Module title cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Module description cannot exceed 1000 characters']
  },
  videoId: {
    type: String,
    required: [true, 'Video ID is required']
  },
  videoUrl: {
    type: String,
    required: [true, 'Video URL is required']
  },
  thumbnail: {
    type: String,
    required: [true, 'Thumbnail URL is required']
  },
  duration: {
    type: Number, // in seconds
    required: [true, 'Video duration is required']
  },
  order: {
    type: Number,
    required: [true, 'Module order is required']
  },
  xpReward: {
    type: Number,
    default: 10
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
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    replies: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      content: {
        type: String,
        required: true,
        maxlength: [500, 'Reply cannot exceed 500 characters']
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  }]
}, {
  timestamps: true
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [200, 'Course title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    maxlength: [2000, 'Course description cannot exceed 2000 characters']
  },
  thumbnail: {
    type: String,
    required: [true, 'Course thumbnail is required']
  },
  playlistUrl: {
    type: String,
    required: [true, 'Playlist URL is required'],
    unique: true
  },
  playlistId: {
    type: String,
    required: [true, 'Playlist ID is required'],
    unique: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Course creator is required']
  },
  modules: [moduleSchema],
  totalModules: {
    type: Number,
    default: 0
  },
  totalDuration: {
    type: Number, // in minutes
    default: 0
  },
  totalXP: {
    type: Number,
    default: 0
  },
  
  // Course metadata
  category: {
    type: String,
    required: [true, 'Course category is required'],
    enum: [
      'programming',
      'design',
      'business',
      'marketing',
      'music',
      'cooking',
      'fitness',
      'language',
      'science',
      'history',
      'technology',
      'art',
      'photography',
      'finance',
      'health',
      'other'
    ]
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  language: {
    type: String,
    default: 'en'
  },
  
  // Course statistics
  enrolledUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    completedModules: [{
      type: Number // module order
    }],
    lastAccessed: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number, // percentage (0-100)
      default: 0
    }
  }],
  totalEnrollments: {
    type: Number,
    default: 0
  },
  totalCompletions: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    review: {
      type: String,
      maxlength: [1000, 'Review cannot exceed 1000 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Course settings
  isPublic: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  allowComments: {
    type: Boolean,
    default: true
  },
  allowNotes: {
    type: Boolean,
    default: true
  },
  
  // Course completion requirements
  completionCriteria: {
    type: String,
    enum: ['all_modules', 'percentage', 'custom'],
    default: 'all_modules'
  },
  completionPercentage: {
    type: Number,
    default: 100,
    min: 1,
    max: 100
  },
  
  // SEO and sharing
  slug: {
    type: String,
    unique: true,
    required: true
  },
  metaDescription: {
    type: String,
    maxlength: [300, 'Meta description cannot exceed 300 characters']
  },
  
  // Timestamps
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });
courseSchema.index({ category: 1 });
courseSchema.index({ difficulty: 1 });
courseSchema.index({ isPublic: 1, isActive: 1 });
courseSchema.index({ totalEnrollments: -1 });
courseSchema.index({ averageRating: -1 });
courseSchema.index({ createdAt: -1 });
courseSchema.index({ slug: 1 });

// Virtual for completion rate
courseSchema.virtual('completionRate').get(function() {
  if (this.totalEnrollments === 0) return 0;
  return Math.round((this.totalCompletions / this.totalEnrollments) * 100);
});

// Virtual for formatted duration
courseSchema.virtual('formattedDuration').get(function() {
  const hours = Math.floor(this.totalDuration / 60);
  const minutes = this.totalDuration % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

// Pre-save middleware to update totals
courseSchema.pre('save', function(next) {
  if (this.modules && this.modules.length > 0) {
    this.totalModules = this.modules.length;
    this.totalDuration = Math.round(this.modules.reduce((total, module) => total + module.duration, 0) / 60);
    this.totalXP = this.modules.reduce((total, module) => total + module.xpReward, 0);
  }
  next();
});

// Method to get course progress for a user
courseSchema.methods.getUserProgress = function(userId) {
  const enrollment = this.enrolledUsers.find(enrollment => enrollment.user.toString() === userId.toString());
  
  if (!enrollment) {
    return {
      enrolled: false,
      progress: 0,
      completedModules: 0,
      totalModules: this.totalModules
    };
  }
  
  const progress = enrollment.progress || 0;
  const completedModules = enrollment.completedModules ? enrollment.completedModules.length : 0;
  
  return {
    enrolled: true,
    progress,
    completedModules,
    totalModules: this.totalModules,
    lastAccessed: enrollment.lastAccessed
  };
};

// Method to enroll a user in the course
courseSchema.methods.enrollUser = function(userId) {
  const existingEnrollment = this.enrolledUsers.find(enrollment => enrollment.user.toString() === userId.toString());
  
  if (!existingEnrollment) {
    this.enrolledUsers.push({
      user: userId,
      enrolledAt: new Date(),
      completedModules: [],
      lastAccessed: new Date(),
      progress: 0
    });
    this.totalEnrollments += 1;
    return true;
  }
  
  return false;
};

// Method to mark a module as completed for a user
courseSchema.methods.completeModule = function(userId, moduleOrder) {
  const enrollment = this.enrolledUsers.find(enrollment => enrollment.user.toString() === userId.toString());
  
  if (!enrollment) {
    throw new Error('User not enrolled in this course');
  }
  
  if (!enrollment.completedModules.includes(moduleOrder)) {
    enrollment.completedModules.push(moduleOrder);
    enrollment.progress = Math.round((enrollment.completedModules.length / this.totalModules) * 100);
    enrollment.lastAccessed = new Date();
    
    // Check if course is completed
    if (enrollment.progress >= 100) {
      this.totalCompletions += 1;
    }
    
    return true;
  }
  
  return false;
};

// Method to get course statistics
courseSchema.methods.getStats = function() {
  return {
    totalEnrollments: this.totalEnrollments,
    totalCompletions: this.totalCompletions,
    completionRate: this.completionRate,
    averageRating: this.averageRating,
    totalRatings: this.totalRatings,
    totalModules: this.totalModules,
    totalDuration: this.formattedDuration,
    totalXP: this.totalXP
  };
};

export default mongoose.model('Course', courseSchema); 