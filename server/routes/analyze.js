/**
 * Analyze Route
 * Handles medical report analysis requests
 * Uses Gemini AI for all operations (vision + text analysis)
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const pdfParse = require('pdf-parse');

// Use Gemini for all AI operations (supports both vision and text)
const geminiService = require('../services/geminiService');
const safetyService = require('../services/safetyService');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Allowed: PDF, JPEG, PNG, WebP, GIF'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// In-memory cache for analyzed reports (replace with Redis/DB in production)
const reportCache = new Map();

/**
 * POST /api/analyze
 * Analyze a medical report
 */
router.post('/', upload.single('file'), async (req, res) => {
    const startTime = Date.now();

    try {
        // Validate request
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded. Please upload a PDF or image file.'
            });
        }

        const mode = req.body.mode || 'patient';
        const language = req.body.language || 'en';

        if (!['patient', 'clinician'].includes(mode)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid mode. Use "patient" or "clinician".'
            });
        }

        console.log(`Analyzing report: ${req.file.filename}, Mode: ${mode}`);

        // Generate report ID
        const reportId = uuidv4();
        const filePath = req.file.path;
        const mimeType = req.file.mimetype;

        let extractedData;

        // Extract content based on file type using Gemini
        if (mimeType === 'application/pdf') {
            // Try to extract text from PDF first
            try {
                const pdfBuffer = fs.readFileSync(filePath);
                const pdfData = await pdfParse(pdfBuffer);

                if (pdfData.text && pdfData.text.trim().length > 100) {
                    // PDF has extractable text - use Gemini text extraction
                    console.log('PDF has extractable text, using Gemini text analysis');
                    extractedData = await geminiService.extractFromText(pdfData.text);
                } else {
                    // PDF is image-based (scanned), use Gemini vision
                    console.log('PDF is image-based, using Gemini vision');
                    extractedData = await geminiService.extractFromImage(filePath, mimeType);
                }
            } catch (pdfError) {
                console.log('PDF text extraction failed, trying Gemini vision:', pdfError.message);
                extractedData = await geminiService.extractFromImage(filePath, mimeType);
            }
        } else {
            // Image file - use Gemini vision
            console.log('Image file detected, using Gemini vision');
            extractedData = await geminiService.extractFromImage(filePath, mimeType);
        }

        // Detect red flags
        const redFlags = safetyService.detectRedFlags(extractedData);
        const hasCriticalValues = redFlags.some(f => f.urgency === 'immediate');

        // Generate explanation based on mode using Gemini
        let explanation;
        if (mode === 'patient') {
            explanation = await geminiService.generatePatientExplanation(extractedData);
        } else {
            explanation = await geminiService.generateClinicianExplanation(extractedData);
        }

        // Generate citations using Gemini
        const citationData = await geminiService.generateCitations(
            extractedData,
            extractedData.reportType
        );

        // Get disclaimers and safety warnings
        const disclaimers = safetyService.getDisclaimers(
            extractedData.reportType,
            hasCriticalValues
        );
        const safetyWarnings = safetyService.generateSafetyWarnings(extractedData, redFlags);

        // Build response
        const response = {
            success: true,
            reportId,
            processingTimeMs: Date.now() - startTime,
            mode,
            language,
            reportType: extractedData.reportType,
            reportSubtype: extractedData.reportSubtype,
            extraction: {
                findings: extractedData.findings,
                measurements: extractedData.measurements,
                impressions: extractedData.impressions,
                recommendations: extractedData.recommendations,
                patientInfo: extractedData.patientInfo,
                dateOfStudy: extractedData.dateOfStudy
            },
            explanation,
            redFlags,
            hasCriticalValues,
            needsEscalation: safetyService.needsEscalation(redFlags),
            safetyWarnings,
            citations: citationData.citations,
            terminologyCodes: citationData.terminologyCodes,
            disclaimers,
            metadata: {
                fileName: req.file.originalname,
                fileSize: req.file.size,
                processedAt: new Date().toISOString()
            }
        };

        // Cache the report
        reportCache.set(reportId, {
            ...response,
            filePath // Keep file path for potential re-analysis
        });

        // Clean up uploaded file after processing (optional - keep for demo)
        // fs.unlinkSync(filePath);

        res.json(response);

    } catch (error) {
        console.error('Analysis error:', error);

        // Clean up file on error
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            error: error.message || 'Failed to analyze report',
            processingTimeMs: Date.now() - startTime
        });
    }
});

