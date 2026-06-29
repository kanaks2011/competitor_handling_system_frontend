import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DashboardService } from '../../core/services/dashboard.service';
import { CompetitorService } from '../../core/services/competitor.service';
import {
  CompetitorHealth,
  DashboardSummary,
  EventFeedItem,
  HEALTH_STATUS_LABELS,
  URGENCY_FILTER_OPTIONS,
} from '../../core/models/dashboard.models';
import { CompetitorSummary } from '../../core/models/competitor.models';
import { RiskLevel } from '../../core/models/event.models';

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule, CardModule, TagModule, ButtonModule, RouterLink, SelectModule, TableModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly competitorService = inject(CompetitorService);

  readonly summary = signal<DashboardSummary | null>(null);
  readonly summaryLoading = signal(true);
  readonly feed = signal<EventFeedItem[]>([]);
  readonly feedTotal = signal(0);
  readonly feedLoading = signal(true);
  readonly feedPage = signal(0);
  readonly feedPageSize = signal(10);
  readonly health = signal<CompetitorHealth[]>([]);
  readonly healthLoading = signal(true);
  readonly competitors = signal<CompetitorSummary[]>([]);

  readonly urgencyOptions = URGENCY_FILTER_OPTIONS;
  readonly selectedCompetitorId = signal<number | null>(null);
  readonly selectedUrgency = signal<RiskLevel | null>(null);
  readonly fromDate = signal('');
  readonly toDate = signal('');

  ngOnInit(): void {
    this.loadSummary();
    this.loadHealth();
    this.competitorService.list().subscribe({
      next: (items) => this.competitors.set(items),
    });
    this.loadFeed();
  }

  loadSummary(): void {
    this.summaryLoading.set(true);
    this.dashboardService.getSummary().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.summaryLoading.set(false);
      },
      error: () => this.summaryLoading.set(false),
    });
  }

  loadHealth(): void {
    this.healthLoading.set(true);
    this.dashboardService.getCompetitorHealth().subscribe({
      next: (items) => {
        this.health.set(items);
        this.healthLoading.set(false);
      },
      error: () => this.healthLoading.set(false),
    });
  }

  loadFeed(page = this.feedPage()): void {
    this.feedLoading.set(true);
    this.feedPage.set(page);
    this.dashboardService
      .getFeed(
        page,
        this.feedPageSize(),
        this.selectedCompetitorId() ?? undefined,
        this.selectedUrgency(),
        this.fromDate() || undefined,
        this.toDate() || undefined,
      )
      .subscribe({
        next: (result) => {
          this.feed.set(result.content);
          this.feedTotal.set(result.totalElements);
          this.feedLoading.set(false);
        },
        error: () => this.feedLoading.set(false),
      });
  }

  applyFeedFilters(): void {
    this.loadFeed(0);
  }

  clearFeedFilters(): void {
    this.selectedCompetitorId.set(null);
    this.selectedUrgency.set(null);
    this.fromDate.set('');
    this.toDate.set('');
    this.loadFeed(0);
  }

  onFeedPageChange(event: TableLazyLoadEvent): void {
    const rows = event.rows ?? this.feedPageSize();
    const page = Math.floor((event.first ?? 0) / rows);
    this.feedPageSize.set(rows);
    this.loadFeed(page);
  }

  competitorOptions(): { label: string; value: number | null }[] {
    return [
      { label: 'All competitors', value: null },
      ...this.competitors().map((item) => ({ label: item.name, value: item.id })),
    ];
  }

  healthLabel(status: CompetitorHealth['healthStatus']): string {
    return HEALTH_STATUS_LABELS[status];
  }

  healthSeverity(status: CompetitorHealth['healthStatus']): 'danger' | 'warn' | 'success' | 'secondary' {
    switch (status) {
      case 'CRITICAL':
        return 'danger';
      case 'WATCH':
        return 'warn';
      case 'STABLE':
        return 'success';
      default:
        return 'secondary';
    }
  }

  urgencySeverity(level: RiskLevel | null): 'danger' | 'warn' | 'success' | 'secondary' {
    switch (level) {
      case 'HIGH':
        return 'danger';
      case 'MEDIUM':
        return 'warn';
      case 'LOW':
        return 'success';
      default:
        return 'secondary';
    }
  }

  formatDate(value: string | null): string {
    if (!value) {
      return '—';
    }
    return new Date(value).toLocaleString();
  }
}
