import type { ReactiveValue, ReadonlyAtom, ComputedAtom } from './types';

/**
 * 값이 반응형(atom/computed)인지 확인
 */
export function isReactive(value: unknown): value is ReadonlyAtom<any> | ComputedAtom<any> {
  return (
    value !== null &&
    typeof value === 'object' &&
    'value' in value &&
    'subscribe' in value
  );
}

/**
 * ReactiveValue에서 실제 값 추출
 */
export function getValue<T>(source: ReactiveValue<T>): T {
  if (isReactive(source)) {
    return (source as any).value;
  }
  return source as T;
}

/**
 * 요소의 셀렉터 문자열 생성 (디버깅용)
 */
export function getSelector(el: Element): string {
  if (el.id) return `#${el.id}`;
  if (el.className) {
    const classes = String(el.className).split(' ').filter(Boolean).join('.');
    return `${el.tagName.toLowerCase()}.${classes}`;
  }
  return el.tagName.toLowerCase();
}
