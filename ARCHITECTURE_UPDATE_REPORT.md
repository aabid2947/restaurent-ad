# Backend Architecture Update Report

## Overview
The backend has been updated to support a multi-tenant architecture where devices and media are strictly scoped to registered users. Additionally, the media upload flow has been optimized to use direct-to-Cloudinary uploads.

## Key Changes

### 1. User Authentication & Management
*   **New Model:** `User` (Name, Email, Password, isAdmin).
*   **New Routes:**
    *   `POST /v1/users/register`: Register a new user.
    *   `POST /v1/users/login`: Authenticate and receive user details.
*   **Impact:** All admin operations now require a valid `user_id`.

### 2. Device Pairing & Security
*   **Updated Controller:** `displayController.js`
*   **Logic Change:**
    *   `pairDevice` now verifies that the `user_id` claiming the device actually exists in the `User` database.
    *   If a user is deleted, their claimed devices are automatically reset to 'unpaired' state upon the next pairing attempt.
    *   `getConfig` checks for user existence to prevent orphaned devices from playing content.

### 3. Media Upload Architecture
*   **Old Flow:** Frontend -> Backend (Multer) -> Cloudinary.
*   **New Flow:** Frontend -> Cloudinary (Direct) -> Backend (Metadata).
*   **New Endpoints:**
    *   `POST /v1/admin/upload-signature`: Generates a secure signature for the frontend.
    *   `POST /v1/admin/save-media`: Saves the asset metadata after successful frontend upload.
*   **Benefits:** Reduced server load, faster uploads, better scalability.

### 4. Admin Operations
*   **Updated Controller:** `adminController.js`
*   **Logic Change:**
    *   `claimDevice`, `createPlaylist`, `assignPlaylist`, `getSyncStatus` now all validate the `user_id`.
    *   `assignPlaylist` enforces ownership: A user can only assign playlists to devices they own.

## API Route Summary

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| **POST** | `/v1/users/register` | Create account | No |
| **POST** | `/v1/users/login` | Login | No |
| **GET** | `/v1/displays/generate-code` | Get pairing code | No (Device) |
| **POST** | `/v1/displays/pair` | Pair device | No (Device) |
| **GET** | `/v1/player/config` | Get playlist | No (Device) |
| **POST** | `/v1/player/heartbeat` | Send status | No (Device) |
| **POST** | `/v1/admin/claim-device` | Link device to user | Yes (User ID) |
| **POST** | `/v1/admin/upload-signature` | Get upload sig | Yes (User ID) |
| **POST** | `/v1/admin/save-media` | Save asset info | Yes (User ID) |
| **POST** | `/v1/admin/playlist` | Create playlist | Yes (User ID) |
| **POST** | `/v1/admin/assign-playlist` | Assign content | Yes (User ID) |
| **GET** | `/v1/admin/sync-status` | Check downloads | Yes (User ID) |
