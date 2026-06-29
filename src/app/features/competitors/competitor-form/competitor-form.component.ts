import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageModule } from 'primeng/message';
import { CompetitorService } from '../../../core/services/competitor.service';

@Component({
  selector: 'app-competitor-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    InputTextModule,
    TextareaModule,
    ToggleSwitchModule,
    MessageModule,
  ],
  templateUrl: './competitor-form.component.html',
  styleUrl: './competitor-form.component.scss',
})
export class CompetitorFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly competitorService = inject(CompetitorService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    websiteUrl: ['', Validators.maxLength(500)],
    description: ['', Validators.maxLength(2000)],
    active: [true],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const value = this.form.getRawValue();
    this.competitorService
      .create({
        name: value.name,
        websiteUrl: value.websiteUrl || undefined,
        description: value.description || undefined,
        active: value.active,
      })
      .subscribe({
        next: (created) => {
          this.loading.set(false);
          this.router.navigate(['/competitors', created.id]);
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          this.errorMessage.set(error.error?.message ?? 'Failed to create competitor');
        },
      });
  }
}
