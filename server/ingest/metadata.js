// Canonical title / artist / art / duration from the free iTunes Search API.
const { getJson } = require("./http");

function norm(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

async function search(term, extra = "") {
  const url = "https://itunes.apple.com/search?media=music&entity=song&limit=10" + extra + "&term=" + encodeURIComponent(term);
  const data = await getJson(url);
  return data.results || [];
}

function titleMatches(r, wantTitle) {
  const words = norm(wantTitle).split(" ").filter(Boolean);
  if (!words.length) return true;
  const got = new Set(norm(r.trackName).split(" "));
  const hits = words.filter((w) => got.has(w)).length;
  return hits / words.length >= 0.5;
}

function artistMatches(r, wantArtist) {
  if (!wantArtist) return true;
  const artistWords = norm(wantArtist).split(" ").filter((w) => w.length > 1);
  if (!artistWords.length) return true;
  const gotArtist = new Set(norm(r.artistName).split(" "));
  return artistWords.some((w) => gotArtist.has(w));
}

// Words that mark a variant we do not want unless the user asked for it.
const VARIANT = /\b(remix|remixes|dub|live|acoustic|instrumental|karaoke|cover|edit|version|mix|sped up|slowed|demo|remaster(?:ed)?|radio|extended|tribute|medley|commentary|nightcore|backing track|originally performed|in the style of|made famous|8d)\b/i;

// "Song (feat. X) [Radio Edit]" -> "Song" for searching; the credit is noise.
function cleanTitle(t) {
  return (t || "").replace(/\s*[\(\[][^\)\]]*(feat\.?|ft\.?|with|from|remaster|version|edit|mix)[^\)\]]*[\)\]]/gi, "").replace(/\s+-\s+.*$/, "").trim() || t;
}

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
  if (VARIANT.test(r.artistName) && !VARIANT.test(wantArtist || "")) score -= 0.4; // "Into The Nightcore", "Starstruck Backing Tracks"
  if (/\b(remix|remixes|live|karaoke|tribute)\b/i.test(r.collectionName || "") && !VARIANT.test(wantTitle)) score -= 0.1;
  return { score, recall };
}

// Returns null when nothing convincing is found.
async function itunesLookup(title, artist, { ambiguous = false } = {}) {
  const ct = cleanTitle(title);
  const queries = [`${ct} ${artist}`];
  if (ct !== title) queries.push(`${title} ${artist}`);
  if (ambiguous) queries.push(`${artist} ${title}`); // maybe the line was "Artist - Title"
  let best = null;
  let bestScore = -Infinity;
  let bestRecall = 0;
  // Last resort: search within the artist's own catalogue (a title like
  // "All Time Low" is also a band name and floods the generic search).
  const attempts = queries.map((q) => [q, ""]);
  if (artist) attempts.push([ct, "&attribute=songTerm&limit=100"], [artist, "&attribute=artistTerm&limit=100"]);
  for (const [q, extra] of attempts) {
    let results;
    try {
      results = await search(q, extra);
    } catch (e) {
      continue;
    }
    // The artist we asked for must be on the result, and most of the title too.
    results = results.filter((r) => artistMatches(r, artist) && titleMatches(r, ct));
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

module.exports = { itunesLookup, norm, cleanTitle };
