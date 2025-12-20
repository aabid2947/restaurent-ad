import express from 'express';
import { 
  claimDevice, 
  generateUploadSignature,
  saveMediaMetadata,
  getSyncStatus,
  createPlaylist,
  assignPlaylist
} from '../../controllers/adminController.js';

const router = express.Router();

// Admin endpoints
router.post('/claim-device', claimDevice);
router.post('/upload-signature', generateUploadSignature);
router.post('/save-media', saveMediaMetadata);
router.get('/sync-status', getSyncStatus);
router.post('/playlist', createPlaylist);
router.post('/assign-playlist', assignPlaylist);

export default router;
