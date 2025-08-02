import { google } from 'googleapis';
import axios from 'axios';

class YouTubeService {
  constructor() {
    this.youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY
    });
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
      const response = await this.youtube.playlists.list({
        part: ['snippet', 'contentDetails'],
        id: [playlistId]
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('Playlist not found');
      }

      const playlist = response.data.items[0];
      return {
        id: playlist.id,
        title: playlist.snippet.title,
        description: playlist.snippet.description,
        thumbnail: playlist.snippet.thumbnails?.high?.url || playlist.snippet.thumbnails?.medium?.url,
        channelTitle: playlist.snippet.channelTitle,
        channelId: playlist.snippet.channelId,
        videoCount: playlist.contentDetails.itemCount,
        publishedAt: playlist.snippet.publishedAt
      };
    } catch (error) {
      console.error('Error fetching playlist details:', error);
      throw new Error('Failed to fetch playlist details');
    }
  }

  // Get all videos from playlist
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

  // Get video details (duration, view count, etc.)
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

  // Parse ISO 8601 duration to seconds
  parseDuration(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    
    const hours = (match[1] ? parseInt(match[1]) : 0);
    const minutes = (match[2] ? parseInt(match[2]) : 0);
    const seconds = (match[3] ? parseInt(match[3]) : 0);
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  // Format duration from seconds to readable string
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
}

export default new YouTubeService(); 