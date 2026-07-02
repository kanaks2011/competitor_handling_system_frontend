import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../../core/services/auth.service';

interface LoginFeature {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    MessageModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly features: LoginFeature[] = [
    {
      icon: 'pi pi-globe',
      title: 'Track every touchpoint',
      description: 'Websites, pricing, blogs, social pages, ads, and press — all in one place.',
    },
    {
      icon: 'pi pi-sparkles',
      title: 'AI-powered analysis',
      description: 'AI turns page diffs into urgency, risk, messaging, and positioning insights.',
    },
    {
      icon: 'pi pi-bell',
      title: 'Instant high-urgency alerts',
      description: 'Email and in-app notifications when a competitor move needs immediate attention.',
    },
    {
      icon: 'pi pi-file-export',
      title: 'Weekly intelligence reports',
      description: 'Scheduled summaries with events grouped by competitor, sorted by impact.',
    },
  ];

  readonly workflowSteps = [
    'Crawl competitor URLs on your schedule',
    'Detect meaningful page changes automatically',
    'Analyze with AI and generate response playbooks',
    'Alert the team and act before the market shifts',
  ];

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(error.error?.message ?? 'Login failed. Please try again.');
      },
    });
  }
}
