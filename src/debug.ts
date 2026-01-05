/**
 * 디버그 모드
 * 
 * $.atom.debug = true 로 활성화하면:
 * 1. 콘솔에 상태 변경 로깅
 * 2. DOM 업데이트 시 빨간 테두리 깜빡임 (시각적 피드백)
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
   * DOM 업데이트 로깅 + 시각적 하이라이트
   */
  domUpdated($el: JQuery, type: string, value: any) {
    if (!debugEnabled) return;

    // 콘솔 로깅
    const selector = getDebugSelector($el);
    console.log(
      `[atom-effect-jquery] DOM updated: ${selector}.${type} =`,
      value
    );

    // 시각적 하이라이트 (빨간 테두리 깜빡임)
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
 * 요소의 셀렉터 문자열 생성 (디버깅용)
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
 * 시각적 하이라이트 - 빨간 테두리 깜빡임
 * React DevTools의 "Highlight updates" 기능 벤치마킹
 */
function highlightElement($el: JQuery): void {
  // 현재 outline 저장
  const originalOutline = $el.css('outline');
  const originalTransition = $el.css('transition');

  // 빨간 테두리 적용
  $el.css({
    'outline': '2px solid #ff4444',
    'outline-offset': '1px',
    'transition': 'outline 0.1s ease-out'
  });

  // 200ms 후 원래대로 복원
  setTimeout(() => {
    $el.css({
      'outline': originalOutline || '',
      'outline-offset': '',
      'transition': originalTransition || ''
    });
  }, 200);
}
