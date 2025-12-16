import express from 'express';
import { 
  claimDevice, 
  uploadMedia, 
  getSyncStatus,
  createPlaylist,
  assignPlaylist
} from '../../controllers/adminController.js';
import upload from '../../middleware/upload.js';

const router = express.Router();

// Admin endpoints
router.post('/claim-device', claimDevice);
router.post('/upload', upload.single('media_file'), uploadMedia);
router.get('/sync-status', getSyncStatus);
router.post('/playlist', createPlaylist);
router.post('/assign-playlist', assignPlaylist);

export default router;
