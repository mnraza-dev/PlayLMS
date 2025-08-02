import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('-password')
    .populate('following', 'username firstName lastName avatar xp level')
    .populate('followers', 'username firstName lastName avatar xp level');

  res.json({
    success: true,
    data: {
      user
    }
  });
}));

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be less than 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be less than 50 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  body('preferences')
    .optional()
    .isObject()
    .withMessage('Preferences must be an object')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { firstName, lastName, bio, preferences } = req.body;

  const user = await User.findById(req.user._id);

  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (bio !== undefined) user.bio = bio;
  if (preferences) {
    user.preferences = { ...user.preferences, ...preferences };
  }

  await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        bio: user.bio,
        preferences: user.preferences,
        xp: user.xp,
        level: user.level,
        streak: user.streak
      }
    }
  });
}));

// @route   GET /api/users/:username
// @desc    Get public user profile
// @access  Public
router.get('/:username', asyncHandler(async (req, res) => {
  const { username } = req.params;

  const user = await User.findOne({ username, isActive: true })
    .select('username firstName lastName avatar bio xp level streak totalCoursesEnrolled totalCoursesCompleted totalVideosWatched totalWatchTime createdAt')
    .populate('followers', 'username firstName lastName avatar')
    .populate('following', 'username firstName lastName avatar');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: {
      user
    }
  });
}));

// @route   GET /api/users/:username/courses
// @desc    Get user's enrolled courses
// @access  Private
router.get('/:username/courses', asyncHandler(async (req, res) => {
  const { username } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Check if user is viewing their own courses or has permission
  if (username !== req.user.username) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const progress = await Progress.find({ user: req.user._id })
    .populate({
      path: 'course',
      select: 'title description thumbnail slug totalModules totalDuration category difficulty',
      match: { isActive: true }
    })
    .sort({ lastAccessed: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Progress.countDocuments({ user: req.user._id });

  res.json({
    success: true,
    data: {
      courses: progress.filter(p => p.course), // Filter out inactive courses
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
}));

// @route   GET /api/users/:username/achievements
// @desc    Get user's achievements
// @access  Private
router.get('/:username/achievements', asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (username !== req.user.username) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const user = await User.findById(req.user._id);
  const progress = await Progress.find({ user: req.user._id })
    .populate('course', 'title');

  // Calculate achievements
  const achievements = [];

  // Course completion achievements
  const completedCourses = progress.filter(p => p.isCompleted).length;
  if (completedCourses >= 1) achievements.push({ name: 'First Course', description: 'Complete your first course', icon: '🎓' });
  if (completedCourses >= 5) achievements.push({ name: 'Course Master', description: 'Complete 5 courses', icon: '🏆' });
  if (completedCourses >= 10) achievements.push({ name: 'Learning Champion', description: 'Complete 10 courses', icon: '👑' });

  // Streak achievements
  if (user.streak.current >= 7) achievements.push({ name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🔥' });
  if (user.streak.current >= 30) achievements.push({ name: 'Monthly Master', description: 'Maintain a 30-day streak', icon: '⚡' });
  if (user.streak.longest >= 100) achievements.push({ name: 'Century Streak', description: 'Achieve a 100-day streak', icon: '💎' });

  // XP achievements
  if (user.xp >= 1000) achievements.push({ name: 'XP Collector', description: 'Earn 1,000 XP', icon: '⭐' });
  if (user.xp >= 5000) achievements.push({ name: 'XP Master', description: 'Earn 5,000 XP', icon: '🌟' });
  if (user.xp >= 10000) achievements.push({ name: 'XP Legend', description: 'Earn 10,000 XP', icon: '💫' });

  // Level achievements
  if (user.level >= 10) achievements.push({ name: 'Level 10', description: 'Reach level 10', icon: '🔟' });
  if (user.level >= 25) achievements.push({ name: 'Level 25', description: 'Reach level 25', icon: '2️⃣5️⃣' });
  if (user.level >= 50) achievements.push({ name: 'Level 50', description: 'Reach level 50', icon: '5️⃣0️⃣' });

  // Watch time achievements
  if (user.totalWatchTime >= 60) achievements.push({ name: 'Hour Learner', description: 'Watch 1 hour of content', icon: '⏰' });
  if (user.totalWatchTime >= 300) achievements.push({ name: 'Time Master', description: 'Watch 5 hours of content', icon: '⏱️' });
  if (user.totalWatchTime >= 600) achievements.push({ name: 'Time Legend', description: 'Watch 10 hours of content', icon: '⌛' });

  res.json({
    success: true,
    data: {
      achievements,
      userAchievements: user.badges,
      stats: {
        completedCourses,
        currentStreak: user.streak.current,
        longestStreak: user.streak.longest,
        totalXP: user.xp,
        level: user.level,
        totalWatchTime: user.totalWatchTime
      }
    }
  });
}));

// @route   POST /api/users/follow/:userId
// @desc    Follow a user
// @access  Private
router.post('/follow/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (userId === req.user._id.toString()) {
    return res.status(400).json({
      success: false,
      message: 'Cannot follow yourself'
    });
  }

  const userToFollow = await User.findById(userId);
  if (!userToFollow) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const currentUser = await User.findById(req.user._id);

  // Check if already following
  if (currentUser.following.includes(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Already following this user'
    });
  }

  // Add to following
  currentUser.following.push(userId);
  userToFollow.followers.push(req.user._id);

  await currentUser.save();
  await userToFollow.save();

  res.json({
    success: true,
    message: 'Successfully followed user'
  });
}));

// @route   DELETE /api/users/follow/:userId
// @desc    Unfollow a user
// @access  Private
router.delete('/follow/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const currentUser = await User.findById(req.user._id);
  const userToUnfollow = await User.findById(userId);

  if (!userToUnfollow) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Remove from following
  currentUser.following = currentUser.following.filter(id => id.toString() !== userId);
  userToUnfollow.followers = userToUnfollow.followers.filter(id => id.toString() !== req.user._id.toString());

  await currentUser.save();
  await userToUnfollow.save();

  res.json({
    success: true,
    message: 'Successfully unfollowed user'
  });
}));

