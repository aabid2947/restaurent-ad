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
// curl -X POST http://localhost:5000/v1/admin/claim-device -H "Content-Type: application/json" -d '{"pairing_code":"268314","user_id":"YYYY"}'
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

// @desc    Generate Cloudinary Upload Signature
// @route   POST /v1/admin/upload-signature
// @access  Private (Admin/User)
export const generateUploadSignature = async (req, res) => {
  const { user_id } = req.body;

  try {
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const timestamp = Math.round((new Date).getTime() / 1000);
    const folder = `advertisement/${user_id}`;

    // Parameters to sign. MUST match exactly what is sent to Cloudinary
    const paramsToSign = {
      timestamp: timestamp,
      folder: folder,
    };

    const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET);

    res.status(200).json({
      timestamp,
      signature,
      api_key: process.env.CLOUDINARY_API_KEY,
      folder,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Save Media Metadata (After direct upload)
// @route   POST /v1/admin/save-media
// @access  Private (Admin/User)
export const saveMediaMetadata = async (req, res) => {
  const { user_id, file_url, public_id, resource_type, duration, original_filename, tags } = req.body;

  try {
    // Verify user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const asset = new MediaAsset({
      asset_id: uuidv4(),
      user_id: user._id,
      file_url: file_url,
      type: resource_type, // 'image' or 'video'
      duration: duration || (resource_type === 'video' ? 0 : 10), // Default 10s for images if not provided
      original_filename: original_filename,
      tags: tags || []
    });

    // Persist metadata
    await asset.save();

    res.status(200).json({
      message: 'Media metadata saved successfully',
      asset
    });

  } catch (error) {
    res.status(500).json({ message: 'Failed to save metadata', error: error.message });
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
  const { user_id, name, assets, schedules, priority, tags, is_active, assigned_devices } = req.body;

  try {
    // Verify user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const playlist_id = uuidv4();

    // assets should be an array of { asset_id, order, duration, type }
    // schedules should be an array of { startTime, endTime, daysOfWeek, startDate, endDate }

    const playlist = await Playlist.create({
      playlist_id,
      user_id: user._id,
      name,
      assets: assets || [],
      schedules: schedules || [],
      priority: priority || 1,
      tags: tags || [],
      is_active: is_active !== undefined ? is_active : true,
      assigned_devices: assigned_devices || [],
      last_updated: Date.now()
    });

    res.status(201).json(playlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign playlist to device (Legacy/Simple mode)
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

    // Add device to playlist's assigned_devices if not already there
    if (!playlist.assigned_devices.includes(device_token)) {
      playlist.assigned_devices.push(device_token);
      await playlist.save();
    }

    // Also update device for backward compatibility or quick reference
    device.playlist_id = playlist_id;
    device.download_status = 'in_progress';
    await device.save();

    res.status(200).json({ message: 'Playlist assigned successfully', device });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all devices for a user
// @route   GET /v1/admin/devices
// @access  Private (Admin/User)
export const getDevices = async (req, res) => {
  const { user_id } = req.query;

  try {
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const devices = await Device.find({ user_id }).populate('playlist_id'); // Add populate
    res.status(200).json(devices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get user media links
// @route GET /v1/admin/save-user-media-links
export const getUserMediaLinks = async (req, res) => {
  const { user_id } = req.query;
  try {
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const allMedia = await MediaAsset.find({ user_id });
    res.status(200).json({ allMedia });
  }
  catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all playlists for a user
// @route   GET /v1/admin/playlists
// @access  Private (Admin/User)
export const getPlaylists = async (req, res) => {
  const { user_id } = req.query;

  try {
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const playlists = await Playlist.find({ user_id });
    res.status(200).json(playlists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a Playlist (Add/Remove/Reorder assets, Update Schedule)
// @route   PUT /v1/admin/playlist/:playlist_id
// @access  Private (Admin/User)
export const updatePlaylist = async (req, res) => {
  const { playlist_id } = req.params;
  const { user_id, name, assets, schedules, priority, tags, is_active, assigned_devices } = req.body;

  try {
    const user = await User.findById(user_id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const playlist = await Playlist.findOne({ playlist_id });
    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });

    if (playlist.user_id.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (name) playlist.name = name;
    if (assets) playlist.assets = assets;
    if (schedules) playlist.schedules = schedules;
    if (priority) playlist.priority = priority;
    if (tags) playlist.tags = tags;
    if (is_active !== undefined) playlist.is_active = is_active;
    if (assigned_devices) playlist.assigned_devices = assigned_devices;

    playlist.last_updated = Date.now();

    await playlist.save();
    res.status(200).json(playlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc handle device playlist, add new playlist , remove existing playlist
// @route POST /v1/admin/device-playlist
// @access Private (Admin/User)
export const handleDevicePlaylist = async (req, res) => {
  try {
    const { device_token, playlist_id, action, user_id } = req.body;

    // Verify user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const device = await Device.findOne({ device_token });
    if (!device) return res.status(404).json({ message: 'Device not found' });

    // check ownership
    if (device.user_id !== user_id) {
      return res.status(403).json({ message: 'Not authorized to manage this device' });
    }

    // check playlist existence
    const playlist = await Playlist.findOne({ playlist_id });
    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });

    if (action === 'add') {
      // add playlist to device
      if (!playlist.assigned_devices.includes(device_token)) {
        playlist.assigned_devices.push(device_token);
        await playlist.save();
      }
      device.playlist_id = playlist._id; // Sync back to device
    }
    else if (action === 'remove') {
      // remove playlist from device
      playlist.assigned_devices = playlist.assigned_devices.filter(token => token !== device_token);
      await playlist.save();
      device.playlist_id = null; // Remove from device
    }
    await device.save();
    res.status(200).json({ message: `Playlist ${action}ed successfully`, device });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// @desc set a name for a device
// @route PUT /v1/admin/device-name
// @access Private (Admin/User)
export const setDeviceName = async (req, res) => {
  try {
    const { device_token, device_name, user_id } = req.body;

    // Verify user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const device = await Device.findOne({ device_token });
    if (!device) return res.status(404).json({ message: 'Device not found' });
    // check ownership
    if (device.user_id !== user_id) {
      return res.status(403).json({ message: 'Not authorized to manage this device' });
    }
    device.name = device_name;
    console.log(device)
    await device.save();
    res.status(200).json({ message: 'Device name updated successfully', device });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// @desc    Delete a Playlist
// @route   DELETE /v1/admin/playlist/:playlist_id
// @access  Private (Admin/User)

export const deletePlaylist = async (req, res) => {
  const { playlist_id } = req.params;
  const { user_id } = req.query; // Pass user_id to ensure ownership

  try {
    const playlist = await Playlist.findOne({ playlist_id });
    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });

    if (playlist.user_id.toString() !== user_id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Playlist.deleteOne({ playlist_id });
    res.status(200).json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};