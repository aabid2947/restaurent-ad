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
//  curl -X GET http://localhost:5000/v1/displays/generate-code
router.post('/displays/pair', pairDevice);
//  curl -X POST https://restaurent-khaki.vercel.app/v1/displays/pair -H "Content-Type: application/json" -d '{"code":"988974","userId":"696cc5a2408ba71c209b6359"}'
router.get('/player/config', getConfig); 
router.post('/player/heartbeat', heartbeat);

export default router;
