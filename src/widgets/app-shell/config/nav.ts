import { BarChart3Icon, Building2Icon, ListChecksIcon, type LucideIcon } from 'lucide-react';
import type { AppRole } from '@/shared/api';
import { routes } from '@/shared/config';

type NavItem = { to: string; label: string; icon: LucideIcon };

const objects: NavItem = { to: routes.objects, label: 'Объекты', icon: Building2Icon };
const myTasks: NavItem = { to: routes.tasks, label: 'Мои задачи', icon: ListChecksIcon };
const allTasks: NavItem = { to: routes.tasks, label: 'Задачи', icon: ListChecksIcon };
const statistics: NavItem = { to: routes.statistics, label: 'Статистика', icon: BarChart3Icon };

export const NAV_BY_ROLE: Record<AppRole, NavItem[]> = {
  manager: [objects, allTasks, statistics],
  executor: [myTasks, objects, statistics],
};
