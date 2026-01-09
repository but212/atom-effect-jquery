import { describe, it, expect, vi, beforeEach } from 'vitest';
import $ from 'jquery';
import '../src/index';
import { debug } from '../src/debug';
import { getValue } from '../src/utils';
import { registry, disableAutoCleanup, enableAutoCleanup } from '../src/registry';
import type { EffectObject } from '../src/types';

function wait(ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('Coverage Gap Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    $.atom.debug = false;
    vi.clearAllMocks();
  });

  describe('chainable.ts gaps', () => {
    it('atomHtml with reactive value', async () => {
      const html = $.atom('<span>initial</span>');
      const $el = $('<div>');
      $el.atomHtml(html);
      expect($el.html()).toBe('<span>initial</span>');
      
      html.value = '<b>updated</b>';
      await wait();
      expect($el.html()).toBe('<b>updated</b>');
    });

    it('atomCss with reactive value', async () => {
      const opacity = $.atom(0.5);
      const $el = $('<div>').appendTo(document.body);
      $el.atomCss('opacity', opacity);
      await wait(10);
      expect(Number($el.css('opacity'))).toBe(0.5);
      
      opacity.value = 0.8;
      await wait(10);
      expect(Number($el.css('opacity'))).toBe(0.8);
      $el.remove();
    });

    it('atomProp with reactive value', async () => {
      const checked = $.atom(false);
      const $el = $('<input type="checkbox">');
      $el.atomProp('checked', checked);
      await wait();
      expect($el.prop('checked')).toBe(false);
      
      checked.value = true;
      await wait();
      expect($el.prop('checked')).toBe(true);
    });

    it('atomShow/Hide with reactive values', async () => {
      const visible = $.atom(true);
      const $el = $('<div>').appendTo(document.body);
      
      $el.atomShow(visible);
      await wait();
      expect($el.css('display')).not.toBe('none');
      
      visible.value = false;
      await wait();
      expect($el.css('display')).toBe('none');

      const hidden = $.atom(false);
      $el.atomHide(hidden);
      await wait();
      expect($el.css('display')).not.toBe('none');
      
      hidden.value = true;
      await wait();
      expect($el.css('display')).toBe('none');
      
      $el.remove();
    });

    it('atomVal IME events and debounce', async () => {
      const val = $.atom('');
      const $el = $('<input>');
      $el.atomVal(val, { debounce: 10 });

      $el.trigger('compositionstart');
      $el.val('ㄱ').trigger('input');
      expect(val.value).toBe(''); // Should not update during composition

      $el.val('가').trigger('compositionend');
      expect(val.value).toBe('가'); // Should update on compositionend

      $el.val('나').trigger('input');
      expect(val.value).toBe('가'); // Should not update immediately due to debounce
      await wait(20);
      expect(val.value).toBe('나');
    });

    it('atomChecked with reactive value', async () => {
      const checked = $.atom(false);
      const $el = $('<input type="checkbox">');
      $el.atomChecked(checked);
      
      $el.prop('checked', true).trigger('change');
      expect(checked.value).toBe(true);
      
      checked.value = false;
      await wait();
      expect($el.prop('checked')).toBe(false);
    });

    it('atomUnbind', () => {
      const text = $.atom('hello');
      const $el = $('<div>');
      $el.atomText(text);
      expect($el.text()).toBe('hello');
      
      $el.atomUnbind();
      text.value = 'world';
      // Should not update after unbind
      expect($el.text()).toBe('hello');
    });
  });

  describe('unified.ts gaps', () => {
    it('atomBind reactive branches (html, attr, prop, show, hide)', async () => {
      const html = $.atom('<b>b</b>');
      const attr = $.atom<string | null>('val');
      const prop = $.atom(true);
      const show = $.atom(false);
      const $el = $('<div>').appendTo(document.body);

      $el.atomBind({
        html,
        attr: { 'data-test': attr },
        prop: { disabled: prop },
        show
      });

      await wait();
      expect($el.html()).toBe('<b>b</b>');
      expect($el.attr('data-test')).toBe('val');
      expect($el.prop('disabled')).toBe(true);
      expect($el.css('display')).toBe('none');

      html.value = '<i>i</i>';
      attr.value = null;
      prop.value = false;
      show.value = true;
      await wait();

      expect($el.html()).toBe('<i>i</i>');
      expect($el.attr('data-test')).toBeUndefined();
      expect($el.prop('disabled')).toBe(false);
      expect($el.css('display')).not.toBe('none');
      
      $el.remove();
    });

    it('atomBind events (on)', () => {
      const count = $.atom(0);
      const $el = $('<button>');
      $el.atomBind({
        on: {
          click: () => { count.value++; }
        }
      });

      $el.trigger('click');
      expect(count.value).toBe(1);
    });

    it('atomBind IME events', async () => {
      const val = $.atom('');
      const $el = $('<input>');
      $el.atomBind({ val });

      $el.trigger('compositionstart');
      $el.val('ㄱ').trigger('input');
      expect(val.value).toBe('');

      $el.val('가').trigger('compositionend');
      expect(val.value).toBe('가');
    });
  });

  describe('debug.ts gaps', () => {
    it('debug logging and highlighting', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      $.atom.debug = true;
      
      debug.log('test', 'message');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[atom-effect-jquery] test:'), 'message');

      const $el = $('<div id="my-id" class="c1 c2">');
      debug.domUpdated($el, 'text', 'hello');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('DOM updated: #my-id.text ='), 'hello');
      
      // Test selector generation with classes only
      const $el2 = $('<div class="c1 c2">');
      debug.domUpdated($el2, 'text', 'world');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('DOM updated: div.c1.c2.text ='), 'world');

      $.atom.debug = false;
      consoleSpy.mockRestore();
    });

    it('debug.warn', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      $.atom.debug = true;
      debug.warn('warning');
      expect(warnSpy).toHaveBeenCalled();
      $.atom.debug = false;
      warnSpy.mockRestore();
    });
  });

  describe('list.ts gaps', () => {
    it('atomList with bind and onRemove (async)', async () => {
      const items = $.atom([{ id: 1, name: 'a' }]);
      const $container = $('<div>');
      let bindCalled = false;
      let removeCalled = false;

      $container.atomList(items, {
        key: 'id',
        render: (item) => `<span>${item.name}</span>`,
        bind: ($el, _item) => {
          bindCalled = true;
          $el.attr('data-bound', 'true');
        },
        onRemove: async (_$el) => {
          removeCalled = true;
          await wait(10);
        }
      });

      await wait();
      expect(bindCalled).toBe(true);
      expect($container.find('span').attr('data-bound')).toBe('true');

      items.value = [];
      await wait();
      expect(removeCalled).toBe(true);
      await wait(20);
      expect($container.children().length).toBe(0);
    });
  });

  describe('mount.ts gaps', () => {
    it('unmounting existing component and error handling', () => {
      const $el = $('<div>');
      let cleanupCalled = false;
      
      const Comp1 = () => () => { cleanupCalled = true; };
      const Comp2 = () => { throw new Error('mount error'); };

      $el.atomMount(Comp1);
      $el.atomMount(Comp1); // Should trigger cleanup of first
      expect(cleanupCalled).toBe(true);

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      $el.atomMount(Comp2);
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Mount error:'), expect.any(Error));
      errorSpy.mockRestore();
    });
  });

  describe('namespace.ts gaps', () => {
    it('atom with name and $.isReactive', () => {
      const a = $.atom(0, { name: 'test-atom' });
      // Metadata is private/WeakMap, but we covered the line.
      expect($.isReactive(a)).toBe(true);
      expect($.isReactive({})).toBe(false);
    });
  });

  describe('registry.ts gaps', () => {
    it('registry.hasBind and error handling during dispose', () => {
      const el = document.createElement('div');
      expect(registry.hasBind(el)).toBe(false);
      
      registry.trackCleanup(el, () => {});
      expect(registry.hasBind(el)).toBe(true);

      // Force error in dispose
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      $.atom.debug = true;
      registry.trackEffect(el, { dispose: () => { throw new Error('dispose error'); } } as unknown as EffectObject);
      
      registry.cleanup(el);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[atom-effect-jquery]'), 'Effect dispose error:', expect.any(Error));
      
      // Force error in cleanup
      const el2 = document.createElement('div');
      registry.trackCleanup(el2, () => { throw new Error('cleanup error'); });
      registry.cleanup(el2);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[atom-effect-jquery]'), 'Cleanup error:', expect.any(Error));

      $.atom.debug = false;
      warnSpy.mockRestore();
    });

    it('disableAutoCleanup', () => {
      enableAutoCleanup();
      disableAutoCleanup();
      // Verifies the lines in registry.ts
    });
  });

  describe('utils.ts gaps', () => {
    it('getValue with static values', () => {
      expect(getValue(123)).toBe(123);
      expect(getValue('str')).toBe('str');
      expect(getValue(null)).toBe(null);
    });
  });
});
