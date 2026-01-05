/**
 * Debug Mode
 * 
 * When $.atom.debug = true is enabled:
 * 1. Logs state changes to the console.
 * 2. Visually highlights DOM updates (red border flash).
 */

let debugEnabled = false;

export const debug = {
  get enabled() {
    return debugEnabled;
  },
  set enabled(value: boolean) {
    debugEnabled = value;
  },

  log(type: string, ...args: any[]) {
    if (debugEnabled) {
      console.log(`[atom-effect-jquery] ${type}:`, ...args);
    }
  },

  atomChanged(name: string | undefined, oldVal: any, newVal: any) {
    if (debugEnabled) {
      const label = name || 'anonymous';
      console.log(
        `[atom-effect-jquery] Atom "${label}" changed:`,
        oldVal, '→', newVal
      );
    }
  },

  /**
   * Logs DOM updates and triggers visual highlight.
   */
  domUpdated($el: JQuery, type: string, value: any) {
    if (!debugEnabled) return;

    // Console logging
    const selector = getDebugSelector($el);
    console.log(
      `[atom-effect-jquery] DOM updated: ${selector}.${type} =`,
      value
    );

    // Visual highlight (red border flash)
    highlightElement($el);
  },

  cleanup(selector: string) {
    if (debugEnabled) {
      console.log(`[atom-effect-jquery] Cleanup: ${selector}`);
    }
  },

  warn(...args: any[]) {
    if (debugEnabled) {
      console.warn('[atom-effect-jquery]', ...args);
    }
  }
};

/**
 * Generates a selector string for the element (for debugging).
 */
function getDebugSelector($el: JQuery): string {
  const el = $el[0];
  if (!el) return 'unknown';
  if (el.id) return `#${el.id}`;
  if (el.className) {
    const classes = String(el.className).split(' ').filter(Boolean).join('.');
    return `${el.tagName.toLowerCase()}.${classes}`;
  }
  return el.tagName.toLowerCase();
}

/**
 * Visual highlight - flashes a red border.
 * Inspired by React DevTools "Highlight updates".
 */
function highlightElement($el: JQuery): void {
  // Save current outline
  const originalOutline = $el.css('outline');
  const originalTransition = $el.css('transition');

  // Apply red border
  $el.css({
    'outline': '2px solid #ff4444',
    'outline-offset': '1px',
    'transition': 'outline 0.1s ease-out'
  });

  // Restore after 200ms
  setTimeout(() => {
    $el.css({
      'outline': originalOutline || '',
      'outline-offset': '',
      'transition': originalTransition || ''
    });
  }, 200);
}
