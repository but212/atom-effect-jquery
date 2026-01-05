import { describe, it, expect } from 'vitest';
import $ from 'jquery';
import '../src/index';

function tick() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

describe('Integration', () => {
    it('should handle complex updates', async () => {
        // Counter app simulation
        const count = $.atom(0);
        const $app = $('<div id="app">').appendTo(document.body);
        
        $app.append('<span id="count"></span>');
        $app.append('<button id="inc"></button>');
        
        const $count = $app.find('#count');
        const $inc = $app.find('#inc');
        
        $count.atomText(count);
        $inc.atomOn('click', () => count.value++);
        
        await tick();
        expect($count.text()).toBe('0');
        
        $inc.click();
        await tick();
        expect($count.text()).toBe('1');
        
        $app.remove();
    });
});
