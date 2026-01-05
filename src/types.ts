import type {
  WritableAtom,
  ReadonlyAtom,
  ComputedAtom,
  EffectObject,
  AtomOptions as BaseAtomOptions,
  ComputedOptions
} from '@but212/atom-effect';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Atom 옵션 확장
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface AtomOptions extends BaseAtomOptions {
  name?: string;  // 디버깅용 이름
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 반응형 값
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type ReactiveValue<T> = T | ReadonlyAtom<T> | ComputedAtom<T>;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 바인딩 옵션
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface BindingOptions {
  text?: ReactiveValue<any>;
  html?: ReactiveValue<string>;
  class?: Record<string, ReactiveValue<boolean>>;
  css?: Record<string, ReactiveValue<string | number> | [ReactiveValue<number>, string]>;
  attr?: Record<string, ReactiveValue<string | boolean | null>>;
  prop?: Record<string, ReactiveValue<any>>;
  show?: ReactiveValue<boolean>;
  hide?: ReactiveValue<boolean>;
  val?: WritableAtom<any>;
  checked?: WritableAtom<boolean>;
  on?: Record<string, (e: JQuery.Event) => void>;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 리스트 옵션
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ListOptions<T> {
  key: keyof T | ((item: T, index: number) => string | number);
  render: (item: T, index: number) => string;
  bind?: ($el: JQuery, item: T, index: number) => void;
  onAdd?: ($el: JQuery) => void;
  onRemove?: ($el: JQuery) => Promise<void> | void;
  empty?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Val 옵션
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ValOptions {
  debounce?: number;
  event?: string;
  parse?: (v: string) => any;
  format?: (v: any) => string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 컴포넌트
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type ComponentFn<P = {}> = ($el: JQuery, props: P) => void | (() => void);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// jQuery 타입 확장
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

declare global {
  interface JQueryStatic {
    atom: {
      <T>(initialValue: T, options?: AtomOptions): WritableAtom<T>;
      debug: boolean;
    };
    computed<T>(fn: () => T, options?: ComputedOptions<T>): ComputedAtom<T>;
    effect(fn: () => void | (() => void)): EffectObject;
    batch(fn: () => void): void;
    untracked<T>(fn: () => T): T;
    isAtom(v: unknown): boolean;
    isComputed(v: unknown): boolean;
    isReactive(v: unknown): boolean;
  }

  interface JQuery {
    // 체이닝
    atomText(source: ReactiveValue<any>, formatter?: (v: any) => string): this;
    atomHtml(source: ReactiveValue<string>): this;
    atomClass(className: string, condition: ReactiveValue<boolean>): this;
    atomCss(prop: string, source: ReactiveValue<string | number>, unit?: string): this;
    atomAttr(name: string, source: ReactiveValue<string | boolean | null>): this;
    atomProp(name: string, source: ReactiveValue<any>): this;
    atomShow(condition: ReactiveValue<boolean>): this;
    atomHide(condition: ReactiveValue<boolean>): this;
    atomVal(atom: WritableAtom<any>, options?: ValOptions): this;
    atomChecked(atom: WritableAtom<boolean>): this;
    atomOn(event: string, handler: (e: JQuery.Event) => void): this;

    // 통합
    atomBind(options: BindingOptions): this;

    // 리스트
    atomList<T>(source: ReadonlyAtom<T[]>, options: ListOptions<T>): this;

    // 컴포넌트
    atomMount<P>(component: ComponentFn<P>, props?: P): this;
    atomUnmount(): this;

    // 정리
    atomUnbind(): this;
  }
}

export type {
  WritableAtom,
  ReadonlyAtom,
  ComputedAtom,
  EffectObject,
  ComputedOptions
};
