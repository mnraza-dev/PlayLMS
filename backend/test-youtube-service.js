import dotenv from 'dotenv';
import YouTubeService from './src/services/youtubeService.js';

// Load environment variables
dotenv.config();

// Test playlist URLs
const testPlaylists = [
  'https://www.youtube.com/playlist?list=PLWKjhJtqVAbnZtkAI3BqcYxKnfWn_C704', // Working playlist
  'https://www.youtube.com/playlist?list=PLrAXtmRdnEQy6nuLMH7uaudz8wOPW2JHA'  // Non-working playlist
];

async function testYouTubeService() {
  console.log('🧪 Testing YouTube Service...\n');

  // Test URL validation
  console.log('1. Testing URL validation:');
  testPlaylists.forEach((url, index) => {
    const isValid = YouTubeService.validateYouTubeUrl(url);
    console.log(`   Playlist ${index + 1}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
  });

  // Test playlist ID extraction
  console.log('\n2. Testing playlist ID extraction:');
  testPlaylists.forEach((url, index) => {
    try {
      const playlistId = YouTubeService.extractPlaylistId(url);
      console.log(`   Playlist ${index + 1}: ${playlistId}`);
    } catch (error) {
      console.log(`   Playlist ${index + 1}: ❌ ${error.message}`);
    }
  });

  // Test course preview (if API key is available)
  if (process.env.YOUTUBE_API_KEY) {
    console.log('\n3. Testing course preview:');
    try {
      const result = await YouTubeService.getCoursePreview(testPlaylists[0]);
      if (result.success) {
        console.log('   ✅ Course preview successful');
        console.log(`   Title: ${result.preview.title}`);
        console.log(`   Videos: ${result.preview.videoCount}`);
        console.log(`   Duration: ${result.preview.estimatedDuration}`);
        console.log(`   XP: ${result.preview.estimatedXP}`);
      } else {
        console.log(`   ❌ Course preview failed: ${result.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Course preview error: ${error.message}`);
    }
  } else {
    console.log('\n3. Skipping course preview test (YOUTUBE_API_KEY not set)');
  }

  // Test course creation (if API key is available)
  if (process.env.YOUTUBE_API_KEY) {
    console.log('\n4. Testing course creation:');
    try {
      const result = await YouTubeService.createCourseFromPlaylist(
        testPlaylists[0], 
        'test-creator-id',
        {
          category: 'programming',
          difficulty: 'beginner',
          tags: ['javascript', 'react'],
          isPublic: true
        }
      );
      if (result.success) {
        console.log('   ✅ Course creation successful');
        console.log(`   Title: ${result.course.title}`);
        console.log(`   Modules: ${result.course.totalModules}`);
        console.log(`   Duration: ${result.stats.totalDuration}`);
        console.log(`   XP: ${result.stats.totalXP}`);
      } else {
        console.log(`   ❌ Course creation failed: ${result.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Course creation error: ${error.message}`);
    }
  } else {
    console.log('\n4. Skipping course creation test (YOUTUBE_API_KEY not set)');
  }

  console.log('\n✅ YouTube Service test completed!');
}

// Run the test
testYouTubeService().catch(console.error); 