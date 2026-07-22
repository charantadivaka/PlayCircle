import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PlayRequest } from '../models/play-request.model';

@Injectable({ providedIn: 'root' })
export class RequestService {
  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  sendRequest(to: string, sport: string, message = '') {
    return this.http.post<{ playRequest: PlayRequest }>(`${this.API}/requests`, { to, sport, message });
  }

  listRequests() {
    return this.http.get<{ incoming: PlayRequest[]; outgoing: PlayRequest[] }>(`${this.API}/requests`);
  }

  respondToRequest(id: string, status: 'accepted' | 'declined') {
    return this.http.patch<{ playRequest: PlayRequest; conversation: any }>(`${this.API}/requests/${id}`, { status });
  }
}
