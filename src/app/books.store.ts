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
  shareStatus: 'idle' | 'copied' | 'error';
  isRestoring: boolean;
}

const initialState: BooksState = {
  books: [],
  query: '',
  shareStatus: 'idle',
  isRestoring: false,
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
      patchState(store, { query, searchRequestStatus: 'idle' });
    },
    clearSearch() {
      patchState(store, { query: '', books: [] }, setSuccess('search'));
    },
    restoreFromHistory(query: string, books: Book[]) {
      patchState(store, { query, books }, setSuccess('search'));
    },
    async shareResults() {
      // Minify books to keep URL size safe
      const booksToShare = store.books().slice(0, 15).map((b) => ({
        key: b.key,
        title: b.title,
        author_name: b.author_name,
        first_publish_year: b.first_publish_year,
        cover_i: b.cover_i,
        subject: b.subject?.slice(0, 3),
      }));

      const state = {
        query: store.query(),
        books: booksToShare,
      };

      try {
        const json = JSON.stringify(state);
        const token = btoa(
          encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (match, p1) =>
            String.fromCharCode(parseInt(p1, 16)),
          ),
        );

        const url = new URL(window.location.href);
        url.searchParams.set('share', token);

        await navigator.clipboard.writeText(url.toString());
        patchState(store, { shareStatus: 'copied' });
        setTimeout(() => patchState(store, { shareStatus: 'idle' }), 3000);
      } catch (err) {
        console.error('Failed to share', err);
        patchState(store, { shareStatus: 'error' });
        setTimeout(() => patchState(store, { shareStatus: 'idle' }), 3000);
      }
    },
    restoreFromSharedToken(token: string) {
      patchState(store, { isRestoring: true });
      try {
        const base64 = token.replace(/ /g, '+');
        const json = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join(''),
        );

        const state = JSON.parse(json);

        if (state.query && Array.isArray(state.books)) {
          // Add a small delay for a smooth transition
          setTimeout(() => {
            patchState(store, { query: state.query, books: state.books, isRestoring: false }, setSuccess('search'));
            
            // Clean URL
            const url = new URL(window.location.href);
            url.searchParams.delete('share');
            window.history.replaceState({}, '', url.toString());
          }, 150);
        } else {
          patchState(store, { isRestoring: false });
        }
      } catch (e) {
        console.error('Failed to restore shared state', e);
        patchState(store, { isRestoring: false });
      }
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
