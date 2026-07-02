import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../../core/services/auth.service';

interface RegisterBenefit {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    MessageModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly benefits: RegisterBenefit[] = [
    {
      icon: 'pi pi-users',
      title: 'Add competitors in minutes',
      description: 'Track websites, pricing pages, blogs, social profiles, ads, and press releases.',
    },
    {
      icon: 'pi pi-sync',
      title: 'Automated monitoring',
      description: 'Schedule crawls and get diffs when competitors change what matters.',
    },
    {
      icon: 'pi pi-bolt',
      title: 'AI response playbooks',
      description: 'AI generates battlecards, campaign ideas, and objection-handling notes.',
    },
    {
      icon: 'pi pi-envelope',
      title: 'Alerts & weekly reports',
      description: 'High-urgency emails plus scheduled intelligence summaries for your team.',
    },
  ];

  readonly onboardingSteps = [
    'Create your account',
    'Add competitors and source URLs',
    'Run your first crawl',
    'Review AI insights on the dashboard',
  ];

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(error.error?.message ?? 'Registration failed. Please try again.');
      },
    });
  }
}
