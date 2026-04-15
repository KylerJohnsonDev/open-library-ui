import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import { Book } from './books.store';

export const booksApiEvents = eventGroup({
  source: 'Books API',
  events: {
    searchSuccess: type<{ query: string; books: Book[] }>(),
  },
});
