import $ from 'jquery';
import { effect, batch } from '@but212/atom-effect';
import { registry } from './registry';
import { debug } from './debug';
import { isReactive, getValue } from './utils';
import type { BindingOptions } from './types';

/**
 * Extends jQuery with atom-based data binding capabilities.
 * This plugin allows synchronizing DOM element states (text, html, classes, styles, etc.)
 * with reactive atoms or static values. It also supports two-way binding for form inputs
 * and automatic cleanup of effects and event listeners.
 *
 * @param options - Configuration object defining the bindings.
 * @returns The jQuery object for chainability.
 */
$.fn.atomBind = function<T extends string | number | boolean | null | undefined>(options: BindingOptions<T>): JQuery {
  return this.each(function() {
    const $el = $(this);
    const effects: (() => void)[] = [];

    // Text
    if (options.text !== undefined) {
      if (isReactive(options.text)) {
        effects.push(() => {
          const text = String(getValue(options.text) ?? '');
          $el.text(text);
          debug.domUpdated($el, 'text', text);
        });
      } else {
        $el.text(String(options.text ?? ''));
      }
    }

    // HTML
    if (options.html !== undefined) {
      if (isReactive(options.html)) {
        effects.push(() => {
          const html = String(getValue(options.html) ?? '');
          $el.html(html);
          debug.domUpdated($el, 'html', html);
        });
      } else {
        $el.html(String(options.html ?? ''));
      }
    }

    // Class
    if (options.class) {
      for (const [className, condition] of Object.entries(options.class)) {
        if (isReactive(condition)) {
          effects.push(() => {
            const value = Boolean(getValue(condition));
            $el.toggleClass(className, value);
            debug.domUpdated($el, `class.${className}`, value);
          });
        } else {
          $el.toggleClass(className, Boolean(condition));
        }
      }
    }

    // CSS
    if (options.css) {
      for (const [prop, value] of Object.entries(options.css)) {
        if (Array.isArray(value)) {
          const [source, unit] = value;
          if (isReactive(source)) {
            effects.push(() => {
              const cssValue = `${getValue(source)}${unit}`;
              $el.css(prop, cssValue);
              debug.domUpdated($el, `css.${prop}`, cssValue);
            });
          } else {
            $el.css(prop, `${source}${unit}`);
          }
        } else if (isReactive(value)) {
          effects.push(() => {
            const cssValue = getValue(value) as string | number;
            $el.css(prop, cssValue);
            debug.domUpdated($el, `css.${prop}`, cssValue);
          });
        } else {
          $el.css(prop, value as string | number);
        }
      }
    }

    // Attributes
    if (options.attr) {
      for (const [name, value] of Object.entries(options.attr)) {
        const applyAttr = (v: string | boolean | null | undefined) => {
          if (v === null || v === undefined || v === false) {
            $el.removeAttr(name);
          } else if (v === true) {
            $el.attr(name, name);
          } else {
            $el.attr(name, String(v));
          }
          debug.domUpdated($el, `attr.${name}`, v);
        };

        if (isReactive(value)) {
          effects.push(() => applyAttr(getValue(value)));
        } else {
          applyAttr(value);
        }
      }
    }

    // Properties
    if (options.prop) {
      for (const [name, value] of Object.entries(options.prop)) {
        if (isReactive(value)) {
          effects.push(() => {
            const propValue = getValue(value);
            $el.prop(name, propValue);
            debug.domUpdated($el, `prop.${name}`, propValue);
          });
        } else {
          $el.prop(name, value);
        }
      }
    }

    // Show
    if (options.show !== undefined) {
      if (isReactive(options.show)) {
        effects.push(() => {
          const value = Boolean(getValue(options.show));
          $el.toggle(value);
          debug.domUpdated($el, 'show', value);
        });
      } else {
        $el.toggle(Boolean(options.show));
      }
    }

    // Hide
    if (options.hide !== undefined) {
      if (isReactive(options.hide)) {
        effects.push(() => {
          const value = !getValue(options.hide);
          $el.toggle(value);
          debug.domUpdated($el, 'hide', !value);
        });
      } else {
        $el.toggle(!options.hide);
      }
    }

    // Val (Two-way) - Supports IME
    if (options.val !== undefined) {
      const atom = options.val;
      let isUpdatingFromAtom = false;
      let isComposing = false;

      // IME Events
      const onCompositionStart = () => { isComposing = true; };
      const onCompositionEnd = () => {
        isComposing = false;
        if (!isUpdatingFromAtom) {
          batch(() => { atom.value = $el.val() as unknown as T; });
        }
      };

      $el.on('compositionstart', onCompositionStart);
      $el.on('compositionend', onCompositionEnd);

      const handler = () => {
        if (isComposing || isUpdatingFromAtom) return;
        batch(() => { atom.value = $el.val() as unknown as T; });
      };
      
      $el.on('input change', handler);
      
      registry.trackCleanup(this, () => {
        $el.off('input change', handler);
        $el.off('compositionstart', onCompositionStart);
        $el.off('compositionend', onCompositionEnd);
      });

      effects.push(() => {
        const v = String(atom.value ?? '');
        if ($el.val() !== v) {
          isUpdatingFromAtom = true;
          $el.val(v);
          debug.domUpdated($el, 'val', v);
          isUpdatingFromAtom = false;
        }
      });
    }

    // Checked (Two-way)
    if (options.checked !== undefined) {
      const atom = options.checked;
      let isUpdatingFromAtom = false;

      const handler = () => {
        if (isUpdatingFromAtom) return;
        batch(() => { atom.value = $el.prop('checked'); });
      };
      
      $el.on('change', handler);
      registry.trackCleanup(this, () => $el.off('change', handler));

      effects.push(() => {
        isUpdatingFromAtom = true;
        $el.prop('checked', atom.value);
        debug.domUpdated($el, 'checked', atom.value);
        isUpdatingFromAtom = false;
      });
    }

    // Event Handlers
    if (options.on) {
      for (const [eventName, handler] of Object.entries(options.on)) {
        const wrapped = function(this: HTMLElement, e: JQuery.Event) {
          batch(() => handler.call(this, e));
        };
        $el.on(eventName, wrapped);
        registry.trackCleanup(this, () => $el.off(eventName, wrapped));
      }
    }

    // Register Effects
    if (effects.length > 0) {
      const fx = effect(() => {
        effects.forEach(fn => fn());
      });
      registry.trackEffect(this, fx);
    }
  });
};
