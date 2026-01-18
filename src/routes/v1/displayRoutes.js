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
//  curl -X POST http://localhost:5000/v1/displays/pair -H "Content-Type: application/json" -d '{"pairing_code":"565728","user_id":"696ce064dc2b809d4b43da10"}'
router.get('/player/config', getConfig); 
router.post('/player/heartbeat', heartbeat);

export default router;
