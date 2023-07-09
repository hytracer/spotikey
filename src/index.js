const fetch = require('node-fetch');
const SpotifyWebApi = require('spotify-web-api-node');
const dotenv = require('dotenv');
const express = require('express');
const opn = require('opn');

// Load environment variables from .env file
dotenv.config();

// Create a new Spotify API client
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: 'http://localhost:8888/callback' // Update with your redirect URI
});

// Authorization Code flow: Step 1 - Authorization URL
const authorizeUrl = spotifyApi.createAuthorizeURL([
  'user-read-currently-playing' // Add any additional scopes if required
]);

// Open the authorization URL in the browser
opn(authorizeUrl);

// Express server setup
const app = express();
app.get('/callback', async (req, res) => {
  const { code } = req.query;

  try {
    // Exchange authorization code for access token
    const { body } = await spotifyApi.authorizationCodeGrant(code);
    const accessToken = body.access_token;

    // Set the access token explicitly for each request
    spotifyApi.setAccessToken(accessToken);

    res.send('Authorization successful! You can now close this tab.');
  } catch (err) {
    console.error('Error:', err);
    res.send('An error occurred. Please try again or check the console for details.');
  }
});

// Start the server
const port = 8888; // Choose a port number
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

let previousTrack = null;

// Get the currently playing track from Spotify
async function getCurrentTrack() {
  try {
    const response = await spotifyApi.getMyCurrentPlayingTrack();
    return response.body;
  } catch (err) {
    console.error('Error getting current track:', err);
    return null;
  }
}

// Post the current track to Misskey
async function postCurrentTrack(track) {
  const postContent = `🎵 Now playing on Spotify:\n${track.name} by ${track.artists[0].name} (${track.album.name})`;

  try {
    await fetch(`${process.env.MISSKEY_INSTANCE_URL}/api/notes/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MISSKEY_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        visibility: 'public',
        text: postContent
      })
    });
    console.log('Posted to Misskey:', postContent);
  } catch (err) {
    console.error('Error posting to Misskey:', err);
  }
}

// Check for changes in the currently playing track
async function checkCurrentTrack() {
  const track = await getCurrentTrack();
  if (track && track.item.name !== previousTrack) {
    await postCurrentTrack(track.item);
    previousTrack = track.item.name;
  }
}

// Poll for changes every 10 seconds
const pollInterval = 10000; // 10 seconds
setInterval(checkCurrentTrack, pollInterval);
