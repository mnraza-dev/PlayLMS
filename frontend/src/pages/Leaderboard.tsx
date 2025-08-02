import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Trophy, Medal, Crown, Flame, Target, Users } from 'lucide-react';
import { apiHelpers } from '../services/api';

const Leaderboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'xp' | 'streak' | 'courses'>('xp');

  const { data: leaderboardData, isLoading } = useQuery(
    ['leaderboard', activeTab],
    () => apiHelpers.getLeaderboard(activeTab, 50),
    {
      refetchInterval: 300000, // Refetch every 5 minutes
    }
  );

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-amber-600" />;
    return <span className="text-lg font-bold text-gray-600 dark:text-gray-400">{rank}</span>;
  };

  const formatXP = (xp: number) => {
    if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
    if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
    return xp.toString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leaderboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            See the top learners and their achievements
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'xp', label: 'XP Leaders', icon: Trophy },
                { id: 'streak', label: 'Streak Champions', icon: Flame },
                { id: 'courses', label: 'Course Masters', icon: Target },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {leaderboardData?.data?.length > 0 ? (
              <div className="space-y-4">
                {leaderboardData.data.map((user: any, index: number) => (
                  <div
                    key={user._id}
                    className={`flex items-center space-x-4 p-4 rounded-lg border ${
                      index < 3
                        ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-center w-12 h-12">
                      {getRankIcon(index + 1)}
                    </div>

                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          @{user.username}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      {activeTab === 'xp' && (
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatXP(user.xp)} XP
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Level {user.level}
                          </p>
                        </div>
                      )}

                      {activeTab === 'streak' && (
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {user.streak?.current || 0} days
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Current streak
                          </p>
                        </div>
                      )}

                      {activeTab === 'courses' && (
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {user.totalCoursesCompleted || 0}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Courses completed
                          </p>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        {user.badges?.slice(0, 3).map((badge: any, badgeIndex: number) => (
                          <div
                            key={badgeIndex}
                            className="w-6 h-6 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center"
                            title={badge.name}
                          >
                            <Trophy className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                          </div>
                        ))}
                        {user.badges?.length > 3 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            +{user.badges.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No leaderboard data
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Start learning to appear on the leaderboard!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard; 