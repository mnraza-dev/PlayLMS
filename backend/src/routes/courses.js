import express from 'express';
import { body, validationResult } from 'express-validator';
import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import User from '../models/User.js';
import YouTubeService from '../services/youtubeService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { optionalAuthMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Apply optional auth middleware to all routes
router.use(optionalAuthMiddleware);

// @route   POST /api/courses/convert
// @desc    Convert YouTube playlist to course
// @access  Private
router.post('/convert', [
  body('playlistUrl')
    .notEmpty()
    .withMessage('Playlist URL is required')
    .custom((value) => {
      if (!YouTubeService.validateYouTubeUrl(value)) {
        throw new Error('Invalid YouTube playlist URL');
      }
      return true;
    }),
  body('category')
    .isIn([
      'programming', 'design', 'business', 'marketing', 'music', 'cooking',
      'fitness', 'language', 'science', 'history', 'technology', 'art',
      'photography', 'finance', 'health', 'other'
    ])
    .withMessage('Invalid category'),
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid difficulty level'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
], asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const { playlistUrl, category, difficulty = 'beginner', tags = [], isPublic = true } = req.body;

  try {
    // Use the enhanced YouTube service to create course
    const result = await YouTubeService.createCourseFromPlaylist(playlistUrl, req.user._id, {
      category,
      difficulty,
      tags,
      isPublic
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    // Check if course already exists
    const existingCourse = await Course.findOne({ playlistId: result.course.playlistId });
    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: 'This playlist has already been converted to a course'
      });
    }

    // Create course
    const course = new Course(result.course);
    await course.save();

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: {
        course: {
          _id: course._id,
          title: course.title,
          description: course.description,
          thumbnail: course.thumbnail,
          category: course.category,
          difficulty: course.difficulty,
          totalModules: course.totalModules,
          totalDuration: course.totalDuration,
          totalXP: course.totalXP,
          slug: course.slug
        },
        stats: result.stats
      }
    });
  } catch (error) {
    console.error('Course creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create course'
    });
  }
}));

// @route   GET /api/courses
// @desc    Get all public courses with filtering and pagination
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    category,
    difficulty,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const query = { isPublic: true, isActive: true };

  // Apply filters
  if (category) query.category = category;
  if (difficulty) query.difficulty = difficulty;
  if (search) {
    query.$text = { $search: search };
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const courses = await Course.find(query)
    .populate('creator', 'username firstName lastName avatar')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .select('-modules -enrolledUsers -ratings');

  const total = await Course.countDocuments(query);

  // Add user progress if authenticated
  if (req.user) {
    for (const course of courses) {
      const progress = await Progress.findOne({
        user: req.user._id,
        course: course._id
      });
      course.userProgress = progress ? progress.overallProgress : 0;
    }
  }

  res.json({
    success: true,
    data: {
      courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
}));

// @route   GET /api/courses/:slug
// @desc    Get course by slug
// @access  Public
router.get('/:slug', asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const course = await Course.findOne({ slug, isActive: true })
    .populate('creator', 'username firstName lastName avatar bio')
    .populate('ratings.user', 'username firstName lastName avatar');

  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found'
    });
  }

  // Get user progress if authenticated
  let userProgress = null;
  if (req.user) {
    userProgress = await Progress.findOne({
      user: req.user._id,
      course: course._id
    });
  }

  res.json({
    success: true,
    data: {
      course,
      userProgress
    }
  });
}));

// @route   POST /api/courses/:courseId/enroll
// @desc    Enroll in a course
// @access  Private
router.post('/:courseId/enroll', asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const { courseId } = req.params;

  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found'
    });
  }

  if (!course.isPublic || !course.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Course is not available for enrollment'
    });
  }

  // Check if already enrolled
  const existingProgress = await Progress.findOne({
    user: req.user._id,
    course: courseId
  });

  if (existingProgress) {
    return res.status(400).json({
      success: false,
      message: 'Already enrolled in this course'
    });
  }

  // Create progress record
  const progress = new Progress({
    user: req.user._id,
    course: courseId
  });

  await progress.save();

  // Update course enrollment
  course.enrollUser(req.user._id);
  await course.save();

  // Update user stats
  const user = await User.findById(req.user._id);
  user.totalCoursesEnrolled += 1;
  await user.save();

  res.json({
    success: true,
    message: 'Successfully enrolled in course',
    data: {
      progress
    }
  });
}));