/**
 * POST /api/analyze/text
 * Analyze raw report text (no file upload)
 */
router.post('/text', async (req, res) => {
    const startTime = Date.now();

    try {
        const { reportText, mode = 'patient', language = 'en' } = req.body;

        if (!reportText || reportText.trim().length < 50) {
            return res.status(400).json({
                success: false,
                error: 'Report text is required and must be at least 50 characters.'
            });
        }

        const reportId = uuidv4();
        console.log(`Analyzing text report: ${reportId}, Mode: ${mode}`);

        // Extract data from text using Gemini
        const extractedData = await geminiService.extractFromText(reportText);

        // Detect red flags
        const redFlags = safetyService.detectRedFlags(extractedData);
        const hasCriticalValues = redFlags.some(f => f.urgency === 'immediate');

        // Generate explanation using Gemini
        let explanation;
        if (mode === 'patient') {
            explanation = await geminiService.generatePatientExplanation(extractedData);
        } else {
            explanation = await geminiService.generateClinicianExplanation(extractedData);
        }

        // Generate citations using Gemini
        const citationData = await geminiService.generateCitations(
            extractedData,
            extractedData.reportType
        );

        // Get disclaimers
        const disclaimers = safetyService.getDisclaimers(extractedData.reportType, hasCriticalValues);
        const safetyWarnings = safetyService.generateSafetyWarnings(extractedData, redFlags);

        const response = {
            success: true,
            reportId,
            processingTimeMs: Date.now() - startTime,
            mode,
            language,
            reportType: extractedData.reportType,
            reportSubtype: extractedData.reportSubtype,
            extraction: {
                findings: extractedData.findings,
                measurements: extractedData.measurements,
                impressions: extractedData.impressions,
                recommendations: extractedData.recommendations
            },
            explanation,
            redFlags,
            hasCriticalValues,
            needsEscalation: safetyService.needsEscalation(redFlags),
            safetyWarnings,
            citations: citationData.citations,
            terminologyCodes: citationData.terminologyCodes,
            disclaimers,
            metadata: {
                inputType: 'text',
                textLength: reportText.length,
                processedAt: new Date().toISOString()
            }
        };

        reportCache.set(reportId, response);
        res.json(response);

    } catch (error) {
        console.error('Text analysis error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to analyze report text',
            processingTimeMs: Date.now() - startTime
        });
    }
});

/**
 * POST /api/analyze/switch-mode
 * Switch explanation mode for an existing report
 */
router.post('/switch-mode', async (req, res) => {
    try {
        const { reportId, newMode } = req.body;

        if (!reportId || !newMode) {
            return res.status(400).json({
                success: false,
                error: 'reportId and newMode are required'
            });
        }

        if (!['patient', 'clinician'].includes(newMode)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid mode. Use "patient" or "clinician".'
            });
        }

        const cachedReport = reportCache.get(reportId);
        if (!cachedReport) {
            return res.status(404).json({
                success: false,
                error: 'Report not found. Please re-upload and analyze.'
            });
        }

        // Generate new explanation in requested mode using Gemini
        let newExplanation;
        if (newMode === 'patient') {
            newExplanation = await geminiService.generatePatientExplanation({
                findings: cachedReport.extraction.findings,
                measurements: cachedReport.extraction.measurements,
                impressions: cachedReport.extraction.impressions
            });
        } else {
            newExplanation = await geminiService.generateClinicianExplanation({
                findings: cachedReport.extraction.findings,
                measurements: cachedReport.extraction.measurements,
                impressions: cachedReport.extraction.impressions
            });
        }

        // Update cache
        cachedReport.mode = newMode;
        cachedReport.explanation = newExplanation;
        reportCache.set(reportId, cachedReport);

        res.json({
            success: true,
            reportId,
            mode: newMode,
            explanation: newExplanation
        });

    } catch (error) {
        console.error('Mode switch error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to switch mode'
        });
    }
});

// Export cache for other routes
router.getCache = () => reportCache;

module.exports = router;
