# New Media Upload Flow API Summary

## 1. Generate Upload Signature
**Endpoint:** `POST /v1/admin/upload-signature`

**Description:** Generates a signature for the frontend to upload files directly to Cloudinary.

**Request Body:**
```json
{
  "user_id": "6582f..."
}
```

**Response Body:**
```json
{
  "timestamp": 1703068800,
  "signature": "a1b2c3d4...",
  "api_key": "123456789...",
  "folder": "advertisement/6582f...",
  "cloud_name": "your_cloud_name"
}
```

---

## 2. Save Media Metadata
**Endpoint:** `POST /v1/admin/save-media`

**Description:** Saves the metadata of the uploaded file to the backend database after a successful Cloudinary upload.

**Request Body:**
```json
{
  "user_id": "6582f...",
  "file_url": "https://res.cloudinary.com/...",
  "public_id": "advertisement/6582f.../image123",
  "resource_type": "image",
  "duration": 10,
  "original_filename": "promo.jpg"
}
```

**Response Body:**
```json
{
  "message": "Media metadata saved successfully",
  "asset": {
    "asset_id": "uuid-...",
    "file_url": "https://res.cloudinary.com/...",
    "type": "image",
    "playback_duration": 10,
    "original_filename": "promo.jpg"
  }
}
```
