import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
import { DatePipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CompetitorService } from '../../../core/services/competitor.service';
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
import {
  CompetitorDetail,
  SOURCE_TYPES,
  Source,
  SourceType,
} from '../../../core/models/competitor.models';
import {
  CompetitorIntelligence,
  TimelineItem,
} from '../../../core/models/dashboard.models';
import { RiskLevel } from '../../../core/models/event.models';

@Component({
  selector: 'app-competitor-detail',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    InputTextModule,
    TextareaModule,
    ToggleSwitchModule,
    SelectModule,
    TableModule,
    TagModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
    MessageModule,
    DatePipe,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './competitor-detail.component.html',
  styleUrl: './competitor-detail.component.scss',
})
export class CompetitorDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly competitorService = inject(CompetitorService);
  private readonly crawlService = inject(CrawlService);
  private readonly changeService = inject(ChangeService);
  private readonly eventService = inject(EventService);
  private readonly dashboardService = inject(DashboardService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  readonly sourceTypes = SOURCE_TYPES;
  readonly competitor = signal<CompetitorDetail | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly sourceDialogVisible = signal(false);
  readonly editingSource = signal<Source | null>(null);
  readonly sourceSaving = signal(false);
  readonly crawling = signal(false);
  readonly latestCrawl = signal<CrawlJobResponse | null>(null);
  readonly changes = signal<DetectedChangeSummary[]>([]);
  readonly changesLoading = signal(true);
  readonly changesTotal = signal(0);
  readonly changesPageSize = 10;
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
  readonly intelligence = signal<CompetitorIntelligence | null>(null);
  readonly intelligenceLoading = signal(true);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    websiteUrl: ['', Validators.maxLength(500)],
    description: ['', Validators.maxLength(2000)],
    active: [true],
  });

  readonly sourceForm = this.fb.nonNullable.group({
    sourceType: ['WEBSITE' as SourceType, Validators.required],
    sourceUrl: ['', [Validators.required, Validators.maxLength(1000)]],
    active: [true],
  });

  private competitorId = 0;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/competitors']);
      return;
    }
    this.competitorId = id;
    this.loadCompetitor();
    this.loadChanges();
    this.loadIntelligence();
  }

  loadIntelligence(): void {
    this.intelligenceLoading.set(true);
    this.dashboardService.getCompetitorIntelligence(this.competitorId).subscribe({
      next: (data) => {
        this.intelligence.set(data);
        this.intelligenceLoading.set(false);
      },
      error: () => this.intelligenceLoading.set(false),
    });
  }

  loadCompetitor(): void {
    this.loading.set(true);
    this.competitorService.get(this.competitorId).subscribe({
      next: (data) => {
        this.competitor.set(data);
        this.form.patchValue({
          name: data.name,
          websiteUrl: data.websiteUrl ?? '',
          description: data.description ?? '',
          active: data.active,
        });
        this.loading.set(false);
        this.loadLatestCrawl(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Competitor not found',
        });
        this.router.navigate(['/competitors']);
      },
    });
  }

  saveCompetitor(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const value = this.form.getRawValue();

    this.competitorService
      .update(this.competitorId, {
        name: value.name,
        websiteUrl: value.websiteUrl || undefined,
        description: value.description || undefined,
      })
      .subscribe({
        next: (updated) => {
          this.competitor.set(updated);
          this.saving.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Saved',
            detail: 'Competitor updated',
          });
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message ?? 'Failed to update competitor',
          });
        },
      });
  }

  onStatusToggle(active: boolean): void {
    this.competitorService.updateStatus(this.competitorId, active).subscribe({
      next: (updated) => {
        this.competitor.set(updated);
        this.form.patchValue({ active: updated.active });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update status',
        });
        this.loadCompetitor();
      },
    });
  }

  openSourceDialog(source?: Source): void {
    this.editingSource.set(source ?? null);
    if (source) {
      this.sourceForm.patchValue({
        sourceType: source.sourceType,
        sourceUrl: source.sourceUrl,
        active: source.active,
      });
    } else {
      this.sourceForm.reset({
        sourceType: 'WEBSITE',
        sourceUrl: '',
        active: true,
      });
    }
    this.sourceDialogVisible.set(true);
  }

  closeSourceDialog(): void {
    this.sourceDialogVisible.set(false);
    this.editingSource.set(null);
  }

  saveSource(): void {
    if (this.sourceForm.invalid) {
      this.sourceForm.markAllAsTouched();
      return;
    }

    this.sourceSaving.set(true);
    const value = this.sourceForm.getRawValue();
    const editing = this.editingSource();

    const request$ = editing
      ? this.competitorService.updateSource(this.competitorId, editing.id, value)
      : this.competitorService.addSource(this.competitorId, value);

    request$.subscribe({
      next: () => {
        this.sourceSaving.set(false);
        this.closeSourceDialog();
        this.loadCompetitor();
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: editing ? 'Source updated' : 'Source added',
        });
      },
      error: (error: HttpErrorResponse) => {
        this.sourceSaving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message ?? 'Failed to save source',
        });
      },
    });
  }

  confirmDeleteSource(source: Source): void {
    this.confirmationService.confirm({
      header: 'Delete source',
      message: `Remove this ${source.sourceType} source?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.competitorService.deleteSource(this.competitorId, source.id).subscribe({
          next: () => {
            this.loadCompetitor();
            this.messageService.add({
              severity: 'success',
              summary: 'Deleted',
              detail: 'Source removed',
            });
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete source',
            });
          },
        });
      },
    });
  }

  sourceTypeLabel(type: SourceType): string {
    return this.sourceTypes.find((item) => item.value === type)?.label ?? type;
  }

  loadLatestCrawl(showError: boolean): void {
    this.crawlService.getLatest(this.competitorId).subscribe({
      next: (job) => this.latestCrawl.set(job),
      error: () => {
        if (showError) {
          this.latestCrawl.set(null);
        }
      },
    });
  }

  runCrawl(): void {
    const item = this.competitor();
    if (!item) {
      return;
    }

    const activeSources = item.sources.filter((source) => source.active);
    if (activeSources.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No sources',
        detail: 'Add at least one active source URL before crawling',
      });
      return;
    }

    this.crawling.set(true);
    this.crawlService.runCrawl(this.competitorId).subscribe({
      next: (job) => {
        this.crawling.set(false);
        this.latestCrawl.set(job);
        this.loadChanges(0);
        this.loadIntelligence();
        this.messageService.add({
          severity: job.status === 'DONE' ? 'success' : 'warn',
          summary: job.status === 'DONE' ? 'Crawl complete' : 'Crawl finished with errors',
          detail: `${job.sourcesSuccess}/${job.sourcesTotal} sources crawled successfully`,
        });
      },
      error: (error: HttpErrorResponse) => {
        this.crawling.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Crawl failed',
          detail: error.error?.message ?? 'Failed to run crawl',
        });
      },
    });
  }

  loadChanges(page = this.changesPage()): void {
    this.changesLoading.set(true);
    this.changeService
      .listByCompetitor(this.competitorId, page, this.changesPageSize, {
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
    const page = Math.floor((event.first ?? 0) / this.changesPageSize);
    this.loadChanges(page);
  }

  applyChangeFilters(): void {
    this.loadChanges(0);
  }

  clearChangeFilters(): void {
    this.changeSourceFilter.set(null);
    this.changeFromDate.set('');
    this.changeToDate.set('');
    this.significantOnly.set(false);
    this.includeNoChange.set(false);
    this.loadChanges(0);
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

  formatDetectedAt(value: string): string {
    return new Date(value).toLocaleString();
  }

  openEventAnalysis(change: DetectedChangeSummary): void {
    if (change.eventId) {
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
        this.loadChanges(this.changesPage());
        this.loadIntelligence();
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

  isAnalyzingChange(changeId: number): boolean {
    return this.analyzingChangeId() === changeId;
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

  openTimelineEvent(item: TimelineItem): void {
    if (item.eventId) {
      this.router.navigate(['/events', item.eventId]);
    }
  }
}
