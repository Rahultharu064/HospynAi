import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { Pagination } from '../../../core/models/api-response.model';

@Component({
  selector: 'app-pagination',
  standalone: true,
  template: `
    @if (pagination() && pagination()!.totalPages > 1) {
      <div class="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
        <p class="text-sm text-gray-600">
          Showing <span class="font-medium">{{ startItem() }}</span> to
          <span class="font-medium">{{ endItem() }}</span> of
          <span class="font-medium">{{ pagination()!.total }}</span> results
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            class="btn-secondary"
            [disabled]="pagination()!.page <= 1"
            (click)="pageChange.emit(pagination()!.page - 1)"
          >
            Previous
          </button>
          <button
            type="button"
            class="btn-secondary"
            [disabled]="pagination()!.page >= pagination()!.totalPages"
            (click)="pageChange.emit(pagination()!.page + 1)"
          >
            Next
          </button>
        </div>
      </div>
    }
  `,
})
export class PaginationComponent {
  private readonly _pagination = signal<Pagination | null>(null);

  @Input({ required: true }) set data(value: Pagination | null) {
    this._pagination.set(value);
  }

  @Output() pageChange = new EventEmitter<number>();

  pagination = computed(() => this._pagination());

  startItem = computed(() => {
    const d = this._pagination();
    if (!d || d.total === 0) return 0;
    return (d.page - 1) * d.limit + 1;
  });

  endItem = computed(() => {
    const d = this._pagination();
    if (!d) return 0;
    return Math.min(d.page * d.limit, d.total);
  });
}
