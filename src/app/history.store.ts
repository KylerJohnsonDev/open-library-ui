import { signalStore, withState } from '@ngrx/signals';
import { on, withReducer } from '@ngrx/signals/events';
import { booksApiEvents } from './books-api.events';
import { Book } from './books.store';

export interface HistoryItem {
  query: string;
  books: Book[];
  searchedAt: Date;
}

interface HistoryState {
  history: HistoryItem[];
}

const initialState: HistoryState = {
  history: [],
};

export const HistoryStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withReducer(
    on(booksApiEvents.searchSuccess, ({ payload: { query, books } }, state) => {
      const newItem: HistoryItem = { query, books, searchedAt: new Date() };
      const deduped = state.history.filter((h) => h.query !== query);
      return { history: [newItem, ...deduped].slice(0, 6) };
    }),
  ),
);
