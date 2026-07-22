import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { LocationService, Coords } from '../../core/services/location.service';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/models/user.model';
import { PlayerCardComponent } from '../../shared/components/player-card/player-card.component';
import { Router } from '@angular/router';

// Fix leaflet default icon issue with angular
const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';
const iconDefault = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, PlayerCardComponent],
  template: `
    <div class="dashboard-layout">
      <!-- Sidebar / List View -->
      <aside class="sidebar glass animate-slide-in">
        <div class="sidebar-header">
          <h2>Nearby Players</h2>
          
          <div class="filters mt-4">
            <div class="form-group">
              <label for="sportFilter">Sport Filter</label>
              <select id="sportFilter" [(ngModel)]="selectedSport" (change)="fetchPlayers()">
                <option value="All">All Sports</option>
                <option *ngFor="let s of sportsOptions" [value]="s">{{ s }}</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="radiusFilter">Radius ({{ selectedRadius }}km)</label>
              <input type="range" id="radiusFilter" min="1" max="50" [(ngModel)]="selectedRadius" (change)="fetchPlayers()" class="w-full" />
            </div>
          </div>
        </div>
        
        <div class="sidebar-content">
          <div *ngIf="isLoading" class="loading-center">
            <div class="spinner"></div>
          </div>
          
          <div *ngIf="!isLoading && locationDenied" class="p-4 text-center">
            <div class="text-danger font-bold mb-2">Location Required</div>
            <p class="text-sm text-muted mb-4">Please enable location permissions in your browser to find players nearby.</p>
            <button class="btn btn-outline btn-sm" (click)="requestLocation()">Try Again</button>
          </div>
          
          <div *ngIf="!isLoading && !locationDenied && players().length === 0" class="p-4 text-center">
            <p class="text-muted">No players found within {{ selectedRadius }}km.</p>
          </div>
          
          <div class="players-list" *ngIf="!isLoading && players().length > 0">
            <div *ngFor="let p of players()" class="player-list-item" (mouseenter)="highlightMarker(p._id)" (mouseleave)="unhighlightMarker(p._id)">
              <app-player-card 
                [player]="p" 
                [showActions]="true" 
                actionText="View Profile"
                (onAction)="viewProfile($event)">
              </app-player-card>
            </div>
          </div>
        </div>
      </aside>

      <!-- Map View -->
      <main class="map-container">
        <div id="map" #mapElement></div>
        <div class="location-btn" (click)="recenterMap()" title="Recenter on me">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
          </svg>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .dashboard-layout { display: flex; height: calc(100vh - 64px); }
    .sidebar { width: 380px; display: flex; flex-direction: column; border-top: none; border-bottom: none; border-left: none; border-radius: 0; background: var(--color-surface); z-index: 10; }
    .sidebar-header { padding: 24px; border-bottom: 1px solid var(--color-border); }
    .sidebar-content { flex: 1; overflow-y: auto; }
    .players-list { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
    .map-container { flex: 1; position: relative; }
    #map { width: 100%; height: 100%; z-index: 1; }
    .location-btn { position: absolute; bottom: 32px; right: 32px; width: 50px; height: 50px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 400; box-shadow: var(--shadow-lg); transition: var(--transition); color: var(--color-primary); }
    .location-btn:hover { background: var(--color-primary); color: #0a1628; transform: translateY(-2px); }
    
    @media (max-width: 768px) {
      .dashboard-layout { flex-direction: column; }
      .sidebar { width: 100%; height: 50vh; order: 2; border-right: none; border-top: 1px solid var(--color-border); }
      .map-container { height: 50vh; order: 1; }
    }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapElement') mapElement!: ElementRef;
  
  private map: L.Map | null = null;
  private markers: Map<string, L.Marker> = new Map();
  private userMarker: L.Marker | null = null;
  private radiusCircle: L.Circle | null = null;

  sportsOptions = ['Cricket', 'Football', 'Badminton', 'Volleyball', 'Basketball', 'Tennis', 'Chess', 'Table Tennis', 'Running', 'Cycling'];
  selectedSport = 'All';
  selectedRadius = 10;
  
  players = signal<User[]>([]);
  isLoading = true;
  locationDenied = false;
  myCoords: Coords | null = null;

  constructor(
    private locationService: LocationService, 
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    this.requestLocation();
  }

  ngAfterViewInit() {
    this.initMap();
  }
  
  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  requestLocation() {
    this.isLoading = true;
    this.locationDenied = false;
    this.locationService.requestAndWatch().then((coords: any) => {
      this.myCoords = coords;
      if (this.map) {
        this.updateUserMarker();
        this.recenterMap();
      }
      this.fetchPlayers();
    }).catch((err: any) => {
      this.isLoading = false;
      this.locationDenied = true;
      console.error(err);
    });
  }

  fetchPlayers() {
    if (!this.myCoords) return;
    this.isLoading = true;
    
    this.userService.getNearbyPlayers(
      this.myCoords.lat, 
      this.myCoords.lng, 
      this.selectedRadius, 
      this.selectedSport
    ).subscribe({
      next: (res: any) => {
        const pList = res.players;
        pList.forEach((p: User) => {
          if (p.location && p.location.coordinates) {
            const [lng, lat] = p.location.coordinates;
            p.distance = Math.round(L.latLng(lat, lng).distanceTo(L.latLng(this.myCoords!.lat, this.myCoords!.lng)));
          }
        });
        this.players.set(pList);
        this.updateMapMarkers();
        this.updateRadiusCircle();
        this.isLoading = false;
      },
      error: (err: any) => {
        this.isLoading = false;
      }
    });
  }

  private initMap() {
    // Default to a world view if location not yet loaded, or the user location
    const center: L.LatLngTuple = this.myCoords ? [this.myCoords.lat, this.myCoords.lng] : [20, 0];
    const zoom = this.myCoords ? 13 : 2;

    this.map = L.map(this.mapElement.nativeElement, {
      center,
      zoom,
      zoomControl: false // Add it manually for custom placement if needed
    });

    L.control.zoom({ position: 'topright' }).addTo(this.map);

    // Dark theme map tiles (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(this.map);

    if (this.myCoords) {
      this.updateUserMarker();
      this.updateRadiusCircle();
    }
  }

  private updateUserMarker() {
    if (!this.map || !this.myCoords) return;
    
    if (this.userMarker) {
      this.userMarker.setLatLng([this.myCoords.lat, this.myCoords.lng]);
    } else {
      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color:#00c9a7; width:20px; height:20px; border-radius:50%; border:3px solid white; box-shadow:0 0 15px rgba(0,201,167,0.8);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      
      this.userMarker = L.marker([this.myCoords.lat, this.myCoords.lng], { icon: customIcon })
        .addTo(this.map)
        .bindPopup('<b>You are here</b>');
    }
  }

  private updateRadiusCircle() {
    if (!this.map || !this.myCoords) return;
    
    if (this.radiusCircle) {
      this.map.removeLayer(this.radiusCircle);
    }
    
    this.radiusCircle = L.circle([this.myCoords.lat, this.myCoords.lng], {
      color: '#00c9a7',
      fillColor: '#00c9a7',
      fillOpacity: 0.05,
      weight: 1,
      radius: this.selectedRadius * 1000 // km to m
    }).addTo(this.map);
  }

  private updateMapMarkers() {
    if (!this.map) return;
    
    // Clear old markers
    this.markers.forEach(marker => this.map!.removeLayer(marker));
    this.markers.clear();
    
    // Add new markers
    this.players().forEach(player => {
      if (player.location && player.location.coordinates) {
        const [lng, lat] = player.location.coordinates;
        
        const avatarHtml = player.avatar 
          ? `<img src="/uploads/${player.avatar}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">` 
          : `<div style="background:var(--color-accent); color:#000; width:100%; height:100%; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold;">${player.name.charAt(0)}</div>`;
          
        const markerIcon = L.divIcon({
          className: 'player-marker',
          html: `<div style="width:36px; height:36px; border-radius:50%; border:3px solid var(--color-primary); box-shadow:0 0 10px rgba(0,0,0,0.5);">${avatarHtml}</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });
        
        const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(this.map!);
        
        // Popup with a button to view profile
        const popupContent = `
          <div style="text-align:center; padding:5px;">
            <div style="font-weight:bold; margin-bottom:5px;">${player.name}</div>
            <div style="font-size:12px; margin-bottom:10px; color:#888;">${player.sports.join(', ')}</div>
            <a href="/profile/${player._id}" style="background:var(--color-primary); color:#000; padding:5px 10px; border-radius:4px; text-decoration:none; display:inline-block; font-size:12px; font-weight:bold;">View Profile</a>
          </div>
        `;
        marker.bindPopup(popupContent);
        
        this.markers.set(player._id, marker);
      }
    });
  }

  recenterMap() {
    if (this.map && this.myCoords) {
      this.map.flyTo([this.myCoords.lat, this.myCoords.lng], 13);
    }
  }
  
  highlightMarker(id: string) {
    const marker = this.markers.get(id);
    if (marker && this.map) {
      // Just an effect, maybe bounce or open popup
      marker.openPopup();
    }
  }
  
  unhighlightMarker(id: string) {
    const marker = this.markers.get(id);
    if (marker) {
      marker.closePopup();
    }
  }
  
  viewProfile(player: User) {
    this.router.navigate(['/profile', player._id]);
  }
}
