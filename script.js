(() => {
  const DEFAULTS = {
    community: 'Error',
    serverRecommended: '1.21.8',
    lowest: 'Error',
    highest: 'Error'
  };

  const keys = Object.keys(DEFAULTS);

  function populate() {
    keys.forEach(k => {
      const el = document.querySelector(`.version[data-key="${k}"]`);
      if (el) el.textContent = DEFAULTS[k];
    });
  }

  function compareVersions(a, b) {
    const pa = String(a).split('.').map(s => parseInt(s, 10) || 0);
    const pb = String(b).split('.').map(s => parseInt(s, 10) || 0);
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
      const na = pa[i] || 0;
      const nb = pb[i] || 0;
      if (na > nb) return 1;
      if (na < nb) return -1;
    }
    return 0;
  }

  async function fetchHighestGameVersion() {
    try {
      const res = await fetch('https://api.modrinth.com/v2/project/wynntils');
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      const versions = Array.isArray(data.game_versions) ? data.game_versions : [];
      if (versions.length === 0) return null;
      let highest = versions[0];
      for (let i = 1; i < versions.length; i++) {
        const v = versions[i];
        if (compareVersions(v, highest) > 0) highest = v;
      }
      return highest;
    } catch (e) {
      return null;
    }
  }

  function extractVersionsFromProxy(vstr) {
    if (!vstr || typeof vstr !== 'string') return null;
    const m = vstr.match(/(?:WynnProxy\s*)?([^\s-]+)-([^\s+]+)/i);
    if (!m) return null;
    let low = m[1].trim();
    let high = m[2].trim();
    if (high.endsWith('+')) high = high.slice(0, -1);
    return { lowest: low, highest: high };
  }

  async function fetchWynnProxyRange() {
    try {
      const res = await fetch('https://api.mcsrvstat.us/3/wynncraft.com');
      if (!res.ok) throw new Error('Network error ' + res.status);
      const data = await res.json();
      const ver = data && data.version;
      const parsed = extractVersionsFromProxy(ver);
      if (!parsed) console.debug('Could not parse proxy version string:', ver);
      return parsed;
    } catch (e) {
      console.debug('fetchWynnProxyRange failed:', e && e.message);
      return null;
    }
  }

  async function init() {
    const highest = await fetchHighestGameVersion();
    if (highest) {
      DEFAULTS.community = String(highest);
    }

    const proxyRange = await fetchWynnProxyRange();
    if (proxyRange) {
      DEFAULTS.lowest = proxyRange.lowest;
      DEFAULTS.highest = proxyRange.highest;
    }

    populate();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
