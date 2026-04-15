import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { pipe, switchMap, tap, catchError, of, distinctUntilChanged, debounceTime } from 'rxjs';
import { withRequestStatus, setPending, setSuccess, setError } from '@/shared/core';

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
  withMethods((store, http = inject(HttpClient)) => ({
    updateQuery(query: string) {
      patchState(store, { query });
    },
    search: rxMethod<string>(
      pipe(
        debounceTime(300),
        distinctUntilChanged(),
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
            }),
            catchError(() => {
              patchState(store, setError('search', 'Failed to fetch books'));
              return of({ docs: [] });
            })
          );
        })
      )
    ),
  }))
);
