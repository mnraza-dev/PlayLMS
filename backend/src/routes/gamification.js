import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

router.get('/dashboard', asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const progress = await Progress.find({ user: req.user._id })
    .populate('course', 'title category');

  // Calculate achievements
  const achievements = [];
  const completedCourses = progress.filter(p => p.isCompleted).length;
  const totalWatchTime = progress.reduce((total, p) => total + p.totalWatchTime, 0);

  // Course completion achievements
  if (completedCourses >= 1) achievements.push({ name: 'First Course', description: 'Complete your first course', icon: '🎓', earned: true });
  if (completedCourses >= 5) achievements.push({ name: 'Course Master', description: 'Complete 5 courses', icon: '🏆', earned: true });
  if (completedCourses >= 10) achievements.push({ name: 'Learning Champion', description: 'Complete 10 courses', icon: '👑', earned: true });

  // Streak achievements
  if (user.streak.current >= 7) achievements.push({ name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🔥', earned: true });
  if (user.streak.current >= 30) achievements.push({ name: 'Monthly Master', description: 'Maintain a 30-day streak', icon: '⚡', earned: true });
  if (user.streak.longest >= 100) achievements.push({ name: 'Century Streak', description: 'Achieve a 100-day streak', icon: '💎', earned: true });

  // XP achievements
  if (user.xp >= 1000) achievements.push({ name: 'XP Collector', description: 'Earn 1,000 XP', icon: '⭐', earned: true });
  if (user.xp >= 5000) achievements.push({ name: 'XP Master', description: 'Earn 5,000 XP', icon: '🌟', earned: true });
  if (user.xp >= 10000) achievements.push({ name: 'XP Legend', description: 'Earn 10,000 XP', icon: '💫', earned: true });

  // Level achievements
  if (user.level >= 10) achievements.push({ name: 'Level 10', description: 'Reach level 10', icon: '🔟', earned: true });
  if (user.level >= 25) achievements.push({ name: 'Level 25', description: 'Reach level 25', icon: '2️⃣5️⃣', earned: true });
  if (user.level >= 50) achievements.push({ name: 'Level 50', description: 'Reach level 50', icon: '5️⃣0️⃣', earned: true });

  // Watch time achievements
  if (totalWatchTime >= 60) achievements.push({ name: 'Hour Learner', description: 'Watch 1 hour of content', icon: '⏰', earned: true });
  if (totalWatchTime >= 300) achievements.push({ name: 'Time Master', description: 'Watch 5 hours of content', icon: '⏱️', earned: true });
  if (totalWatchTime >= 600) achievements.push({ name: 'Time Legend', description: 'Watch 10 hours of content', icon: '⌛', earned: true });

  // Add unearned achievements for motivation
  if (completedCourses < 1) achievements.push({ name: 'First Course', description: 'Complete your first course', icon: '🎓', earned: false });
  if (user.streak.current < 7) achievements.push({ name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🔥', earned: false });
  if (user.xp < 1000) achievements.push({ name: 'XP Collector', description: 'Earn 1,000 XP', icon: '⭐', earned: false });

  // Calculate next level XP
  const currentLevelXP = Math.pow(user.level - 1, 2) * 100;
  const nextLevelXP = Math.pow(user.level, 2) * 100;
  const xpProgress = ((user.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

  // Get recent activity
  const recentActivity = progress
    .sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed))
    .slice(0, 5)
    .map(p => ({
      course: p.course.title,
      progress: p.overallProgress,
      lastAccessed: p.lastAccessed
    }));

  // Get daily challenges
  const today = new Date();
  const challenges = [
    {
      id: 'daily_watch',
      title: 'Watch 30 minutes today',
      description: 'Spend 30 minutes learning',
      icon: '📺',
      progress: Math.min(100, (totalWatchTime / 30) * 100),
      completed: totalWatchTime >= 30,
      reward: 50
    },
    {
      id: 'daily_streak',
      title: 'Maintain your streak',
      description: 'Learn something today',
      icon: '🔥',
      progress: user.streak.current > 0 ? 100 : 0,
      completed: user.streak.current > 0,
      reward: 25
    },
    {
      id: 'complete_module',
      title: 'Complete a module',
      description: 'Finish one module today',
      icon: '✅',
      progress: 0, // This would need to be calculated from today's activity
      completed: false,
      reward: 100
    }
  ];

  res.json({
    success: true,
    data: {
      user: {
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        xpProgress,
        nextLevelXP: nextLevelXP - user.xp
      },
      achievements,
      challenges,
      recentActivity,
      stats: {
        completedCourses,
        totalWatchTime,
        totalSessions: progress.reduce((total, p) => total + p.learningSessions.length, 0),
        averageProgress: progress.length > 0 ? progress.reduce((total, p) => total + p.overallProgress, 0) / progress.length : 0
      }
    }
  });
}));

// @route   GET /api/gamification/leaderboard
// @desc    Get leaderboard
// @access  Public
router.get('/leaderboard', asyncHandler(async (req, res) => {
  const { type = 'xp', limit = 10 } = req.query;

  let sortField = 'xp';
  if (type === 'streak') sortField = 'streak.current';
  if (type === 'courses') sortField = 'totalCoursesCompleted';
  if (type === 'watchTime') sortField = 'totalWatchTime';
  if (type === 'level') sortField = 'level';

  const users = await User.find({ isActive: true })
    .select('username firstName lastName avatar xp level streak totalCoursesCompleted totalWatchTime')
    .sort({ [sortField]: -1 })
    .limit(parseInt(limit));

  // Add user's position if authenticated
  let userPosition = null;
  if (req.user) {
    const userRank = await User.countDocuments({
      [sortField]: { $gt: req.user[sortField] },
      isActive: true
    });
    userPosition = userRank + 1;
  }

  res.json({
    success: true,
    data: {
      leaderboard: users,
      type,
      userPosition
    }
  });
}));

// @route   GET /api/gamification/challenges
// @desc    Get available challenges
// @access  Private
router.get('/challenges', asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const progress = await Progress.find({ user: req.user._id });

  const challenges = [
    // Daily challenges
    {
      id: 'daily_watch_30',
      title: '30-Minute Learner',
      description: 'Watch 30 minutes of content today',
      type: 'daily',
      icon: '📺',
      target: 30,
      current: progress.reduce((total, p) => total + p.totalWatchTime, 0),
      reward: 50,
      completed: false
    },
    {
      id: 'daily_streak',
      title: 'Streak Keeper',
      description: 'Maintain your learning streak',
      type: 'daily',
      icon: '🔥',
      target: 1,
      current: user.streak.current,
      reward: 25,
      completed: user.streak.current > 0
    },
    {
      id: 'daily_module',
      title: 'Module Master',
      description: 'Complete one module today',
      type: 'daily',
      icon: '✅',
      target: 1,
      current: 0, // Would need to calculate from today's activity
      reward: 100,
      completed: false
    },

    // Weekly challenges
    {
      id: 'weekly_courses_3',
      title: 'Course Explorer',
      description: 'Enroll in 3 courses this week',
      type: 'weekly',
      icon: '🎓',
      target: 3,
      current: user.totalCoursesEnrolled,
      reward: 200,
      completed: user.totalCoursesEnrolled >= 3
    },
    {
      id: 'weekly_watch_5',
      title: 'Time Devotee',
      description: 'Watch 5 hours of content this week',
      type: 'weekly',
      icon: '⏰',
      target: 300, // 5 hours in minutes
      current: user.totalWatchTime,
      reward: 300,
      completed: user.totalWatchTime >= 300
    },

    // Monthly challenges
    {
      id: 'monthly_level_5',
      title: 'Level Up',
      description: 'Gain 5 levels this month',
      type: 'monthly',
      icon: '📈',
      target: 5,
      current: user.level,
      reward: 500,
      completed: false
    },
    {
      id: 'monthly_streak_30',
      title: 'Streak Legend',
      description: 'Maintain a 30-day streak',
      type: 'monthly',
      icon: '💎',
      target: 30,
      current: user.streak.longest,
      reward: 1000,
      completed: user.streak.longest >= 30
    }
  ];

  res.json({
    success: true,
    data: {
      challenges
    }
  });
}));

