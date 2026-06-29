import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { RecipientService } from '../../core/services/recipient.service';
import { NotificationRecipient } from '../../core/models/recipient.models';

@Component({
  selector: 'app-recipients',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    CardModule,
    DialogModule,
    InputTextModule,
    TableModule,
    TagModule,
    ToggleSwitchModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './recipients.component.html',
  styleUrl: './recipients.component.scss',
})
export class RecipientsComponent implements OnInit {
  private readonly recipientService = inject(RecipientService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);

  readonly recipients = signal<NotificationRecipient[]>([]);
  readonly loading = signal(true);
  readonly dialogVisible = signal(false);
  readonly saving = signal(false);
  readonly updatingId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    name: ['', Validators.maxLength(200)],
    alertEnabled: [true],
    weeklyReportEnabled: [true],
  });

  ngOnInit(): void {
    this.loadRecipients();
  }

  loadRecipients(): void {
    this.loading.set(true);
    this.recipientService.list().subscribe({
      next: (items) => {
        this.recipients.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openDialog(): void {
    this.form.reset({
      email: '',
      name: '',
      alertEnabled: true,
      weeklyReportEnabled: true,
    });
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
  }

  saveRecipient(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const value = this.form.getRawValue();
    this.recipientService
      .create({
        email: value.email.trim(),
        name: value.name.trim() || null,
        alertEnabled: value.alertEnabled,
        weeklyReportEnabled: value.weeklyReportEnabled,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.dialogVisible.set(false);
          this.loadRecipients();
          this.messageService.add({ severity: 'success', summary: 'Recipient added' });
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Failed to add recipient',
            detail: error.error?.message ?? 'Could not save recipient',
          });
        },
      });
  }

  updateToggle(
    recipient: NotificationRecipient,
    field: 'alertEnabled' | 'weeklyReportEnabled' | 'active',
    value: boolean,
  ): void {
    this.updatingId.set(recipient.id);
    this.recipientService.update(recipient.id, { [field]: value }).subscribe({
      next: (updated) => {
        this.recipients.update((items) =>
          items.map((item) => (item.id === updated.id ? updated : item)),
        );
        this.updatingId.set(null);
      },
      error: (error: HttpErrorResponse) => {
        this.updatingId.set(null);
        this.loadRecipients();
        this.messageService.add({
          severity: 'error',
          summary: 'Update failed',
          detail: error.error?.message ?? 'Could not update recipient',
        });
      },
    });
  }

  confirmDelete(recipient: NotificationRecipient): void {
    this.confirmationService.confirm({
      header: 'Remove recipient',
      message: `Stop sending notifications to ${recipient.email}?`,
      accept: () => {
        this.recipientService.delete(recipient.id).subscribe({
          next: () => {
            this.loadRecipients();
            this.messageService.add({ severity: 'info', summary: 'Recipient removed', life: 2000 });
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Failed to remove recipient' });
          },
        });
      },
    });
  }

  isUpdating(id: number): boolean {
    return this.updatingId() === id;
  }
}
