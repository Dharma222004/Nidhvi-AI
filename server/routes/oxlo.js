/**
 * Oxlo AI Routes
 * Endpoints for using Oxlo AI models for specialized tasks
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const oxloService = require('../services/oxloService');

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

/**
 * POST /api/oxlo/analyze-image
 * Analyze medical report image using Oxlo's gemma-3-4b model
 * Alternative to Gemini for fast OCR and image analysis
 */
router.post('/analyze-image', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        // Read the file and convert to base64
        const filePath = req.file.path;
        const fileBuffer = fs.readFileSync(filePath);
        const base64Image = fileBuffer.toString('base64');
        const mimeType = req.file.mimetype;

        // Analyze using Oxlo
        const result = await oxloService.extractFromImageOCR(base64Image, mimeType);

        // Clean up uploaded file
        fs.unlinkSync(filePath);

        res.json({
            success: true,
            provider: 'oxlo',
            model: oxloService.OXLO_CONFIG.models.imageOCR,
            data: result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error analyzing image with Oxlo:', error);

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
 * POST /api/oxlo/transcribe-audio
 * Transcribe medical audio dictation using Whisper models
 */
router.post('/transcribe-audio', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No audio file uploaded'
            });
        }

        const { accuracy = 'medium' } = req.body;
        const audioPath = req.file.path;

        // Transcribe using Oxlo Whisper
        const result = await oxloService.analyzeAudioReport(audioPath, accuracy);

        // Clean up uploaded file
        fs.unlinkSync(audioPath);

        res.json({
            success: true,
            provider: 'oxlo',
            model: accuracy === 'large' ? 'whisper-large' : 'whisper-medium',
            transcription: result.transcription,
            timestamp: result.timestamp
        });
    } catch (error) {
        console.error('Error transcribing audio with Oxlo:', error);

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
 * POST /api/oxlo/text-to-speech
 * Convert text to speech using kokoro-82m model
 */
router.post('/text-to-speech', express.json(), async (req, res) => {
    try {
        const { text, voice, speed } = req.body;

        if (!text) {
            return res.status(400).json({
                success: false,
                error: 'Text is required'
            });
        }

        const result = await oxloService.generateSpeech(text, { voice, speed });

        res.json({
            success: true,
            provider: 'oxlo',
            model: oxloService.OXLO_CONFIG.models.tts,
            audio: result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error generating speech with Oxlo:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/oxlo/process
 * Universal endpoint for processing with auto-model selection
 */
router.post('/process', upload.single('file'), async (req, res) => {
    try {
        const { taskType, text } = req.body;
        let data = {};

        // Prepare data based on task type
        if (taskType === 'ocr' || taskType === 'image') {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'File required for OCR/image tasks'
                });
            }
            const fileBuffer = fs.readFileSync(req.file.path);
            data = {
                imageData: fileBuffer.toString('base64'),
                mimeType: req.file.mimetype
            };
        } else if (taskType === 'audio' || taskType === 'transcribe') {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'Audio file required for transcription tasks'
                });
            }
            data = {
                audioPath: req.file.path
            };
        } else if (taskType === 'tts' || taskType === 'speech') {
            if (!text) {
                return res.status(400).json({
                    success: false,
                    error: 'Text required for TTS tasks'
                });
            }
            data = { text };
        } else {
            return res.status(400).json({
                success: false,
                error: `Invalid task type: ${taskType}`
            });
        }

        // Process with Oxlo
        const result = await oxloService.processWithOxlo(taskType, data, req.body.options || {});

        // Clean up uploaded file if exists
        if (req.file?.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.json({
            success: true,
            provider: 'oxlo',
            taskType,
            result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error processing with Oxlo:', error);

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
 * GET /api/oxlo/models
 * Get available Oxlo models and their capabilities
 */
router.get('/models', (req, res) => {
    try {
        const models = oxloService.getAvailableModels();
        res.json({
            success: true,
            ...models
        });
    } catch (error) {
        console.error('Error getting Oxlo models:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/oxlo/health
 * Check Oxlo API health and connectivity
 */
router.get('/health', async (req, res) => {
    try {
        const isValid = await oxloService.validateOxloApiKey();

        res.json({
            success: true,
            status: isValid ? 'healthy' : 'unavailable',
            configured: !!process.env.OXLO_API_KEY,
            endpoint: process.env.OXLO_API_ENDPOINT,
            models: oxloService.OXLO_CONFIG.models,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error checking Oxlo health:', error);
        res.status(500).json({
            success: false,
            status: 'error',
            error: error.message
        });
    }
});

module.exports = router;
