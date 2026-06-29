import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { interval } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { OpsService } from '../../core/services/ops.service';
import {
  DependencyInfo,
  DependencyProbeResult,
  DependencyStatus,
  OpsOverallStatus,
  OpsStatus,
} from '../../core/models/ops.models';
import { CrawlLogStatus } from '../../core/models/scheduler.models';

const AUTO_REFRESH_MS = 30_000;

@Component({
  selector: 'app-ops',
  imports: [RouterLink, ButtonModule, CardModule, TagModule, MessageModule, ToastModule],
  providers: [MessageService],
  templateUrl: './ops.component.html',
  styleUrl: './ops.component.scss',
})
export class OpsComponent implements OnInit {
  private readonly opsService = inject(OpsService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly probing = signal(false);
  readonly status = signal<OpsStatus | null>(null);
  readonly probeResults = signal<DependencyProbeResult[]>([]);

  ngOnInit(): void {
    this.loadStatus();
    interval(AUTO_REFRESH_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadStatus(false));
  }

  loadStatus(showLoading = true): void {
    if (showLoading) {
      this.loading.set(true);
    }
    this.opsService.getStatus().subscribe({
      next: (value) => {
        this.status.set(value);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  probeDependencies(): void {
    this.probing.set(true);
    this.opsService.probeDependencies().subscribe({
      next: (response) => {
        this.probeResults.set(response.results);
        this.probing.set(false);
        const failed = response.results.some((item) => !item.reachable);
        this.messageService.add({
          severity: failed ? 'warn' : 'success',
          summary: failed ? 'Probe completed with issues' : 'All probes passed',
          detail: failed
            ? 'One or more live connection checks failed.'
            : 'External dependencies responded successfully.',
        });
      },
      error: () => {
        this.probing.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Probe failed',
          detail: 'Could not run dependency probes.',
        });
      },
    });
  }

  overallSeverity(status: OpsOverallStatus): 'success' | 'warn' | 'danger' {
    switch (status) {
      case 'OK':
        return 'success';
      case 'DEGRADED':
        return 'warn';
      case 'ERROR':
        return 'danger';
    }
  }

  dependencySeverity(status: DependencyStatus): 'success' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'OK':
        return 'success';
      case 'WARNING':
        return 'warn';
      case 'ERROR':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  crawlSeverity(status: CrawlLogStatus): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch (status) {
      case 'DONE':
        return 'success';
      case 'FAILED':
        return 'danger';
      case 'RUNNING':
        return 'info';
      case 'SKIPPED':
        return 'warn';
      default:
        return 'secondary';
    }
  }

  metricSeverity(count: number): 'success' | 'warn' | 'danger' {
    if (count === 0) {
      return 'success';
    }
    return 'warn';
  }

  failedMetricSeverity(count: number): 'success' | 'warn' | 'danger' {
    if (count === 0) {
      return 'success';
    }
    return 'danger';
  }

  formatDate(value: string | null): string {
    if (!value) {
      return '—';
    }
    return new Date(value).toLocaleString();
  }

  dependencyLabel(dependency: DependencyInfo): string {
    return dependency.name.charAt(0).toUpperCase() + dependency.name.slice(1);
  }
}
