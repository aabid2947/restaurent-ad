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
  // device_token is passed as a query parameter or header. 
  // Spec says "Request Parameters: device_token". Usually query or path.
  // Let's assume query param ?device_token=... or header.
  // Spec says "Input: device_token".
  
  const { device_token } = req.query; 

  if (!device_token) {
    return res.status(400).json({ message: 'Device token is required' });
  }

  try {
    const device = await Device.findOne({ device_token });

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Optional: Verify user existence for active playback
    if (device.user_id) {
      const user = await User.findById(device.user_id);
      if (!user) {
        return res.status(403).json({ message: 'Device owner no longer exists' });
      }
    }

    if (!device.playlist_id) {
      return res.status(200).json({ playlist_json: { display_sequence: [] }, message: 'No playlist assigned' });
    }

    const playlist = await Playlist.findOne({ playlist_id: device.playlist_id });

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    // Return the Playlist Configuration Model
    res.status(200).json({
      playlist_json: {
        playlist_id: playlist.playlist_id,
        display_sequence: playlist.display_sequence,
        last_updated: playlist.last_updated
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
