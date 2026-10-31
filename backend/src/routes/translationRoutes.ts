import { Router } from 'express';
import { detectLanguage, translateText } from '../controllers/translationController';

const router = Router();

router.post('/detect', detectLanguage);
router.post('/translate', translateText);

export default router;
