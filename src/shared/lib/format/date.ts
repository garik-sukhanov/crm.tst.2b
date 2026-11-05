const dateTime = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});
const dateTimeWithYear = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const dateOnly = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const relative = new Intl.RelativeTimeFormat('ru-RU', { numeric: 'auto' });

const toDate = (value: string | Date) => (typeof value === 'string' ? new Date(value) : value);

/** «5 нояб., 14:20» — год показываем, только если он не текущий. */
export const formatDateTime = (value: string | Date, now: Date = new Date()): string => {
  const date = toDate(value);
  return (date.getFullYear() === now.getFullYear() ? dateTime : dateTimeWithYear)
    .format(date)
    .replace(' г.', '');
};

export const formatDate = (value: string | Date): string =>
  dateOnly.format(toDate(value)).replace(' г.', '');

/** «только что», «5 мин назад», «вчера», «3 дня назад», дальше — дата. */
export const formatRelative = (value: string | Date, now: Date = new Date()): string => {
  const date = toDate(value);
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return 'только что';
  if (abs < 3600) return relative.format(Math.round(seconds / 60), 'minute');
  if (abs < 86_400) return relative.format(Math.round(seconds / 3600), 'hour');
  if (abs < 7 * 86_400) return relative.format(Math.round(seconds / 86_400), 'day');
  return formatDateTime(date, now);
};

/** Длительность в часах → «3 ч», «2,5 дн». */
export const formatDuration = (hours: number): string => {
  if (!Number.isFinite(hours)) return '—';
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} мин`;
  if (hours < 48) return `${Math.round(hours)} ч`;
  return `${(hours / 24).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} дн`;
};
