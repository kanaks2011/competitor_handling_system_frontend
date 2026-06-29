import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OpsProbeResponse, OpsStatus } from '../models/ops.models';

@Injectable({ providedIn: 'root' })
export class OpsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/ops`;

  getStatus(): Observable<OpsStatus> {
    return this.http.get<OpsStatus>(`${this.baseUrl}/status`);
  }

  probeDependencies(): Observable<OpsProbeResponse> {
    return this.http.post<OpsProbeResponse>(`${this.baseUrl}/probe`, null);
  }
}
