import { ZardBadgeComponent } from '@/shared/components/badge';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BooksStore } from './books.store';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardInputDirective,
    ZardButtonComponent,
    ZardCardComponent,
    ZardBadgeComponent,
    ZardSkeletonComponent,
  ],
  template: `
    <div class="min-h-screen bg-background text-foreground p-4 md:p-8 font-serif">
      <header class="max-w-6xl mx-auto mb-12 text-center">
        <h1 class="text-5xl font-bold mb-4 text-primary tracking-tight">Athenaeum</h1>
        <p class="text-muted-foreground text-lg italic">
          Explore the boundless archives of Open Library
        </p>

        <div class="mt-8 max-w-2xl mx-auto relative group">
          <input
            z-input
            type="text"
            placeholder="Search for titles, authors, or subjects..."
            class="w-full text-lg py-6 px-6 rounded-full border-2 border-border focus:border-primary transition-all shadow-sm"
            [ngModel]="store.query()"
            (ngModelChange)="onQueryChange($event)"
          />
          <div class="absolute right-3 top-1/2 -translate-y-1/2">
            @if (store.searchIsPending()) {
              <div
                class="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"
              ></div>
            }
          </div>
        </div>
      </header>

      <main class="max-w-6xl mx-auto">
        @if (store.searchIsError()) {
          <div
            class="p-4 mb-6 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 text-center"
          >
            {{ store.searchRequestError() }}
          </div>
        }

        @if (store.searchIsPending() && store.books().length === 0) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (i of [1, 2, 3, 4, 5, 6]; track i) {
              <z-card class="h-[400px] flex flex-col p-0 overflow-hidden">
                <z-skeleton class="h-48 w-full" />
                <div class="p-4 space-y-3">
                  <z-skeleton class="h-6 w-3/4" />
                  <z-skeleton class="h-4 w-1/2" />
                  <z-skeleton class="h-20 w-full" />
                </div>
              </z-card>
            }
          </div>
        } @else if (store.books().length > 0) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            @for (book of store.books(); track book.key) {
              <z-card
                class="group flex flex-col h-full overflow-hidden border-border/50 hover:border-primary/50 transition-all hover:shadow-xl bg-card/50 backdrop-blur-sm"
              >
                <div
                  class="relative h-64 overflow-hidden bg-muted flex items-center justify-center"
                >
                  @if (book.cover_i) {
                    <img
                      [src]="'https://covers.openlibrary.org/b/id/' + book.cover_i + '-M.jpg'"
                      [alt]="book.title"
                      class="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                  } @else {
                    <div class="text-muted-foreground flex flex-col items-center p-4 text-center">
                      <span class="text-4xl mb-2">📖</span>
                      <span class="text-xs uppercase tracking-widest">No Cover Available</span>
                    </div>
                  }
                  <div class="absolute top-2 right-2">
                    <z-badge variant="secondary" class="bg-background/80 backdrop-blur-md">
                      {{ book.first_publish_year || 'N/A' }}
                    </z-badge>
                  </div>
                </div>

                <div class="p-6 flex-grow flex flex-col">
                  <h3
                    class="text-xl font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors"
                  >
                    {{ book.title }}
                  </h3>
                  <p class="text-sm text-muted-foreground mb-4 font-sans italic">
                    {{ book.author_name ? book.author_name.join(', ') : 'Unknown Author' }}
                  </p>

                  @if (book.subject) {
                    <div class="flex flex-wrap gap-1 mt-auto">
                      @for (sub of book.subject.slice(0, 3); track sub) {
                        <z-badge
                          variant="outline"
                          class="text-[10px] px-2 py-0 border-primary/20 text-primary/70"
                        >
                          {{ sub }}
                        </z-badge>
                      }
                    </div>
                  }
                </div>

                <div class="p-4 pt-0 mt-auto">
                  <a
                    [href]="'https://openlibrary.org' + book.key"
                    target="_blank"
                    z-button
                    variant="outline"
                    class="w-full rounded-lg hover:bg-primary hover:text-primary-foreground border-primary/20"
                  >
                    View Details
                  </a>
                </div>
              </z-card>
            }
          </div>
        } @else if (!store.searchIsPending() && store.query()) {
          <div
            class="text-center py-20 bg-card/30 rounded-3xl border-2 border-dashed border-border/50"
          >
            <span class="text-6xl mb-4 block">🕯️</span>
            <p class="text-xl text-muted-foreground">No manuscripts found for your search.</p>
          </div>
        } @else {
          <div class="text-center py-20">
            <div class="inline-block p-8 rounded-full bg-primary/5 mb-6">
              <span class="text-7xl">📜</span>
            </div>
            <h2 class="text-2xl font-semibold mb-2">Begin Your Journey</h2>
            <p class="text-muted-foreground max-w-md mx-auto">
              Enter a title, author, or secret keyword to uncover hidden treasures from the Open
              Library collection.
            </p>
          </div>
        }
      </main>

      <footer
        class="mt-20 py-8 border-t border-border/50 text-center text-sm text-muted-foreground font-sans"
      >
        <p>Crafted for bibliophiles. Powered by Open Library API.</p>
      </footer>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `,
  ],
})
export class AppComponent {
  readonly store = inject(BooksStore);

  constructor() {
    effect(() => {
      this.store.search(this.store.query());
    });
  }

  onQueryChange(query: string) {
    this.store.updateQuery(query);
  }
}
