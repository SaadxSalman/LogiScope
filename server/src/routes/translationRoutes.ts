// server/src/routes/translationRoutes.ts
import { Router } from 'express';
import multer from 'multer';
import { processInput } from '../controllers/translationController';

const router = Router();
const upload = multer({ dest: 'uploads/' }); // Temporary storage for files

// Handles audio/video file uploads
router.post('/translate/upload', upload.single('file'), processInput);

// Handles direct text input
router.post('/translate/text', processInput);

export default router;