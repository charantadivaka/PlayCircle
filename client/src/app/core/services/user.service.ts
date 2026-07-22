import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getNearbyPlayers(lat: number, lng: number, radius = 10, sport = 'All') {
    let params: any = { lat, lng, radius };
    if (sport && sport !== 'All') params['sport'] = sport;
    return this.http.get<{ players: User[] }>(`${this.API}/users/nearby`, { params });
  }

  getUserById(id: string) {
    return this.http.get<{ user: User }>(`${this.API}/users/${id}`);
  }

  updateProfile(formData: FormData) {
    return this.http.patch<{ user: User }>(`${this.API}/users/profile`, formData);
  }

  updateLocation(lng: number, lat: number) {
    return this.http.patch(`${this.API}/users/location`, { lng, lat });
  }
}
