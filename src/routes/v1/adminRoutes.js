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
  getUserMediaLinks
} from '../../controllers/adminController.js';
import { MediaAsset } from '../../models/MediaAsset.js';

const router = express.Router();

// Admin endpoints
router.post('/claim-device', claimDevice);
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
router.get('/save-user-media-links',getUserMediaLinks);
router.get('/sync-status', getSyncStatus);
router.post('/playlist', createPlaylist);
router.put('/playlist/:playlist_id', updatePlaylist);
router.post('/assign-playlist', assignPlaylist);
router.get('/devices', getDevices);
router.get('/playlists', getPlaylists);

export default router;
