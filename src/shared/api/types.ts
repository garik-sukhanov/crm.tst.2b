import type { Database } from './database.types';

type PublicSchema = Database['public'];

export type Row<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row'];
export type AppRole = PublicSchema['Enums']['app_role'];
export type TaskStatus = PublicSchema['Enums']['task_status'];
