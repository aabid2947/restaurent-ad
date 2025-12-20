import mongoose from 'mongoose';

// Schema for Device/Display (TV Stick)
// This corresponds to the "Device/Display Model"
const deviceSchema = new mongoose.Schema({
  device_token: {
    type: String,
    unique: true,
    sparse: true
    // This will be generated upon successful pairing
  },
  user_id: {
    type: String,
    // required: true, // Can be null initially before pairing? 
    // Actually, pairing assigns a user. So it might be null if we pre-create devices, 
    // but in this flow, device is created on pairing.
  },
  pairing_code: {
    type: String,
    required: true,
    unique: true, // The 6-digit code
  },
  playlist_id: {
    type: String,
    ref: 'Playlist', // Reference to the Playlist model (optional, but good for population)
    default: null,
  },
  app_version: {
    type: String,
    default: '1.0.0',
  },
  status: {
    type: String,
    enum: ['playing', 'idle', 'error', 'offline', 'paired', 'unpaired'],
    default: 'unpaired',
  },
  last_heartbeat: {
    type: Date,
    default: Date.now,
  },
  // Helper to track sync status for "Asset Sync" endpoint
  download_status: {
    type: String,
    enum: ['completed', 'in_progress', 'failed', 'unknown'],
    default: 'unknown',
  }
}, {
  timestamps: true
});

const Device = mongoose.model('Device', deviceSchema);

export default Device;
