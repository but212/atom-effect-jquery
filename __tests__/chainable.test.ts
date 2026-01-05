import { describe, it, expect } from 'vitest';
import $ from 'jquery';
import '../src/index';

function tick() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

describe('Chainable Methods', () => {
  it('atomText should bind text', async () => {
    const text = $.atom('initial');
    const $el = $('<div>').appendTo(document.body);
    $el.atomText(text);

    await tick();
    expect($el.text()).toBe('initial');

    text.value = 'updated';
    await tick();
    expect($el.text()).toBe('updated');
    $el.remove();
  });

  it('atomClass should bind class', async () => {
    const isActive = $.atom(false);
    const $el = $('<div>').appendTo(document.body);
    $el.atomClass('active', isActive);

    await tick();
    expect($el.hasClass('active')).toBe(false);

    isActive.value = true;
    await tick();
    expect($el.hasClass('active')).toBe(true);
    $el.remove();
  });

  it('atomAttr should bind attributes', async () => {
    const src = $.atom('img.jpg');
    const $el = $('<img>').appendTo(document.body);
    $el.atomAttr('src', src);

    await tick();
    expect($el.attr('src')).toBe('img.jpg');

    src.value = 'new.jpg';
    await tick();
    expect($el.attr('src')).toBe('new.jpg');
    $el.remove();
  });
});
