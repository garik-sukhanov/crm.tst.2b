import { useUnit } from 'effector-react';
import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react';
import { $resolvedTheme, $themeMode, type ThemeMode, themeModeChanged } from '@/shared/lib/theme';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

const OPTIONS: { value: ThemeMode; label: string; icon: typeof SunIcon }[] = [
  { value: 'light', label: 'Светлая', icon: SunIcon },
  { value: 'dark', label: 'Тёмная', icon: MoonIcon },
  { value: 'system', label: 'Как в системе', icon: MonitorIcon },
];

const isThemeMode = (value: string): value is ThemeMode =>
  OPTIONS.some((option) => option.value === value);

export const ThemeSwitch = () => {
  const [mode, resolved, setMode] = useUnit([$themeMode, $resolvedTheme, themeModeChanged]);
  const TriggerIcon = resolved === 'dark' ? MoonIcon : SunIcon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Тема оформления" className="size-10">
          <TriggerIcon className="size-[18px]" strokeWidth={1.75} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Тема</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={mode}
          onValueChange={(value) => isThemeMode(value) && setMode(value)}
        >
          {OPTIONS.map(({ value, label, icon: Icon }) => (
            <DropdownMenuRadioItem key={value} value={value} className="min-h-10">
              <Icon className="size-4 text-muted-foreground" strokeWidth={1.75} />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
