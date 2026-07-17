// Language selector — PLACEHOLDER for now.
// Full text translation was tried and reverted; only two things remain wired up:
//   1. The selector itself, so the UI slot is visible and reviewable.
//   2. Page direction (RTL for Hebrew) switching, kept for future reference —
//      when real translations are added later, this already flips the layout correctly.
// Text content is NOT translated yet. The data-i18n attributes in the HTML are inert
// markers left in place for when a translation dictionary is reintroduced.

(function () {
  const STORAGE_KEY = 'fieldGuideLang';
  const RTL_LANGS = ['he'];

  function applyDirection(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';
  }

  const select = document.getElementById('langSelect');
  if (!select) return;

  const saved = window.localStorage.getItem(STORAGE_KEY) || 'en';
  select.value = saved;
  applyDirection(saved);

  select.addEventListener('change', () => {
    window.localStorage.setItem(STORAGE_KEY, select.value);
    applyDirection(select.value);
  });
})();
