import express from 'express';
import { body, validationResult } from 'express-validator';
import Progress from '../models/Progress.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// @route   GET /api/progress/:courseId
// @desc    Get user progress for a course
// @access  Private
router.get('/:courseId', asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const progress = await Progress.findOne({
    user: req.user._id,
    course: courseId
  }).populate('course', 'title totalModules');

  if (!progress) {
    return res.status(404).json({
      success: false,
      message: 'Progress not found'
    });
  }

  res.json({
    success: true,
    data: {
      progress
    }
  });
}));

// @route   POST /api/progress/:courseId/modules/:moduleOrder/watch
// @desc    Update module watch progress
// @access  Private
router.post('/:courseId/modules/:moduleOrder/watch', [
  body('watchTime')
    .isInt({ min: 0 })
    .withMessage('Watch time must be a positive integer'),
  body('isCompleted')
    .optional()
    .isBoolean()
    .withMessage('isCompleted must be a boolean')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { courseId, moduleOrder } = req.params;
  const { watchTime, isCompleted = false } = req.body;

  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found'
    });
  }

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
  const moduleProgress = progress.updateModuleProgress(parseInt(moduleOrder), watchTime, isCompleted);
  await progress.save();

  // Update course progress
  if (isCompleted) {
    course.completeModule(req.user._id, parseInt(moduleOrder));
    await course.save();

    // Update user stats and XP
    const user = await User.findById(req.user._id);
    user.totalVideosWatched += 1;
    user.totalWatchTime += Math.floor(watchTime / 60);
    
    const module = course.modules.find(m => m.order === parseInt(moduleOrder));
    if (module) {
      const xpResult = user.addXP(module.xpReward);
      await user.save();
      
      res.json({
        success: true,
        message: 'Progress updated successfully',
        data: {
          progress: progress.overallProgress,
          xpEarned: xpResult.xpGained,
          leveledUp: xpResult.leveledUp,
          newLevel: xpResult.newLevel
        }
      });
    } else {
      await user.save();
      res.json({
        success: true,
        message: 'Progress updated successfully',
        data: {
          progress: progress.overallProgress
        }
      });
    }
  } else {
    res.json({
      success: true,
      message: 'Progress updated successfully',
      data: {
        progress: progress.overallProgress
      }
    });
  }
}));

// @route   POST /api/progress/:courseId/modules/:moduleOrder/notes
// @desc    Add note to module
// @access  Private
router.post('/:courseId/modules/:moduleOrder/notes', [
  body('content')
    .notEmpty()
    .withMessage('Note content is required')
    .isLength({ max: 1000 })
    .withMessage('Note content must be less than 1000 characters'),
  body('timestamp')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Timestamp must be a positive integer')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { courseId, moduleOrder } = req.params;
  const { content, timestamp = 0 } = req.body;

  const progress = await Progress.findOne({
    user: req.user._id,
    course: courseId
  });

  if (!progress) {
    return res.status(400).json({
      success: false,
      message: 'Not enrolled in this course'
    });
  }

  const success = progress.addNote(parseInt(moduleOrder), content, timestamp);
  if (!success) {
    return res.status(400).json({
      success: false,
      message: 'Failed to add note'
    });
  }

  await progress.save();

  res.json({
    success: true,
    message: 'Note added successfully',
    data: {
      note: {
        content,
        timestamp,
        createdAt: new Date()
      }
    }
  });
}));

// @route   POST /api/progress/:courseId/modules/:moduleOrder/bookmarks
// @desc    Add bookmark to module
// @access  Private
router.post('/:courseId/modules/:moduleOrder/bookmarks', [
  body('timestamp')
    .isInt({ min: 0 })
    .withMessage('Timestamp must be a positive integer'),
  body('title')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Bookmark title must be less than 200 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { courseId, moduleOrder } = req.params;
  const { timestamp, title } = req.body;

  const progress = await Progress.findOne({
    user: req.user._id,
    course: courseId
  });

  if (!progress) {
    return res.status(400).json({
      success: false,
      message: 'Not enrolled in this course'
    });
  }

  const success = progress.addBookmark(parseInt(moduleOrder), timestamp, title);
  if (!success) {
    return res.status(400).json({
      success: false,
      message: 'Failed to add bookmark'
    });
  }

  await progress.save();

  res.json({
    success: true,
    message: 'Bookmark added successfully',
    data: {
      bookmark: {
        timestamp,
        title: title || `Bookmark at ${Math.floor(timestamp / 60)}:${(timestamp % 60).toString().padStart(2, '0')}`,
        createdAt: new Date()
      }
    }
  });
}));

