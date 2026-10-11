import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

interface ChatbotStats {
  totalSessions: number;
  totalMessages: number;
  todayMessages: number;
  averageResponseTime: number;
  averageConfidence: number;
  agentTaskCompletion: number;
  llmProvider?: string;
}

interface CallStats {
  totalCalls: number;
  inboundCalls: number;
  outboundCalls: number;
  aiResolved: number;
  handedOff: number;
  missed: number;
  averageDuration: number;
  aiResolutionRate: number;
  missedCallRate: number;
  peakHours: Array<{ hour: number; count: number }>;
  dailyVolume: Array<{ date: string; count: number }>;
  outcomes: Record<string, number>;
}

@Component({
  selector: 'app-ai-admin',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  template: `
    <app-page-header title="AI administration" subtitle="Monitoring the hospital AI stack, call routing, and chatbot usage." />

    @if (loading()) {
      <div class="card p-6 text-sm text-gray-500">Loading AI telemetry…</div>
    } @else {
      <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div class="card p-4">
          <p class="text-xs font-mono uppercase tracking-[0.2em] text-gray-500">Calls</p>
          <p class="mt-3 text-3xl font-display font-semibold text-gray-900">{{ callStats()?.totalCalls ?? 0 }}</p>
        </div>
        <div class="card p-4">
          <p class="text-xs font-mono uppercase tracking-[0.2em] text-gray-500">AI resolved</p>
          <p class="mt-3 text-3xl font-display font-semibold text-gray-900">{{ callStats()?.aiResolved ?? 0 }}</p>
        </div>
        <div class="card p-4">
          <p class="text-xs font-mono uppercase tracking-[0.2em] text-gray-500">Avg duration</p>
          <p class="mt-3 text-3xl font-display font-semibold text-gray-900">{{ callStats()?.averageDuration ?? 0 }}s</p>
        </div>
        <div class="card p-4">
          <p class="text-xs font-mono uppercase tracking-[0.2em] text-gray-500">Chat messages</p>
          <p class="mt-3 text-3xl font-display font-semibold text-gray-900">{{ chatbotStats()?.totalMessages ?? 0 }}</p>
        </div>
        <div class="card p-4">
          <p class="text-xs font-mono uppercase tracking-[0.2em] text-gray-500">Avg confidence</p>
          <p class="mt-3 text-3xl font-display font-semibold text-gray-900">{{ chatbotStats()?.averageConfidence ? (chatbotStats()!.averageConfidence * 100).toFixed(0) : '0' }}%</p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div class="card p-6">
          <h2 class="mb-4 font-display text-lg font-semibold text-gray-900">Calling agent</h2>
          <dl class="space-y-3 text-sm">
            <div class="flex items-center justify-between"><dt class="text-gray-500">Inbound calls</dt><dd>{{ callStats()?.inboundCalls ?? 0 }}</dd></div>
            <div class="flex items-center justify-between"><dt class="text-gray-500">Outbound calls</dt><dd>{{ callStats()?.outboundCalls ?? 0 }}</dd></div>
            <div class="flex items-center justify-between"><dt class="text-gray-500">Handed off</dt><dd>{{ callStats()?.handedOff ?? 0 }}</dd></div>
            <div class="flex items-center justify-between"><dt class="text-gray-500">Missed calls</dt><dd>{{ callStats()?.missed ?? 0 }}</dd></div>
            <div class="flex items-center justify-between"><dt class="text-gray-500">AI resolution rate</dt><dd>{{ callStats()?.aiResolutionRate?.toFixed(1) ?? '0.0' }}%</dd></div>
            <div class="flex items-center justify-between"><dt class="text-gray-500">Missed rate</dt><dd>{{ callStats()?.missedCallRate?.toFixed(1) ?? '0.0' }}%</dd></div>
          </dl>
        </div>

        <div class="card p-6">
          <h2 class="mb-4 font-display text-lg font-semibold text-gray-900">Chatbot</h2>
          <dl class="space-y-3 text-sm">
            <div class="flex items-center justify-between"><dt class="text-gray-500">Sessions</dt><dd>{{ chatbotStats()?.totalSessions ?? 0 }}</dd></div>
            <div class="flex items-center justify-between"><dt class="text-gray-500">Today messages</dt><dd>{{ chatbotStats()?.todayMessages ?? 0 }}</dd></div>
            <div class="flex items-center justify-between"><dt class="text-gray-500">Avg response time</dt><dd>{{ chatbotStats()?.averageResponseTime ?? 0 }} ms</dd></div>
            <div class="flex items-center justify-between"><dt class="text-gray-500">Completed tasks</dt><dd>{{ chatbotStats()?.agentTaskCompletion ?? 0 }}%</dd></div>
            <div class="flex items-center justify-between"><dt class="text-gray-500">LLM provider</dt><dd>{{ chatbotStats()?.llmProvider ?? 'groq' }}</dd></div>
          </dl>
        </div>
      </div>
    }
  `,
})
export class AiAdminComponent implements OnInit {
  private readonly http = inject(HttpClient);
  readonly loading = signal(true);
  readonly chatbotStats = signal<ChatbotStats | null>(null);
  readonly callStats = signal<CallStats | null>(null);

  ngOnInit(): void {
    const baseUrl = `${environment.apiUrl}`;

    this.http.get<ApiResponse<ChatbotStats>>(`${baseUrl}/chatbot/stats`).subscribe({
      next: (res) => this.chatbotStats.set(res.data),
      error: () => this.chatbotStats.set(null),
    });

    this.http.get<ApiResponse<CallStats>>(`${baseUrl}/calling/stats`).subscribe({
      next: (res) => {
        this.callStats.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.callStats.set(null);
        this.loading.set(false);
      },
    });
  }
}
