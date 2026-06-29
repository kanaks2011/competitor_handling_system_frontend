import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'competitors',
        loadComponent: () =>
          import('./features/competitors/competitor-list/competitor-list.component').then(
            (m) => m.CompetitorListComponent,
          ),
      },
      {
        path: 'competitors/new',
        loadComponent: () =>
          import('./features/competitors/competitor-form/competitor-form.component').then(
            (m) => m.CompetitorFormComponent,
          ),
      },
      {
        path: 'competitors/:id',
        loadComponent: () =>
          import('./features/competitors/competitor-detail/competitor-detail.component').then(
            (m) => m.CompetitorDetailComponent,
          ),
      },
      {
        path: 'scheduler',
        loadComponent: () =>
          import('./features/scheduler/scheduler.component').then((m) => m.SchedulerComponent),
      },
      {
        path: 'events/:id',
        loadComponent: () =>
          import('./features/events/event-detail/event-detail.component').then((m) => m.EventDetailComponent),
      },
      {
        path: 'alerts',
        loadComponent: () =>
          import('./features/alerts/alerts.component').then((m) => m.AlertsComponent),
      },
      {
        path: 'recipients',
        loadComponent: () =>
          import('./features/recipients/recipients.component').then((m) => m.RecipientsComponent),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/reports.component').then((m) => m.ReportsComponent),
      },
      {
        path: 'reports/:id',
        loadComponent: () =>
          import('./features/reports/report-detail/report-detail.component').then((m) => m.ReportDetailComponent),
      },
      {
        path: 'system',
        loadComponent: () =>
          import('./features/ops/ops.component').then((m) => m.OpsComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
