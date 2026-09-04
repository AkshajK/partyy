// Canonical title / artist / art / duration from the free iTunes Search API.
const { getJson } = require("./http");

function norm(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

async function search(term) {
  const url = "https://itunes.apple.com/search?media=music&entity=song&limit=10&term=" + encodeURIComponent(term);
  const data = await getJson(url);
  return data.results || [];
}

// Words that mark a variant we do not want unless the user asked for it.
const VARIANT = /\b(remix|remixes|dub|live|acoustic|instrumental|karaoke|cover|edit|version|mix|sped up|slowed|demo|remaster(?:ed)?|radio|extended|tribute|medley|commentary)\b/i;

// Score a candidate: how much of what we asked for it contains (recall), how
// much extra it drags in (precision), minus a penalty for unrequested variants.
function scoreResult(r, wantTitle, wantArtist) {
  const wantWords = new Set(norm(wantTitle + " " + wantArtist).split(" ").filter(Boolean));
  const gotWords = new Set(norm(r.trackName + " " + r.artistName).split(" ").filter(Boolean));
  let hits = 0;
  for (const w of gotWords) if (wantWords.has(w)) hits++;
  const recall = hits / Math.max(wantWords.size, 1);
  const precision = hits / Math.max(gotWords.size, 1);
  let score = 0.7 * recall + 0.3 * precision;
  if (VARIANT.test(r.trackName) && !VARIANT.test(wantTitle)) score -= 0.25;
  if (/\b(remix|remixes|live|karaoke|tribute)\b/i.test(r.collectionName || "") && !VARIANT.test(wantTitle)) score -= 0.1;
  return { score, recall };
}

// Returns null when nothing convincing is found.
async function itunesLookup(title, artist, { ambiguous = false } = {}) {
  const queries = [`${title} ${artist}`];
  if (ambiguous) queries.push(`${artist} ${title}`); // maybe the line was "Artist - Title"
  let best = null;
  let bestScore = -Infinity;
  let bestRecall = 0;
  for (const q of queries) {
    let results;
    try {
      results = await search(q);
    } catch (e) {
      continue;
    }
    for (const r of results) {
      const { score, recall } = scoreResult(r, title, artist);
      if (score > bestScore) {
        bestScore = score;
        bestRecall = recall;
        best = r;
      }
    }
    if (bestRecall >= 0.8) break;
  }
  if (!best || bestRecall < 0.4) return null;
  return {
    title: best.trackName,
    artist: [best.artistName],
    artUrl: (best.artworkUrl100 || "").replace("100x100bb", "600x600bb") || undefined,
    durationMs: best.trackTimeMillis,
    itunesUrl: best.trackViewUrl,
    confidence: bestScore,
  };
}

module.exports = { itunesLookup, norm };