// @route   POST /api/gamification/challenges/:challengeId/claim
// @desc    Claim challenge reward
// @access  Private
router.post('/challenges/:challengeId/claim', asyncHandler(async (req, res) => {
  const { challengeId } = req.params;

  const user = await User.findById(req.user._id);

  // Check if challenge is completed and reward can be claimed
  // This is a simplified version - in a real app, you'd track claimed challenges
  const challengeCompleted = true; // This would be determined by challenge logic
  const alreadyClaimed = false; // This would be checked against claimed challenges

  if (!challengeCompleted) {
    return res.status(400).json({
      success: false,
      message: 'Challenge not completed'
    });
  }

  if (alreadyClaimed) {
    return res.status(400).json({
      success: false,
      message: 'Reward already claimed'
    });
  }

  // Add XP reward (example: 100 XP)
  const xpReward = 100;
  const xpResult = user.addXP(xpReward);
  await user.save();

  res.json({
    success: true,
    message: 'Challenge reward claimed successfully',
    data: {
      xpEarned: xpResult.xpGained,
      leveledUp: xpResult.leveledUp,
      newLevel: xpResult.newLevel
    }
  });
}));

// @route   GET /api/gamification/achievements
// @desc    Get user achievements
// @access  Private
router.get('/achievements', asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const progress = await Progress.find({ user: req.user._id });

  const completedCourses = progress.filter(p => p.isCompleted).length;
  const totalWatchTime = progress.reduce((total, p) => total + p.totalWatchTime, 0);

  const achievements = [
    // Course completion achievements
    {
      id: 'first_course',
      name: 'First Course',
      description: 'Complete your first course',
      icon: '🎓',
      earned: completedCourses >= 1,
      earnedAt: completedCourses >= 1 ? new Date() : null
    },
    {
      id: 'course_master',
      name: 'Course Master',
      description: 'Complete 5 courses',
      icon: '🏆',
      earned: completedCourses >= 5,
      earnedAt: completedCourses >= 5 ? new Date() : null
    },
    {
      id: 'learning_champion',
      name: 'Learning Champion',
      description: 'Complete 10 courses',
      icon: '👑',
      earned: completedCourses >= 10,
      earnedAt: completedCourses >= 10 ? new Date() : null
    },

    // Streak achievements
    {
      id: 'week_warrior',
      name: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      icon: '🔥',
      earned: user.streak.current >= 7,
      earnedAt: user.streak.current >= 7 ? new Date() : null
    },
    {
      id: 'monthly_master',
      name: 'Monthly Master',
      description: 'Maintain a 30-day streak',
      icon: '⚡',
      earned: user.streak.current >= 30,
      earnedAt: user.streak.current >= 30 ? new Date() : null
    },
    {
      id: 'century_streak',
      name: 'Century Streak',
      description: 'Achieve a 100-day streak',
      icon: '💎',
      earned: user.streak.longest >= 100,
      earnedAt: user.streak.longest >= 100 ? new Date() : null
    },

    // XP achievements
    {
      id: 'xp_collector',
      name: 'XP Collector',
      description: 'Earn 1,000 XP',
      icon: '⭐',
      earned: user.xp >= 1000,
      earnedAt: user.xp >= 1000 ? new Date() : null
    },
    {
      id: 'xp_master',
      name: 'XP Master',
      description: 'Earn 5,000 XP',
      icon: '🌟',
      earned: user.xp >= 5000,
      earnedAt: user.xp >= 5000 ? new Date() : null
    },
    {
      id: 'xp_legend',
      name: 'XP Legend',
      description: 'Earn 10,000 XP',
      icon: '💫',
      earned: user.xp >= 10000,
      earnedAt: user.xp >= 10000 ? new Date() : null
    },

    // Level achievements
    {
      id: 'level_10',
      name: 'Level 10',
      description: 'Reach level 10',
      icon: '🔟',
      earned: user.level >= 10,
      earnedAt: user.level >= 10 ? new Date() : null
    },
    {
      id: 'level_25',
      name: 'Level 25',
      description: 'Reach level 25',
      icon: '2️⃣5️⃣',
      earned: user.level >= 25,
      earnedAt: user.level >= 25 ? new Date() : null
    },
    {
      id: 'level_50',
      name: 'Level 50',
      description: 'Reach level 50',
      icon: '5️⃣0️⃣',
      earned: user.level >= 50,
      earnedAt: user.level >= 50 ? new Date() : null
    },

    // Watch time achievements
    {
      id: 'hour_learner',
      name: 'Hour Learner',
      description: 'Watch 1 hour of content',
      icon: '⏰',
      earned: totalWatchTime >= 60,
      earnedAt: totalWatchTime >= 60 ? new Date() : null
    },
    {
      id: 'time_master',
      name: 'Time Master',
      description: 'Watch 5 hours of content',
      icon: '⏱️',
      earned: totalWatchTime >= 300,
      earnedAt: totalWatchTime >= 300 ? new Date() : null
    },
    {
      id: 'time_legend',
      name: 'Time Legend',
      description: 'Watch 10 hours of content',
      icon: '⌛',
      earned: totalWatchTime >= 600,
      earnedAt: totalWatchTime >= 600 ? new Date() : null
    }
  ];

  const earnedCount = achievements.filter(a => a.earned).length;
  const totalCount = achievements.length;

  res.json({
    success: true,
    data: {
      achievements,
      stats: {
        earned: earnedCount,
        total: totalCount,
        percentage: Math.round((earnedCount / totalCount) * 100)
      }
    }
  });
}));

// @route   GET /api/gamification/stats
// @desc    Get user gamification statistics
// @access  Private
router.get('/stats', asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const progress = await Progress.find({ user: req.user._id });

  const stats = {
    xp: user.xp,
    level: user.level,
    streak: user.streak,
    totalCoursesEnrolled: user.totalCoursesEnrolled,
    totalCoursesCompleted: user.totalCoursesCompleted,
    totalVideosWatched: user.totalVideosWatched,
    totalWatchTime: user.totalWatchTime,
    averageProgress: progress.length > 0 ? progress.reduce((total, p) => total + p.overallProgress, 0) / progress.length : 0,
    totalSessions: progress.reduce((total, p) => total + p.learningSessions.length, 0),
    averageSessionTime: progress.reduce((total, p) => {
      const sessionTime = p.learningSessions.reduce((sum, s) => sum + s.duration, 0);
      return total + sessionTime;
    }, 0) / Math.max(1, progress.reduce((total, p) => total + p.learningSessions.length, 0))
  };

  res.json({
    success: true,
    data: {
      stats
    }
  });
}));

export default router; 