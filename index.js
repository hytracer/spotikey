const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const SpotifyWebApi = require('spotify-web-api-node');
const dotenv = require('dotenv');
const express = require('express');
const opn = require('opn');
const { app, BrowserWindow, Tray, Menu, dialog } = require('electron');
const isFirstRun = require('electron-first-run');

// Load environment variables from .env file
dotenv.config();

const requiredEnvVariables = ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET', 'MISSKEY_INSTANCE_URL', 'MISSKEY_ACCESS_TOKEN'];
const missingEnvVariables = requiredEnvVariables.filter((envVariable) => !process.env[envVariable]);

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

// Open the authorization URL in the default browser
opn(authorizeUrl);

let mainWindow;
let tray;

// Express server setup
const expressapp = express();
expressapp.get('/callback', async (req, res) => {
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
    const appPath = app.getAppPath();
    opn(appPath);
    opn(appPath + "/POSTINSTALL.txt").then(() => {
      app.quit();
    })
  }
});

// Start the server
const port = 8888; // Choose a port number
expressapp.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

let previousTrack = null;

// Express server setup
const server = express();
server.get('/callback', async (req, res) => {
  const { code } = req.query;

  try {
    // Exchange authorization code for access token
    const { body } = await spotifyApi.authorizationCodeGrant(code);
    const accessToken = body.access_token;

    // Set the access token explicitly for each request
    spotifyApi.setAccessToken(accessToken);

    res.send('Authorization successful! You can now close this tab.');
    // mainWindow.loadFile('index.html'); // Load your main HTML file
  } catch (err) {
    console.error('Error:', err);
    res.send('An error occurred. Please try again or check the console for details.');
  }
});

// Initialize the Electron app
app.whenReady().then(() => {
  if (isFirstRun()) {
    openInstallationFolder();
  }
  createMainWindow();
  createTray();

  if (missingEnvVariables.length > 0) {
    opn("https://github.com/hytracer/spotikey/POSTINSTALL.txt");
    dialog.showMessageBox({
      type: 'error',
      title: 'Missing Environment Variables',
      message: 'Missing Required Environment Variables',
      detail: `The following environment variables are missing or not properly set:\n${missingEnvVariables.join('\n')}\nYou need to add those to your .env file`,
      buttons: ['Open example .env']
    }).then((result) => {
      if (result.response === 0) {
        opn('https://github.com/hytracer/spotikey/.env.example');
      }
      app.quit();
    });
    return;
  }
});

// Create the main window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  });

  mainWindow.on('closed', () => (mainWindow = null));
}

// Create the system tray
function createTray() {
  tray = new Tray('assets/icon.png');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Current Settings',
      click: () => {
        const settings = Object.entries(process.env).map(([key, value]) => `${key}=${value}`).join('\n');
        dialog.showMessageBox({
          type: 'info',
          title: 'App Settings',
          message: 'Current App Settings',
          detail: settings
        });
      }
    },
    {
      label: 'Credits',
      click: () => {
        dialog.showMessageBox({
          type: 'info',
          title: 'Credits',
          message: 'Credits',
          detail: 'hytracer (Konata) 2023 - hytracer.ink'
        });
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('spotikey');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}

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

function openEnvFile() {
  opn('.env');
}

function openInstallationFolder() {
  const appPath = app.getAppPath();
  opn(appPath);
  opn(appPath + "/POSTINSTALL.txt").then(() => {
    app.quit();
  })
}