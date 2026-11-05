/** Понятное сообщение для ошибок базы и сети. Коды CRM0x задаёт миграция security. */
const MESSAGES: Record<string, string> = {
  CRM01: 'Такой переход статуса запрещён',
  CRM02: 'Это действие выполняет другая роль',
  CRM03: 'Нужен комментарий',
  CRM04: 'Задача не найдена или недоступна',
  CRM05: 'Исполнителем можно назначить только исполнителя',
  CRM06: 'Статус меняется только кнопками действий',
  CRM07: 'Запись нельзя изменить',
  '42501': 'Недостаточно прав',
  '23503': 'Связанная запись не найдена',
  '23514': 'Проверьте заполнение полей',
  PGRST116: 'Запись не найдена',
};

type ErrorLike = { code?: unknown; message?: unknown };

export class ApiError extends Error {
  readonly code: string | null;

  constructor(message: string, code: string | null = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

export const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) return error;
  const { code, message } = (error ?? {}) as ErrorLike;
  const codeStr = typeof code === 'string' && code ? code : null;
  if (codeStr && MESSAGES[codeStr]) return new ApiError(MESSAGES[codeStr], codeStr);
  if (typeof message === 'string' && /fetch|network/i.test(message)) {
    return new ApiError('Нет связи с сервером. Проверьте интернет.', codeStr);
  }
  return new ApiError('Что-то пошло не так. Попробуйте ещё раз.', codeStr);
};

/** Развернуть ответ supabase-js: вернуть data или бросить ApiError. */
export const unwrap = <T>(result: { data: T; error: unknown }): T => {
  if (result.error) throw toApiError(result.error);
  return result.data;
};
