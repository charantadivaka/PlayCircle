export interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string | null;
  age?: number;
  bio?: string;
  sports: string[];
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
  // Computed client-side
  distance?: number; // metres
}
