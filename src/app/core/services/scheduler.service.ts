import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CrawlLog,
  Page,
  ScheduleConfig,
  UpdateScheduleConfigRequest,
} from '../models/scheduler.models';

@Injectable({ providedIn: 'root' })
export class SchedulerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/scheduler`;

  getConfig(): Observable<ScheduleConfig> {
    return this.http.get<ScheduleConfig>(`${this.baseUrl}/config`);
  }

  updateConfig(request: UpdateScheduleConfigRequest): Observable<ScheduleConfig> {
    return this.http.put<ScheduleConfig>(`${this.baseUrl}/config`, request);
  }

  runNow(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/run-now`, null);
  }

  getLogs(page = 0, size = 10): Observable<Page<CrawlLog>> {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', 'startedAt,desc');
    return this.http.get<Page<CrawlLog>>(`${this.baseUrl}/logs`, { params });
  }
}
