import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { SchedulerService } from '../../core/services/scheduler.service';
import {
  CrawlLog,
  CrawlLogStatus,
  CrawlTriggerType,
  ScheduleConfig,
  ScheduleFrequency,
} from '../../core/models/scheduler.models';
import { FormsModule } from '@angular/forms';

const FREQUENCY_OPTIONS: { label: string; value: ScheduleFrequency }[] = [
  { label: 'Daily', value: 'DAILY' },
  { label: 'Every 2 days', value: 'EVERY_2_DAYS' },
  { label: 'Weekly', value: 'WEEKLY' },
];

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

const AUTO_REFRESH_MS = 30_000;

@Component({
  selector: 'app-scheduler',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    CardModule,
    SelectModule,
    TableModule,
    TagModule,
    ToggleSwitchModule,
    ToastModule,
    MessageModule,
  ],
  providers: [MessageService],
  templateUrl: './scheduler.component.html',
  styleUrl: './scheduler.component.scss',
})
export class SchedulerComponent implements OnInit {
  private readonly schedulerService = inject(SchedulerService);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private refreshSub: Subscription | null = null;

  readonly frequencyOptions = FREQUENCY_OPTIONS;
  readonly dayOfWeekOptions = DAY_OF_WEEK_OPTIONS;
  readonly timezoneOptions = TIMEZONE_OPTIONS;

  readonly configLoading = signal(true);
  readonly saving = signal(false);
  readonly runningNow = signal(false);
  readonly logsLoading = signal(true);
  readonly logs = signal<CrawlLog[]>([]);
  readonly totalLogs = signal(0);
  readonly pageSize = 10;
  readonly currentPage = signal(0);
  readonly cronDescription = signal('');
  readonly lastRunAt = signal<string | null>(null);
  readonly nextFireAt = signal<string | null>(null);
  readonly triggerRegistered = signal(false);
  readonly lastRefreshedAt = signal<Date | null>(null);
  readonly autoRefreshEnabled = signal(false);

  readonly form = this.fb.nonNullable.group({
    enabled: [false],
    frequency: ['DAILY' as ScheduleFrequency, Validators.required],
    runTime: ['06:00', Validators.required],
    dayOfWeek: [1],
    timezone: ['Asia/Dhaka', Validators.required],
  });

  ngOnInit(): void {
    this.loadConfig();
    this.loadLogs();
    this.destroyRef.onDestroy(() => this.stopAutoRefresh());
  }

  onAutoRefreshToggle(enabled: boolean): void {
    this.autoRefreshEnabled.set(enabled);
    if (enabled) {
      this.startAutoRefresh();
      this.refreshSilently();
    } else {
      this.stopAutoRefresh();
    }
  }

  refreshNow(): void {
    this.refreshSilently();
  }

  private startAutoRefresh(): void {
    this.stopAutoRefresh();
    this.refreshSub = interval(AUTO_REFRESH_MS).subscribe(() => this.refreshSilently());
  }

  private stopAutoRefresh(): void {
    this.refreshSub?.unsubscribe();
    this.refreshSub = null;
  }

  loadConfig(): void {
    this.configLoading.set(true);
    this.schedulerService.getConfig().subscribe({
      next: (config) => this.applyConfig(config),
      error: () => {
        this.configLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load scheduler settings',
        });
      },
    });
  }

  loadLogs(page = this.currentPage()): void {
    this.logsLoading.set(true);
    this.schedulerService.getLogs(page, this.pageSize).subscribe({
      next: (result) => {
        this.logs.set(result.content);
        this.totalLogs.set(result.totalElements);
        this.currentPage.set(result.number);
        this.logsLoading.set(false);
        this.lastRefreshedAt.set(new Date());
      },
      error: () => {
        this.logsLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load crawl history',
        });
      },
    });
  }

  onPageChange(event: { first?: number }): void {
    const page = Math.floor((event.first ?? 0) / this.pageSize);
    this.loadLogs(page);
  }

  refreshSilently(): void {
    this.schedulerService.getConfig().subscribe({
      next: (config) => {
        this.applyConfig(config);
        this.lastRefreshedAt.set(new Date());
      },
    });

    this.schedulerService.getLogs(this.currentPage(), this.pageSize).subscribe({
      next: (result) => {
        this.logs.set(result.content);
        this.totalLogs.set(result.totalElements);
        this.currentPage.set(result.number);
        this.lastRefreshedAt.set(new Date());
      },
    });
  }

  saveConfig(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { enabled, frequency, runTime, dayOfWeek, timezone } = this.form.getRawValue();
    const [hourStr, minuteStr] = runTime.split(':');
    const runHour = Number(hourStr);
    const runMinute = Number(minuteStr);

    const request = {
      enabled,
      frequency,
      runHour,
      runMinute,
      dayOfWeek: frequency === 'WEEKLY' ? dayOfWeek : null,
      timezone,
    };

    this.saving.set(true);
    this.schedulerService.updateConfig(request).subscribe({
      next: (config) => {
        this.applyConfig(config);
        this.saving.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: config.enabled ? 'Automated crawl schedule updated' : 'Scheduler disabled',
        });
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message ?? 'Failed to save scheduler settings',
        });
      },
    });
  }

  runBatchCrawlNow(): void {
    this.runningNow.set(true);
    this.schedulerService.runNow().subscribe({
      next: () => {
        this.runningNow.set(false);
        this.loadConfig();
        this.loadLogs(0);
        this.messageService.add({
          severity: 'success',
          summary: 'Batch crawl complete',
          detail: 'All active competitors were processed',
        });
      },
      error: (error: HttpErrorResponse) => {
        this.runningNow.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Batch crawl failed',
          detail: error.error?.message ?? 'Failed to run batch crawl',
        });
      },
    });
  }

  isWeekly(): boolean {
    return this.form.controls.frequency.value === 'WEEKLY';
  }

  triggerLabel(type: CrawlTriggerType): string {
    return type === 'MANUAL' ? 'Manual' : 'Scheduled';
  }

  statusLabel(status: CrawlLogStatus): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  statusSeverity(status: CrawlLogStatus): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch (status) {
      case 'DONE':
        return 'success';
      case 'RUNNING':
        return 'info';
      case 'FAILED':
        return 'danger';
      case 'SKIPPED':
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

  duration(log: CrawlLog): string {
    if (!log.finishedAt) {
      return '—';
    }
    const ms = new Date(log.finishedAt).getTime() - new Date(log.startedAt).getTime();
    if (ms < 1000) {
      return `${ms}ms`;
    }
    return `${Math.round(ms / 1000)}s`;
  }

  private applyConfig(config: ScheduleConfig): void {
    const runTime = `${String(config.runHour).padStart(2, '0')}:${String(config.runMinute).padStart(2, '0')}`;
    this.form.patchValue({
      enabled: config.enabled,
      frequency: config.frequency,
      runTime,
      dayOfWeek: config.dayOfWeek ?? 1,
      timezone: config.timezone,
    });
    this.cronDescription.set(config.cronDescription);
    this.lastRunAt.set(config.lastRunAt);
    this.nextFireAt.set(config.nextFireAt);
    this.triggerRegistered.set(config.triggerRegistered);
    this.configLoading.set(false);
  }
}
