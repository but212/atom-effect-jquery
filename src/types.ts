import type {
  WritableAtom,
  ReadonlyAtom,
  ComputedAtom,
  EffectObject,
  AtomOptions as BaseAtomOptions,
  ComputedOptions
} from '@but212/atom-effect';

/**
 * Extended options for Atom creation.
 */
export interface AtomOptions extends BaseAtomOptions {
  /** Name for debugging purposes */
  name?: string;
}

/**
 * Represents a value that can be either dynamic (Atom/Computed) or static.
 */
export type ReactiveValue<T> = T | ReadonlyAtom<T> | ComputedAtom<T>;

/**
 * Configuration options for `atomBind`.
 */
export interface BindingOptions<T> {
  text?: ReactiveValue<T>;
  html?: ReactiveValue<string>;
  class?: Record<string, ReactiveValue<boolean>>;
  css?: Record<string, ReactiveValue<string | number> | [ReactiveValue<number>, string]>;
  attr?: Record<string, ReactiveValue<string | boolean | null>>;
  prop?: Record<string, ReactiveValue<T>>;
  show?: ReactiveValue<boolean>;
  hide?: ReactiveValue<boolean>;
  val?: WritableAtom<T>;
  checked?: WritableAtom<boolean>;
  on?: Record<string, (e: JQuery.Event) => void>;
}

/**
 * Configuration options for `atomList`.
 */
export interface ListOptions<T> {
  key: keyof T | ((item: T, index: number) => string | number);
  render: (item: T, index: number) => string | Element;
  bind?: ($el: JQuery, item: T, index: number) => void;
  update?: ($el: JQuery, item: T, index: number) => void;
  onAdd?: ($el: JQuery) => void;
  onRemove?: ($el: JQuery) => Promise<void> | void;
  empty?: string;
}

/**
 * Configuration options for `atomVal`.
 */
export interface ValOptions<T> {
  debounce?: number;
  event?: string;
  parse?: (v: string) => T;
  format?: (v: T) => string;
}

/**
 * Functional Component type.
 */
export type ComponentFn<P = {}> = ($el: JQuery, props: P) => void | (() => void);

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
    nextTick(): Promise<void>;
  }

  interface JQuery {
    // Chainable methods
    atomText<T>(source: ReactiveValue<T>, formatter?: (v: T) => string): this;
    atomHtml(source: ReactiveValue<string>): this;
    atomClass(className: string, condition: ReactiveValue<boolean>): this;
    atomCss(prop: string, source: ReactiveValue<string | number>, unit?: string): this;
    atomAttr(name: string, source: ReactiveValue<string | boolean | null>): this;
    atomProp<T extends string | number | boolean | null | undefined>(name: string, source: ReactiveValue<T>): this;
    atomShow(condition: ReactiveValue<boolean>): this;
    atomHide(condition: ReactiveValue<boolean>): this;
    atomVal<T>(atom: WritableAtom<T>, options?: ValOptions<T>): this;
    atomChecked(atom: WritableAtom<boolean>): this;
    atomOn(event: string, handler: (e: JQuery.Event) => void): this;

    // Integrated binding
    atomBind<T extends string | number | boolean | null | undefined>(options: BindingOptions<T>): this;

    // List rendering
    atomList<T>(source: ReadonlyAtom<T[]>, options: ListOptions<T>): this;

    // Component mounting
    atomMount<P>(component: ComponentFn<P>, props?: P): this;
    atomUnmount(): this;

    // Cleanup
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
