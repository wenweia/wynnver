(() => {
  const DEFAULTS = {
    community: 'Error',
    lowest: '1.20.5',
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

  async function fetchHighestFromMCVersionsAPI() {
    try {
      const res = await fetch('https://mc-versions-api.net/api/java');
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();

      let versions = null;
      if (Array.isArray(data)) versions = data;
      else if (Array.isArray(data.versions)) versions = data.versions;
      else if (Array.isArray(data.data)) versions = data.data;
      else if (Array.isArray(data.result)) versions = data.result;

      if (!versions || versions.length === 0) return null;

      let highest = versions[0];
      for (let i = 1; i < versions.length; i++) {
        const v = versions[i];
        if (compareVersions(v, highest) > 0) highest = v;
      }
      return highest;
    } catch (e) {
      console.debug('fetchHighestFromMCVersionsAPI failed:', e && e.message);
      return null;
    }
  }

  async function init() {
    const highest = await fetchHighestGameVersion();
    if (highest) {
      DEFAULTS.community = String(highest);
    }

    const mcHighest = await fetchHighestFromMCVersionsAPI();
    if (mcHighest) {
      DEFAULTS.highest = mcHighest;
    }

    populate();

    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', `You should use Minecraft version ${DEFAULTS.community} to connect to Wynncraft!`);
    }
    if (ogDesc) {
      ogDesc.setAttribute('content', `Note that Wynncraft technically supports clients as old as ${DEFAULTS.lowest} and as new as ${DEFAULTS.highest}.`);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
