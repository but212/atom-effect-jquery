# Changelog

## [0.1.1] - 2026-01-15

### Added

- **Example**: Add basic example page.

### Changed

- **Debug Utility**: Resolved race conditions and style pollution in `highlightElement`.
  - Implemented timer cleanup to prevent overlapping highlight effects.
  - Enhanced original style preservation using data attributes to ensure styles aren't overwritten by highlight colors.
  - Added smooth CSS transitions for recovery and automated cleanup of temporary metadata.

## [0.1.0] - 2026-01-15

### Added - 0.1.0

- **Core Integration**: Initial release of `atom-effect-jquery`, providing reactive bindings for jQuery using `@but212/atom-effect`.
- **Static Methods**: Extends jQuery with core reactive primitives:
  - `$.atom(initialValue)`: Create writable atoms.
  - `$.computed(fn)`: Create derived computed atoms.
  - `$.effect(fn)`: Create side effects.
  - `$.batch(fn)`: Batch multiple updates.
  - `$.nextTick()`: Promise that resolves after the next update cycle.
- **DOM Binding Methods**: Chainable jQuery methods for reactive DOM updates:
  - `.atomText(atom)`: Bind text content.
  - `.atomHtml(atom)`: Bind HTML content.
  - `.atomClass(className, atom)`: Reactive class toggling.
  - `.atomCss(property, atom)`: Reactive CSS property updates.
  - `.atomAttr(attribute, atom)`: Reactive attribute updates.
  - `.atomProp(property, atom)`: Reactive property updates.
  - `.atomShow(atom)` / `.atomHide(atom)`: Reactive visibility toggling.
- **Two-Way Binding**:
  - `.atomVal(atom, options)`: Two-way binding for form inputs with debounce and formatting support.
  - `.atomChecked(atom)`: Two-way binding for checkboxes and radio buttons.
- **Unified Binding**: `.atomBind(bindings)` method to set multiple bindings (text, class, css, events) in a single call.
- **List Rendering**: `.atomList(atom, config)` for efficient array rendering with keyed diffing.
- **Component System**: `.atomMount(Component, props)` to mount functional components with lifecycle management.
- **Event Handling**: `.atomOn(event, handler)` for batched event listeners.
- **Automatic Cleanup**: Integrated `MutationObserver` to automatically dispose of effects when elements are removed from the DOM.
- **Debug Mode**: `$.atom.debug = true` to enable console logging and visual highlighting of updates.
- **Performance**: Optional global jQuery event batching via `enablejQueryBatching()`.
