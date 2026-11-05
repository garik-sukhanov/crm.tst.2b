export const routes = {
  root: '/',
  login: '/login',
  objects: '/objects',
  object: (id: string) => `/objects/${id}`,
  task: (id: string) => `/tasks/${id}`,
  tasks: '/tasks',
  statistics: '/statistics',
} as const;
