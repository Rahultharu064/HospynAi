import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { InventoryService } from '../../services/inventory.service';
import { InventoryItem, InventoryStats } from '../../models/inventory.model';

@Component({
  selector: 'app-inventory-overview',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, CurrencyPipe, DatePipe],
  template: `
    <app-page-header title="Inventory" subtitle="Pharmacy and medical stock tracking across the operating system." />

    @if (loading()) {
      <div class="card p-6 text-sm text-gray-500">Loading inventory status…</div>
    } @else {
      <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div class="card p-4">
          <p class="text-xs font-mono uppercase tracking-[0.2em] text-gray-500">Items</p>
          <p class="mt-3 text-3xl font-display font-semibold text-gray-900">{{ stats()?.totalItems ?? 0 }}</p>
        </div>
        <div class="card p-4">
          <p class="text-xs font-mono uppercase tracking-[0.2em] text-gray-500">Inventory value</p>
          <p class="mt-3 text-3xl font-display font-semibold text-gray-900">{{ stats()?.totalValue ?? 0 | currency }}</p>
        </div>
        <div class="card p-4">
          <p class="text-xs font-mono uppercase tracking-[0.2em] text-gray-500">Low stock</p>
          <p class="mt-3 text-3xl font-display font-semibold text-gray-900">{{ stats()?.lowStockItems ?? 0 }}</p>
        </div>
        <div class="card p-4">
          <p class="text-xs font-mono uppercase tracking-[0.2em] text-gray-500">Expiring soon</p>
          <p class="mt-3 text-3xl font-display font-semibold text-gray-900">{{ stats()?.expiringSoonItems ?? 0 }}</p>
        </div>
        <div class="card p-4">
          <p class="text-xs font-mono uppercase tracking-[0.2em] text-gray-500">Controlled</p>
          <p class="mt-3 text-3xl font-display font-semibold text-gray-900">{{ stats()?.controlledSubstances ?? 0 }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div class="card p-6 xl:col-span-2">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="font-display text-lg font-semibold text-gray-900">Current stock</h2>
            <span class="text-xs font-mono uppercase tracking-[0.2em] text-gray-500">{{ items().length }} items</span>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full text-left text-sm">
              <thead class="border-b border-gray-200 text-gray-500">
                <tr>
                  <th class="py-3 pr-4">Drug</th>
                  <th class="py-3 pr-4">Batch</th>
                  <th class="py-3 pr-4">Qty</th>
                  <th class="py-3 pr-4">Expiry</th>
                  <th class="py-3 pr-4">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (item of items(); track item.id) {
                  <tr>
                    <td class="py-3 pr-4">
                      <div class="font-medium text-gray-900">{{ item.drugName }}</div>
                      <div class="text-xs text-gray-500">{{ item.category || 'General' }}</div>
                    </td>
                    <td class="py-3 pr-4 text-gray-600">{{ item.batchNumber }}</td>
                    <td class="py-3 pr-4">
                      <span class="font-medium" [class.text-amber-600]="item.isLowStock" [class.text-emerald-600]="!item.isLowStock">
                        {{ item.quantity }} {{ item.unit || 'units' }}
                      </span>
                    </td>
                    <td class="py-3 pr-4 text-gray-600">{{ item.expiryDate | date:'mediumDate' }}</td>
                    <td class="py-3 pr-4">
                      @if (item.isExpired) {
                        <span class="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">Expired</span>
                      } @else if (item.isLowStock) {
                        <span class="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">Low stock</span>
                      } @else {
                        <span class="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">Healthy</span>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="py-8 text-center text-sm text-gray-500">No inventory rows available.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <div class="card p-6">
          <h2 class="mb-4 font-display text-lg font-semibold text-gray-900">Reorder guidance</h2>
          <div class="space-y-4">
            @for (entry of stats()?.reorderRecommendations ?? []; track entry.drugName) {
              <div class="rounded-xl border border-gray-200 p-3">
                <div class="flex items-center justify-between gap-3">
                  <p class="font-medium text-gray-900">{{ entry.drugName }}</p>
                  <span class="rounded-full bg-sky-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-700">
                    {{ entry.priority }}
                  </span>
                </div>
                <p class="mt-2 text-xs text-gray-500">Stock {{ entry.currentStock }} → reorder {{ entry.recommendedOrder }}</p>
                <p class="mt-2 text-sm font-semibold text-navy-700">{{ entry.estimatedCost | currency }}</p>
              </div>
            } @empty {
              <p class="text-sm text-gray-500">No reorder actions needed right now.</p>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class InventoryOverviewComponent implements OnInit {
  private readonly inventoryService = inject(InventoryService);

  readonly loading = signal(true);
  readonly items = signal<InventoryItem[]>([]);
  readonly stats = signal<InventoryStats | null>(null);

  ngOnInit(): void {
    this.inventoryService.list({ page: 1, limit: 20 }).subscribe({
      next: (res) => {
        this.items.set(res.data.items ?? []);
      },
      error: () => this.items.set([]),
    });

    this.inventoryService.stats().subscribe({
      next: (res) => {
        this.stats.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.stats.set(null);
        this.loading.set(false);
      },
    });
  }
}
