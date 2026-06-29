import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ReportService } from '../../../core/services/report.service';
import { WeeklyReportDetail, WeeklyReportStatus } from '../../../core/models/report.models';

@Component({
  selector: 'app-report-detail',
  imports: [RouterLink, ButtonModule, CardModule, TagModule],
  templateUrl: './report-detail.component.html',
  styleUrl: './report-detail.component.scss',
})
export class ReportDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly reportService = inject(ReportService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly loading = signal(true);
  readonly report = signal<WeeklyReportDetail | null>(null);
  readonly htmlContent = signal<SafeHtml | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.loading.set(false);
      return;
    }
    this.reportService.getDetail(id).subscribe({
      next: (detail) => {
        this.report.set(detail);
        this.htmlContent.set(this.sanitizer.bypassSecurityTrustHtml(detail.htmlContent));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  statusSeverity(status: WeeklyReportStatus): 'success' | 'warn' | 'danger' | 'info' {
    switch (status) {
      case 'SENT':
        return 'success';
      case 'FAILED':
        return 'danger';
      default:
        return 'info';
    }
  }

  formatDate(value: string | null): string {
    if (!value) {
      return '—';
    }
    return new Date(value).toLocaleString();
  }
}
