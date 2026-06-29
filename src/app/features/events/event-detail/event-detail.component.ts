import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { EventService } from '../../../core/services/event.service';
import {
  AnalysisStatus,
  CompetitorEventDetail,
  GeneratedResponse,
  RESPONSE_FIELDS,
  ResponseField,
  RiskLevel,
} from '../../../core/models/event.models';
import { SOURCE_TYPES, SourceType } from '../../../core/models/competitor.models';

@Component({
  selector: 'app-event-detail',
  imports: [RouterLink, ButtonModule, CardModule, TagModule, MessageModule, ToastModule],
  providers: [MessageService],
  templateUrl: './event-detail.component.html',
  styleUrl: './event-detail.component.scss',
})
export class EventDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly eventService = inject(EventService);
  private readonly messageService = inject(MessageService);

  readonly loading = signal(true);
  readonly regenerating = signal(false);
  readonly event = signal<CompetitorEventDetail | null>(null);
  readonly sourceTypes = SOURCE_TYPES;
  readonly responseFields = RESPONSE_FIELDS;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.loading.set(false);
      return;
    }
    this.loadEvent(id);
  }

  loadEvent(id: number): void {
    this.loading.set(true);
    this.eventService.getDetail(id).subscribe({
      next: (detail) => {
        this.event.set(detail);
        this.loading.set(false);
        this.ensureResponses(detail);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  private ensureResponses(detail: CompetitorEventDetail): void {
    if (detail.analysisStatus !== 'DONE' || this.regenerating()) {
      return;
    }

    const response = detail.generatedResponse;
    if (response?.status === 'DONE') {
      return;
    }

    this.regenerating.set(true);
    this.eventService.regenerateResponses(detail.id).subscribe({
      next: (updated) => {
        this.event.set(updated);
        this.regenerating.set(false);
      },
      error: () => {
        this.regenerating.set(false);
      },
    });
  }

  regenerateResponses(): void {
    const item = this.event();
    if (!item || this.regenerating()) {
      return;
    }

    this.regenerating.set(true);
    this.eventService.regenerateResponses(item.id).subscribe({
      next: (detail) => {
        this.event.set(detail);
        this.regenerating.set(false);
        const response = detail.generatedResponse;
        if (response?.status === 'FAILED') {
          this.messageService.add({
            severity: 'error',
            summary: 'Regeneration failed',
            detail: response.errorMessage ?? 'Gemini could not regenerate responses. Try again in a minute.',
          });
          return;
        }
        if (response?.errorMessage) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Regeneration failed',
            detail: `${response.errorMessage} Showing the previous version.`,
          });
          return;
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Responses regenerated',
          detail: 'All six response types were refreshed.',
        });
      },
      error: () => {
        this.regenerating.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Regeneration failed',
          detail: 'Could not regenerate responses. Try again.',
        });
      },
    });
  }

  responseValue(response: GeneratedResponse, field: ResponseField): string | null {
    return response[field.key];
  }

  copyResponse(text: string | null, label: string): void {
    if (!text) {
      return;
    }

    navigator.clipboard.writeText(text).then(
      () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Copied',
          detail: `${label} copied to clipboard.`,
          life: 2000,
        });
      },
      () => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Copy failed',
          detail: 'Could not access clipboard.',
        });
      }
    );
  }

  sourceTypeLabel(type: SourceType): string {
    return this.sourceTypes.find((item) => item.value === type)?.label ?? type;
  }

  riskSeverity(level: RiskLevel | null): 'success' | 'warn' | 'danger' | 'secondary' {
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

  statusSeverity(status: AnalysisStatus): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch (status) {
      case 'DONE':
        return 'success';
      case 'FAILED':
        return 'danger';
      case 'PENDING':
        return 'info';
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
