import $ from 'jquery';
import { registry } from './registry';
import { debug } from './debug';
import { getSelector } from './utils';
import type { ComponentFn } from './types';

const mountedComponents = new WeakMap<Element, () => void>();

$.fn.atomMount = function<P>(
  component: ComponentFn<P>,
  props: P = {} as P
): JQuery {
  return this.each(function() {
    const $el = $(this);
    const el = this;
    const selector = getSelector(el);

    // 기존 컴포넌트 언마운트
    const existing = mountedComponents.get(el);
    if (existing) {
      debug.log('mount', `${selector} unmounting existing component`);
      existing();
    }

    debug.log('mount', `${selector} mounting component`);

    // 마운트
    let userCleanup: void | (() => void);
    try {
      userCleanup = component($el, props);
    } catch (e) {
      console.error('[atom-effect-jquery] Mount error:', e);
      return;
    }

    // cleanup
    let isUnmounted = false;
    const fullCleanup = () => {
      if (isUnmounted) return;
      isUnmounted = true;

      debug.log('mount', `${selector} full cleanup`);
      
      if (typeof userCleanup === 'function') {
        try { userCleanup(); } catch {}
      }
      registry.cleanupTree(el);
      mountedComponents.delete(el);
    };

    mountedComponents.set(el, fullCleanup);
    registry.trackCleanup(el, fullCleanup);
  });
};

$.fn.atomUnmount = function(): JQuery {
  return this.each(function() {
    mountedComponents.get(this)?.();
  });
};
