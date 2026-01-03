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
  getPlaylists
} from '../../controllers/adminController.js';

const router = express.Router();

// Admin endpoints
router.post('/claim-device', claimDevice);
router.post('/upload-signature', generateUploadSignature);
router.post('/save-media', saveMediaMetadata);
router.get('/sync-status', getSyncStatus);
router.post('/playlist', createPlaylist);
router.put('/playlist/:playlist_id', updatePlaylist);
router.post('/assign-playlist', assignPlaylist);
router.get('/devices', getDevices);
router.get('/playlists', getPlaylists);

export default router;
