import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AlertService } from '../../core/services/alert.service';
import { ALERT_FILTER_OPTIONS, AlertFilter, AlertSummary } from '../../core/models/alert.models';

@Component({
  selector: 'app-alerts',
  imports: [
    FormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    SelectModule,
    TableModule,
    TagModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './alerts.component.html',
  styleUrl: './alerts.component.scss',
})
export class AlertsComponent implements OnInit {
  private readonly alertService = inject(AlertService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  readonly filterOptions = ALERT_FILTER_OPTIONS;
  readonly selectedFilter = signal<AlertFilter>('UNREAD');
  readonly alerts = signal<AlertSummary[]>([]);
  readonly totalRecords = signal(0);
  readonly loading = signal(true);
  readonly page = signal(0);
  readonly pageSize = signal(20);

  ngOnInit(): void {
    this.loadAlerts();
  }

  loadAlerts(page = this.page()): void {
    this.loading.set(true);
    this.page.set(page);
    this.alertService.list(this.selectedFilter(), page, this.pageSize()).subscribe({
      next: (result) => {
        this.alerts.set(result.content);
        this.totalRecords.set(result.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onFilterChange(value: AlertFilter): void {
    this.selectedFilter.set(value);
    this.loadAlerts(0);
  }

  onPageChange(event: TableLazyLoadEvent): void {
    const rows = event.rows ?? this.pageSize();
    const page = Math.floor((event.first ?? 0) / rows);
    this.pageSize.set(rows);
    this.loadAlerts(page);
  }

  openAlert(alert: AlertSummary): void {
    if (alert.unread) {
      this.alertService.markAsRead(alert.id).subscribe({
        next: () => this.router.navigate(['/events', alert.competitorEventId]),
        error: () => this.router.navigate(['/events', alert.competitorEventId]),
      });
      return;
    }
    this.router.navigate(['/events', alert.competitorEventId]);
  }

  markAsRead(alert: AlertSummary, event: Event): void {
    event.stopPropagation();
    this.alertService.markAsRead(alert.id).subscribe({
      next: () => {
        this.loadAlerts();
        this.messageService.add({ severity: 'success', summary: 'Marked as read', life: 2000 });
      },
    });
  }

  dismissAlert(alert: AlertSummary, event: Event): void {
    event.stopPropagation();
    this.alertService.markAsDismissed(alert.id).subscribe({
      next: () => {
        this.loadAlerts();
        this.messageService.add({ severity: 'info', summary: 'Alert dismissed', life: 2000 });
      },
    });
  }

  markAllRead(): void {
    this.alertService.markAllAsRead().subscribe({
      next: () => {
        this.loadAlerts();
        this.messageService.add({ severity: 'success', summary: 'All alerts marked as read' });
      },
    });
  }

  formatDate(value: string | null): string {
    if (!value) {
      return '—';
    }
    return new Date(value).toLocaleString();
  }

  statusLabel(alert: AlertSummary): string {
    if (alert.dismissedAt) {
      return 'Dismissed';
    }
    if (alert.readAt) {
      return 'Read';
    }
    return 'Unread';
  }

  statusSeverity(alert: AlertSummary): 'danger' | 'success' | 'secondary' | 'info' {
    if (alert.dismissedAt) {
      return 'secondary';
    }
    if (alert.readAt) {
      return 'success';
    }
    return 'danger';
  }
}
