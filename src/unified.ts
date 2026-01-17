import $ from 'jquery';
import { effect, batch } from '@but212/atom-effect';
import { registry } from './registry';
import { debug } from './debug';
import { isReactive, getValue } from './utils';
import type { BindingOptions, ReactiveValue, CssValue, WritableAtom } from './types';
import { createInputBindingState } from './types';

// ============================================================================
// Binding Handler Types
// ============================================================================

/**
 * Effect factory function - returns effects to register, or empty array for static bindings.
 */
type EffectFactory = () => void;

/**
 * Context passed to binding handlers for cleanup registration.
 */
interface BindingContext {
  readonly $el: JQuery;
  readonly el: HTMLElement;
  readonly effects: EffectFactory[];
  readonly trackCleanup: (fn: () => void) => void;
}

// ============================================================================
// One-Way Binding Handlers (Atom → DOM)
// ============================================================================

function bindText<T>(ctx: BindingContext, value: ReactiveValue<T>): void {
  if (isReactive(value)) {
    ctx.effects.push(() => {
      const text = String(getValue(value) ?? '');
      ctx.$el.text(text);
      debug.domUpdated(ctx.$el, 'text', text);
    });
  } else {
    ctx.$el.text(String(value ?? ''));
  }
}

function bindHtml(ctx: BindingContext, value: ReactiveValue<string>): void {
  if (isReactive(value)) {
    ctx.effects.push(() => {
      const html = String(getValue(value) ?? '');
      ctx.$el.html(html);
      debug.domUpdated(ctx.$el, 'html', html);
    });
  } else {
    ctx.$el.html(String(value ?? ''));
  }
}

function bindClass(ctx: BindingContext, classMap: Record<string, ReactiveValue<boolean>>): void {
  for (const [className, condition] of Object.entries(classMap)) {
    if (isReactive(condition)) {
      ctx.effects.push(() => {
        const value = Boolean(getValue(condition));
        ctx.$el.toggleClass(className, value);
        debug.domUpdated(ctx.$el, `class.${className}`, value);
      });
    } else {
      ctx.$el.toggleClass(className, Boolean(condition));
    }
  }
}

function bindCss(ctx: BindingContext, cssMap: Record<string, CssValue>): void {
  for (const [prop, value] of Object.entries(cssMap)) {
    if (Array.isArray(value)) {
      const [source, unit] = value;
      if (isReactive(source)) {
        ctx.effects.push(() => {
          const cssValue = `${getValue(source)}${unit}`;
          ctx.$el.css(prop, cssValue);
          debug.domUpdated(ctx.$el, `css.${prop}`, cssValue);
        });
      } else {
        ctx.$el.css(prop, `${source}${unit}`);
      }
    } else if (isReactive(value)) {
      ctx.effects.push(() => {
        const cssValue = getValue(value) as string | number;
        ctx.$el.css(prop, cssValue);
        debug.domUpdated(ctx.$el, `css.${prop}`, cssValue);
      });
    } else {
      ctx.$el.css(prop, value as string | number);
    }
  }
}

function bindAttr(ctx: BindingContext, attrMap: Record<string, ReactiveValue<string | boolean | null>>): void {
  for (const [name, value] of Object.entries(attrMap)) {
    const applyAttr = (v: string | boolean | null | undefined) => {
      if (v === null || v === undefined || v === false) {
        ctx.$el.removeAttr(name);
      } else if (v === true) {
        ctx.$el.attr(name, name);
      } else {
        ctx.$el.attr(name, String(v));
      }
      debug.domUpdated(ctx.$el, `attr.${name}`, v);
    };

    if (isReactive(value)) {
      ctx.effects.push(() => applyAttr(getValue(value)));
    } else {
      applyAttr(value);
    }
  }
}

function bindProp(ctx: BindingContext, propMap: Record<string, ReactiveValue<unknown>>): void {
  for (const [name, value] of Object.entries(propMap)) {
    if (isReactive(value)) {
      ctx.effects.push(() => {
        const propValue = getValue(value);
        ctx.$el.prop(name, propValue as string | number | boolean | null | undefined);
        debug.domUpdated(ctx.$el, `prop.${name}`, propValue);
      });
    } else {
      ctx.$el.prop(name, value as string | number | boolean | null | undefined);
    }
  }
}

function bindShow(ctx: BindingContext, condition: ReactiveValue<boolean>): void {
  if (isReactive(condition)) {
    ctx.effects.push(() => {
      const value = Boolean(getValue(condition));
      ctx.$el.toggle(value);
      debug.domUpdated(ctx.$el, 'show', value);
    });
  } else {
    ctx.$el.toggle(Boolean(condition));
  }
}