// @route   POST /api/progress/:courseId/session
// @desc    Record learning session
// @access  Private
router.post('/:courseId/session', [
  body('startTime')
    .isISO8601()
    .withMessage('Start time must be a valid ISO date'),
  body('endTime')
    .isISO8601()
    .withMessage('End time must be a valid ISO date'),
  body('modulesWatched')
    .isArray()
    .withMessage('Modules watched must be an array'),
  body('xpEarned')
    .isInt({ min: 0 })
    .withMessage('XP earned must be a positive integer')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { courseId } = req.params;
  const { startTime, endTime, modulesWatched, xpEarned } = req.body;

  const progress = await Progress.findOne({
    user: req.user._id,
    course: courseId
  });

  if (!progress) {
    return res.status(400).json({
      success: false,
      message: 'Not enrolled in this course'
    });
  }

  // Add learning session
  progress.addLearningSession(new Date(startTime), new Date(endTime), modulesWatched, xpEarned);
  await progress.save();

  // Update user streak
  const user = await User.findById(req.user._id);
  user.updateStreak();
  await user.save();

  res.json({
    success: true,
    message: 'Learning session recorded successfully',
    data: {
      session: {
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        modulesWatched,
        xpEarned
      },
      currentStreak: user.streak.current
    }
  });
}));

// @route   GET /api/progress/:courseId/analytics
// @desc    Get course analytics
// @access  Private
router.get('/:courseId/analytics', asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const progress = await Progress.findOne({
    user: req.user._id,
    course: courseId
  }).populate('course', 'title totalModules totalDuration');

  if (!progress) {
    return res.status(404).json({
      success: false,
      message: 'Progress not found'
    });
  }

  const analytics = {
    overallProgress: progress.overallProgress,
    totalWatchTime: progress.formattedTotalWatchTime,
    completedModules: progress.completedModules,
    totalModules: progress.course.totalModules,
    estimatedCompletionTime: progress.estimatedCompletionTime,
    learningStats: progress.getLearningStats(),
    moduleBreakdown: progress.moduleProgress.map(mp => ({
      moduleOrder: mp.moduleOrder,
      isCompleted: mp.isCompleted,
      watchTime: mp.watchTime,
      lastWatched: mp.lastWatched,
      notesCount: mp.notes.length,
      bookmarksCount: mp.bookmarks.length
    }))
  };

  res.json({
    success: true,
    data: {
      analytics
    }
  });
}));

// @route   DELETE /api/progress/:courseId/modules/:moduleOrder/notes/:noteId
// @desc    Delete note
// @access  Private
router.delete('/:courseId/modules/:moduleOrder/notes/:noteId', asyncHandler(async (req, res) => {
  const { courseId, moduleOrder, noteId } = req.params;

  const progress = await Progress.findOne({
    user: req.user._id,
    course: courseId
  });

  if (!progress) {
    return res.status(400).json({
      success: false,
      message: 'Not enrolled in this course'
    });
  }

  const moduleProgress = progress.moduleProgress.find(mp => mp.moduleOrder === parseInt(moduleOrder));
  if (!moduleProgress) {
    return res.status(404).json({
      success: false,
      message: 'Module progress not found'
    });
  }

  const noteIndex = moduleProgress.notes.findIndex(note => note._id.toString() === noteId);
  if (noteIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Note not found'
    });
  }

  moduleProgress.notes.splice(noteIndex, 1);
  await progress.save();

  res.json({
    success: true,
    message: 'Note deleted successfully'
  });
}));

// @route   DELETE /api/progress/:courseId/modules/:moduleOrder/bookmarks/:bookmarkId
// @desc    Delete bookmark
// @access  Private
router.delete('/:courseId/modules/:moduleOrder/bookmarks/:bookmarkId', asyncHandler(async (req, res) => {
  const { courseId, moduleOrder, bookmarkId } = req.params;

  const progress = await Progress.findOne({
    user: req.user._id,
    course: courseId
  });

  if (!progress) {
    return res.status(400).json({
      success: false,
      message: 'Not enrolled in this course'
    });
  }

  const moduleProgress = progress.moduleProgress.find(mp => mp.moduleOrder === parseInt(moduleOrder));
  if (!moduleProgress) {
    return res.status(404).json({
      success: false,
      message: 'Module progress not found'
    });
  }

  const bookmarkIndex = moduleProgress.bookmarks.findIndex(bookmark => bookmark._id.toString() === bookmarkId);
  if (bookmarkIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Bookmark not found'
    });
  }

  moduleProgress.bookmarks.splice(bookmarkIndex, 1);
  await progress.save();

  res.json({
    success: true,
    message: 'Bookmark deleted successfully'
  });
}));

export default router; 