# atom-effect-jquery

**Reactive jQuery bindings powered by [atom-effect](https://github.com/but212/atom-effect).**

`atom-effect-jquery` brings modern, fine-grained reactivity to jQuery applications. It allows you to bind DOM elements directly to atoms, ensuring efficient updates without manual DOM manipulation. It also features automatic cleanup of effects when elements are removed from the DOM, resolving one of the biggest pain points in jQuery development (memory leaks).

## Features

- **Fine-grained Reactivity:** Powered by `@but212/atom-effect`.
- **Two-way Data Binding:** Seamless synchronization for inputs (`val`, `checked`).
- **Auto-Cleanup:** Effects are automatically disposed when elements are removed from the DOM (via MutionObserver).
- **Optimized List Rendering:** `atomList` for efficient array rendering.
- **Debug Mode:** Visual highlighting of DOM updates to trace reactivity.
- **jQuery Integration:** Batching support for standard jQuery events.

## Installation

### NPM

```bash
npm install atom-effect-jquery jquery @but212/atom-effect
# or
pnpm add atom-effect-jquery jquery @but212/atom-effect
```

### CDN

```html
<!-- Load jQuery -->
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<!-- Load atom-effect-jquery -->
<script src="https://cdn.jsdelivr.net/npm/atom-effect-jquery"></script>
```

## Basic Usage

```javascript
// If using NPM:
// import $ from 'jquery';
// import 'atom-effect-jquery';

// 1. Create State
const count = $.atom(0);
const doubled = $.computed(() => count.value * 2);

// 2. Bind to DOM
$('#count').atomText(count);
$('#doubled').atomText(doubled);

// 3. Update State (DOM updates automatically)
$('#increment').on('click', () => count.value++);
$('#decrement').on('click', () => count.value--);

// 4. React to changes (Side Effects)
$.effect(() => {
  console.log(`Current count: ${count.value}, Doubled: ${doubled.value}`);
});
```

## API Reference

### Static Methods

The library extends the main jQuery function `$`:

- `$.atom(initialValue)`: Creates a writable atom.
- `$.computed(() => ...)`: Creates a derived computed atom.
- `$.effect(() => ...)`: Runs a side effect.
- `$.batch(() => ...)`: Batches multiple updates into a single render.
- `$.nextTick()`: Returns a Promise that resolves after the next update cycle.

### DOM Binding Methods

All methods are chainable and return the jQuery object.

#### Text & Content

- **`.atomText(atom, formatter?)`**
  Updates `textContent`. Optional formatter function.
- **`.atomHtml(atom)`**
  Updates `innerHTML`. (⚠️ Use with caution regarding XSS).

#### Attributes & Styles

- **`.atomClass(className, booleanAtom)`**
  Toggles a class based on the atom's truthy value.
- **`.atomCss(property, atom, unit?)`**
  Updates a CSS property. Optional unit (e.g., 'px') can be appended.
- **`.atomAttr(attribute, atom)`**
  Updates an HTML attribute.
- **`.atomProp(property, atom)`**
  Updates a DOM property (e.g., `disabled`, `readOnly`).
- **`.atomShow(booleanAtom)`** / **`.atomHide(booleanAtom)`**
  Toggles visibility using jQuery's `.toggle()`.

#### Two-Way Binding

- **`.atomVal(atom, options?)`**
  Two-way binding for input elements.
  - `options.debounce`: Debounce input updates (ms).
  - `options.format`: Format value before ensuring it in DOM.
  - *Note:* Automatically handles IME types (e.g., for Korean/Chinese).
- **`.atomChecked(booleanAtom)`**
  Two-way binding for checkboxes and radios.

#### Events

- **`.atomOn(event, handler)`**
  Adds an event listener where the handler is automatically wrapped in `$.batch()`.

### Unified Binding (`.atomBind`)

For cleaner code when setting multiple bindings at once.

```typescript
$('div').atomBind({
  text: nameAtom,
  class: { 'active': isActiveAtom },
  css: { 'color': colorAtom },
  on: { click: () => console.log('clicked') }
});
```

### List Rendering (`.atomList`)

Efficiently renders a list of atoms.

```typescript
const items = $.atom(['Apple', 'Banana']);

$('ul').atomList(items, {
  // Unique key for efficient diffing (required)
  key: (item) => item, 
  
  // Render function returning an HTML string or Element
  render: (item) => `<li>${item}</li>`,
  
  // Optional: Bind events/atoms to the created element
  bind: ($el, item) => {
    $el.on('click', () => alert(item));
  }
});
```

### Component Mounting (`.atomMount`)

Mounts a functional component that manages its own lifecycle.

```typescript
const Counter = ($el, props) => {
  const count = $.atom(props.initial || 0);
  
  $el.append('<span>0</span>');
  $el.find('span').atomText(count);
  
  // Return cleanup function (optional)
  return () => console.log('Unmounted');
};

$('#app').atomMount(Counter, { initial: 10 });
```

## Advanced Features

### Automatic Cleanup

When an element bound with `atom-effect-jquery` is removed from the DOM (e.g., via `.remove()` or `.empty()`), the library automatically detects this via `MutationObserver` and cleans up all associated subscribers and effects. You don't need to manually dispose of your bindings.

### jQuery Event Batching

To ensure optimal performance, you can enable global patching of jQuery's event handlers. This wraps every jQuery event handler in a `batch()`, so multiple state updates within a single event only trigger one DOM update.

```typescript
import { enablejQueryBatching } from 'atom-effect-jquery';

enablejQueryBatching(); // Call this once at startup
```

### Debug Mode

Enable debug mode to see console logs for every DOM update and visually highlight updated elements in the browser.

```typescript
$.atom.debug = true;
```

## License

MIT
