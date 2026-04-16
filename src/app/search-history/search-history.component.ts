import { ZardCardComponent } from '@/shared/components/card';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Dispatcher } from '@ngrx/signals/events';
import { BooksStore } from '../books.store';
import { historyEvents } from '../history.events';
import { HistoryItem, HistoryStore } from '../history.store';

@Component({
  selector: 'app-search-history',
  standalone: true,
  imports: [ZardCardComponent, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (store.history().length > 0) {
      <section class="max-w-6xl mx-auto mt-16">
        <h2 class="text-2xl font-semibold mb-6 text-foreground">Recent Searches</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (item of store.history(); track item.query) {
            <div class="group relative">
              <z-card
                class="flex flex-col border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-all hover:shadow-lg cursor-pointer h-full"
                [zTitle]="item.query"
                [zDescription]="resultLabel(item)"
                (click)="onCardClick(item)"
              >
                <ul class="space-y-2 mt-1">
                  @for (book of item.books.slice(0, 3); track book.key) {
                    <li class="flex items-start gap-3 py-1 border-b border-border/30 last:border-0">
                      @if (book.cover_i) {
                        <img
                          [src]="'https://covers.openlibrary.org/b/id/' + book.cover_i + '-S.jpg'"
                          [alt]="book.title"
                          class="w-8 h-10 object-cover rounded shrink-0 mt-0.5"
                        />
                      } @else {
                        <div
                          class="w-8 h-10 bg-muted rounded shrink-0 flex items-center justify-center text-[10px] text-muted-foreground"
                        >
                          📖
                        </div>
                      }
                      <div class="min-w-0">
                        <p class="text-sm font-medium leading-tight line-clamp-1">{{ book.title }}</p>
                        <p class="text-xs text-muted-foreground italic line-clamp-1">
                          {{ book.author_name?.[0] ?? 'Unknown Author' }}
                        </p>
                      </div>
                    </li>
                  }
                </ul>
                <div class="mt-3 text-xs text-muted-foreground font-sans" card-footer>
                  {{ item.searchedAt | date: 'h:mm a' }}
                </div>
              </z-card>
              <button
                type="button"
                class="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-background/80 backdrop-blur-md border border-border/50 text-muted-foreground hover:text-destructive hover:border-destructive/30 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                (click)="onRemove($event, item.query)"
                title="Remove from history"
              >
                ✕
              </button>
            </div>
          }
        </div>
      </section>
    }
  `,
  styles: [
    `
      .line-clamp-1 {
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `,
  ],
})
export class SearchHistoryComponent {
  readonly store = inject(HistoryStore);
  private readonly booksStore = inject(BooksStore);
  private readonly dispatcher = inject(Dispatcher);

  onCardClick(item: HistoryItem): void {
    this.booksStore.restoreFromHistory(item.query, item.books);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onRemove(event: Event, query: string): void {
    event.stopPropagation();
    this.dispatcher.dispatch(historyEvents.removeItem({ query }));
  }

  resultLabel(item: HistoryItem): string {
    const count = item.books.length;
    return `${count} result${count !== 1 ? 's' : ''} found`;
  }
}
