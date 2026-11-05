import { describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/api', () => ({ supabase: {}, unwrap: vi.fn() }));
const { mergeFeed } = await import('./feed');

const actor = { id: 'u', fullName: 'U' };

describe('mergeFeed', () => {
  it('сливает историю и комментарии по времени', () => {
    const merged = mergeFeed(
      [
        {
          kind: 'status',
          id: 's1',
          at: '2026-01-01T10:00:00Z',
          actor,
          from: null,
          to: 'new',
          comment: null,
        },
        {
          kind: 'status',
          id: 's2',
          at: '2026-01-03T10:00:00Z',
          actor,
          from: 'new',
          to: 'in_progress',
          comment: null,
        },
      ],
      [{ kind: 'comment', id: 'c1', at: '2026-01-02T10:00:00Z', actor, body: 'привет' }],
    );
    expect(merged.map((i) => i.id)).toEqual(['s1', 'c1', 's2']);
  });
});
