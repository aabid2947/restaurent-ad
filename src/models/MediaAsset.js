import mongoose from 'mongoose';

// Schema for individual media assets
// This corresponds to the "Media Asset Model" in the requirements
const mediaAssetSchema = new mongoose.Schema({
  asset_id: {
    type: String,
    required: true,
    // unique: true // Not strictly unique globally if reused, but usually unique per upload
  },
  file_url: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['video', 'image'],
    required: true,
  },
  playback_duration: {
    type: Number,
    required: true, // Duration in seconds
  },
  checksum: {
    type: String,
    // required: true, // Optional for now, can be added if we implement checksum calculation
  },
  original_filename: String, // Helper for admin UI
  priority: {
    type: Number,
    default: 1, // Default priority 1. Higher number = higher priority/frequency
  },
  uploaded_at: {
    type: Date,
    default: Date.now,
  }
});

// We can export the schema to be used in Playlist, or the model if we want to store all assets independently
const MediaAsset = mongoose.model('MediaAsset', mediaAssetSchema);

export { mediaAssetSchema, MediaAsset };
