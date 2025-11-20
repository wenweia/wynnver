const fs = require('fs');
const https = require('https');

const INDEX_PATH = 'index.html';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WynnverBot/1.0)'
      }
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function getVersions() {
  let community = 'TBD';
  try {
    const wynntils = await fetchJson('https://api.modrinth.com/v2/project/wynntils');
    if (Array.isArray(wynntils.game_versions) && wynntils.game_versions.length > 0) {
      community = wynntils.game_versions.sort((a, b) => {
        const pa = a.split('.').map(Number);
        const pb = b.split('.').map(Number);
        for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
          if ((pa[i] || 0) > (pb[i] || 0)) return 1;
          if ((pa[i] || 0) < (pb[i] || 0)) return -1;
        }
        return 0;
      }).pop();
    }
  } catch (e) {}

  // Lowest and highest supported
  let lowest = 'TBD', highest = 'TBD';
  try {
    const proxy = await fetchJson('https://api.mcsrvstat.us/3/wynncraft.com');
    const ver = proxy && proxy.version;
    console.log('Fetched proxy.version:', ver);
    process.stdout.write('Fetched proxy.version: ' + ver + '\n');
    if (!ver) {
      console.log('Full proxy object:', JSON.stringify(proxy, null, 2));
      process.stdout.write('Full proxy object: ' + JSON.stringify(proxy) + '\n');
    }
    if (ver) {
      const m = ver.match(/(?:WynnProxy\s*)?([^\s-]+)-([^\s+]+)/i);
      if (m) {
        lowest = m[1].trim();
        highest = m[2].replace(/\+$/, '').trim();
      } else {
        console.log('Regex did not match version string:', ver);
        process.stdout.write('Regex did not match version string: ' + ver + '\n');
      }
    }
  } catch (e) {
    console.log('Error fetching or parsing proxy.version:', e);
    process.stdout.write('Error fetching or parsing proxy.version: ' + e + '\n');
  }

  return { community, lowest, highest };
}

function updateMetaTags(html, { community, lowest, highest }) {
  html = html.replace(
    /<meta property="og:title" content="[^"]*"/,
    `<meta property="og:title" content="You should use Minecraft version ${community} to connect to Wynncraft!"`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*"/,
    `<meta property="og:description" content="Note that Wynncraft technically supports clients as old as ${lowest} and as new as ${highest}."`
  );
  return html;
}

(async () => {
  const versions = await getVersions();
  let html = fs.readFileSync(INDEX_PATH, 'utf8');
  html = updateMetaTags(html, versions);
  fs.writeFileSync(INDEX_PATH, html, 'utf8');
  console.log('Open Graph tags updated:', versions);
})();
