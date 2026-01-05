import { describe, it, expect } from 'vitest';
import $ from 'jquery';
import '../src/index';

function tick() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

describe('List Rendering', () => {
  it('should render list', async () => {
    const items = $.atom([{ id: 1, text: 'A' }, { id: 2, text: 'B' }]);
    const $ul = $('<ul>').appendTo(document.body);
    
    $ul.atomList(items, {
        key: 'id',
        render: (item) => `<li id="item-${item.id}">${item.text}</li>`
    });

    await tick();
    expect($ul.children().length).toBe(2);
    expect($ul.find('#item-1').text()).toBe('A');
    expect($ul.find('#item-2').text()).toBe('B');

    // Add item
    items.value = [...items.value, { id: 3, text: 'C' }];
    await tick();
    expect($ul.children().length).toBe(3);
    
    // Remove item
    items.value = items.value.filter(i => i.id !== 2);
    await tick();
    expect($ul.children().length).toBe(2);
    expect($ul.find('#item-2').length).toBe(0);
    
    $ul.remove();
  });
});
