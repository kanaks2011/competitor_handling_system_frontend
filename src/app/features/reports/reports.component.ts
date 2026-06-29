import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageService } from 'primeng/api';
import { ReportService } from '../../core/services/report.service';
import { WeeklyReportSummary, WeeklyReportStatus } from '../../core/models/report.models';

const DAY_OF_WEEK_OPTIONS = [
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
  { label: 'Sunday', value: 7 },
];

const TIMEZONE_OPTIONS = [
  { label: 'Asia/Dhaka (GMT+6)', value: 'Asia/Dhaka' },
  { label: 'Asia/Kolkata (GMT+5:30)', value: 'Asia/Kolkata' },
  { label: 'Asia/Singapore (GMT+8)', value: 'Asia/Singapore' },
  { label: 'Asia/Tokyo (GMT+9)', value: 'Asia/Tokyo' },
  { label: 'Europe/London (GMT+0/+1)', value: 'Europe/London' },
  { label: 'Europe/Berlin (GMT+1/+2)', value: 'Europe/Berlin' },
  { label: 'America/New_York (EST/EDT)', value: 'America/New_York' },
  { label: 'America/Chicago (CST/CDT)', value: 'America/Chicago' },
  { label: 'America/Los_Angeles (PST/PDT)', value: 'America/Los_Angeles' },
  { label: 'UTC', value: 'UTC' },
];

@Component({
  selector: 'app-reports',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    SelectModule,
    TableModule,
    TagModule,
    ToastModule,
    ToggleSwitchModule,
  ],
  providers: [MessageService],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent implements OnInit {
  private readonly reportService = inject(ReportService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  readonly dayOfWeekOptions = DAY_OF_WEEK_OPTIONS;
  readonly timezoneOptions = TIMEZONE_OPTIONS;

  readonly reports = signal<WeeklyReportSummary[]>([]);
  readonly totalRecords = signal(0);
  readonly loading = signal(true);
  readonly generating = signal(false);
  readonly configLoading = signal(true);
  readonly saving = signal(false);
  readonly pageSize = signal(20);
  readonly scheduleDescription = signal('');
  readonly nextFireAt = signal<string | null>(null);

  readonly scheduleForm = this.fb.nonNullable.group({
    enabled: [true],
    dayOfWeek: [1, Validators.required],
    runTime: ['08:00', Validators.required],
    timezone: ['Asia/Dhaka', Validators.required],
  });

  ngOnInit(): void {
    this.loadConfig();
    this.loadReports();
  }

  loadConfig(): void {
    this.configLoading.set(true);
    this.reportService.getConfig().subscribe({
      next: (config) => this.applyConfig(config),
      error: () => {
        this.configLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load report schedule',
        });
      },
    });
  }

  loadReports(page = 0, size = this.pageSize()): void {
    this.loading.set(true);
    this.reportService.list(page, size).subscribe({
      next: (result) => {
        this.reports.set(result.content);
        this.totalRecords.set(result.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPageChange(event: TableLazyLoadEvent): void {
    const rows = event.rows ?? this.pageSize();
    const page = Math.floor((event.first ?? 0) / rows);
    this.pageSize.set(rows);
    this.loadReports(page, rows);
  }

  saveSchedule(): void {
    if (this.scheduleForm.invalid) {
      this.scheduleForm.markAllAsTouched();
      return;
    }

    const { enabled, dayOfWeek, runTime, timezone } = this.scheduleForm.getRawValue();
    const [hourStr, minuteStr] = runTime.split(':');

    this.saving.set(true);
    this.reportService
      .updateConfig({
        enabled,
        dayOfWeek,
        runHour: Number(hourStr),
        runMinute: Number(minuteStr),
        timezone,
      })
      .subscribe({
        next: (config) => {
          this.applyConfig(config);
          this.saving.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Saved',
            detail: config.enabled ? 'Weekly report schedule updated' : 'Automatic reports disabled',
          });
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message ?? 'Failed to save report schedule',
          });
        },
      });
  }

  generateNow(): void {
    this.generating.set(true);
    this.reportService.generateNow().subscribe({
      next: (report) => {
        this.generating.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Weekly report generated',
          detail: report.emailSent ? 'Report emailed to recipients.' : 'Report saved (email not sent).',
        });
        this.router.navigate(['/reports', report.id]);
      },
      error: (error: HttpErrorResponse) => {
        this.generating.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Generation failed',
          detail: error.error?.message ?? 'Could not generate weekly report',
        });
      },
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

  private applyConfig(config: {
    enabled: boolean;
    dayOfWeek: number;
    runHour: number;
    runMinute: number;
    timezone: string;
    scheduleDescription: string;
    nextFireAt: string | null;
  }): void {
    const runTime = `${String(config.runHour).padStart(2, '0')}:${String(config.runMinute).padStart(2, '0')}`;
    this.scheduleForm.patchValue({
      enabled: config.enabled,
      dayOfWeek: config.dayOfWeek,
      runTime,
      timezone: config.timezone,
    });
    this.scheduleDescription.set(config.scheduleDescription);
    this.nextFireAt.set(config.nextFireAt);
    this.configLoading.set(false);
  }
}
