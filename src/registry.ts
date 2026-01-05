import type { EffectObject } from './types';
import { debug } from './debug';
import { getSelector } from './utils';

/**
 * 바인딩 레지스트리
 * 
 * 순환 참조 문제 해결:
 * - Atom -> Subscription -> Callback -> DOM Element 순환 참조 방지
 * - WeakMap으로 DOM 요소별 구독 해제 함수 추적
 * - MutationObserver로 DOM 제거 시 자동 unsubscribe
 * 
 * 메모리 누수 방지:
 * - DOM 제거 시 반드시 unsubscribe() 호출
 * - 자식 노드도 재귀적으로 정리
 */
class BindingRegistry {
  // DOM 요소 -> Effect 배열 (구독 해제용)
  private effects = new WeakMap<Element, EffectObject[]>();
  
  // DOM 요소 -> 커스텀 cleanup 함수 배열
  private cleanups = new WeakMap<Element, Array<() => void>>();
  
  // 바인딩된 요소 추적 (성능 최적화)
  private boundElements = new WeakSet<Element>();

  /**
   * Effect 등록 (나중에 dispose 호출용)
   */
  trackEffect(el: Element, fx: EffectObject): void {
    const list = this.effects.get(el) || [];
    list.push(fx);
    this.effects.set(el, list);
    this.boundElements.add(el);
  }

  /**
   * 커스텀 cleanup 함수 등록 (이벤트 해제 등)
   */
  trackCleanup(el: Element, fn: () => void): void {
    const list = this.cleanups.get(el) || [];
    list.push(fn);
    this.cleanups.set(el, list);
    this.boundElements.add(el);
  }

  /**
   * 바인딩 여부 확인 (성능 최적화)
   */
  hasBind(el: Element): boolean {
    return this.boundElements.has(el);
  }

  /**
   * 단일 요소 정리
   * - 모든 Effect dispose (Atom과의 연결 끊기)
   * - 모든 커스텀 cleanup 실행
   */
  cleanup(el: Element): void {
    if (!this.boundElements.has(el)) return;

    debug.cleanup(getSelector(el));

    // 1. Effects dispose - Atom 구독 해제 (순환 참조 끊기!)
    const effects = this.effects.get(el);
    if (effects) {
      this.effects.delete(el); // 재진입 방지를 위해 먼저 삭제
      effects.forEach(fx => {
        try { 
          fx.dispose();  // 이게 핵심! Atom과의 연결 끊기
        } catch (e) {
          debug.warn('Effect dispose error:', e);
        }
      });
    }

    // 2. 커스텀 cleanups 실행 (이벤트 해제 등)
    const cleanups = this.cleanups.get(el);
    if (cleanups) {
      this.cleanups.delete(el); // 재진입 방지를 위해 먼저 삭제
      cleanups.forEach(fn => {
        try { fn(); } catch (e) {
          debug.warn('Cleanup error:', e);
        }
      });
    }

    this.boundElements.delete(el);
  }

  /**
   * 요소와 모든 자식 정리 (재귀)
   * - 깊은 삭제 시 필수 (empty(), remove() 등)
   */
  cleanupTree(el: Element): void {
    // 자식 먼저 (깊이 우선)
    const children = el.querySelectorAll('*');
    children.forEach(child => {
      if (this.boundElements.has(child)) {
        this.cleanup(child);
      }
    });
    
    // 그 다음 자신
    this.cleanup(el);
  }
}

export const registry = new BindingRegistry();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MutationObserver 자동 cleanup
// 
// jQuery의 .remove()나 .empty()는 외부 라이브러리(Atom)의
// 구독까지는 정리하지 못함. MutationObserver가 필수!
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let observer: MutationObserver | null = null;

export function enableAutoCleanup(root: Element = document.body): void {
  if (observer) return;

  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.removedNodes.forEach(node => {
        if (node instanceof Element) {
          // 제거된 노드와 모든 자식 정리
          registry.cleanupTree(node);
        }
      });
    }
  });

  observer.observe(root, { childList: true, subtree: true });
}

export function disableAutoCleanup(): void {
  observer?.disconnect();
  observer = null;
}
