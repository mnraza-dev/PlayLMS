import { google } from 'googleapis';
import axios from 'axios';

class YouTubeService {
  constructor() {
    if (!process.env.YOUTUBE_API_KEY) {
      console.warn('YouTube API key not found in environment variables');
    }
    
    this.youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY
    });
    
    console.log('YouTube service initialized with API key:', process.env.YOUTUBE_API_KEY ? 'Present' : 'Missing');
  }
  extractPlaylistId(url) {
    const patterns = [
      /(?:youtube\.com\/playlist\?list=|youtu\.be\/.*\?list=)([^&]+)/,
      /(?:youtube\.com\/watch\?.*list=)([^&]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    throw new Error('Invalid YouTube playlist URL');
  }
  async getPlaylistDetails(playlistId) {
    try {
      console.log('Fetching playlist details for ID:', playlistId);
      
      const response = await this.youtube.playlists.list({
        part: ['snippet', 'contentDetails'],
        id: [playlistId]
      });

      console.log('Playlist API response:', response.data);

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('Playlist not found');
      }

      const playlist = response.data.items[0];
      const details = {
        id: playlist.id,
        title: playlist.snippet.title,
        description: playlist.snippet.description,
        thumbnail: playlist.snippet.thumbnails?.high?.url || playlist.snippet.thumbnails?.medium?.url,
        channelTitle: playlist.snippet.channelTitle,
        channelId: playlist.snippet.channelId,
        videoCount: playlist.contentDetails.itemCount,
        publishedAt: playlist.snippet.publishedAt
      };
      
      console.log('Playlist details extracted:', details);
      return details;
    } catch (error) {
      console.error('Error fetching playlist details:', error);
      console.error('Error details:', error.response?.data || error.message);
      throw new Error('Failed to fetch playlist details');
    }
  }
  async getPlaylistVideos(playlistId, maxResults = 50) {
    try {
      const videos = [];
      let nextPageToken = null;

      do {
        const response = await this.youtube.playlistItems.list({
          part: ['snippet', 'contentDetails'],
          playlistId: playlistId,
          maxResults: Math.min(maxResults, 50),
          pageToken: nextPageToken
        });

        const items = response.data.items || [];
        
        // Get video details for each item
        const videoIds = items.map(item => item.contentDetails.videoId);
        const videoDetails = await this.getVideoDetails(videoIds);

        // Combine playlist item data with video details
        const combinedVideos = items.map((item, index) => {
          const videoDetail = videoDetails.find(v => v.id === item.contentDetails.videoId);
          return {
            id: item.contentDetails.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
            channelTitle: item.snippet.channelTitle,
            channelId: item.snippet.channelId,
            publishedAt: item.snippet.publishedAt,
            position: item.snippet.position,
            duration: videoDetail?.duration || 0,
            viewCount: videoDetail?.viewCount || 0,
            likeCount: videoDetail?.likeCount || 0,
            videoUrl: `https://www.youtube.com/watch?v=${item.contentDetails.videoId}`
          };
        });

        videos.push(...combinedVideos);
        nextPageToken = response.data.nextPageToken;

        // Limit total results
        if (videos.length >= maxResults) {
          videos.splice(maxResults);
          break;
        }

      } while (nextPageToken);

      return videos;
    } catch (error) {
      console.error('Error fetching playlist videos:', error);
      throw new Error('Failed to fetch playlist videos');
    }
  }
  async getVideoDetails(videoIds) {
    try {
      const response = await this.youtube.videos.list({
        part: ['contentDetails', 'statistics'],
        id: videoIds
      });

      return response.data.items.map(video => ({
        id: video.id,
        duration: this.parseDuration(video.contentDetails.duration),
        viewCount: parseInt(video.statistics.viewCount) || 0,
        likeCount: parseInt(video.statistics.likeCount) || 0,
        commentCount: parseInt(video.statistics.commentCount) || 0
      }));
    } catch (error) {
      console.error('Error fetching video details:', error);
      return [];
    }
  }
  parseDuration(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    
    const hours = (match[1] ? parseInt(match[1]) : 0);
    const minutes = (match[2] ? parseInt(match[2]) : 0);
    const seconds = (match[3] ? parseInt(match[3]) : 0);
    
    return hours * 3600 + minutes * 60 + seconds;
  }
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  // Search for playlists
  async searchPlaylists(query, maxResults = 10) {
    try {
      const response = await this.youtube.search.list({
        part: ['snippet'],
        q: query,
        type: 'playlist',
        maxResults: maxResults,
        order: 'relevance'
      });

      return response.data.items.map(item => ({
        id: item.id.playlistId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        publishedAt: item.snippet.publishedAt
      }));
    } catch (error) {
      console.error('Error searching playlists:', error);
      throw new Error('Failed to search playlists');
    }
  }

  // Get video embed URL
  getEmbedUrl(videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }

  // Validate YouTube URL
  validateYouTubeUrl(url) {
    const patterns = [
      /^https?:\/\/(www\.)?youtube\.com\/playlist\?list=[^&]+/,
      /^https?:\/\/(www\.)?youtu\.be\/[^?]+\?list=[^&]+/,
      /^https?:\/\/(www\.)?youtube\.com\/watch\?.*list=[^&]+/
    ];

    return patterns.some(pattern => pattern.test(url));
  }

  // Get video thumbnail in different qualities
  getVideoThumbnails(videoId) {
    return {
      default: `https://img.youtube.com/vi/${videoId}/default.jpg`,
      medium: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      high: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      standard: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
      maxres: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    };
  }

  // Extract video ID from various YouTube URL formats
  extractVideoId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    throw new Error('Invalid YouTube video URL');
  }

  // Get video information by ID
  async getVideoInfo(videoId) {
    try {
      const response = await this.youtube.videos.list({
        part: ['snippet', 'contentDetails', 'statistics'],
        id: [videoId]
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('Video not found');
      }

      const video = response.data.items[0];
      return {
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnail: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.medium?.url,
        channelTitle: video.snippet.channelTitle,
        channelId: video.snippet.channelId,
        publishedAt: video.snippet.publishedAt,
        duration: this.parseDuration(video.contentDetails.duration),
        viewCount: parseInt(video.statistics.viewCount) || 0,
        likeCount: parseInt(video.statistics.likeCount) || 0,
        commentCount: parseInt(video.statistics.commentCount) || 0,
        videoUrl: `https://www.youtube.com/watch?v=${video.id}`
      };
    } catch (error) {
      console.error('Error fetching video info:', error);
      throw new Error('Failed to fetch video information');
    }
  }

  // Create LMS course from YouTube playlist
  async createCourseFromPlaylist(playlistUrl, creatorId, courseData = {}) {
    try {
      // Validate URL
      if (!this.validateYouTubeUrl(playlistUrl)) {
        throw new Error('Invalid YouTube playlist URL');
      }

      // Extract playlist ID
      const playlistId = this.extractPlaylistId(playlistUrl);

      // Get playlist details
      const playlistDetails = await this.getPlaylistDetails(playlistId);

      // Get playlist videos
      const videos = await this.getPlaylistVideos(playlistId);

      if (videos.length === 0) {
        throw new Error('No videos found in playlist');
      }

      // Create course modules
      const modules = videos.map((video, index) => ({
        title: video.title,
        description: video.description || 'No description available',
        videoId: video.id,
        videoUrl: video.videoUrl,
        thumbnail: video.thumbnail,
        duration: video.duration,
        order: index + 1,
        xpReward: 10
      }));

      // Generate slug
      const slug = playlistDetails.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Calculate total duration in minutes
      const totalDuration = Math.round(videos.reduce((total, video) => total + video.duration, 0) / 60);

      // Calculate total XP
      const totalXP = modules.reduce((total, module) => total + module.xpReward, 0);

      // Prepare course data
      const course = {
        title: playlistDetails.title,
        description: playlistDetails.description || 'No description available',
        thumbnail: playlistDetails.thumbnail,
        playlistUrl,
        playlistId,
        creator: creatorId,
        modules,
        totalModules: modules.length,
        totalDuration,
        totalXP,
        category: courseData.category || 'other',
        difficulty: courseData.difficulty || 'beginner',
        tags: courseData.tags || [],
        isPublic: courseData.isPublic !== undefined ? courseData.isPublic : true,
        slug,
        metaDescription: playlistDetails.description 
          ? playlistDetails.description.substring(0, 300) 
          : `Learn from ${playlistDetails.title} playlist with ${modules.length} videos`
      };

      return {
        success: true,
        course,
        playlistDetails,
        stats: {
          totalVideos: videos.length,
          totalDuration: this.formatDuration(totalDuration * 60),
          totalXP,
          channelTitle: playlistDetails.channelTitle,
          channelId: playlistDetails.channelId
        }
      };

    } catch (error) {
      console.error('Error creating course from playlist:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get course preview data without creating the course
  async getCoursePreview(playlistUrl) {
    try {
      console.log('getCoursePreview called with URL:', playlistUrl);
      
      // Validate URL
      if (!this.validateYouTubeUrl(playlistUrl)) {
        console.log('URL validation failed');
        throw new Error('Invalid YouTube playlist URL');
      }
      console.log('URL validation passed');

      // Extract playlist ID
      const playlistId = this.extractPlaylistId(playlistUrl);
      console.log('Extracted playlist ID:', playlistId);

      // Get playlist details
      console.log('Getting playlist details...');
      const playlistDetails = await this.getPlaylistDetails(playlistId);
      console.log('Playlist details:', playlistDetails);

      // Get first few videos for preview
      console.log('Getting playlist videos...');
      const videos = await this.getPlaylistVideos(playlistId, 5);
      console.log('Found videos:', videos.length);

      if (videos.length === 0) {
        throw new Error('No videos found in playlist');
      }

      // Calculate preview stats
      const totalDuration = Math.round(videos.reduce((total, video) => total + video.duration, 0) / 60);
      const totalXP = videos.length * 10; // 10 XP per video

      const preview = {
        title: playlistDetails.title,
        description: playlistDetails.description,
        thumbnail: playlistDetails.thumbnail,
        channelTitle: playlistDetails.channelTitle,
        videoCount: playlistDetails.videoCount,
        sampleVideos: videos.slice(0, 3), // Show first 3 videos
        estimatedDuration: this.formatDuration(totalDuration * 60),
        estimatedXP: totalXP,
        playlistId
      };

      console.log('Preview created successfully:', preview);
      return {
        success: true,
        preview
      };

    } catch (error) {
      console.error('Error getting course preview:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new YouTubeService(); 