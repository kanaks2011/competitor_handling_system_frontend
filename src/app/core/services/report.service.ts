import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page, WeeklyReportConfig, WeeklyReportDetail, WeeklyReportSummary, UpdateWeeklyReportConfigRequest } from '../models/report.models';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/reports/weekly`;

  list(page = 0, size = 20): Observable<Page<WeeklyReportSummary>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'createdAt,desc');
    return this.http.get<Page<WeeklyReportSummary>>(this.baseUrl, { params });
  }

  getDetail(id: number): Observable<WeeklyReportDetail> {
    return this.http.get<WeeklyReportDetail>(`${this.baseUrl}/${id}`);
  }

  generateNow(): Observable<WeeklyReportDetail> {
    return this.http.post<WeeklyReportDetail>(`${this.baseUrl}/generate`, null);
  }

  getConfig(): Observable<WeeklyReportConfig> {
    return this.http.get<WeeklyReportConfig>(`${this.baseUrl}/config`);
  }

  updateConfig(request: UpdateWeeklyReportConfigRequest): Observable<WeeklyReportConfig> {
    return this.http.put<WeeklyReportConfig>(`${this.baseUrl}/config`, request);
  }
}
