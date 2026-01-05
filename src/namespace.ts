import $ from 'jquery';
import {
  atom as createAtom,
  computed,
  effect,
  batch,
  untracked,
  isAtom,
  isComputed
} from '@but212/atom-effect';
import { debug } from './debug';
import type { AtomOptions, WritableAtom } from './types';

/**
 * atom 메타데이터 저장 (디버깅용)
 */
const atomMetadata = new WeakMap<WritableAtom<any>, { name?: string }>();

/**
 * $.atom 함수
 */
function atom<T>(initialValue: T, options: AtomOptions = {}): WritableAtom<T> {
  const instance = createAtom(initialValue, options);
  
  // 메타데이터 저장
  if (options.name) {
    atomMetadata.set(instance, { name: options.name });
  }

  // 디버그 모드: 값 변경 감지
  // Note: Wrapper logic removed due to interference with atom-effect internals (computed reactivity)
  // Revisit if safer interception method is found.
  /*
  if (debug.enabled || options.name) {
    // ... removed ...
  }
  */

  return instance;
}

// debug 속성 추가
// @ts-ignore: Adding property to function
atom.debug = false;
Object.defineProperty(atom, 'debug', {
  get() {
    return debug.enabled;
  },
  set(value: boolean) {
    debug.enabled = value;
  }
});

/**
 * jQuery 정적 메서드 확장
 */
$.extend({
  atom,
  computed,
  effect,
  batch,
  untracked,
  isAtom,
  isComputed,
  isReactive: (v: unknown) => isAtom(v) || isComputed(v)
});
