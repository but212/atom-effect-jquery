/**
 * Debug Mode
 * 
 * When $.atom.debug = true is enabled:
 * 1. Logs state changes to the console.
 * 2. Visually highlights DOM updates (red border flash).
 * 
 * Debug mode can be enabled in two ways:
 * 1. Environment variable (build-time): NODE_ENV=development
 * 2. Runtime: $.atom.debug = true or window.__ATOM_DEBUG__ = true
 */

/**
 * Determines the initial debug state based on environment.
 * Priority: window.__ATOM_DEBUG__ > NODE_ENV === 'development'
 */
function getInitialDebugState(): boolean {
  // Browser: check global flag
  if (typeof window !== 'undefined') {
    const globalFlag = (window as Window & { __ATOM_DEBUG__?: boolean }).__ATOM_DEBUG__;
    if (typeof globalFlag === 'boolean') {
      return globalFlag;
    }
  }

  // Vite support
  if (import.meta.env?.DEV) {
    return true;
  }

  // Node/Bundler check
  try {
    // @ts-expect-error
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
      return true;
    }
  } catch (_e) {
    // ignore
  }

  return false;
}

let debugEnabled = getInitialDebugState();

export const debug = {
  get enabled() {
    return debugEnabled;
  },
  set enabled(value: boolean) {
    debugEnabled = value;
  },

  log<T>(type: string, ...args: T[]) {
    if (debugEnabled) {
      console.log(`[atom-effect-jquery] ${type}:`, ...args);
    }
  },

  atomChanged<T>(name: string | undefined, oldVal: T, newVal: T) {
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
  domUpdated<T>($el: JQuery, type: string, value: T) {
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

  warn<T>(...args: T[]) {
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
