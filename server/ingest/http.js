// Tiny HTTPS helpers. Node 16 has no global fetch.
const https = require("https");

function getText(url, { headers = {}, redirects = 5 } = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { headers: { "User-Agent": "Mozilla/5.0 (partyy-ingest)", ...headers } },
      (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && redirects > 0) {
          res.resume();
          const next = new URL(res.headers.location, url).toString();
          return resolve(getText(next, { headers, redirects: redirects - 1 }));
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve(body));
      }
    );
    req.on("error", reject);
    req.setTimeout(20000, () => req.destroy(new Error("timeout " + url)));
  });
}

async function getJson(url, opts) {
  return JSON.parse(await getText(url, opts));
}

module.exports = { getText, getJson };