function bindHide(ctx: BindingContext, condition: ReactiveValue<boolean>): void {
  if (isReactive(condition)) {
    ctx.effects.push(() => {
      const value = !getValue(condition);
      ctx.$el.toggle(value);
      debug.domUpdated(ctx.$el, 'hide', !value);
    });
  } else {
    ctx.$el.toggle(!condition);
  }
}

// ============================================================================
// Two-Way Binding Handlers (Atom ↔ DOM)
// ============================================================================

function bindVal<T>(ctx: BindingContext, atom: WritableAtom<T>): void {
  const state = createInputBindingState();

  // IME composition support
  const onCompositionStart = () => { state.phase = 'composing'; };
  const onCompositionEnd = () => {
    state.phase = 'idle';
    if (state.phase === 'idle') {
      batch(() => { atom.value = ctx.$el.val() as unknown as T; });
    }
  };

  ctx.$el.on('compositionstart', onCompositionStart);
  ctx.$el.on('compositionend', onCompositionEnd);

  // DOM → Atom
  const handler = () => {
    if (state.phase !== 'idle') return;
    batch(() => { atom.value = ctx.$el.val() as unknown as T; });
  };
  
  ctx.$el.on('input change', handler);
  
  ctx.trackCleanup(() => {
    ctx.$el.off('input change', handler);
    ctx.$el.off('compositionstart', onCompositionStart);
    ctx.$el.off('compositionend', onCompositionEnd);
  });

  // Atom → DOM
  ctx.effects.push(() => {
    const v = String(atom.value ?? '');
    if (ctx.$el.val() !== v) {
      state.phase = 'syncing-to-dom';
      ctx.$el.val(v);
      debug.domUpdated(ctx.$el, 'val', v);
      state.phase = 'idle';
    }
  });
}

function bindChecked(ctx: BindingContext, atom: WritableAtom<boolean>): void {
  const state = createInputBindingState();

  // DOM → Atom
  const handler = () => {
    if (state.phase !== 'idle') return;
    batch(() => { atom.value = ctx.$el.prop('checked'); });
  };
  
  ctx.$el.on('change', handler);
  ctx.trackCleanup(() => ctx.$el.off('change', handler));

  // Atom → DOM
  ctx.effects.push(() => {
    state.phase = 'syncing-to-dom';
    ctx.$el.prop('checked', atom.value);
    debug.domUpdated(ctx.$el, 'checked', atom.value);
    state.phase = 'idle';
  });
}

// ============================================================================
// Event Binding Handler
// ============================================================================

function bindEvents(ctx: BindingContext, eventMap: Record<string, (e: JQuery.Event) => void>): void {
  for (const [eventName, handler] of Object.entries(eventMap)) {
    const wrapped = function(this: HTMLElement, e: JQuery.Event) {
      batch(() => handler.call(this, e));
    };
    ctx.$el.on(eventName, wrapped);
    ctx.trackCleanup(() => ctx.$el.off(eventName, wrapped));
  }
}

// ============================================================================
// Main Entry Point
// ============================================================================

/**
 * Extends jQuery with atom-based data binding capabilities.
 * 
 * This plugin synchronizes DOM element states (text, html, classes, styles, etc.)
 * with reactive atoms. Handlers are modular and focused for maintainability.
 */
$.fn.atomBind = function<T extends string | number | boolean | null | undefined>(options: BindingOptions<T>): JQuery {
  return this.each(function() {
    const $el = $(this);
    const effects: EffectFactory[] = [];

    // Build binding context
    const ctx: BindingContext = {
      $el,
      el: this,
      effects,
      trackCleanup: (fn) => registry.trackCleanup(this, fn),
    };

    // Apply bindings through focused handlers
    if (options.text !== undefined) bindText(ctx, options.text);
    if (options.html !== undefined) bindHtml(ctx, options.html);
    if (options.class) bindClass(ctx, options.class);
    if (options.css) bindCss(ctx, options.css);
    if (options.attr) bindAttr(ctx, options.attr);
    if (options.prop) bindProp(ctx, options.prop);
    if (options.show !== undefined) bindShow(ctx, options.show);
    if (options.hide !== undefined) bindHide(ctx, options.hide);
    if (options.val !== undefined) bindVal(ctx, options.val);
    if (options.checked !== undefined) bindChecked(ctx, options.checked);
    if (options.on) bindEvents(ctx, options.on);

    // Register all collected effects
    effects.forEach(fn => {
      const fx = effect(fn);
      registry.trackEffect(this, fx);
    });
  });
};
