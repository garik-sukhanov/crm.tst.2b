import { combine, createEffect, createEvent, createStore, sample } from 'effector';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';
const THEME_COLOR: Record<ResolvedTheme, string> = { light: '#fafafa', dark: '#141415' };

const readStoredMode = (): ThemeMode => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
};

const media = window.matchMedia(DARK_QUERY);

export const themeModeChanged = createEvent<ThemeMode>();
const systemSchemeChanged = createEvent<boolean>();

export const $themeMode = createStore<ThemeMode>(readStoredMode()).on(
  themeModeChanged,
  (_, mode) => mode,
);
const $systemDark = createStore(media.matches).on(systemSchemeChanged, (_, dark) => dark);

export const $resolvedTheme = combine(
  $themeMode,
  $systemDark,
  (mode, systemDark): ResolvedTheme => (mode === 'system' ? (systemDark ? 'dark' : 'light') : mode),
);

const persistModeFx = createEffect((mode: ThemeMode) => {
  try {
    if (mode === 'system') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // приватный режим браузера — выбор просто не запомнится
  }
});

const applyThemeFx = createEffect((theme: ResolvedTheme) => {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
});

sample({ clock: themeModeChanged, target: persistModeFx });
sample({ clock: $resolvedTheme, target: applyThemeFx });

media.addEventListener('change', (event) => systemSchemeChanged(event.matches));
applyThemeFx($resolvedTheme.getState());
