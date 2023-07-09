
# spotikey~ ✰

Show your now-playing spotify status on the fediverse (misskey and alike)

Feel free to submit a PR if you'd like to add support for more streaming platforms, or more features ヾ(≧▽≦*)o
## Demo
https://miruku.cafe/@music


## Building

You can grab a precompiled release over the [Releases](https://github.com/hytracer/spotikey/releases) tab

Or, build it yourself:

```bash
  git clone https://github.com/hytracer/spotikey && cd  spotikey
  npm install --dev
  npm run build
```


    
## Run spotikey without building

```bash
  npm install --dev
  npm run dev
```


## Environment Variables

To run spotikey, you will need to add the following environment variables to your .env file

`SPOTIFY_CLIENT_ID`: Your Spotify Client ID

`SPOTIFY_CLIENT_SECRET`: Your Spotify Secret

`MISSKEY_INSTANCE_URL`: Your instance URL 

`MISSKEY_ACCESS_TOKEN`: Your Access Token

You need to [create a spotify application](https://developer.spotify.com/documentation/web-api/tutorials/getting-started) and a misskey api key to run spotikey.

## Tech Stack

**Client:** Electron

**Server:** Node, Express


![Logo](https://images6.fanpop.com/image/photos/35100000/Konata-lucky-star-35192860-704-396.jpg)

