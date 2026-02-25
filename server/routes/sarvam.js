/**
 * Sarvam AI Routes
 * Endpoints for specialized Indian language services
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const sarvamService = require('../services/sarvamService');

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 25 * 1024 * 1024 // 25MB limit for audio files
    }
});

/**
 * POST /api/sarvam/translate
 * Translate text between Indian languages and English
 */
router.post('/translate', express.json(), async (req, res) => {
    try {
        const { text, sourceLanguage, targetLanguage } = req.body;

        if (!text || !targetLanguage) {
            return res.status(400).json({
                success: false,
                error: 'Text and target language are required'
            });
        }

        const translatedText = await sarvamService.translate(
            text,
            sourceLanguage || 'en-IN',
            targetLanguage
        );

        res.json({
            success: true,
            provider: 'sarvam',
            translatedText,
            sourceLanguage: sourceLanguage || 'en-IN',
            targetLanguage
        });
    } catch (error) {
        console.error('Sarvam translation route error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/sarvam/transcribe
 * Speech-to-text for Indian languages
 */
router.post('/transcribe', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Audio file is required'
            });
        }

        const languageCode = req.body.language || 'hi-IN';
        const transcript = await sarvamService.speechToText(req.file.path, languageCode);

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
            success: true,
            provider: 'sarvam',
            transcript,
            languageCode
        });
    } catch (error) {
        console.error('Sarvam transcription route error:', error);

        // Clean up file if it exists
        if (req.file?.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/sarvam/speak
 * Text-to-speech for Indian languages
 */
router.post('/speak', express.json(), async (req, res) => {
    try {
        const { text, targetLanguage } = req.body;

        if (!text || !targetLanguage) {
            return res.status(400).json({
                success: false,
                error: 'Text and target language are required'
            });
        }

        const audioChunks = await sarvamService.textToSpeech(text, targetLanguage);

        res.json({
            success: true,
            provider: 'sarvam',
            audios: audioChunks,
            contentType: 'audio/wav'
        });
    } catch (error) {
        console.error('Sarvam TTS route error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/sarvam/config
 * Check if Sarvam is configured
 */
router.get('/config', (req, res) => {
    res.json({
        success: true,
        configured: sarvamService.isConfigured(),
        baseUrl: process.env.SARVAM_API_URL || 'https://api.sarvam.ai'
    });
});

module.exports = router;
