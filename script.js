(() => {
  // Default values — maintainers should update these in the repository.
  const DEFAULTS = {
    community: 'TBD',
    serverRecommended: 'TBD',
    lowest: 'TBD',
    highest: 'TBD'
  };

  const keys = Object.keys(DEFAULTS);

  function populate() {
    keys.forEach(k => {
      const el = document.querySelector(`.version[data-key="${k}"]`);
      if (el) el.textContent = DEFAULTS[k];
    });
  }

  document.addEventListener('DOMContentLoaded', populate);
})();
