# YouTube Playlist to LMS Course Conversion

This feature allows users to convert any YouTube playlist into a structured LMS course with progress tracking, gamification, and interactive features.

## Features

### 🎯 Core Functionality
- **Playlist URL Validation**: Supports various YouTube playlist URL formats
- **Automatic Course Creation**: Converts playlists to structured courses with modules
- **Progress Tracking**: Track completion of individual videos/modules
- **Gamification**: XP rewards for completing videos
- **Course Preview**: Preview playlist details before creating the course

### 📊 Course Structure
- **Modules**: Each video becomes a module in the course
- **Metadata**: Title, description, thumbnail, duration, and statistics
- **Categories**: Programming, Design, Business, Marketing, etc.
- **Difficulty Levels**: Beginner, Intermediate, Advanced
- **Tags**: Custom tags for better organization
- **Privacy Settings**: Public or private courses

## API Endpoints

### 1. Preview Course
```http
POST /api/courses/preview
Content-Type: application/json

{
  "playlistUrl": "https://www.youtube.com/playlist?list=..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "preview": {
      "title": "Course Title",
      "description": "Course description",
      "thumbnail": "https://...",
      "channelTitle": "Channel Name",
      "videoCount": 15,
      "sampleVideos": [...],
      "estimatedDuration": "2h 30m",
      "estimatedXP": 150,
      "playlistId": "PL..."
    }
  }
}
```

### 2. Create Course
```http
POST /api/courses/convert
Content-Type: application/json

{
  "playlistUrl": "https://www.youtube.com/playlist?list=...",
  "category": "programming",
  "difficulty": "beginner",
  "tags": ["javascript", "react"],
  "isPublic": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {
    "course": {
      "_id": "...",
      "title": "Course Title",
      "description": "Course description",
      "thumbnail": "https://...",
      "category": "programming",
      "difficulty": "beginner",
      "totalModules": 15,
      "totalDuration": 150,
      "totalXP": 150,
      "slug": "course-title"
    },
    "stats": {
      "totalVideos": 15,
      "totalDuration": "2h 30m",
      "totalXP": 150,
      "channelTitle": "Channel Name",
      "channelId": "UC..."
    }
  }
}
```

## Supported URL Formats

The service supports various YouTube playlist URL formats:

- `https://www.youtube.com/playlist?list=PL...`
- `https://youtu.be/VIDEO_ID?list=PL...`
- `https://www.youtube.com/watch?v=VIDEO_ID&list=PL...`

## YouTube Service Methods

### Core Methods

#### `createCourseFromPlaylist(playlistUrl, creatorId, courseData)`
Creates a complete LMS course from a YouTube playlist URL.

**Parameters:**
- `playlistUrl` (string): YouTube playlist URL
- `creatorId` (string): User ID of the course creator
- `courseData` (object): Course configuration
  - `category` (string): Course category
  - `difficulty` (string): Difficulty level
  - `tags` (array): Course tags
  - `isPublic` (boolean): Course visibility

**Returns:**
```json
{
  "success": true,
  "course": {
    "title": "Course Title",
    "description": "Course description",
    "thumbnail": "https://...",
    "playlistUrl": "https://...",
    "playlistId": "PL...",
    "creator": "user_id",
    "modules": [...],
    "totalModules": 15,
    "totalDuration": 150,
    "totalXP": 150,
    "category": "programming",
    "difficulty": "beginner",
    "tags": ["javascript"],
    "isPublic": true,
    "slug": "course-title"
  },
  "stats": {
    "totalVideos": 15,
    "totalDuration": "2h 30m",
    "totalXP": 150,
    "channelTitle": "Channel Name",
    "channelId": "UC..."
  }
}
```

#### `getCoursePreview(playlistUrl)`
Gets a preview of the course without creating it.

**Parameters:**
- `playlistUrl` (string): YouTube playlist URL

**Returns:**
```json
{
  "success": true,
  "preview": {
    "title": "Course Title",
    "description": "Course description",
    "thumbnail": "https://...",
    "channelTitle": "Channel Name",
    "videoCount": 15,
    "sampleVideos": [...],
    "estimatedDuration": "2h 30m",
    "estimatedXP": 150,
    "playlistId": "PL..."
  }
}
```

### Utility Methods

#### `validateYouTubeUrl(url)`
Validates if a URL is a valid YouTube playlist URL.

#### `extractPlaylistId(url)`
Extracts the playlist ID from a YouTube playlist URL.

#### `getPlaylistDetails(playlistId)`
Fetches detailed information about a YouTube playlist.

#### `getPlaylistVideos(playlistId, maxResults)`
Fetches all videos from a YouTube playlist.

#### `getVideoDetails(videoIds)`
Fetches detailed information about specific videos.

## Frontend Integration

### CreateCourse Component

The frontend includes a comprehensive course creation interface:

1. **Step 1**: Enter YouTube playlist URL
2. **Step 2**: Preview playlist details and configure course settings
3. **Step 3**: Create the course

### Features:
- Real-time URL validation
- Playlist preview with sample videos
- Course configuration (category, difficulty, tags)
- Progress tracking during creation
- Error handling and user feedback

## Environment Setup

### Required Environment Variables

```env
YOUTUBE_API_KEY=your_youtube_api_key_here
MONGODB_URI=mongodb://localhost:27017/playlms
JWT_SECRET=your_jwt_secret
```

### YouTube API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the YouTube Data API v3
4. Create credentials (API Key)
5. Add the API key to your environment variables

### Testing

Run the test script to verify the YouTube service:

```bash
cd backend
node test-youtube-service.js
```

## Error Handling

The service includes comprehensive error handling for:

- Invalid YouTube URLs
- Private or unavailable playlists
- API rate limits
- Network errors
- Missing or invalid API keys

## Rate Limiting

The YouTube API has quotas and rate limits. The service includes:

- Efficient API calls (batch video details)
- Error handling for quota exceeded
- Graceful degradation when limits are reached

## Security Considerations

- API keys are stored in environment variables
- URL validation prevents malicious inputs
- User authentication required for course creation
- Input sanitization for all user data

## Future Enhancements

- Support for YouTube channels (all videos)
- Automatic course updates when playlist changes
- Bulk course creation
- Advanced filtering and search
- Integration with other video platforms 