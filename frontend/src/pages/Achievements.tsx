import React from 'react';
import { useQuery } from 'react-query';
import { Award, Trophy, Star, Target, Flame, BookOpen, Clock, Users } from 'lucide-react';
import { apiHelpers } from '../services/api';

const Achievements: React.FC = () => {
  const { data: achievementsData, isLoading } = useQuery(
    'achievements',
    () => apiHelpers.getAchievements(),
    {
      refetchInterval: 60000, // Refetch every minute
    }
  );

  const { data: userStats } = useQuery(
    'userStats',
    () => apiHelpers.getUserStats(),
    {
      refetchInterval: 60000,
    }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const achievements = achievementsData?.data || [];
  const stats = userStats?.data;

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'xp':
        return <Trophy className="h-6 w-6" />;
      case 'streak':
        return <Flame className="h-6 w-6" />;
      case 'courses':
        return <BookOpen className="h-6 w-6" />;
      case 'time':
        return <Clock className="h-6 w-6" />;
      default:
        return <Award className="h-6 w-6" />;
    }
  };

  const getAchievementColor = (type: string) => {
    switch (type) {
      case 'xp':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400';
      case 'streak':
        return 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400';
      case 'courses':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400';
      case 'time':
        return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400';
      default:
        return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Achievements</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Track your accomplishments and unlock new badges
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Trophy className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total XP</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.xp || 0}
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
                  {stats?.streak?.current || 0} days
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Courses Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.totalCoursesCompleted || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Watch Time</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.floor((stats?.totalWatchTime || 0) / 60)}h
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Your Achievements
          </h2>

          {achievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((achievement: any, index: number) => (
                <div
                  key={achievement._id}
                  className={`p-6 rounded-lg border-2 ${
                    achievement.earned
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                      : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div
                      className={`p-3 rounded-lg ${
                        achievement.earned
                          ? getAchievementColor(achievement.type)
                          : 'bg-gray-200 text-gray-400 dark:bg-gray-600 dark:text-gray-500'
                      }`}
                    >
                      {getAchievementIcon(achievement.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {achievement.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {achievement.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {achievement.earned ? (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          ) : (
                            <Target className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {achievement.earned ? 'Earned' : 'Locked'}
                          </span>
                        </div>
                        {achievement.earned && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(achievement.earnedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No achievements yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Complete courses and challenges to unlock achievements!
              </p>
            </div>
          )}
        </div>

        {/* Achievement Categories */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              XP Achievements
            </h3>
            <div className="space-y-3">
              {[
                { name: 'First Steps', requirement: 'Earn 100 XP', earned: stats?.xp >= 100 },
                { name: 'Getting Started', requirement: 'Earn 500 XP', earned: stats?.xp >= 500 },
                { name: 'Dedicated Learner', requirement: 'Earn 1,000 XP', earned: stats?.xp >= 1000 },
                { name: 'XP Master', requirement: 'Earn 5,000 XP', earned: stats?.xp >= 5000 },
              ].map((achievement, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{achievement.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{achievement.requirement}</p>
                  </div>
                  {achievement.earned ? (
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  ) : (
                    <Target className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Streak Achievements
            </h3>
            <div className="space-y-3">
              {[
                { name: 'Week Warrior', requirement: '7-day streak', earned: (stats?.streak?.current || 0) >= 7 },
                { name: 'Fortnight Fighter', requirement: '14-day streak', earned: (stats?.streak?.current || 0) >= 14 },
                { name: 'Monthly Master', requirement: '30-day streak', earned: (stats?.streak?.current || 0) >= 30 },
                { name: 'Streak Legend', requirement: '100-day streak', earned: (stats?.streak?.current || 0) >= 100 },
              ].map((achievement, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{achievement.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{achievement.requirement}</p>
                  </div>
                  {achievement.earned ? (
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  ) : (
                    <Target className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Achievements; 