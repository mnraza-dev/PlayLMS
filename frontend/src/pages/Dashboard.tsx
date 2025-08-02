import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  BookOpen, 
  Trophy, 
  Flame, 
  Target, 
  TrendingUp, 
  Clock, 
  Play,
  Star,
  Calendar,
  Award,
  Zap,
  Users
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiHelpers } from '../services/api';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalCourses: number;
  completedCourses: number;
  totalXP: number;
  currentStreak: number;
  longestStreak: number;
  totalWatchTime: number;
  level: number;
  badges: Array<{
    name: string;
    description: string;
    icon: string;
    earnedAt: string;
  }>;
}

interface RecentCourse {
  _id: string;
  title: string;
  thumbnail: string;
  progress: number;
  lastAccessed: string;
  totalModules: number;
  completedModules: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch dashboard data
  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery(
    'dashboard',
    async () => {
      const [gamificationData, userStats] = await Promise.all([
        apiHelpers.getGamificationDashboard(),
        apiHelpers.getUserStats(),
      ]);
      return { gamificationData, userStats };
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Fetch recent courses
  const { data: recentCourses, isLoading: isLoadingCourses } = useQuery(
    'recentCourses',
    () => apiHelpers.getCourses({ limit: 5, enrolled: true }),
    {
      refetchInterval: 60000, // Refetch every minute
    }
  );

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getLevelProgress = (xp: number) => {
    const currentLevel = Math.floor(Math.sqrt(xp / 100)) + 1;
    const xpForCurrentLevel = (currentLevel - 1) ** 2 * 100;
    const xpForNextLevel = currentLevel ** 2 * 100;
    const progress = ((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;
    return { currentLevel, progress: Math.min(progress, 100) };
  };

  const levelInfo = getLevelProgress(dashboardData?.gamificationData?.xp || 0);

  if (isLoadingDashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Continue your learning journey and track your progress
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Courses Enrolled</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardData?.userStats?.totalCoursesEnrolled || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Trophy className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Courses Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardData?.userStats?.totalCoursesCompleted || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Flame className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardData?.gamificationData?.streak?.current || 0} days
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total XP</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardData?.gamificationData?.xp || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Level {levelInfo.currentLevel}
            </h2>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {dashboardData?.gamificationData?.xp || 0} XP
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${levelInfo.progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {Math.round(levelInfo.progress)}% to next level
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Courses */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Continue Learning
                </h2>
                <Link
                  to="/courses"
                  className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                >
                  View all courses
                </Link>
              </div>

              {isLoadingCourses ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center space-x-4">
                        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg w-16 h-12"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentCourses?.data?.length > 0 ? (
                <div className="space-y-4">
                  {recentCourses.data.map((course: RecentCourse) => (
                    <Link
                      key={course._id}
                      to={`/courses/${course._id}`}
                      className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-16 h-12 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {course.title}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center space-x-1">
                            <Play className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {course.completedModules}/{course.totalModules} modules
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Target className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {course.progress}% complete
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No courses yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Start your learning journey by enrolling in a course
                  </p>
                  <Link
                    to="/courses"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Browse Courses
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Achievements */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Achievements
              </h3>
              {dashboardData?.gamificationData?.badges?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.gamificationData.badges.slice(0, 3).map((badge, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                        <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {badge.name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {badge.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Complete courses to earn achievements!
                </p>
              )}
            </div>

            {/* Learning Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Learning Stats
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Watch Time</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDuration(dashboardData?.userStats?.totalWatchTime || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Play className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Videos Watched</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {dashboardData?.userStats?.totalVideosWatched || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Flame className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Longest Streak</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {dashboardData?.gamificationData?.streak?.longest || 0} days
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link
                  to="/create-course"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Create Course
                  </span>
                </Link>
                <Link
                  to="/leaderboard"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Trophy className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    View Leaderboard
                  </span>
                </Link>
                <Link
                  to="/achievements"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                    <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    View Achievements
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 