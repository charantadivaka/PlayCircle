# PlayCircle

PlayCircle is a full-stack MEAN application for real-time sports matchmaking. It allows users to register, find nearby players using a live geospatial map, send play requests, and chat in real-time.

## Features
- **Authentication**: JWT-based authentication with bcrypt password hashing.
- **Geospatial Search**: Find nearby online players using MongoDB `$near` queries.
- **Real-Time Map**: View nearby players on a Leaflet map.
- **Real-Time Chat & Notifications**: Built with Socket.IO.
- **Profile Management**: Update your details and upload a profile picture.
- **Play Requests**: Send, receive, and respond to invitations.

## Tech Stack
- **Frontend**: Angular 18 (Standalone Components, Signals), Leaflet, Socket.io-client.
- **Backend**: Node.js, Express.js, Socket.IO.
- **Database**: MongoDB, Mongoose.
- **Other Tools**: Multer (file uploads), bcryptjs, jsonwebtoken, express-validator.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally on default port `27017` or an Atlas URI)

### Installation

1. **Clone the repository and install dependencies**
   ```bash
   # The root package.json has a script to install all dependencies
   npm run install:all
   ```

2. **Configure Environment Variables**
   The project requires a `.env` file at the root level.
   ```bash
   cp .env.example .env
   ```
   Update `.env` if you're using MongoDB Atlas, otherwise the default local MongoDB URI (`mongodb://localhost:27017/playcircle`) is used.

3. **Run the Application**
   Start both the backend server and the Angular development server simultaneously using concurrently:
   ```bash
   npm run dev
   ```

   - **Frontend**: Accessible at [http://localhost:4200](http://localhost:4200)
   - **Backend API**: Accessible at `http://localhost:3000` (Angular proxies API requests to it, so you won't encounter CORS issues during development).

## Manual Verification / Demo Flow

1. Open `http://localhost:4200` in two different browser tabs (or a regular tab and an incognito window).
2. **Register** two different users.
3. Allow **location permissions** in both browsers when prompted on the Dashboard.
4. On the map, you should see the other player if they are within the selected radius. You can filter by sport or adjust the radius.
5. Click on the other player on the map (or sidebar list) and select **View Profile**.
6. **Send a Play Request**.
7. In the other tab, a **real-time notification** will pop up in the top right bell icon.
8. Go to **Requests**, accept the incoming request.
9. You can now chat in real-time via the **Chat** tab!
