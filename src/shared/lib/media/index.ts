import { useSyncExternalStore } from 'react';

/** Совпадает ли медиазапрос. Нужен там, где на телефоне и десктопе разная разметка, а не только стили. */
export const useMediaQuery = (query: string): boolean =>
  useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );

/** md в Tailwind — 768px. От этой ширины показываем доску колонками. */
export const useIsBoardLayout = () => useMediaQuery('(min-width: 768px)');
