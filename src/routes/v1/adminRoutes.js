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
  // curl -X POST http://localhost:5000/v1/admin/claim-device -H "Content-Type: application/json" -d '{"pairing_code":"114907","user_id":"69612f69b6d7fb3111302cb6"}'
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
//  curl -X PUT http://localhost:5000/v1/admin/device-name -H "Content-Type: application/json" -d '{"device_token":"dc2bb8cd-030c-4321-aa8c-7004da0a10ce","device_name":"Lobby TV","user_id":"696cc5a2408ba71c209b6359"}'
router.get('/save-user-media-links',getUserMediaLinks);
router.get('/sync-status', getSyncStatus);
router.post('/playlist', createPlaylist);
router.put('/playlist/:playlist_id', updatePlaylist);
router.put('/device-playlist', handleDevicePlaylist);
router.post('/assign-playlist', assignPlaylist);
router.get('/devices', getDevices);
router.get('/playlists', getPlaylists);
router.delete('/playlist/:playlist_id', deletePlaylist);

export default router;
