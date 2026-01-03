import mongoose from 'mongoose';

// Schema for individual media assets
// This corresponds to the "Media Asset Model" in the requirements
const mediaAssetSchema = new mongoose.Schema({
  asset_id: {
    type: String,
    required: true,
    unique: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  duration: {
    type: Number,
    default: 10, // Default duration in seconds
  },
  original_filename: String,
  tags: [String],
  uploaded_at: {
    type: Date,
    default: Date.now,
  }
});

const MediaAsset = mongoose.model('MediaAsset', mediaAssetSchema);

export { mediaAssetSchema, MediaAsset };
