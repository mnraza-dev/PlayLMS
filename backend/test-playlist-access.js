import dotenv from 'dotenv';
import { google } from 'googleapis';

// Load environment variables
dotenv.config();

async function testPlaylistAccess() {
  console.log('🧪 Testing Playlist Access...\n');

  if (!process.env.YOUTUBE_API_KEY) {
    console.log('❌ YOUTUBE_API_KEY not found');
    return;
  }

  const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
  });

  // Test with different playlist IDs
  const testPlaylists = [
    'PLrAXtmRdnEQy6nuLMH7uaudz8wOPW2JHA', // Original test
    'PLWKjhJtqVAbnZtkAI3BqcYxKnfWn_C704', // Another test
    'PL0vfts4VZjNnL5J3q35J4qnrWh9eTLqOT', // Popular programming playlist
    'PLu0W_9lII9agpFUAlPFe_VNSlXW5uE0YL'  // Another popular one
  ];

  for (const playlistId of testPlaylists) {
    console.log(`\n--- Testing Playlist: ${playlistId} ---`);
    
    try {
      const response = await youtube.playlists.list({
        part: ['snippet', 'contentDetails'],
        id: [playlistId]
      });

      if (response.data.items && response.data.items.length > 0) {
        const playlist = response.data.items[0];
        console.log('✅ Playlist found!');
        console.log(`   Title: ${playlist.snippet.title}`);
        console.log(`   Channel: ${playlist.snippet.channelTitle}`);
        console.log(`   Videos: ${playlist.contentDetails.itemCount}`);
        console.log(`   Privacy: ${playlist.status?.privacyStatus || 'Unknown'}`);
        
        // Test getting videos from this playlist
        try {
          const videosResponse = await youtube.playlistItems.list({
            part: ['snippet'],
            playlistId: playlistId,
            maxResults: 3
          });
          
          if (videosResponse.data.items && videosResponse.data.items.length > 0) {
            console.log('✅ Videos accessible!');
            console.log(`   Found ${videosResponse.data.items.length} videos`);
          } else {
            console.log('❌ No videos found in playlist');
          }
        } catch (videoError) {
          console.log('❌ Cannot access videos:', videoError.message);
        }
        
        return playlistId; // Found a working playlist
      } else {
        console.log('❌ Playlist not found');
      }
    } catch (error) {
      console.log('❌ Error accessing playlist:', error.message);
      if (error.response?.data?.error) {
        console.log('   Error details:', error.response.data.error);
      }
    }
  }

  console.log('\n❌ No working playlists found');
  return null;
}

// Run the test
testPlaylistAccess().then((workingPlaylistId) => {
  if (workingPlaylistId) {
    console.log(`\n✅ Found working playlist: ${workingPlaylistId}`);
    console.log('You can use this playlist ID for testing!');
  }
}).catch(console.error); 