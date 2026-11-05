import { describe, expect, it } from 'vitest';
import { formatDuration, formatRelative } from './date';
import { plural, pluralCount } from './plural';

describe('plural', () => {
  it.each([
    [1, 'задача'],
    [2, 'задачи'],
    [5, 'задач'],
    [11, 'задач'],
    [21, 'задача'],
    [24, 'задачи'],
  ])('%i → %s', (n, form) => {
    expect(plural(n, ['задача', 'задачи', 'задач'])).toBe(form);
  });

  it('pluralCount', () => {
    expect(pluralCount(3, ['объект', 'объекта', 'объектов'])).toBe('3 объекта');
  });
});

describe('formatRelative', () => {
  const now = new Date('2026-11-05T12:00:00Z');
  it('только что', () => {
    expect(formatRelative('2026-11-05T11:59:30Z', now)).toBe('только что');
  });
  it('минуты и часы', () => {
    expect(formatRelative('2026-11-05T11:55:00Z', now)).toBe('5 минут назад');
    expect(formatRelative('2026-11-05T09:00:00Z', now)).toBe('3 часа назад');
  });
  it('дни', () => {
    expect(formatRelative('2026-11-04T12:00:00Z', now)).toBe('вчера');
  });
});

describe('formatDuration', () => {
  it.each([
    [0.25, '15 мин'],
    [5, '5 ч'],
    [72, '3 дн'],
    [Number.NaN, '—'],
  ])('%f ч → %s', (hours, text) => {
    expect(formatDuration(hours)).toBe(text);
  });
});
