import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CompetitorEventDetail, CompetitorEventSummary, Page } from '../models/event.models';

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/events`;

  listByCompetitor(competitorId: number, page = 0, size = 10): Observable<Page<CompetitorEventSummary>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'createdAt,desc');
    return this.http.get<Page<CompetitorEventSummary>>(`${this.baseUrl}/competitors/${competitorId}`, {
      params,
    });
  }

  getDetail(id: number): Observable<CompetitorEventDetail> {
    return this.http.get<CompetitorEventDetail>(`${this.baseUrl}/${id}`);
  }

  getByChange(detectedChangeId: number): Observable<CompetitorEventDetail> {
    return this.http.get<CompetitorEventDetail>(`${this.baseUrl}/by-change/${detectedChangeId}`);
  }

  analyzeChange(detectedChangeId: number): Observable<CompetitorEventDetail> {
    return this.http.post<CompetitorEventDetail>(`${this.baseUrl}/analyze/${detectedChangeId}`, null);
  }

  regenerateResponses(eventId: number): Observable<CompetitorEventDetail> {
    return this.http.post<CompetitorEventDetail>(`${this.baseUrl}/${eventId}/responses/regenerate`, null);
  }
}
