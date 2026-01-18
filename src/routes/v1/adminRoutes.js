import express from 'express';
import { 
  claimDevice, 
  generateUploadSignature,
  saveMediaMetadata,
  getSyncStatus,
  createPlaylist,
  updatePlaylist,
  assignPlaylist,
  getDevices,
  getPlaylists,
  getUserMediaLinks,
  handleDevicePlaylist,
  setDeviceName,
  deletePlaylist
} from '../../controllers/adminController.js';
import { MediaAsset } from '../../models/MediaAsset.js';

const router = express.Router();

// Admin endpoints
router.post('/claim-device', claimDevice);
//  curl -X POST http://localhost:5000/v1/admin/claim-device -H "Content-Type: application/json" -d '{"pairing_code":"429227","user_id":"696cc5a2408ba71c209b6359"}'
router.post('/upload-signature', generateUploadSignature);
router.post('/save-media', saveMediaMetadata);
// see links to all save media

// router.get('/save-media-links', async (req, res) => {
//   const allMedia =await MediaAsset.find({});
//   console.log(typeof(allMedia))
//   // const m = allMedia.map(m => m.url);
//   // console.log(m)
//   // const links = allMedia.map(media => media.url);
//   res.json({ allMedia });
// });
router.put('/device-name', setDeviceName);
//  curl -X PUT http://localhost:5000/v1/admin/device-name -H "Content-Type: application/json" -d '{"device_token":"53a734f6-f6d4-4648-af43-9a0746b9eb7e","device_name":"Lobby TV","user_id":"696ce064dc2b809d4b43da10"}'
router.get('/save-user-media-links',getUserMediaLinks);
router.get('/sync-status', getSyncStatus);
router.post('/playlist', createPlaylist);
router.put('/playlist/:playlist_id', updatePlaylist);
router.put('/device-playlist', handleDevicePlaylist);
router.post('/assign-playlist', assignPlaylist);
router.get('/devices', getDevices);
//  curl -X GET http://localhost:5000/v1/admin/devices?user_id=696ce449cd58e3876f27e2fb
router.get('/playlists', getPlaylists);
router.delete('/playlist/:playlist_id', deletePlaylist);

export default router;
