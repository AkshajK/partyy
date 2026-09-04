// Turn whatever the admin pasted into a list of {title, artist} wanted songs.
// Accepts: a Spotify playlist URL/URI, a YouTube playlist URL, or plain lines
// of "Title - Artist" / "Title, Artist" / "Title by Artist".
const { execFile } = require("child_process");
const { getText } = require("./http");

const YTDLP = process.env.YTDLP_BIN || "yt-dlp";

function detect(input) {
  const s = input.trim();
  const sp = s.match(/(?:open\.spotify\.com\/(?:embed\/)?playlist\/|spotify:playlist:)([A-Za-z0-9]+)/);
  if (sp) return { kind: "spotify", playlistId: sp[1] };
  if (/(?:youtube\.com\/.*[?&]list=|youtu\.be\/.*[?&]list=)/.test(s)) return { kind: "youtube", url: s.split(/\s/)[0] };
  return { kind: "list" };
}

// Spotify's public embed page carries the first 100 tracks as JSON, no auth.
async function spotifyPlaylist(playlistId) {
  const html = await getText(`https://open.spotify.com/embed/playlist/${playlistId}`);
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) throw new Error("Spotify embed page did not contain track data");
  const entity = JSON.parse(m[1]).props.pageProps.state.data.entity;
  const items = (entity.trackList || []).map((t) => ({
    title: t.title,
    artist: (t.subtitle || "").split(",")[0].trim(),
  }));
  return { name: entity.name, items, capped: items.length >= 100 };
}

// YouTube playlist titles are messy ("Artist - Title (Official Video)"); we
// clean them up and let the iTunes lookup normalize the rest.
function youtubePlaylist(url) {
  return new Promise((resolve, reject) => {
    execFile(
      YTDLP,
      ["-q", "--no-warnings", "--flat-playlist", "--print", "%(title)s\t%(uploader)s", url],
      { maxBuffer: 10 * 1024 * 1024 },
      (err, stdout) => {
        if (err) return reject(new Error("yt-dlp playlist read failed: " + err.message));
        const items = stdout
          .split("\n")
          .filter(Boolean)
          .map((line) => {
            const [rawTitle, uploader] = line.split("\t");
            return parseLine(cleanYouTubeTitle(rawTitle), uploader);
          });
        resolve({ name: undefined, items, capped: false });
      }
    );
  });
}

function cleanYouTubeTitle(t) {
  return t
    .replace(/\((official|lyric|lyrics|audio|video|music video|visualizer|hd|hq|4k)[^)]*\)/gi, "")
    .replace(/\[(official|lyric|lyrics|audio|video|music video|visualizer|hd|hq|4k)[^\]]*\]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// "Title - Artist", "Artist - Title", "Title, Artist", "Title by Artist".
// Ambiguity between the first two is resolved later by the iTunes lookup,
// which is asked with both orderings.
function parseLine(line, fallbackArtist) {
  const l = line.trim();
  if (!l) return null;
  let m = l.match(/^(.+?)\s+by\s+(.+)$/i);
  if (m) return { title: m[1].trim(), artist: m[2].trim() };
  m = l.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  if (m) return { title: m[1].trim(), artist: m[2].trim(), ambiguous: true };
  m = l.match(/^"?(.+?)"?\s*,\s*(.+)$/);
  if (m) return { title: m[1].trim(), artist: m[2].trim() };
  return { title: l, artist: (fallbackArtist || "").replace(/ - Topic$/, "").trim() };
}

function listInput(text) {
  const items = text
    .split("\n")
    .map((line) => parseLine(line))
    .filter(Boolean);
  return { name: undefined, items, capped: false };
}

async function resolveInput(input) {
  const d = detect(input);
  if (d.kind === "spotify") return { kind: d.kind, ...(await spotifyPlaylist(d.playlistId)) };
  if (d.kind === "youtube") return { kind: d.kind, ...(await youtubePlaylist(d.url)) };
  return { kind: "list", ...listInput(input) };
}

module.exports = { detect, resolveInput, parseLine, cleanYouTubeTitle };
