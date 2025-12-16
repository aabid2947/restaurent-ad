import express from 'express';
import { 
  generateCode, 
  pairDevice, 
  getConfig, 
  heartbeat 
} from '../../controllers/displayController.js';

const router = express.Router();

// Device endpoints
// Mounted at /v1

router.get('/displays/generate-code', generateCode); 
router.post('/displays/pair', pairDevice);

router.get('/player/config', getConfig); 
router.post('/player/heartbeat', heartbeat);

export default router;
