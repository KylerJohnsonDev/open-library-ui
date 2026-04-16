import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';

export const historyEvents = eventGroup({
  source: 'History UI',
  events: {
    removeItem: type<{ query: string }>(),
  },
});
