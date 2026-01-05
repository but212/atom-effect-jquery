import $ from 'jquery';
import { effect } from '@but212/atom-effect';
import { registry } from './registry';
import { debug } from './debug';
import { getSelector } from './utils';
import type { ListOptions, ReadonlyAtom } from './types';

/**
 * atomList 구현
 * 
 * v1.0 제한사항:
 * - 단순 추가/삭제만 최적화
 * - 정렬/이동은 전체 재렌더링
 * - 고급 Diffing은 v2.0에서 지원 예정
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

      // 빈 상태
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

      // 아이템 처리
      let $prev: JQuery | null = null;

      for (let i = 0; i < items.length; i++) {
        const item = items[i]!;
        const k = getKey(item, i);
        newKeys.add(k);

        const existing = itemMap.get(k);

        if (existing) {
          // 위치 조정
          if ($prev) {
            $prev.after(existing.$el);
          } else {
            $container.prepend(existing.$el);
          }
          existing.item = item;
          $prev = existing.$el;
        } else {
          // 새로 생성
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

      // 제거
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
