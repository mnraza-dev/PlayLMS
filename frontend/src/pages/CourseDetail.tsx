import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  BookOpen, 
  Clock, 
  Users, 
  Star, 
  Play,
  Target,
  Calendar,
  Award,
  Share2,
  Heart,
  MessageCircle,
  Eye,
  CheckCircle,
  Lock
} from 'lucide-react';
import { apiHelpers } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Module {
  _id: string;
  title: string;
  description: string;
  videoId: string;
  videoUrl: string;
  thumbnail: string;
  duration: number;
  order: number;
  xpReward: number;
  isCompleted?: boolean;
  isUnlocked?: boolean;
}

interface Review {
  _id: string;
  user: {
    firstName: string;
    lastName: string;
    username: string;
  };
  rating: number;
  review: string;
  createdAt: string;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: string;
  difficulty: string;
  totalModules: number;
  totalDuration: number;
  totalEnrollments: number;
  averageRating: number;
  totalRatings: number;
  creator: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  modules: Module[];
  ratings: Review[];
  isEnrolled?: boolean;
  progress?: number;
  enrolledAt?: string;
}

const CourseDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'reviews'>('overview');
  const [showAllModules, setShowAllModules] = useState(false);

  const { data: courseData, isLoading, refetch } = useQuery(
    ['course', slug],
    () => apiHelpers.getCourse(slug!),
    {
      enabled: !!slug,
    }
  );

  const handleEnroll = async () => {
    if (!user) {
      toast.error('Please log in to enroll in courses');
      return;
    }

    try {
      await apiHelpers.enrollInCourse(courseData.data._id);
      toast.success('Successfully enrolled in course!');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to enroll in course');
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const formatDurationMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const renderStars = (rating: number, size: 'sm' | 'md' = 'md') => {
    const starSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`${starSize} ${
              i < Math.floor(rating)
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
          ({rating.toFixed(1)})
        </span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!courseData?.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Course not found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            The course you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const course: Course = courseData.data;
  const completedModules = course.modules.filter(m => m.isCompleted).length;
  const unlockedModules = course.modules.filter(m => m.isUnlocked !== false).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="relative h-64 md:h-80">
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full">
                  {course.category}
                </span>
                <span className="px-3 py-1 bg-gray-600 text-white text-sm rounded-full">
                  {course.difficulty}
                </span>
                {course.isEnrolled && (
                  <span className="px-3 py-1 bg-green-600 text-white text-sm rounded-full">
                    Enrolled
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {course.title}
              </h1>
              <p className="text-gray-200 text-lg mb-4 line-clamp-2">
                {course.description}
              </p>
              <div className="flex items-center space-x-6 text-white">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>{course.totalEnrollments} students enrolled</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>{formatDurationMinutes(course.totalDuration)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>{course.totalModules} modules</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-gray-600 dark:text-gray-400">
                    {course.creator.firstName[0]}{course.creator.lastName[0]}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {course.creator.firstName} {course.creator.lastName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Course Creator
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {renderStars(course.averageRating)}
                <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <Heart className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            {course.isEnrolled && course.progress !== undefined && (
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Your Progress</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {course.progress}% complete
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-4">
              {course.isEnrolled ? (
                <Link
                  to={`/courses/${course._id}/1`}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Continue Learning
                </Link>
              ) : (
                <button
                  onClick={handleEnroll}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Enroll Now
                </button>
              )}
              <button className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <MessageCircle className="h-5 w-5 mr-2" />
                Ask Question
              </button>
            </div>
          </div>
        </div>

        {/* Course Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'modules', label: 'Modules' },
                    { id: 'reviews', label: 'Reviews' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    About this course
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                    {course.description}
                  </p>
                  
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                    What you'll learn
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    {course.modules.slice(0, 6).map((module, index) => (
                      <div key={module._id} className="flex items-start space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {module.title}
                        </span>
                      </div>
                    ))}
                  </div>

                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                    Course requirements
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <li>• No prior experience required</li>
                    <li>• Basic computer skills</li>
                    <li>• Internet connection</li>
                  </ul>
                </div>
              )}

              {activeTab === 'modules' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Course Content
                    </h3>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {completedModules}/{course.totalModules} completed
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {course.modules.map((module, index) => (
                      <div
                        key={module._id}
                        className={`p-4 rounded-lg border ${
                          module.isCompleted
                            ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                            : module.isUnlocked !== false
                            ? 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {module.isCompleted ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : module.isUnlocked !== false ? (
                              <Play className="h-5 w-5 text-blue-500" />
                            ) : (
                              <Lock className="h-5 w-5 text-gray-400" />
                            )}
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {index + 1}. {module.title}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {module.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {formatDuration(module.duration)}
                            </span>
                            {module.isUnlocked !== false && (
                              <Link
                                to={`/courses/${course._id}/${module.order}`}
                                className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                              >
                                {module.isCompleted ? 'Review' : 'Start'}
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Student Reviews
                    </h3>
                    {renderStars(course.averageRating, 'sm')}
                  </div>
                  
                  {course.ratings.length > 0 ? (
                    <div className="space-y-6">
                      {course.ratings.map((review) => (
                        <div key={review._id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  {review.user.firstName[0]}{review.user.lastName[0]}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {review.user.firstName} {review.user.lastName}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            {renderStars(review.rating, 'sm')}
                          </div>
                          <p className="text-gray-600 dark:text-gray-400">
                            {review.review}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No reviews yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Be the first to review this course!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Course Statistics
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Students</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {course.totalEnrollments}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Average Rating</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {course.averageRating.toFixed(1)}/5
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Reviews</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {course.totalRatings}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Course Duration</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDurationMinutes(course.totalDuration)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Modules</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {course.totalModules}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress (if enrolled) */}
            {course.isEnrolled && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Your Progress
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {completedModules}/{course.totalModules}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Unlocked</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {unlockedModules}/{course.totalModules}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${course.progress || 0}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    {course.progress || 0}% complete
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail; 