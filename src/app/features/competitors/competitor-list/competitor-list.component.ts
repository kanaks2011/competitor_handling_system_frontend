import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CompetitorService } from '../../../core/services/competitor.service';
import { CrawlService } from '../../../core/services/crawl.service';
import { CompetitorSummary, CrawlJobStatus } from '../../../core/models/competitor.models';
import { FormsModule } from '@angular/forms';
import { CompetitorViewDialogComponent } from '../competitor-view-dialog/competitor-view-dialog.component';

@Component({
  selector: 'app-competitor-list',
  imports: [
    RouterLink,
    FormsModule,
    ButtonModule,
    TableModule,
    TagModule,
    ToggleSwitchModule,
    ConfirmDialogModule,
    ToastModule,
    CompetitorViewDialogComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './competitor-list.component.html',
  styleUrl: './competitor-list.component.scss',
})
export class CompetitorListComponent implements OnInit {
  private readonly competitorService = inject(CompetitorService);
  private readonly crawlService = inject(CrawlService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

  readonly competitors = signal<CompetitorSummary[]>([]);
  readonly loading = signal(true);
  readonly crawlingIds = signal<Set<number>>(new Set());
  readonly viewDialogVisible = signal(false);
  readonly viewCompetitorId = signal<number | null>(null);
  readonly viewCompetitorName = signal('');

  ngOnInit(): void {
    this.loadCompetitors();
  }

  loadCompetitors(): void {
    this.loading.set(true);
    this.competitorService.list().subscribe({
      next: (data) => {
        this.competitors.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load competitors',
        });
      },
    });
  }

  onStatusToggle(competitor: CompetitorSummary, active: boolean): void {
    this.competitorService.updateStatus(competitor.id, active).subscribe({
      next: (updated) => {
        this.competitors.update((items) =>
          items.map((item) =>
            item.id === competitor.id ? { ...item, active: updated.active } : item,
          ),
        );
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update status',
        });
        this.loadCompetitors();
      },
    });
  }

  confirmDelete(competitor: CompetitorSummary): void {
    this.confirmationService.confirm({
      header: 'Delete competitor',
      message: `Delete "${competitor.name}" and all its sources?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteCompetitor(competitor.id),
    });
  }

  private deleteCompetitor(id: number): void {
    this.competitorService.delete(id).subscribe({
      next: () => {
        this.competitors.update((items) => items.filter((item) => item.id !== id));
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Competitor removed',
        });
      },
      error: (error: HttpErrorResponse) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message ?? 'Failed to delete competitor',
        });
      },
    });
  }

  isCrawling(id: number): boolean {
    return this.crawlingIds().has(id);
  }

  runCrawl(competitor: CompetitorSummary, event?: Event): void {
    event?.stopPropagation();

    if (competitor.sourceCount === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No sources',
        detail: 'Add at least one active source URL before crawling',
      });
      return;
    }

    this.crawlingIds.update((ids) => new Set(ids).add(competitor.id));

    this.crawlService.runCrawl(competitor.id).subscribe({
      next: (job) => {
        this.crawlingIds.update((ids) => {
          const next = new Set(ids);
          next.delete(competitor.id);
          return next;
        });
        this.loadCompetitors();
        this.messageService.add({
          severity: job.status === 'DONE' ? 'success' : 'warn',
          summary: job.status === 'DONE' ? 'Crawl complete' : 'Crawl finished with errors',
          detail: `${job.sourcesSuccess}/${job.sourcesTotal} sources crawled successfully`,
        });
      },
      error: (error: HttpErrorResponse) => {
        this.crawlingIds.update((ids) => {
          const next = new Set(ids);
          next.delete(competitor.id);
          return next;
        });
        this.messageService.add({
          severity: 'error',
          summary: 'Crawl failed',
          detail: error.error?.message ?? 'Failed to run crawl',
        });
      },
    });
  }

  crawlStatusLabel(status: CrawlJobStatus | null): string {
    if (!status) {
      return 'Never crawled';
    }
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  crawlStatusSeverity(status: CrawlJobStatus | null): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch (status) {
      case 'DONE':
        return 'success';
      case 'RUNNING':
        return 'info';
      case 'FAILED':
        return 'danger';
      case 'PENDING':
        return 'warn';
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

  openViewDetails(competitor: CompetitorSummary, event?: Event): void {
    event?.stopPropagation();
    this.viewCompetitorId.set(competitor.id);
    this.viewCompetitorName.set(competitor.name);
    this.viewDialogVisible.set(true);
  }
}
