/**
 * atom-effect-jquery
 * 
 * jQuery에 반응성을 더하다
 * 
 * 특징:
 * - IME(한글/중국어/일본어) 입력 완벽 지원
 * - MutationObserver 기반 자동 cleanup (메모리 누수 방지)
 * - Debug 모드: 콘솔 로깅 + 시각적 하이라이트
 */

import $ from 'jquery';

// 플러그인 등록
import './namespace';
import './chainable';
import './unified';
import './list';
import './mount';

// 자동 cleanup (핵심!)
import { enableAutoCleanup, disableAutoCleanup, registry } from './registry';

// DOM Ready 시 자동 활성화
$(() => enableAutoCleanup(document.body));

// 명시적 import 지원
export {
  atom,
  computed,
  effect,
  batch,
  untracked
} from '@but212/atom-effect';

// 타입 export
export type {
  WritableAtom,
  ReadonlyAtom,
  ComputedAtom,
  BindingOptions,
  ListOptions,
  ComponentFn
} from './types';

export { registry, enableAutoCleanup, disableAutoCleanup };
export default $;
