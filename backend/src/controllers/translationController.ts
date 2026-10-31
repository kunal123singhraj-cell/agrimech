import { Request, Response } from 'express';
import { TranslationService } from '../services/translationService';

export const detectLanguage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text } = req.body;
    if (!text) {
      res.status(400).json({ success: false, message: 'Text is required for language detection.' });
      return;
    }
    const detected = TranslationService.detectLanguage(text);
    res.json({ success: true, detectedLanguage: detected });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const translateText = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, sourceLang } = req.body;
    if (!text) {
      res.status(400).json({ success: false, message: 'Text is required for translation.' });
      return;
    }
    const result = TranslationService.translateMessage(text, sourceLang);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
