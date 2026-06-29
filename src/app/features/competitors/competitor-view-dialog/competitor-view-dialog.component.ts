import { Component, effect, inject, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageService } from 'primeng/api';
import { CrawlService } from '../../../core/services/crawl.service';
import { ChangeService } from '../../../core/services/change.service';
import { EventService } from '../../../core/services/event.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { CrawlJobResponse } from '../../../core/models/crawl.models';
import {
  ChangeStatus,
  DetectedChangeDetail,
  DetectedChangeSummary,
  SignificanceLevel,
} from '../../../core/models/change.models';
import { SOURCE_TYPES, SourceType } from '../../../core/models/competitor.models';
import { CompetitorIntelligence, TimelineItem } from '../../../core/models/dashboard.models';
import { RiskLevel } from '../../../core/models/event.models';

@Component({
  selector: 'app-competitor-view-dialog',
  imports: [
    FormsModule,
    RouterLink,
    ButtonModule,
    DialogModule,
    SelectModule,
    TableModule,
    TagModule,
    ToggleSwitchModule,
    DatePipe,
  ],
  templateUrl: './competitor-view-dialog.component.html',
  styleUrl: './competitor-view-dialog.component.scss',
})
export class CompetitorViewDialogComponent {
  private readonly crawlService = inject(CrawlService);
  private readonly changeService = inject(ChangeService);
  private readonly eventService = inject(EventService);
  private readonly dashboardService = inject(DashboardService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

  /** Exposed for template navigation helpers only */
  protected navigateToEvent(eventId: number): void {
    this.visible.set(false);
    this.router.navigate(['/events', eventId]);
  }

  readonly visible = model(false);
  readonly competitorId = input<number | null>(null);
  readonly competitorName = input('');
  readonly closed = output<void>();

  readonly sourceTypes = SOURCE_TYPES;
  readonly latestCrawl = signal<CrawlJobResponse | null>(null);
  readonly crawlLoading = signal(false);
  readonly intelligence = signal<CompetitorIntelligence | null>(null);
  readonly intelligenceLoading = signal(false);
  readonly changes = signal<DetectedChangeSummary[]>([]);
  readonly changesLoading = signal(false);
  readonly changesTotal = signal(0);
  readonly changesPageSize = 5;
  readonly changesPage = signal(0);
  readonly changeSourceFilter = signal<SourceType | null>(null);
  readonly changeFromDate = signal('');
  readonly changeToDate = signal('');
  readonly significantOnly = signal(false);
  readonly includeNoChange = signal(false);
  readonly diffDialogVisible = signal(false);
  readonly selectedChange = signal<DetectedChangeDetail | null>(null);
  readonly changeDetailLoading = signal(false);
  readonly analyzingChangeId = signal<number | null>(null);

  constructor() {
    effect(() => {
      if (this.visible() && this.competitorId()) {
        this.loadAll();
      }
    });
  }

  onHide(): void {
    this.resetState();
    this.closed.emit();
  }

  loadAll(): void {
    const id = this.competitorId();
    if (!id) {
      return;
    }
    this.loadLatestCrawl(id);
    this.loadIntelligence(id);
    this.loadChanges(id, 0);
  }

  loadLatestCrawl(competitorId: number): void {
    this.crawlLoading.set(true);
    this.crawlService.getLatest(competitorId).subscribe({
      next: (job) => {
        this.latestCrawl.set(job);
        this.crawlLoading.set(false);
      },
      error: () => {
        this.latestCrawl.set(null);
        this.crawlLoading.set(false);
      },
    });
  }

  loadIntelligence(competitorId: number): void {
    this.intelligenceLoading.set(true);
    this.dashboardService.getCompetitorIntelligence(competitorId).subscribe({
      next: (data) => {
        this.intelligence.set(data);
        this.intelligenceLoading.set(false);
      },
      error: () => this.intelligenceLoading.set(false),
    });
  }

  loadChanges(competitorId: number, page = this.changesPage()): void {
    this.changesLoading.set(true);
    this.changeService
      .listByCompetitor(competitorId, page, this.changesPageSize, {
        sourceType: this.changeSourceFilter(),
        fromDate: this.changeFromDate() || null,
        toDate: this.changeToDate() || null,
        significantOnly: this.significantOnly(),
        includeNoChange: this.includeNoChange(),
      })
      .subscribe({
        next: (result) => {
          this.changes.set(result.content);
          this.changesTotal.set(result.totalElements);
          this.changesPage.set(result.number);
          this.changesLoading.set(false);
        },
        error: () => {
          this.changesLoading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load change history',
          });
        },
      });
  }

  onChangesPageChange(event: { first?: number }): void {
    const id = this.competitorId();
    if (!id) {
      return;
    }
    const page = Math.floor((event.first ?? 0) / this.changesPageSize);
    this.loadChanges(id, page);
  }

  applyChangeFilters(): void {
    const id = this.competitorId();
    if (id) {
      this.loadChanges(id, 0);
    }
  }

  clearChangeFilters(): void {
    this.changeSourceFilter.set(null);
    this.changeFromDate.set('');
    this.changeToDate.set('');
    this.significantOnly.set(false);
    this.includeNoChange.set(false);
    const id = this.competitorId();
    if (id) {
      this.loadChanges(id, 0);
    }
  }

  openChangeDetail(change: DetectedChangeSummary): void {
    if (change.changeStatus === 'FIRST_SNAPSHOT' || change.changeStatus === 'NO_CHANGE') {
      this.messageService.add({
        severity: 'info',
        summary: 'No diff available',
        detail: change.summary ?? 'Nothing meaningful to compare',
      });
      return;
    }

    this.diffDialogVisible.set(true);
    this.changeDetailLoading.set(true);
    this.selectedChange.set(null);

    this.changeService.getDetail(change.id).subscribe({
      next: (detail) => {
        this.selectedChange.set(detail);
        this.changeDetailLoading.set(false);
      },
      error: () => {
        this.changeDetailLoading.set(false);
        this.diffDialogVisible.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load change detail',
        });
      },
    });
  }

  closeChangeDetail(): void {
    this.diffDialogVisible.set(false);
    this.selectedChange.set(null);
  }

  diffHtml(): SafeHtml | null {
    const html = this.selectedChange()?.diffHtml;
    if (!html) {
      return null;
    }
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  openEventAnalysis(change: DetectedChangeSummary): void {
    if (change.eventId) {
      this.visible.set(false);
      this.router.navigate(['/events', change.eventId]);
      return;
    }

    if (change.changeStatus !== 'SIGNIFICANT') {
      return;
    }

    this.analyzingChangeId.set(change.id);
    this.eventService.analyzeChange(change.id).subscribe({
      next: (event) => {
        this.analyzingChangeId.set(null);
        const id = this.competitorId();
        if (id) {
          this.loadChanges(id, this.changesPage());
          this.loadIntelligence(id);
        }
        this.visible.set(false);
        this.router.navigate(['/events', event.id]);
      },
      error: (error: HttpErrorResponse) => {
        this.analyzingChangeId.set(null);
        this.messageService.add({
          severity: 'error',
          summary: 'Analysis failed',
          detail: error.error?.message ?? 'Gemini analysis failed',
        });
      },
    });
  }

  openTimelineEvent(item: TimelineItem): void {
    if (item.eventId) {
      this.visible.set(false);
      this.router.navigate(['/events', item.eventId]);
    }
  }

  goToEdit(): void {
    const id = this.competitorId();
    if (!id) {
      return;
    }
    this.visible.set(false);
    this.router.navigate(['/competitors', id]);
  }

  isAnalyzingChange(changeId: number): boolean {
    return this.analyzingChangeId() === changeId;
  }

  sourceTypeLabel(type: SourceType): string {
    return this.sourceTypes.find((item) => item.value === type)?.label ?? type;
  }

  changeStatusLabel(status: ChangeStatus): string {
    return status
      .split('_')
      .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
      .join(' ');
  }

  changeStatusSeverity(status: ChangeStatus): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch (status) {
      case 'SIGNIFICANT':
        return 'danger';
      case 'TRIVIAL':
        return 'warn';
      case 'NO_CHANGE':
        return 'secondary';
      case 'FIRST_SNAPSHOT':
        return 'info';
      default:
        return 'secondary';
    }
  }

  significanceSeverity(level: SignificanceLevel): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch (level) {
      case 'HIGH':
        return 'danger';
      case 'MEDIUM':
        return 'warn';
      case 'LOW':
        return 'info';
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

  formatDetectedAt(value: string): string {
    return new Date(value).toLocaleString();
  }

  private resetState(): void {
    this.latestCrawl.set(null);
    this.intelligence.set(null);
    this.changes.set([]);
    this.changesTotal.set(0);
    this.changesPage.set(0);
    this.changeSourceFilter.set(null);
    this.changeFromDate.set('');
    this.changeToDate.set('');
    this.significantOnly.set(false);
    this.includeNoChange.set(false);
    this.closeChangeDetail();
  }
}