// @route   POST /api/courses/:courseId/modules/:moduleOrder/complete
// @desc    Mark module as completed
// @access  Private
router.post('/:courseId/modules/:moduleOrder/complete', asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const { courseId, moduleOrder } = req.params;

  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found'
    });
  }

  const module = course.modules.find(m => m.order === parseInt(moduleOrder));
  if (!module) {
    return res.status(404).json({
      success: false,
      message: 'Module not found'
    });
  }

  // Get or create progress
  let progress = await Progress.findOne({
    user: req.user._id,
    course: courseId
  });

  if (!progress) {
    return res.status(400).json({
      success: false,
      message: 'Not enrolled in this course'
    });
  }

  // Update module progress
  progress.updateModuleProgress(parseInt(moduleOrder), module.duration, true);
  await progress.save();

  // Update course progress
  course.completeModule(req.user._id, parseInt(moduleOrder));
  await course.save();

  // Update user stats and XP
  const user = await User.findById(req.user._id);
  user.totalVideosWatched += 1;
  user.totalWatchTime += Math.floor(module.duration / 60);
  
  const xpResult = user.addXP(module.xpReward);
  await user.save();

  res.json({
    success: true,
    message: 'Module completed successfully',
    data: {
      progress: progress.overallProgress,
      xpEarned: xpResult.xpGained,
      leveledUp: xpResult.leveledUp,
      newLevel: xpResult.newLevel
    }
  });
}));

// @route   GET /api/courses/:courseId/modules/:moduleOrder
// @desc    Get module details
// @access  Private
router.get('/:courseId/modules/:moduleOrder', asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const { courseId, moduleOrder } = req.params;

  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found'
    });
  }

  const module = course.modules.find(m => m.order === parseInt(moduleOrder));
  if (!module) {
    return res.status(404).json({
      success: false,
      message: 'Module not found'
    });
  }

  // Get user progress
  const progress = await Progress.findOne({
    user: req.user._id,
    course: courseId
  });

  const moduleProgress = progress?.moduleProgress.find(mp => mp.moduleOrder === parseInt(moduleOrder));

  res.json({
    success: true,
    data: {
      module,
      progress: moduleProgress,
      courseProgress: progress?.overallProgress || 0
    }
  });
}));

// @route   POST /api/courses/:courseId/rate
// @desc    Rate a course
// @access  Private
router.post('/:courseId/rate', [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('review')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Review must be less than 1000 characters')
], asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { courseId } = req.params;
  const { rating, review } = req.body;

  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found'
    });
  }

  // Check if user has already rated
  const existingRating = course.ratings.find(r => r.user.toString() === req.user._id.toString());
  if (existingRating) {
    return res.status(400).json({
      success: false,
      message: 'You have already rated this course'
    });
  }

  // Add rating
  course.ratings.push({
    user: req.user._id,
    rating,
    review
  });

  // Update average rating
  const totalRating = course.ratings.reduce((sum, r) => sum + r.rating, 0);
  course.averageRating = totalRating / course.ratings.length;
  course.totalRatings = course.ratings.length;

  await course.save();

  res.json({
    success: true,
    message: 'Rating submitted successfully',
    data: {
      averageRating: course.averageRating,
      totalRatings: course.totalRatings
    }
  });
}));

// @route   POST /api/courses/preview
// @desc    Get preview of course from YouTube playlist
// @access  Private
router.post('/preview', [
  body('playlistUrl')
    .notEmpty()
    .withMessage('Playlist URL is required')
    .custom((value) => {
      if (!YouTubeService.validateYouTubeUrl(value)) {
        throw new Error('Invalid YouTube playlist URL');
      }
      return true;
    })
], asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  if (!req.user) {
    console.log('No user found in request');
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const { playlistUrl } = req.body;
  console.log('Preview request for URL:', playlistUrl);

  try {
    // Check if YouTube API key is available
    if (!process.env.YOUTUBE_API_KEY) {
      console.log('YouTube API key not found');
      return res.status(500).json({
        success: false,
        message: 'YouTube API key not configured. Please contact administrator.'
      });
    }

    // Get course preview
    console.log('Calling YouTubeService.getCoursePreview...');
    const result = await YouTubeService.getCoursePreview(playlistUrl);
    console.log('YouTubeService result:', result);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    // Check if course already exists
    const existingCourse = await Course.findOne({ playlistId: result.preview.playlistId });
    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: 'This playlist has already been converted to a course',
        data: {
          existingCourse: {
            _id: existingCourse._id,
            title: existingCourse.title,
            slug: existingCourse.slug
          }
        }
      });
    }

    res.json({
      success: true,
      data: {
        preview: result.preview
      }
    });
  } catch (error) {
    console.error('Course preview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get course preview',
      error: error.message
    });
  }
}));

// @route   GET /api/courses/categories
// @desc    Get course categories
// @access  Public
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = await Course.aggregate([
    { $match: { isPublic: true, isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  res.json({
    success: true,
    data: {
      categories
    }
  });
}));

export default router; 