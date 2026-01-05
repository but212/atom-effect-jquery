import $ from 'jquery';
import { effect } from '@but212/atom-effect';
import { registry } from './registry';
import { debug } from './debug';
import { getSelector } from './utils';
import type { ListOptions, ReadonlyAtom } from './types';

/**
 * Implementation of atomList
 * 
 * v1.0 Limitations:
 * - Optimized for simple additions/removals.
 * - Sorting/Moving re-inserts elements (preserving instances).
 * - Advanced keyed diffing planned for v2.0.
 * 
 * WARNING:
 * While basic node reuse is implemented, complex updates might cause focus loss depending on usage.
 * For complex interactive lists, considering using individual component bindings is recommended.
 */
$.fn.atomList = function<T>(
  source: ReadonlyAtom<T[]>,
  options: ListOptions<T>
): JQuery {
  return this.each(function() {
    const $container = $(this);
    const containerEl = this;
    const containerSelector = getSelector(containerEl);

    const { key, render, bind, onAdd, onRemove, empty } = options;

    const getKey = typeof key === 'function'
      ? key
      : (item: T) => (item as any)[key];

    const itemMap = new Map<string | number, { $el: JQuery; item: T }>();
    let $emptyEl: JQuery | null = null;

    const fx = effect(() => {
      const items = source.value;
      const newKeys = new Set<string | number>();

      debug.log('list', `${containerSelector} updating with ${items.length} items`);

      // Empty state
      if (items.length === 0 && empty) {
        if (!$emptyEl) {
          $emptyEl = $(empty);
          $container.append($emptyEl);
        }
        for (const [k, entry] of itemMap) {
          entry.$el.remove();
          registry.cleanup(entry.$el[0]!);
        }
        itemMap.clear();
        return;
      } else if ($emptyEl) {
        $emptyEl.remove();
        $emptyEl = null;
      }

      // Process items
      let $prev: JQuery | null = null;

      for (let i = 0; i < items.length; i++) {
        const item = items[i]!;
        const k = getKey(item, i);
        newKeys.add(k);

        const existing = itemMap.get(k);

        if (existing) {
          // Reposition
          if ($prev) {
            $prev.after(existing.$el);
          } else {
            $container.prepend(existing.$el);
          }
          existing.item = item;
          $prev = existing.$el;
        } else {
          // Create new
          const html = render(item, i);
          const $el = $(html);

          if ($prev) {
            $prev.after($el);
          } else {
            $container.prepend($el);
          }

          itemMap.set(k, { $el, item });

          if (bind) {
            bind($el, item, i);
          }

          if (onAdd) {
            onAdd($el);
          }

          debug.log('list', `${containerSelector} added item:`, k);

          $prev = $el;
        }
      }

      // Remove
      for (const [k, entry] of itemMap) {
        if (!newKeys.has(k)) {
          const doRemove = () => {
            entry.$el.remove();
            registry.cleanup(entry.$el[0]!);
            itemMap.delete(k);
            debug.log('list', `${containerSelector} removed item:`, k);
          };

          if (onRemove) {
            Promise.resolve(onRemove(entry.$el)).then(doRemove);
          } else {
            doRemove();
          }
        }
      }
    });

    registry.trackEffect(containerEl, fx);
    registry.trackCleanup(containerEl, () => {
      itemMap.clear();
      $emptyEl?.remove();
    });
  });
};
