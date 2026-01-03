import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  startTime: { type: String, required: true }, // "HH:MM"
  endTime: { type: String, required: true },   // "HH:MM"
  daysOfWeek: [{ type: Number, min: 0, max: 6 }], // 0=Sun, 1=Mon...
  startDate: Date, // Optional: for date ranges
  endDate: Date,   // Optional
  priority: { type: Number, default: 1 } // Schedule specific priority (optional override)
});

const playlistItemSchema = new mongoose.Schema({
  asset_id: { type: String, required: true }, // Reference to MediaAsset.asset_id
  order: { type: Number, required: true },
  duration: { type: Number }, // Override duration for this specific playlist item
  type: { type: String, enum: ['video', 'image'] } // Cached type for easier frontend rendering
});

// Schema for Playlist Configuration
const playlistSchema = new mongoose.Schema({
  playlist_id: {
    type: String,
    required: true,
    unique: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    default: 'Untitled Playlist'
  },
  priority: {
    type: Number,
    default: 1, // Higher number = higher priority
  },
  tags: [String],
  is_active: {
    type: Boolean,
    default: true,
  },
  // The ordered list of assets to be played
  assets: [playlistItemSchema], 
  
  // Multiple schedules
  schedules: [scheduleSchema],

  // Assigned Devices (Screen assignment)
  assigned_devices: [{
    type: String, // device_token
    ref: 'Device'
  }],

  last_updated: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true
});

const Playlist = mongoose.model('Playlist', playlistSchema);

export default Playlist;
