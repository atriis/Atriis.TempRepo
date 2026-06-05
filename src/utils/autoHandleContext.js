/**
 * Per-page auto-handle flag store.
 *
 * Stores whether a scenario is tagged @nomodalneeded so DSL methods can decide
 * whether to auto-dismiss booking interruption modals — without receiving the
 * Cucumber World as a parameter, which would break layer separation.
 *
 * Usage:
 *   // In the login step (after page is created):
 *   autoHandleContext.set(this.page, this.autoHandleModals);
 *
 *   // In any DSL method:
 *   if (autoHandleContext.isEnabled(page)) { ... }
 */

const _store = new WeakMap();

module.exports = {
  /**
   * Associates the auto-handle flag with a Playwright page instance.
   * @param {import('playwright').Page} page
   * @param {boolean} enabled
   */
  set(page, enabled) {
    _store.set(page, !!enabled);
  },

  /**
   * Returns true if the page is tagged for automatic modal handling.
   * @param {import('playwright').Page} page
   * @returns {boolean}
   */
  isEnabled(page) {
    return _store.get(page) === true;
  },
};
