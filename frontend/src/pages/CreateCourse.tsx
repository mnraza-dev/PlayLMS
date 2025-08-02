import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';
import toast from 'react-hot-toast';
import { 
  Youtube, 
  Play, 
  BookOpen, 
  Users, 
  Clock, 
  Star,
  Plus,
  ChevronRight,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import api from '../services/api';

interface CreateCourseForm {
  playlistUrl: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string;
  isPublic: boolean;
}

interface PlaylistPreview {
  title: string;
  description: string;
  thumbnail: string;
  videoCount: number;
  channelTitle: string;
  estimatedDuration: string;
  estimatedXP: number;
  sampleVideos?: Array<{
    title: string;
    duration: number;
    thumbnail: string;
  }>;
}

const categories = [
  'programming', 'design', 'business', 'marketing', 'music', 'cooking',
  'fitness', 'language', 'science', 'history', 'technology', 'art',
  'photography', 'finance', 'health', 'other'
];

const CreateCourse: React.FC = () => {
  const navigate = useNavigate();
  const [playlistPreview, setPlaylistPreview] = useState<PlaylistPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [step, setStep] = useState(1);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CreateCourseForm>({
    defaultValues: {
      difficulty: 'beginner',
      isPublic: true
    }
  });

  const playlistUrl = watch('playlistUrl');

  // Preview playlist mutation
  const previewMutation = useMutation(
    (url: string) => api.post('/courses/preview', { playlistUrl: url }),
    {
      onSuccess: (data) => {
        setPlaylistPreview(data.data.preview);
        setStep(2);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to preview playlist');
      }
    }
  );

  // Create course mutation
  const createCourseMutation = useMutation(
    (data: CreateCourseForm) => api.post('/courses/convert', {
      ...data,
      tags: data.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    }),
    {
      onSuccess: (data) => {
        toast.success('Course created successfully!');
        navigate(`/courses/${data.data.course.slug}`);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to create course');
      }
    }
  );

  const handlePreviewPlaylist = async () => {
    if (!playlistUrl) {
      toast.error('Please enter a playlist URL');
      return;
    }

    setPreviewLoading(true);
    try {
      await previewMutation.mutateAsync(playlistUrl);
    } finally {
      setPreviewLoading(false);
    }
  };

  const onSubmit = (data: CreateCourseForm) => {
    createCourseMutation.mutate(data);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Create Course from YouTube Playlist
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Convert any YouTube playlist into a structured learning course with progress tracking, 
          gamification, and interactive features.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center mb-8">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
          step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          1
        </div>
        <div className={`flex-1 h-1 mx-4 ${
          step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'
        }`} />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
          step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          2
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Step 1: Playlist URL */}
        {step === 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Step 1: Enter Playlist URL
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  YouTube Playlist URL
                </label>
                <div className="relative">
                  <Youtube className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="url"
                    {...register('playlistUrl', {
                      required: 'Playlist URL is required',
                      pattern: {
                        value: /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/,
                        message: 'Please enter a valid YouTube URL'
                      }
                    })}
                    placeholder="https://www.youtube.com/playlist?list=..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                {errors.playlistUrl && (
                  <p className="mt-1 text-red-600 text-sm flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.playlistUrl.message}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  Public playlists
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  Unlisted playlists
                </div>
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-amber-500 mr-1" />
                  Private playlists not supported
                </div>
              </div>

              <button
                type="button"
                onClick={handlePreviewPlaylist}
                disabled={!playlistUrl || previewLoading}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {previewLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Loading Preview...
                  </>
                ) : (
                  <>
                    Preview Playlist
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Course Details */}
        {step === 2 && playlistPreview && (
          <div className="space-y-6">
            {/* Playlist Preview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Playlist Preview
              </h2>
              
              <div className="flex gap-6">
                <img 
                  src={playlistPreview.thumbnail} 
                  alt={playlistPreview.title}
                  className="w-48 h-28 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {playlistPreview.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {playlistPreview.description}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {playlistPreview.channelTitle}
                    </div>
                    <div className="flex items-center">
                      <Play className="h-4 w-4 mr-1" />
                      {playlistPreview.videoCount} videos
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {playlistPreview.estimatedDuration}
                    </div>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-1" />
                      {playlistPreview.estimatedXP} XP
                    </div>
                  </div>
                </div>

                {/* Sample Videos */}
                {playlistPreview.sampleVideos && playlistPreview.sampleVideos.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Sample Videos
                    </h4>
                    <div className="space-y-2">
                      {playlistPreview.sampleVideos.map((video, index) => (
                        <div key={index} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                          <img 
                            src={video.thumbnail} 
                            alt={video.title}
                            className="w-16 h-9 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {video.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDuration(video.duration)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Course Configuration */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Step 2: Configure Course
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    {...register('category', { required: 'Category is required' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-red-600 text-sm">{errors.category.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    {...register('difficulty')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    {...register('tags')}
                    placeholder="react, javascript, web development"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('isPublic')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Make this course public (visible to all users)
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Back
              </button>
              
              <button
                type="submit"
                disabled={createCourseMutation.isLoading}
                className="bg-indigo-600 text-white px-8 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {createCourseMutation.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Course...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Course
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default CreateCourse;
