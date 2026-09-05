import { count, day } from '../format.js';
import type { Metric } from '../types.js';
import { line } from './shared.js';

const DAY = 86_400_000;

export const reliability: Metric = {
  id: 'reliability',
  title: 'Measurement reliability',
  definition: 'Of the last 30 UTC nights before tonight, counting only nights since the nightly workflow first ran, how many had a run of that workflow complete with success. Read from the workflow run list. Scheduled and manually dispatched runs are counted apart.',
  gaming: 'Backfill missed nights with manual runs.',
  crossCheck: 'The trigger is shown per count, and the run list is linked.',
  compute(data) {
    const today = Date.parse(day(data.generatedAt));
    const first = data.nightlyRuns.map((run) => day(run.createdAt)).sort()[0] ?? day(data.generatedAt);
    const nights = Array.from({ length: 30 }, (_, i) => day(new Date(today - (i + 1) * DAY).toISOString())).filter((night) => night >= first);
    const ok = data.nightlyRuns.filter((run) => run.status === 'completed' && run.conclusion === 'success');
    const nightsBy = (event: string | null): number => {
      const dates = new Set(ok.filter((run) => event === null || run.event === event).map((run) => day(run.createdAt)));
      return nights.filter((night) => dates.has(night)).length;
    };
    return {
      headline: count(nightsBy(null), nights.length),
      rows: [
        line(`${String(nightsBy('schedule'))} nights by schedule, ${String(nightsBy('workflow_dispatch'))} by manual dispatch`),
        line(`first run in the list on ${first}; ${String(data.nightlyRuns.length - ok.length)} of ${String(data.nightlyRuns.length)} listed runs did not complete with success`),
      ],
      crossCheck: [line('nightly run list', data.nightlyRunsUrl)],
    };
  },
};
