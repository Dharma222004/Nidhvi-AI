/**
 * Groq AI Routes
 * Endpoints for using Groq's ultra-fast AI models
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const groqService = require('../services/groqService');

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 25 * 1024 * 1024 // 25MB limit for audio files
    }
});

/**
 * POST /api/groq/qa
 * Medical Q&A using llama-3.3-70b-versatile
 */
router.post('/qa', express.json(), async (req, res) => {
    try {
        const { question, context } = req.body;

        if (!question) {
            return res.status(400).json({
                success: false,
                error: 'Question is required'
            });
        }

        const answer = await groqService.medicalQA(question, context);

        res.json({
            success: true,
            provider: 'groq',
            model: groqService.GROQ_CONFIG.models.chat,
            question,
            answer,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in medical Q&A:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/groq/chat
 * Fast chat using llama-3.1-8b-instant
 */
router.post('/chat', express.json(), async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        const response = await groqService.fastChat(message, history || []);

        res.json({
            success: true,
            provider: 'groq',
            model: groqService.GROQ_CONFIG.models.fastChat,
            message,
            response,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in fast chat:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/groq/transcribe
 * Speech-to-text using whisper-large-v3-turbo
 */
router.post('/transcribe', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Audio file is required'
            });
        }

        const options = {
            language: req.body.language,
            prompt: req.body.prompt,
            temperature: req.body.temperature ? parseFloat(req.body.temperature) : undefined,
            responseFormat: req.body.responseFormat || 'json'
        };

        const result = await groqService.transcribeAudio(req.file.path, options);

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
            success: true,
            provider: 'groq',
            model: groqService.GROQ_CONFIG.models.stt,
            transcription: result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error transcribing audio:', error);

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
 * POST /api/groq/speak
 * Text-to-speech using orpheus-v1-english
 */
router.post('/speak', express.json(), async (req, res) => {
    try {
        const { text, voice, speed, format } = req.body;

        if (!text) {
            return res.status(400).json({
                success: false,
                error: 'Text is required'
            });
        }

        const audioBuffer = await groqService.textToSpeech(text, { voice, speed, format });

        // Set appropriate content-type based on format
        const contentType = format === 'wav' ? 'audio/wav' : 'audio/mpeg';

        res.set({
            'Content-Type': contentType,
            'Content-Length': audioBuffer.length
        });

        res.send(audioBuffer);
    } catch (error) {
        console.error('Error generating speech:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/groq/safety-check
 * Content safety check using llama-guard-4-12b
 */
router.post('/safety-check', express.json(), async (req, res) => {
    try {
        const { content, type } = req.body;

        if (!content) {
            return res.status(400).json({
                success: false,
                error: 'Content is required'
            });
        }

        const safetyResult = await groqService.checkContentSafety(content, type || 'input');

        res.json({
            success: true,
            provider: 'groq',
            model: groqService.GROQ_CONFIG.models.guardrail,
            ...safetyResult,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error checking content safety:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/groq/check-injection
 * Prompt injection detection using prompt-guard-2-86m
 */
router.post('/check-injection', express.json(), async (req, res) => {
    try {
        const { input } = req.body;

        if (!input) {
            return res.status(400).json({
                success: false,
                error: 'Input is required'
            });
        }

        const injectionResult = await groqService.detectPromptInjection(input);

        res.json({
            success: true,
            provider: 'groq',
            model: groqService.GROQ_CONFIG.models.promptGuard,
            ...injectionResult,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error detecting prompt injection:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/groq/analyze-report
 * Analyze medical report with Groq
 */
router.post('/analyze-report', express.json(), async (req, res) => {
    try {
        const { reportText, mode } = req.body;

        if (!reportText) {
            return res.status(400).json({
                success: false,
                error: 'Report text is required'
            });
        }

        const analysis = await groqService.analyzeReport(reportText, mode || 'chat');

        res.json({
            success: true,
            provider: 'groq',
            model: mode === 'fast' ? groqService.GROQ_CONFIG.models.fastChat : groqService.GROQ_CONFIG.models.chat,
            analysis,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error analyzing report:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/groq/explain
 * Generate patient explanation using Groq
 */
router.post('/explain', express.json(), async (req, res) => {
    try {
        const { reportData, mode } = req.body;

        if (!reportData) {
            return res.status(400).json({
                success: false,
                error: 'Report data is required'
            });
        }

        const explanation = await groqService.generatePatientExplanation(reportData, mode || 'chat');

        res.json({
            success: true,
            provider: 'groq',
            model: mode === 'fast' ? groqService.GROQ_CONFIG.models.fastChat : groqService.GROQ_CONFIG.models.chat,
            explanation,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error generating explanation:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/groq/models
 * Get available Groq models and their capabilities
 */
router.get('/models', (req, res) => {
    try {
        const models = groqService.getAvailableModels();
        res.json({
            success: true,
            ...models
        });
    } catch (error) {
        console.error('Error getting Groq models:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/groq/health
 * Check Groq API health and connectivity
 */
router.get('/health', async (req, res) => {
    try {
        const isValid = await groqService.validateGroqApiKey();

        res.json({
            success: true,
            status: isValid ? 'healthy' : 'unavailable',
            configured: !!process.env.GROQ_API_KEY,
            endpoint: process.env.GROQ_API_ENDPOINT,
            models: groqService.GROQ_CONFIG.models,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error checking Groq health:', error);
        res.status(500).json({
            success: false,
            status: 'error',
            error: error.message
        });
    }
});

module.exports = router;
