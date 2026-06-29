import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AlertFilter, AlertSummary, Page, UnreadAlertCount } from '../models/alert.models';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/alerts`;

  list(status: AlertFilter = 'ALL', page = 0, size = 20, competitorId?: number): Observable<Page<AlertSummary>> {
    let params = new HttpParams()
      .set('status', status)
      .set('page', page)
      .set('size', size)
      .set('sort', 'createdAt,desc');

    if (competitorId != null) {
      params = params.set('competitorId', competitorId);
    }

    return this.http.get<Page<AlertSummary>>(this.baseUrl, { params });
  }

  getUnreadCount(): Observable<UnreadAlertCount> {
    return this.http.get<UnreadAlertCount>(`${this.baseUrl}/unread-count`);
  }

  getRecentUnread(limit = 10): Observable<AlertSummary[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<AlertSummary[]>(`${this.baseUrl}/recent`, { params });
  }

  markAsRead(id: number): Observable<AlertSummary> {
    return this.http.patch<AlertSummary>(`${this.baseUrl}/${id}/read`, null);
  }

  markAsDismissed(id: number): Observable<AlertSummary> {
    return this.http.patch<AlertSummary>(`${this.baseUrl}/${id}/dismiss`, null);
  }

  markAllAsRead(): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/read-all`, null);
  }
}
