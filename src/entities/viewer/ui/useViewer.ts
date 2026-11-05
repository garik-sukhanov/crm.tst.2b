import { useUnit } from 'effector-react';
import type { Viewer } from '../api/viewer';
import { $viewer } from '../model/viewer';

/** Текущий пользователь. Внутри защищённых маршрутов он всегда есть. */
export const useViewer = (): Viewer => {
  const viewer = useUnit($viewer);
  if (!viewer) throw new Error('useViewer вызван вне защищённого маршрута');
  return viewer;
};
