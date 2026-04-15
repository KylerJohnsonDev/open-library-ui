import { setError, setPending, setSuccess, withRequestStatus } from '@/shared/core';
import { HttpClient } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { Dispatcher } from '@ngrx/signals/events';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, of, pipe, switchMap, tap } from 'rxjs';
import { booksApiEvents } from './books-api.events';

export interface Book {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  number_of_pages_median?: number;
  subject?: string[];
}

export interface BooksState {
  books: Book[];
  query: string;
}

const initialState: BooksState = {
  books: [],
  query: '',
};

export const BooksStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withRequestStatus('search'),
  withComputed(({ books }) => ({
    count: computed(() => books().length),
  })),
  withMethods((store, http = inject(HttpClient), dispatcher = inject(Dispatcher)) => ({
    updateQuery(query: string) {
      patchState(store, { query });
    },
    clearSearch() {
      patchState(store, { query: '', books: [] }, setSuccess('search'));
    },
    restoreFromHistory(query: string, books: Book[]) {
      patchState(store, { query, books }, setSuccess('search'));
    },
    search: rxMethod<string>(
      pipe(
        tap((query) => {
          if (!query.trim()) {
            patchState(store, { books: [] }, setSuccess('search'));
            return;
          }
          patchState(store, setPending('search'));
        }),
        switchMap((query) => {
          if (!query.trim()) return of({ docs: [] });
          const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}`;
          return http.get<{ docs: Book[] }>(url).pipe(
            tap((response) => {
              patchState(store, { books: response.docs }, setSuccess('search'));
              dispatcher.dispatch(booksApiEvents.searchSuccess({ query, books: response.docs }));
            }),
            catchError(() => {
              patchState(store, setError('search', 'Failed to fetch books'));
              return of({ docs: [] });
            }),
          );
        }),
      ),
    ),
  })),
);
