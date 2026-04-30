import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { log } from '@/lib/log';

describe('log helper (dev mode)', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('log.info forwards to console.log in dev', () => {
    log.info('hello', { foo: 'bar' });
    expect(logSpy).toHaveBeenCalledWith('[info] hello', { foo: 'bar' });
  });

  it('log.warn forwards to console.warn in dev', () => {
    log.warn('uh oh');
    expect(warnSpy).toHaveBeenCalledWith('[warn] uh oh');
  });

  it('log.error forwards to console.error in dev', () => {
    const err = new Error('boom');
    log.error('something failed', err);
    expect(errorSpy).toHaveBeenCalledWith('[error] something failed', err);
  });

  it('log.info accepts variadic extras', () => {
    log.info('msg', 'a', 1, true);
    expect(logSpy).toHaveBeenCalledWith('[info] msg', 'a', 1, true);
  });
});
