import $ from 'jquery';
import { batch } from '@but212/atom-effect';

/**
 * WeakMap to store strict association between original handlers and batched wrappers.
 * This ensures that .off() works correctly when passing the original handler.
 */
const handlerMap = new WeakMap<Function, Function>();

let isjQueryBatchingEnabled = false;

/**
 * Patches jQuery event methods to automatically wrap handlers in a batch().
 * This ensures that state changes inside standard jQuery event handlers
 * trigger updates efficiently.
 */
export function enablejQueryBatching() {
  if (isjQueryBatchingEnabled) return;
  isjQueryBatchingEnabled = true;
  const originalOn = $.fn.on;
  const originalOff = $.fn.off;

  // Patch .on()
  // biome-ignore lint/suspicious/noExplicitAny: jQuery method patching requires dynamic arguments
  $.fn.on = function (this: any, ...args: any[]) {
    // 1. Find the handler function in arguments
    // jQuery .on() signatures are flexible, but the handler is always 
    // the last argument that is a function.
    let fnIndex = -1;
    for (let i = args.length - 1; i >= 0; i--) {
      if (typeof args[i] === 'function') {
        fnIndex = i;
        break;
      }
    }

    if (fnIndex !== -1) {
      const originalFn = args[fnIndex];
      
      // 2. reuse or create wrapper
      let wrappedFn: Function | undefined;
      if (handlerMap.has(originalFn)) {
        wrappedFn = handlerMap.get(originalFn);
      } else {
        // biome-ignore lint/suspicious/noExplicitAny: preserving internal this context
        wrappedFn = function (this: any, ...eventArgs: any[]) {
          // biome-ignore lint/suspicious/noExplicitAny: capture any return value
          let result: any;
          batch(() => {
            result = originalFn.apply(this, eventArgs);
          });
          return result;
        };
        handlerMap.set(originalFn, wrappedFn);
      }

      // 3. Replace argument
      args[fnIndex] = wrappedFn;
    }

    // 4. Call original
    // biome-ignore lint/suspicious/noExplicitAny: dynamic arguments binding
    return originalOn.apply(this, args as any);
  };

  // Patch .off()
  // biome-ignore lint/suspicious/noExplicitAny: jQuery method patching requires dynamic arguments
  $.fn.off = function (this: any, ...args: any[]) {
    // 1. Find the handler
    let fnIndex = -1;
    for (let i = args.length - 1; i >= 0; i--) {
      // Note: In .off(), sometimes the function is not the last valid arg,
      // but usually provided clearly.
      if (typeof args[i] === 'function') {
        fnIndex = i;
        break;
      }
    }

    if (fnIndex !== -1) {
      const originalFn = args[fnIndex];
      // 2. If we have a wrapper for this, pass the wrapper to .off()
      // because that's what jQuery has stored.
      if (handlerMap.has(originalFn)) {
        args[fnIndex] = handlerMap.get(originalFn);
      }
    }

    // biome-ignore lint/suspicious/noExplicitAny: dynamic arguments binding
    return originalOff.apply(this, args as any);
  };
}
