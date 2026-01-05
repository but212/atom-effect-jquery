import { describe, it, expect } from 'vitest';
import { atom, computed } from '../src/index';

describe('Core Reactivity Sanity Check', () => {
  it('should be reactive', async () => {
    const a = atom(1);
    console.log('a created', a.value);
    
    const b = computed(() => {
        console.log('computing b, a is', a.value);
        return a.value * 2;
    });
    console.log('b created', b.value);
    
    // Use effect instead of manual subscribe
    let observedB = 0;
    const { effect } = await import('../src/index');
    effect(() => {
        observedB = b.value;
        console.log('effect run, b is', b.value);
    });
    
    expect(observedB).toBe(2);
    
    console.log('changing a to 2');
    a.value = 2;
    console.log('a is now', a.value);
    
    // Check if b updated
    console.log('b value access:', b.value);
    expect(b.value).toBe(4);
    expect(observedB).toBe(4);
  });
});
