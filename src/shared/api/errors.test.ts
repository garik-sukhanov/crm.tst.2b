import { describe, expect, it } from 'vitest';
import { ApiError, toApiError, unwrap } from './errors';

describe('toApiError', () => {
  it('переводит коды бизнес-правил базы', () => {
    expect(toApiError({ code: 'CRM03', message: 'raw' })).toMatchObject({
      code: 'CRM03',
      message: 'Нужен комментарий',
    });
  });

  it('распознаёт отказ в правах', () => {
    expect(toApiError({ code: '42501' }).message).toBe('Недостаточно прав');
  });

  it('распознаёт сетевую ошибку', () => {
    expect(toApiError(new TypeError('Failed to fetch')).message).toMatch(/Нет связи/);
  });

  it('не показывает пользователю сырой текст неизвестной ошибки', () => {
    const error = toApiError({ code: 'XX000', message: 'internal details' });
    expect(error.message).not.toContain('internal');
    expect(error.code).toBe('XX000');
  });

  it('не оборачивает ApiError повторно', () => {
    const original = new ApiError('x', 'CRM01');
    expect(toApiError(original)).toBe(original);
  });
});

describe('unwrap', () => {
  it('возвращает данные', () => {
    expect(unwrap({ data: [1], error: null })).toEqual([1]);
  });

  it('бросает ApiError', () => {
    expect(() => unwrap({ data: null, error: { code: 'CRM01' } })).toThrow(ApiError);
  });
});
