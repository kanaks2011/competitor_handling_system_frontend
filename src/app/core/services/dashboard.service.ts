import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CompetitorHealth,
  CompetitorIntelligence,
  DashboardSummary,
  EventFeedItem,
  Page,
} from '../models/dashboard.models';
import { RiskLevel } from '../models/event.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dashboard`;

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.baseUrl}/summary`);
  }

  getFeed(
    page = 0,
    size = 10,
    competitorId?: number,
    urgencyLevel?: RiskLevel | null,
    fromDate?: string,
    toDate?: string,
  ): Observable<Page<EventFeedItem>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (competitorId != null) {
      params = params.set('competitorId', competitorId);
    }
    if (urgencyLevel) {
      params = params.set('urgencyLevel', urgencyLevel);
    }
    if (fromDate) {
      params = params.set('fromDate', fromDate);
    }
    if (toDate) {
      params = params.set('toDate', toDate);
    }

    return this.http.get<Page<EventFeedItem>>(`${this.baseUrl}/feed`, { params });
  }

  getCompetitorHealth(): Observable<CompetitorHealth[]> {
    return this.http.get<CompetitorHealth[]>(`${this.baseUrl}/competitor-health`);
  }

  getCompetitorIntelligence(competitorId: number): Observable<CompetitorIntelligence> {
    return this.http.get<CompetitorIntelligence>(`${this.baseUrl}/competitors/${competitorId}/intelligence`);
  }
}