// @route   GET /api/users/leaderboard
// @desc    Get leaderboard
// @access  Public
router.get('/leaderboard', asyncHandler(async (req, res) => {
  const { type = 'xp', limit = 10 } = req.query;

  let sortField = 'xp';
  if (type === 'streak') sortField = 'streak.current';
  if (type === 'courses') sortField = 'totalCoursesCompleted';
  if (type === 'watchTime') sortField = 'totalWatchTime';

  const users = await User.find({ isActive: true })
    .select('username firstName lastName avatar xp level streak totalCoursesCompleted totalWatchTime')
    .sort({ [sortField]: -1 })
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: {
      leaderboard: users,
      type
    }
  });
}));

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', asyncHandler(async (req, res) => {
  const progress = await Progress.find({ user: req.user._id })
    .populate('course', 'title category');

  const stats = {
    totalCourses: progress.length,
    completedCourses: progress.filter(p => p.isCompleted).length,
    totalWatchTime: progress.reduce((total, p) => total + p.totalWatchTime, 0),
    averageProgress: progress.length > 0 ? progress.reduce((total, p) => total + p.overallProgress, 0) / progress.length : 0,
    categoryBreakdown: {},
    recentActivity: progress
      .sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed))
      .slice(0, 5)
      .map(p => ({
        course: p.course.title,
        progress: p.overallProgress,
        lastAccessed: p.lastAccessed
      }))
  };

  // Calculate category breakdown
  progress.forEach(p => {
    if (p.course && p.course.category) {
      if (!stats.categoryBreakdown[p.course.category]) {
        stats.categoryBreakdown[p.course.category] = 0;
      }
      stats.categoryBreakdown[p.course.category]++;
    }
  });

  res.json({
    success: true,
    data: {
      stats
    }
  });
}));

export default router; 