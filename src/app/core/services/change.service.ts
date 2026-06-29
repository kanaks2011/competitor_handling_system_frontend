import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ChangeFilters,
  DetectedChangeDetail,
  DetectedChangeSummary,
  Page,
} from '../models/change.models';

@Injectable({ providedIn: 'root' })
export class ChangeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/changes`;

  listByCompetitor(
    competitorId: number,
    page = 0,
    size = 10,
    filters: ChangeFilters = {},
  ): Observable<Page<DetectedChangeSummary>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'detectedAt,desc');

    if (filters.sourceType) {
      params = params.set('sourceType', filters.sourceType);
    }
    if (filters.fromDate) {
      params = params.set('fromDate', filters.fromDate);
    }
    if (filters.toDate) {
      params = params.set('toDate', filters.toDate);
    }
    if (filters.significantOnly) {
      params = params.set('significantOnly', 'true');
    }
    if (filters.includeNoChange) {
      params = params.set('includeNoChange', 'true');
    }

    return this.http.get<Page<DetectedChangeSummary>>(
      `${this.baseUrl}/competitors/${competitorId}`,
      { params },
    );
  }

  getDetail(id: number): Observable<DetectedChangeDetail> {
    return this.http.get<DetectedChangeDetail>(`${this.baseUrl}/${id}`);
  }
}
