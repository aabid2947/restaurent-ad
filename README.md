# Advertisement Backend API

This is a simple Express.js backend for the Advertisement Display System.

## Setup

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Environment Variables:**
    Create a `.env` file in the root directory with the following:
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret
    ```

3.  **Run Server:**
    ```bash
    npm run dev
    ```

## API Endpoints

### Device / Player

*   **Generate Pairing Code (Helper):** `GET /v1/displays/generate-code`
    *   Returns a 6-digit code for the device to display.
*   **Pair Device:** `POST /v1/displays/pair`
    *   Body: `{ "pairing_code": "123456" }`
    *   Returns: `{ "device_token": "...", "user_id": "..." }`
    *   *Note: Device must be claimed by admin first.*
*   **Get Config:** `GET /v1/player/config?device_token=...`
    *   Returns the active playlist configuration.
*   **Heartbeat:** `POST /v1/player/heartbeat`
    *   Body: `{ "device_token": "...", "status": "playing", "app_version": "1.0.0" }`

### Admin / User

*   **Claim Device:** `POST /v1/admin/claim-device`
    *   Body: `{ "pairing_code": "123456", "user_id": "user123" }`
    *   Links a pending device to a user account.
*   **Upload Media:** `POST /v1/admin/upload`
    *   Body: `media_file` (Multipart), `user_id`
    *   Returns public URL of the uploaded asset.
*   **Create Playlist:** `POST /v1/admin/playlist`
    *   Body: `{ "user_id": "...", "name": "...", "assets": [...] }`
*   **Assign Playlist:** `POST /v1/admin/assign-playlist`
    *   Body: `{ "device_token": "...", "playlist_id": "..." }`
*   **Sync Status:** `GET /v1/admin/sync-status?user_id=...&playlist_id=...`
    *   Returns download status of devices.
