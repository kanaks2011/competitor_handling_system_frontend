import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CompetitorDetail,
  CompetitorSummary,
  CreateCompetitorRequest,
  CreateSourceRequest,
  Source,
  UpdateCompetitorRequest,
  UpdateSourceRequest,
} from '../models/competitor.models';

@Injectable({ providedIn: 'root' })
export class CompetitorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/competitors`;

  list(): Observable<CompetitorSummary[]> {
    return this.http.get<CompetitorSummary[]>(this.baseUrl);
  }

  get(id: number): Observable<CompetitorDetail> {
    return this.http.get<CompetitorDetail>(`${this.baseUrl}/${id}`);
  }

  create(request: CreateCompetitorRequest): Observable<CompetitorDetail> {
    return this.http.post<CompetitorDetail>(this.baseUrl, request);
  }

  update(id: number, request: UpdateCompetitorRequest): Observable<CompetitorDetail> {
    return this.http.put<CompetitorDetail>(`${this.baseUrl}/${id}`, request);
  }

  updateStatus(id: number, active: boolean): Observable<CompetitorDetail> {
    return this.http.patch<CompetitorDetail>(`${this.baseUrl}/${id}/status`, { active });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  addSource(competitorId: number, request: CreateSourceRequest): Observable<Source> {
    return this.http.post<Source>(`${this.baseUrl}/${competitorId}/sources`, request);
  }

  updateSource(
    competitorId: number,
    sourceId: number,
    request: UpdateSourceRequest,
  ): Observable<Source> {
    return this.http.put<Source>(`${this.baseUrl}/${competitorId}/sources/${sourceId}`, request);
  }

  deleteSource(competitorId: number, sourceId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${competitorId}/sources/${sourceId}`);
  }
}
