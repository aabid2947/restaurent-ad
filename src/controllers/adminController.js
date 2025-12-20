import Device from '../models/Device.js';
import Playlist from '../models/Playlist.js';
import { MediaAsset } from '../models/MediaAsset.js';
import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// @desc    Claim a device using pairing code
// @route   POST /v1/admin/claim-device
// @access  Private (Admin/User)
export const claimDevice = async (req, res) => {
  const { pairing_code, user_id } = req.body;

  try {
    // Verify user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const device = await Device.findOne({ pairing_code });

    if (!device) {
      return res.status(404).json({ message: 'Invalid pairing code' });
    }

    if (device.user_id) {
      return res.status(400).json({ message: 'Device already claimed' });
    }

    device.user_id = user_id;
    await device.save();

    res.status(200).json({ message: 'Device claimed successfully', device });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload media asset
// @route   POST /v1/admin/upload
// @access  Private (Admin/User)
export const uploadMedia = async (req, res) => {
  const { user_id } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    // Verify user exists
    const user = await User.findById(user_id);
    if (!user) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(404).json({ message: 'User not found' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: "auto", // auto-detect image or video
      folder: `advertisement/${user_id}`,
    });

    // Remove local file
    fs.unlinkSync(file.path);

    // Create MediaAsset record (Optional but good for management)
    // Note: The spec just says return file_url, but we need to store it to use in playlists
    const asset = new MediaAsset({
      asset_id: uuidv4(),
      file_url: result.secure_url,
      type: result.resource_type, // 'image' or 'video'
      playback_duration: result.duration || 10, // Default 10s for images, video duration from cloudinary
      original_filename: file.originalname,
    });

    // We are not saving Asset to a global collection in this simple version unless needed, 
    // but let's return the details so the frontend can add it to a playlist.
    // Or better, let's save it if we want a library.
    // For now, I'll just return the URL as per spec, but also the asset object.
    
    res.status(200).json({
      file_url: result.secure_url,
      asset_id: asset.asset_id,
      type: asset.type,
      playback_duration: asset.playback_duration
    });

  } catch (error) {
    console.error(error);
    // Try to remove local file if error
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

// @desc    Get sync status of devices for a playlist
// @route   GET /v1/admin/sync-status
// @access  Private (Admin/User)
export const getSyncStatus = async (req, res) => {
  const { user_id, playlist_id } = req.query;

  try {
    // Verify user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find all devices for this user that are assigned this playlist
    const devices = await Device.find({ user_id, playlist_id });

    const statusList = devices.map(device => ({
      device_token: device.device_token,
      download_status: device.download_status || 'unknown',
      last_heartbeat: device.last_heartbeat
    }));

    res.status(200).json({ devices: statusList });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create or Update a Playlist
// @route   POST /v1/admin/playlist
// @access  Private (Admin/User)
export const createPlaylist = async (req, res) => {
  const { user_id, name, assets } = req.body; // assets is array of MediaAsset objects

  try {
    // Verify user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const playlist_id = uuidv4();
    
    const playlist = await Playlist.create({
      playlist_id,
      user_id,
      name,
      display_sequence: assets, // Expects array of objects matching mediaAssetSchema
      last_updated: Date.now()
    });

    res.status(201).json(playlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign playlist to device
// @route   POST /v1/admin/assign-playlist
// @access  Private (Admin/User)
export const assignPlaylist = async (req, res) => {
  const { device_token, playlist_id, user_id } = req.body;

  try {
    // Verify user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const device = await Device.findOne({ device_token });
    if (!device) return res.status(404).json({ message: 'Device not found' });

    // Check ownership
    if (device.user_id !== user_id) {
      return res.status(403).json({ message: 'Not authorized to manage this device' });
    }

    const playlist = await Playlist.findOne({ playlist_id });
    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });

    device.playlist_id = playlist_id;
    // Reset download status as new playlist is assigned
    device.download_status = 'in_progress'; 
    await device.save();

    res.status(200).json({ message: 'Playlist assigned successfully', device });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
