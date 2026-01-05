import $ from 'jquery';
import { effect, batch } from '@but212/atom-effect';
import { registry } from './registry';
import { debug } from './debug';
import { isReactive, getValue } from './utils';
import type { ReactiveValue, WritableAtom, ValOptions } from './types';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// atomText
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

$.fn.atomText = function(
  source: ReactiveValue<any>,
  formatter?: (v: any) => string
): JQuery {
  return this.each(function() {
    const $el = $(this);
    const el = this;

    if (isReactive(source)) {
      const fx = effect(() => {
        const value = getValue(source);
        const text = formatter ? formatter(value) : String(value ?? '');
        $el.text(text);
        debug.domUpdated($el, 'text', text);
      });
      registry.trackEffect(el, fx);
    } else {
      const text = formatter ? formatter(source) : String(source ?? '');
      $el.text(text);
    }
  });
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// atomHtml
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

$.fn.atomHtml = function(source: ReactiveValue<string>): JQuery {
  return this.each(function() {
    const $el = $(this);
    const el = this;

    if (isReactive(source)) {
      const fx = effect(() => {
        const html = String(getValue(source) ?? '');
        $el.html(html);
        debug.domUpdated($el, 'html', html);
      });
      registry.trackEffect(el, fx);
    } else {
      $el.html(String(source ?? ''));
    }
  });
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// atomClass
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

$.fn.atomClass = function(
  className: string,
  condition: ReactiveValue<boolean>
): JQuery {
  return this.each(function() {
    const $el = $(this);
    const el = this;

    if (isReactive(condition)) {
      const fx = effect(() => {
        const value = Boolean(getValue(condition));
        $el.toggleClass(className, value);
        debug.domUpdated($el, `class.${className}`, value);
      });
      registry.trackEffect(el, fx);
    } else {
      $el.toggleClass(className, Boolean(condition));
    }
  });
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// atomCss
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

$.fn.atomCss = function(
  prop: string,
  source: ReactiveValue<string | number>,
  unit?: string
): JQuery {
  return this.each(function() {
    const $el = $(this);
    const el = this;

    if (isReactive(source)) {
      const fx = effect(() => {
        const value = getValue(source);
        const cssValue = unit ? `${value}${unit}` : value;
        $el.css(prop, cssValue);
        debug.domUpdated($el, `css.${prop}`, cssValue);
      });
      registry.trackEffect(el, fx);
    } else {
      $el.css(prop, unit ? `${source}${unit}` : source);
    }
  });
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// atomAttr
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

$.fn.atomAttr = function(
  name: string,
  source: ReactiveValue<string | boolean | null>
): JQuery {
  return this.each(function() {
    const $el = $(this);
    const el = this;

    const applyAttr = (value: string | boolean | null) => {
      if (value === null || value === undefined || value === false) {
        $el.removeAttr(name);
      } else if (value === true) {
        $el.attr(name, name);
      } else {
        $el.attr(name, String(value));
      }
      debug.domUpdated($el, `attr.${name}`, value);
    };

    if (isReactive(source)) {
      const fx = effect(() => applyAttr(getValue(source)));
      registry.trackEffect(el, fx);
    } else {
      applyAttr(source);
    }
  });
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// atomProp
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

$.fn.atomProp = function(
  name: string,
  source: ReactiveValue<any>
): JQuery {
  return this.each(function() {
    const $el = $(this);
    const el = this;

    if (isReactive(source)) {
      const fx = effect(() => {
        const value = getValue(source);
        $el.prop(name, value);
        debug.domUpdated($el, `prop.${name}`, value);
      });
      registry.trackEffect(el, fx);
    } else {
      $el.prop(name, source);
    }
  });
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// atomShow / atomHide
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

$.fn.atomShow = function(condition: ReactiveValue<boolean>): JQuery {
  return this.each(function() {
    const $el = $(this);
    const el = this;

    if (isReactive(condition)) {
      const fx = effect(() => {
        const value = Boolean(getValue(condition));
        $el.toggle(value);
        debug.domUpdated($el, 'show', value);
      });
      registry.trackEffect(el, fx);
    } else {
      $el.toggle(Boolean(condition));
    }
  });
};

$.fn.atomHide = function(condition: ReactiveValue<boolean>): JQuery {
  return this.each(function() {
    const $el = $(this);
    const el = this;

    if (isReactive(condition)) {
      const fx = effect(() => {
        const value = !getValue(condition);
        $el.toggle(value);
        debug.domUpdated($el, 'hide', !value);
      });
      registry.trackEffect(el, fx);
    } else {
      $el.toggle(!condition);
    }
  });
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// atomVal (양방향) - IME 지원 + 무한 루프 방지
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

$.fn.atomVal = function(
  atom: WritableAtom<any>,
  options: ValOptions = {}
): JQuery {
  const {
    debounce: debounceMs,
    event = 'input',
    parse = (v) => v,
    format = (v) => String(v ?? '')
  } = options;

  return this.each(function() {
    const $el = $(this);
    const el = this;
    
    let timeoutId: number | null = null;
    let isUpdatingFromAtom = false;  // 무한 루프 방지
    let isComposing = false;         // IME 조합 중 여부

    // ========== IME 이벤트 ==========
    const onCompositionStart = () => {
      isComposing = true;
    };

    const onCompositionEnd = () => {
      isComposing = false;
      // 조합 완료 시 Atom 업데이트
      updateAtom();
    };

    $el.on('compositionstart', onCompositionStart);
    $el.on('compositionend', onCompositionEnd);

    // ========== 값 업데이트 함수 ==========
    const updateAtom = () => {
      if (isUpdatingFromAtom) return;
      
      batch(() => {
        atom.value = parse($el.val() as string);
      });
    };

    // ========== DOM → Atom ==========
    const onInput = () => {
      // IME 조합 중이면 무시 (compositionend에서 처리)
      if (isComposing) return;
      if (isUpdatingFromAtom) return;

      if (debounceMs) {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = window.setTimeout(updateAtom, debounceMs);
      } else {
        updateAtom();
      }
    };

    $el.on(event, onInput);
    $el.on('change', onInput);  // select 등을 위해

    // ========== Atom → DOM ==========
    const fx = effect(() => {
      const formatted = format(atom.value);
      
      // 값이 다를 때만 업데이트 (불필요한 DOM 조작 방지)
      if ($el.val() !== formatted) {
        isUpdatingFromAtom = true;
        $el.val(formatted);
        debug.domUpdated($el, 'val', formatted);
        isUpdatingFromAtom = false;
      }
    });

    registry.trackEffect(el, fx);

    // ========== Cleanup ==========
    registry.trackCleanup(el, () => {
      $el.off(event, onInput);
      $el.off('change', onInput);
      $el.off('compositionstart', onCompositionStart);
      $el.off('compositionend', onCompositionEnd);
      if (timeoutId) clearTimeout(timeoutId);
    });
  });
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// atomChecked (양방향) - 무한 루프 방지
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

$.fn.atomChecked = function(atom: WritableAtom<boolean>): JQuery {
  return this.each(function() {
    const $el = $(this);
    const el = this;
    
    let isUpdatingFromAtom = false;

    // DOM → Atom
    const handler = function() {
      if (isUpdatingFromAtom) return;
      
      batch(() => {
        atom.value = $el.prop('checked');
      });
    };
    
    $el.on('change', handler);
    registry.trackCleanup(el, () => $el.off('change', handler));

    // Atom → DOM
    const fx = effect(() => {
      isUpdatingFromAtom = true;
      $el.prop('checked', atom.value);
      debug.domUpdated($el, 'checked', atom.value);
      isUpdatingFromAtom = false;
    });
    registry.trackEffect(el, fx);
  });
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// atomOn
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

$.fn.atomOn = function(
  event: string,
  handler: (e: JQuery.Event) => void
): JQuery {
  return this.each(function() {
    const $el = $(this);
    const el = this;

    const wrappedHandler = function(this: HTMLElement, e: JQuery.Event) {
      batch(() => handler.call(this, e));
    };

    $el.on(event, wrappedHandler);
    registry.trackCleanup(el, () => $el.off(event, wrappedHandler));
  });
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// atomUnbind
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

$.fn.atomUnbind = function(): JQuery {
  return this.each(function() {
    registry.cleanupTree(this);
  });
};
