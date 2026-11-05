import { Building2Icon, ListChecksIcon } from 'lucide-react';
import { routes } from '@/shared/config';

export const NAV_ITEMS = [
  { to: routes.objects, label: 'Объекты', icon: Building2Icon },
  { to: routes.myTasks, label: 'Мои задачи', icon: ListChecksIcon },
] as const;
