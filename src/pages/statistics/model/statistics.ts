import { createQuery } from '@farfetched/core';
import { createEffect, sample } from 'effector';
import { createGate } from 'effector-react';
import { fetchAllTasks, fetchStatusHistory } from '@/entities/task';
import { type ApiError, toApiError } from '@/shared/api';
import { computeStatistics, type Statistics } from '../lib/compute';

export const StatisticsGate = createGate('StatisticsPage');

export const statisticsQuery = createQuery({
  effect: createEffect<void, Statistics, ApiError>(async () => {
    try {
      const [tasks, history] = await Promise.all([fetchAllTasks(), fetchStatusHistory()]);
      return computeStatistics(tasks, history);
    } catch (error) {
      throw toApiError(error);
    }
  }),
});

sample({ clock: StatisticsGate.open, target: statisticsQuery.start });
