import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  Play,
  BookOpen,
  Trophy,
  Users,
  Clock,
  Star,
  ArrowRight,
  CheckCircle,
  Zap,
  Target,
  TrendingUp,
} from 'lucide-react'

const Home = () => {
  const { user } = useAuth()

  const features = [
    {
      icon: BookOpen,
      title: 'Convert Playlists',
      description: 'Transform any YouTube playlist into a structured learning course with just a URL.',
    },
    {
      icon: Play,
      title: 'Video Learning',
      description: 'Watch videos with progress tracking, notes, and bookmarks for better retention.',
    },
    {
      icon: Trophy,
      title: 'Gamification',
      description: 'Earn XP, unlock achievements, and compete on leaderboards to stay motivated.',
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Follow other learners, share courses, and build your learning network.',
    },
    {
      icon: Clock,
      title: 'Progress Tracking',
      description: 'Monitor your learning journey with detailed analytics and completion rates.',
    },
    {
      icon: Star,
      title: 'Personalized',
      description: 'Get recommendations based on your interests and learning history.',
    },
  ]

  const stats = [
    { label: 'Courses Created', value: '500+' },
    { label: 'Active Learners', value: '10K+' },
    { label: 'Hours of Content', value: '50K+' },
    { label: 'Success Rate', value: '95%' },
  ]

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Transform YouTube Playlists into
              <span className="gradient-text block">Structured Courses</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Convert any YouTube playlist into a comprehensive learning experience with progress tracking, 
              gamification, and a modern LMS platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link
                  to="/create-course"
                  className="btn-primary btn-lg flex items-center justify-center space-x-2"
                >
                  <Play className="w-5 h-5" />
                  <span>Create Your First Course</span>
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="btn-primary btn-lg flex items-center justify-center space-x-2"
                  >
                    <Play className="w-5 h-5" />
                    <span>Get Started Free</span>
                  </Link>
                  <Link
                    to="/courses"
                    className="btn-outline btn-lg flex items-center justify-center space-x-2"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>Browse Courses</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need for modern learning
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              From playlist conversion to progress tracking, we've built the complete learning platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="card p-6 hover:shadow-medium transition-all duration-300 group"
                >
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-200 dark:group-hover:bg-primary-800 transition-colors">
                    <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How it works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Get started in minutes with our simple three-step process.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Paste Playlist URL
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Simply paste any YouTube playlist URL and our system will automatically extract all videos.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Customize Course
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Add descriptions, categories, and tags to organize your course content effectively.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Start Learning
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Begin your learning journey with progress tracking, notes, and gamification features.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 dark:bg-primary-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to transform your learning?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of learners who are already using PlayLMS to enhance their learning experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link
                to="/create-course"
                className="btn-secondary btn-lg flex items-center justify-center space-x-2"
              >
                <span>Create Your First Course</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="btn-secondary btn-lg flex items-center justify-center space-x-2"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/courses"
                  className="btn-ghost btn-lg flex items-center justify-center space-x-2 text-white hover:bg-white/10"
                >
                  <span>Browse Courses</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home 