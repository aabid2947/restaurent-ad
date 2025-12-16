import mongoose from 'mongoose';
import { mediaAssetSchema } from './MediaAsset.js';

// Schema for Playlist Configuration
// This corresponds to the "Playlist Configuration Model"
const playlistSchema = new mongoose.Schema({
  playlist_id: {
    type: String,
    required: true,
    unique: true,
  },
  user_id: {
    type: String,
    required: true, // Link playlist to a user
  },
  name: {
    type: String,
    default: 'Untitled Playlist'
  },
  // The ordered list of assets to be played
  display_sequence: [mediaAssetSchema], 
  
  last_updated: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

const Playlist = mongoose.model('Playlist', playlistSchema);

export default Playlist;
