import dotenv from 'dotenv';
import { google } from 'googleapis';

// Load environment variables
dotenv.config();

async function testYouTubeAPI() {
  console.log('🧪 Testing YouTube API...\n');

  // Check if API key exists
  if (!process.env.YOUTUBE_API_KEY) {
    console.log('❌ YOUTUBE_API_KEY not found in environment variables');
    console.log('Please set YOUTUBE_API_KEY in your .env file');
    return;
  }

  console.log('✅ YOUTUBE_API_KEY found');

  // Initialize YouTube API
  const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
  });

  try {
    // Test with a simple search
    console.log('Testing YouTube API with a simple search...');
    const response = await youtube.search.list({
      part: ['snippet'],
      q: 'test',
      maxResults: 1
    });

    console.log('✅ YouTube API is working!');
    console.log('Response received:', response.data.items?.length || 0, 'items');

    // Test playlist access
    console.log('\nTesting playlist access...');
    const playlistResponse = await youtube.playlists.list({
      part: ['snippet'],
      id: ['PLrAXtmRdnEQy6nuLMH7uaudz8wOPW2JHA']
    });

    if (playlistResponse.data.items && playlistResponse.data.items.length > 0) {
      console.log('✅ Playlist access is working!');
      console.log('Playlist title:', playlistResponse.data.items[0].snippet.title);
    } else {
      console.log('❌ Playlist not found or access denied');
    }

  } catch (error) {
    console.log('❌ YouTube API test failed');
    console.log('Error:', error.message);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

// Run the test
testYouTubeAPI().catch(console.error); 