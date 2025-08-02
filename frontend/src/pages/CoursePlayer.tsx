import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Maximize,
  Settings,
  BookOpen,
  MessageCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Target,
  Award,
  Edit3,
  Save,
  X,
  Plus,
  Trash2
} from 'lucide-react';
import YouTube from 'react-youtube';
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

interface Note {
  _id: string;
  content: string;
  timestamp: number;
  createdAt: string;
  updatedAt: string;
}

interface Course {
  _id: string;
  title: string;
  modules: Module[];
  totalModules: number;
}

const CoursePlayer: React.FC = () => {
  const { courseId, moduleOrder } = useParams<{ courseId: string; moduleOrder: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteTimestamp, setNoteTimestamp] = useState(0);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const currentModuleOrder = parseInt(moduleOrder || '1');
  const currentModule = course?.modules.find(m => m.order === currentModuleOrder);
  const nextModule = course?.modules.find(m => m.order === currentModuleOrder + 1);
  const prevModule = course?.modules.find(m => m.order === currentModuleOrder - 1);

  // Fetch course data
  const { data: courseData, isLoading } = useQuery(
    ['course', courseId],
    () => apiHelpers.getCourse(courseId!),
    {
      enabled: !!courseId,
    }
  );

  // Fetch progress data
  const { data: progressData, refetch: refetchProgress } = useQuery(
    ['progress', courseId],
    () => apiHelpers.getProgress(courseId!),
    {
      enabled: !!courseId,
    }
  );

  const course: Course | undefined = courseData?.data;

  // Mutations
  const updateProgressMutation = useMutation(
    (data: { watchTime: number; isCompleted: boolean }) =>
      apiHelpers.updateWatchProgress(courseId!, currentModuleOrder, data.watchTime, data.isCompleted),
    {
      onSuccess: () => {
        refetchProgress();
        queryClient.invalidateQueries(['course', courseId]);
      },
    }
  );

  const addNoteMutation = useMutation(
    (data: { content: string; timestamp: number }) =>
      apiHelpers.addNote(courseId!, currentModuleOrder, data.content, data.timestamp),
    {
      onSuccess: () => {
        refetchProgress();
        toast.success('Note added successfully!');
      },
    }
  );

  const completeModuleMutation = useMutation(
    () => apiHelpers.completeModule(courseId!, currentModuleOrder),
    {
      onSuccess: () => {
        refetchProgress();
        queryClient.invalidateQueries(['course', courseId]);
        toast.success('Module completed! +10 XP');
      },
    }
  );

  // YouTube player options
  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: 0,
      modestbranding: 1,
      rel: 0,
    },
  };

  // Player event handlers
  const onReady = (event: any) => {
    setPlayer(event.target);
    setDuration(event.target.getDuration());
  };

  const onStateChange = (event: any) => {
    const state = event.target.getPlayerState();
    setIsPlaying(state === 1);
  };

  const onProgress = () => {
    if (player) {
      const time = player.getCurrentTime();
      setCurrentTime(time);
      
      // Update progress every 30 seconds
      if (Math.floor(time) % 30 === 0) {
        updateProgressMutation.mutate({
          watchTime: time,
          isCompleted: time >= duration * 0.9, // Mark as completed if watched 90%
        });
      }
    }
  };

  // Control functions
  const togglePlay = () => {
    if (player) {
      if (isPlaying) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
    }
  };

  const seekTo = (time: number) => {
    if (player) {
      player.seekTo(time);
    }
  };

  const skipBackward = () => {
    if (player) {
      const newTime = Math.max(0, currentTime - 10);
      player.seekTo(newTime);
    }
  };

  const skipForward = () => {
    if (player) {
      const newTime = Math.min(duration, currentTime + 10);
      player.seekTo(newTime);
    }
  };

  const toggleMute = () => {
    if (player) {
      if (isMuted) {
        player.unMute();
        setIsMuted(false);
      } else {
        player.mute();
        setIsMuted(true);
      }
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (player) {
      player.setVolume(newVolume);
      setVolume(newVolume);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCompleteModule = () => {
    completeModuleMutation.mutate();
  };

  const handleAddNote = () => {
    if (noteContent.trim()) {
      addNoteMutation.mutate({
        content: noteContent,
        timestamp: currentTime,
      });
      setNoteContent('');
      setIsEditingNote(false);
    }
  };

  const handleNoteClick = (note: Note) => {
    seekTo(note.timestamp);
    setSelectedNote(note);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!course || !currentModule) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Module not found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            The module you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const progress = progressData?.data?.modules?.find((m: any) => m.order === currentModuleOrder);
  const notes = progress?.notes || [];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to={`/courses/${courseId}`}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-white">
                {course.title}
              </h1>
              <p className="text-sm text-gray-400">
                Module {currentModuleOrder}: {currentModule.title}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-gray-400">
              <Target className="h-4 w-4" />
              <span className="text-sm">
                {currentModuleOrder}/{course.totalModules}
              </span>
            </div>
            {currentModule.isCompleted && (
              <div className="flex items-center space-x-2 text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Completed</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Video Player */}
        <div className="flex-1 flex flex-col">
          {/* Video Container */}
          <div className="relative bg-black flex-1">
            <YouTube
              videoId={currentModule.videoId}
              opts={opts}
              onReady={onReady}
              onStateChange={onStateChange}
              onProgress={onProgress}
              className="w-full h-full"
            />
            
            {/* Custom Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="w-full bg-gray-600 rounded-full h-1 cursor-pointer" onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const percentage = clickX / rect.width;
                  seekTo(percentage * duration);
                }}>
                  <div
                    className="bg-red-600 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-white text-sm mt-2">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={togglePlay}
                    className="text-white hover:text-gray-300 transition-colors"
                  >
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                  </button>
                  <button
                    onClick={skipBackward}
                    className="text-white hover:text-gray-300 transition-colors"
                  >
                    <SkipBack className="h-5 w-5" />
                  </button>
                  <button
                    onClick={skipForward}
                    className="text-white hover:text-gray-300 transition-colors"
                  >
                    <SkipForward className="h-5 w-5" />
                  </button>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={toggleMute}
                      className="text-white hover:text-gray-300 transition-colors"
                    >
                      {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                      className="w-20"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowNotes(!showNotes)}
                    className={`p-2 rounded-lg transition-colors ${
                      showNotes
                        ? 'bg-blue-600 text-white'
                        : 'text-white hover:bg-gray-700'
                    }`}
                  >
                    <Edit3 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setShowComments(!showComments)}
                    className={`p-2 rounded-lg transition-colors ${
                      showComments
                        ? 'bg-blue-600 text-white'
                        : 'text-white hover:bg-gray-700'
                    }`}
                  >
                    <MessageCircle className="h-5 w-5" />
                  </button>
                  <button className="text-white hover:text-gray-300 transition-colors">
                    <Maximize className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Module Navigation */}
          <div className="bg-gray-800 border-t border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {prevModule && (
                  <Link
                    to={`/courses/${courseId}/${prevModule.order}`}
                    className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                    <span>Previous</span>
                  </Link>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-gray-400">
                  <Award className="h-4 w-4" />
                  <span className="text-sm">{currentModule.xpReward} XP</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{formatTime(currentModule.duration)}</span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {!currentModule.isCompleted && (
                  <button
                    onClick={handleCompleteModule}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Mark Complete</span>
                  </button>
                )}
                {nextModule && (
                  <Link
                    to={`/courses/${courseId}/${nextModule.order}`}
                    className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        {(showNotes || showComments) && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => setShowNotes(true)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  showNotes
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Notes
              </button>
              <button
                onClick={() => setShowComments(true)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  showComments
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Comments
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {showNotes && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Notes</h3>
                    <button
                      onClick={() => setIsEditingNote(true)}
                      className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="text-sm">Add Note</span>
                    </button>
                  </div>

                  {isEditingNote && (
                    <div className="bg-gray-700 rounded-lg p-4">
                      <textarea
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Add a note at the current timestamp..."
                        className="w-full bg-gray-600 text-white rounded-lg p-3 resize-none"
                        rows={3}
                      />
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm text-gray-400">
                          Timestamp: {formatTime(currentTime)}
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setIsEditingNote(false);
                              setNoteContent('');
                            }}
                            className="text-gray-400 hover:text-gray-300"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleAddNote}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {notes.length > 0 ? (
                    <div className="space-y-3">
                      {notes.map((note: Note) => (
                        <div
                          key={note._id}
                          className="bg-gray-700 rounded-lg p-3 cursor-pointer hover:bg-gray-600 transition-colors"
                          onClick={() => handleNoteClick(note)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-blue-400">
                              {formatTime(note.timestamp)}
                            </span>
                            <button className="text-gray-400 hover:text-red-400">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="text-white text-sm">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Edit3 className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400">No notes yet</p>
                      <p className="text-gray-500 text-sm">Add notes while watching</p>
                    </div>
                  )}
                </div>
              )}

              {showComments && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Comments</h3>
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">Comments coming soon!</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursePlayer; 