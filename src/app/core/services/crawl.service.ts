import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CrawlJobResponse } from '../models/crawl.models';

@Injectable({ providedIn: 'root' })
export class CrawlService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/crawl`;

  runCrawl(competitorId: number): Observable<CrawlJobResponse> {
    return this.http.post<CrawlJobResponse>(`${this.baseUrl}/run/${competitorId}`, {});
  }

  getLatest(competitorId: number): Observable<CrawlJobResponse> {
    return this.http.get<CrawlJobResponse>(`${this.baseUrl}/competitors/${competitorId}/latest`);
  }
}
