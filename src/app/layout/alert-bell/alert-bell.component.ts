import { Component, DestroyRef, OnInit, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { Popover, PopoverModule } from 'primeng/popover';
import { TagModule } from 'primeng/tag';
import { AlertService } from '../../core/services/alert.service';
import { AlertSummary } from '../../core/models/alert.models';

const POLL_MS = 30_000;

@Component({
  selector: 'app-alert-bell',
  imports: [ButtonModule, PopoverModule, TagModule, RouterLink],
  templateUrl: './alert-bell.component.html',
  styleUrl: './alert-bell.component.scss',
})
export class AlertBellComponent implements OnInit {
  private readonly alertService = inject(AlertService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly popover = viewChild.required<Popover>('alertPopover');
  readonly unreadCount = signal(0);
  readonly recentAlerts = signal<AlertSummary[]>([]);
  readonly loadingRecent = signal(false);

  ngOnInit(): void {
    this.refreshUnreadCount();
    interval(POLL_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshUnreadCount());
  }

  togglePanel(event: Event): void {
    this.popover().toggle(event);
    this.loadRecent();
  }

  refreshUnreadCount(): void {
    this.alertService.getUnreadCount().subscribe({
      next: (result) => this.unreadCount.set(result.count),
    });
  }

  loadRecent(): void {
    this.loadingRecent.set(true);
    this.alertService.getRecentUnread(8).subscribe({
      next: (alerts) => {
        this.recentAlerts.set(alerts);
        this.loadingRecent.set(false);
      },
      error: () => this.loadingRecent.set(false),
    });
  }

  openAlert(alert: AlertSummary): void {
    this.popover().hide();
    this.alertService.markAsRead(alert.id).subscribe({
      next: () => {
        this.refreshUnreadCount();
        this.router.navigate(['/events', alert.competitorEventId]);
      },
      error: () => this.router.navigate(['/events', alert.competitorEventId]),
    });
  }

  markAllRead(): void {
    this.alertService.markAllAsRead().subscribe({
      next: () => {
        this.refreshUnreadCount();
        this.loadRecent();
      },
    });
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleString();
  }
}
