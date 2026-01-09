import { MediaAsset } from '../models/MediaAsset.js'; //
import Device from '../models/Device.js';
import Playlist from '../models/Playlist.js';
import User from '../models/User.js';
import { v4 as uuidv4 } from 'uuid';
import { generatePairingCode } from '../utils/generateCode.js';
import mongoose from 'mongoose';
// @desc    Generate a pairing code for the device to display
// @route   GET /v1/displays/generate-code
// @access  Public (Device)
export const generateCode = async (req, res) => {
  try {
    let code;
    let isUnique = false;

    // const collections = await mongoose.connection.db.listCollections({ name: 'devices' }).toArray();
    //   if (collections.length > 0) {
    //     // This drops the specific problematic index
    //     await mongoose.connection.db.collection('devices').dropIndex('device_token_1');
    //     console.log('Successfully dropped old device_token index.');
    //   }

    // Ensure code uniqueness
    while (!isUnique) {
      code = generatePairingCode();
      const existingDevice = await Device.findOne({ pairing_code: code });
      if (!existingDevice) isUnique = true;
    }
    console.log(`Generated unique pairing code: ${code}`);

    // Create a temporary device record
    const device = await Device.create({
      pairing_code: code,
      status: 'unpaired'
    });
    console.log(`Created device record with ID: ${device._id}`);

    res.status(200).json({ pairing_code: code });
  } catch (error) {
    console.error('Error generating pairing code:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Pair device using code
// @route   POST /v1/displays/pair
// @access  Public (Device)
export const pairDevice = async (req, res) => {
  const { pairing_code } = req.body;

  try {
    const device = await Device.findOne({ pairing_code });

    if (!device) {
      return res.status(404).json({ message: 'Invalid pairing code' });
    }

    // Check if the device has been claimed by a user (via Admin Panel)
    if (!device.user_id) {
      return res.status(202).json({ message: 'Waiting for user to claim device' });
    }

    // Verify that the user actually exists (in case of deleted users)
    const user = await User.findById(device.user_id);
    if (!user) {
      // Reset the device if the user no longer exists
      device.user_id = null;
      device.status = 'unpaired';
      await device.save();
      return res.status(202).json({ message: 'Waiting for user to claim device' });
    }

    // If already paired and has token, return it
    if (device.device_token) {
      return res.status(200).json({
        device_token: device.device_token,
        user_id: device.user_id
      });
    }

    // Generate permanent device token
    const device_token = uuidv4();

    device.device_token = device_token;
    device.status = 'paired';
    await device.save();

    res.status(200).json({
      device_token,
      user_id: device.user_id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get configuration (playlist) for the device
// @route   GET /v1/player/config
// @access  Public (Device)

export const getConfig = async (req, res) => {
  const { device_token } = req.query; 

  if (!device_token) {
    return res.status(400).json({ message: 'Device token is required' });
  }

  try {
    const device = await Device.findOne({ device_token });

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Verify user existence for active playback
    if (device.user_id) {
      const user = await User.findById(device.user_id);
      if (!user) {
        return res.status(403).json({ message: 'Device owner no longer exists' });
      }
    }

    // --- Advanced Playlist Resolution Logic ---
    const now = new Date();
    const currentDay = now.getDay(); // 0-6
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes from midnight

    // Find all active playlists assigned to this device
    const playlists = await Playlist.find({
      assigned_devices: device_token,
      is_active: true
    });

    let selectedPlaylist = null;
    let highestPriority = -1;

    for (const playlist of playlists) {
      let isScheduled = false;
      
      // Strict scheduling: must have a matching schedule defined
      if (!playlist.schedules || playlist.schedules.length === 0) {
        continue;
      }

      for (const schedule of playlist.schedules) {
        // Check Date Range
        if (schedule.startDate && new Date(schedule.startDate) > now) continue;
        if (schedule.endDate && new Date(schedule.endDate) < now) continue;

        // Check Day of Week
        if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0 && !schedule.daysOfWeek.includes(currentDay)) continue;

        // Check Time Range
        const [startH, startM] = schedule.startTime.split(':').map(Number);
        const [endH, endM] = schedule.endTime.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        if (currentTime >= startMinutes && currentTime <= endMinutes) {
          isScheduled = true;
          break; 
        }
      }

      if (isScheduled) {
        if (playlist.priority > highestPriority) {
          highestPriority = playlist.priority;
          selectedPlaylist = playlist;
        }
      }
    }

    // Fallback to the legacy manually assigned playlist if no scheduled one is found
    if (!selectedPlaylist && device.playlist_id) {
      selectedPlaylist = await Playlist.findOne({ playlist_id: device.playlist_id });
    }

    if (!selectedPlaylist) {
      return res.status(200).json({ 
        playlist_json: { display_sequence: [] }, 
        message: 'No active playlist found' 
      });
    }

    // --- Asset Metadata Fetching & Merging ---

    // 1. Sort assets by the defined order
    const sortedAssetItems = selectedPlaylist.assets.sort((a, b) => a.order - b.order);

    // 2. Extract asset_ids for bulk lookup
    const assetIds = sortedAssetItems.map(item => item.asset_id);

    // 3. Fetch full details from MediaAsset collection using the IDs
    const mediaDetails = await MediaAsset.find({ 
      asset_id: { $in: assetIds } 
    });

    // 4. Enrich the sequence with file URLs and metadata
    const enrichedSequence = sortedAssetItems.map(item => {
      // Find matching metadata from the MediaAsset query
      const detail = mediaDetails.find(m => m.asset_id === item.asset_id);
      
      return {
        asset_id: item.asset_id,
        order: item.order,
        // Prioritize playlist override, then asset metadata, then defaults
        type: item.type || detail?.type, 
        duration: item.duration || detail?.duration || 10, 
        file_url: detail ? detail.file_url : null, 
        original_filename: detail?.original_filename,
        _id: item._id
      };
    });

    // Final Configuration response
    res.status(200).json({
      playlist_json: {
        playlist_id: selectedPlaylist.playlist_id,
        display_sequence: enrichedSequence, 
        last_updated: selectedPlaylist.last_updated,
        name: selectedPlaylist.name
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send heartbeat / status update
// @route   POST /v1/player/heartbeat
// @access  Public (Device)
export const heartbeat = async (req, res) => {
  const { device_token, status, app_version, timestamp } = req.body;

  try {
    const device = await Device.findOne({ device_token });

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    device.status = status || device.status;
    device.app_version = app_version || device.app_version;
    device.last_heartbeat = Date.now();
    
    // If the device sends download status (optional based on spec, but good for sync-status)
    if (req.body.download_status) {
      device.download_status = req.body.download_status;
    }

    await device.save();

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

