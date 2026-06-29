import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateNotificationRecipientRequest,
  NotificationRecipient,
  UpdateNotificationRecipientRequest,
} from '../models/recipient.models';

@Injectable({ providedIn: 'root' })
export class RecipientService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/recipients`;

  list(): Observable<NotificationRecipient[]> {
    return this.http.get<NotificationRecipient[]>(this.baseUrl);
  }

  create(request: CreateNotificationRecipientRequest): Observable<NotificationRecipient> {
    return this.http.post<NotificationRecipient>(this.baseUrl, request);
  }

  update(id: number, request: UpdateNotificationRecipientRequest): Observable<NotificationRecipient> {
    return this.http.put<NotificationRecipient>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
