## Welcome to Partyy.life!

## Check out https://partyy.live

Compete with friends to guess the name of popular songs, and try making it onto the leaderboard. Choose from multiple categories! Designed for Chrome on Web

Brought to you by Akshaj Kadaveru and Daniel Sun

![image](https://github.com/AkshajK/partyy/assets/9513078/5ab4929f-3cc5-4a28-88f2-7714ccde407d)
![image](https://github.com/AkshajK/partyy/assets/9513078/6919444e-3c34-48ab-97ba-de4914abc04a)
![image](https://github.com/AkshajK/partyy/assets/9513078/36153793-5e65-45aa-bc65-13377802a438)

## Running it

Needs Node 16 (`nvm use`), ffmpeg, ffprobe and yt-dlp on the PATH, and a MongoDB Atlas connection string.

```
cp .env.example .env      # fill in ATLAS_SRV
npm install
npm run build             # webpack -> client/dist/bundle.js
npm start                 # http://localhost:3000
```

For front-end hot reload run `npm run hotloader` in a second terminal and use port 5000.

## Songs and audio (since 2026-09)

The game plays a random 30-second window of a full-length MP3 stored under `AUDIO_DIR`
(older rows still carry a fixed Spotify preview URL and keep working). Songs come in
through the admin page at `/dashboard` (site admins only: set `isSiteAdmin: true` on your
user in Mongo): paste a Spotify playlist link, a YouTube playlist link, or one song per
line. Title, artist and album art are looked up on iTunes; audio is fetched from YouTube
with yt-dlp; the pipeline lives in `server/ingest/`.

- `INGEST_MODE=local` downloads on the same machine as the server (dev).
- `INGEST_MODE=remote` (the droplet, which YouTube blocks) leaves jobs queued for
  `scripts/ingest-worker.js`, which runs on a Mac via `scripts/launchd/`, downloads,
  rsyncs the MP3s to the server and marks the job done.
- Bulk load from the command line: `node scripts/ingest.js --category "General" --file songs.txt`

## Deploy

Live copy runs on a DigitalOcean droplet (partyy.kevinzhu.ai) as a systemd service behind
nginx + Let's Encrypt; see `scripts/deploy.sh`.
