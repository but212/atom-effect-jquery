import $ from 'jquery';
import { effect, batch } from '@but212/atom-effect';
import { registry } from './registry';
import { debug } from './debug';
import { isReactive, getValue } from './utils';
import type { BindingOptions, WritableAtom } from './types';

$.fn.atomBind = function(options: BindingOptions): JQuery {
  return this.each(function() {
    const $el = $(this);
    const el = this;
    const effects: (() => void)[] = [];

    // text
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

    // html
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

    // class
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

    // css
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

    // attr
    if (options.attr) {
      for (const [name, value] of Object.entries(options.attr)) {
        const applyAttr = (v: any) => {
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

    // prop
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

    // show
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

    // hide
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

    // val (양방향) - IME 지원
    if (options.val !== undefined) {
      const atom = options.val;
      let isUpdatingFromAtom = false;
      let isComposing = false;

      // IME 이벤트
      const onCompositionStart = () => { isComposing = true; };
      const onCompositionEnd = () => {
        isComposing = false;
        if (!isUpdatingFromAtom) {
          batch(() => { atom.value = $el.val(); });
        }
      };

      $el.on('compositionstart', onCompositionStart);
      $el.on('compositionend', onCompositionEnd);

      const handler = () => {
        if (isComposing || isUpdatingFromAtom) return;
        batch(() => { atom.value = $el.val(); });
      };
      
      $el.on('input change', handler);
      
      registry.trackCleanup(el, () => {
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

    // checked (양방향)
    if (options.checked !== undefined) {
      const atom = options.checked;
      let isUpdatingFromAtom = false;

      const handler = () => {
        if (isUpdatingFromAtom) return;
        batch(() => { atom.value = $el.prop('checked'); });
      };
      
      $el.on('change', handler);
      registry.trackCleanup(el, () => $el.off('change', handler));

      effects.push(() => {
        isUpdatingFromAtom = true;
        $el.prop('checked', atom.value);
        debug.domUpdated($el, 'checked', atom.value);
        isUpdatingFromAtom = false;
      });
    }

    // on
    if (options.on) {
      for (const [eventName, handler] of Object.entries(options.on)) {
        const wrapped = function(this: HTMLElement, e: JQuery.Event) {
          batch(() => handler.call(this, e));
        };
        $el.on(eventName, wrapped);
        registry.trackCleanup(el, () => $el.off(eventName, wrapped));
      }
    }

    // Effect 등록
    if (effects.length > 0) {
      const fx = effect(() => {
        effects.forEach(fn => fn());
      });
      registry.trackEffect(el, fx);
    }
  });
};
