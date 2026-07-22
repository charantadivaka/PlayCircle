import { Injectable, signal } from '@angular/core';
import { SocketService } from './socket.service';

export interface Coords {
  lng: number;
  lat: number;
}

@Injectable({ providedIn: 'root' })
export class LocationService {
  coords = signal<Coords | null>(null);
  permissionDenied = signal<boolean>(false);

  private watchId: number | null = null;

  constructor(private socketService: SocketService) {}

  requestAndWatch(): Promise<Coords> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject('Geolocation not supported');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: Coords = {
            lng: pos.coords.longitude,
            lat: pos.coords.latitude,
          };
          this.coords.set(coords);
          this.socketService.updateLocation(coords.lng, coords.lat);
          resolve(coords);

          // Continue watching for updates
          this.startWatching();
        },
        (err) => {
          this.permissionDenied.set(true);
          reject(err.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  private startWatching() {
    if (this.watchId !== null) return;
    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: Coords = {
          lng: pos.coords.longitude,
          lat: pos.coords.latitude,
        };
        this.coords.set(coords);
        this.socketService.updateLocation(coords.lng, coords.lat);
      },
      () => {},
      { enableHighAccuracy: true }
    );
  }

  stopWatching() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }
}
