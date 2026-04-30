import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn', () => {
  it('merges plain class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('drops falsy values', () => {
    expect(cn('a', false && 'b', null, undefined, 'c')).toBe('a c');
  });

  it('lets later tailwind classes override earlier conflicting ones', () => {
    // twMerge should keep only the last conflicting utility
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});
