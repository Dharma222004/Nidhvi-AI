/**
 * Enhanced Analysis Route
 * Handles complete workflow: Extract → Analyze → Find Hospitals → Translate
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Services
const { extractFromImage, extractFromText, generatePatientExplanation } = require('../services/geminiService');
const { generateChatCompletion } = require('../services/groqService');
const { findHospitalsAndDoctors } = require('../services/hospitalFinderService');
const { translateReport } = require('../services/translationService');
const { getStandardDisclaimers, detectRedFlags } = require('../services/safetyService');

// Configure multer for file uploads - Use memory storage for Vercel
const storage = multer.memoryStorage();
const upload = multer({
<<<<<<< HEAD
    storage: storage,
=======
    dest: (process.env.VERCEL || process.env.NODE_ENV === 'production') ? '/tmp' : 'uploads/',
>>>>>>> dcd52a959bdb91ce4340e0498b60e9c8a5d57696
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE_MB || '10') * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only images (JPG, PNG, WEBP) and PDF files are allowed'));
    }
});

/**
 * POST /api/enhanced/analyze
 * Complete analysis workflow
 */
router.post('/analyze', upload.single('file'), async (req, res) => {
    try {
        const { mode = 'patient', language = 'en', userLocation = null } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        const fileBuffer = req.file.buffer;
        const mimeType = req.file.mimetype;

        console.log(`\n=== Enhanced Analysis Started (Memory Mode) ===`);
        console.log(`File: ${req.file.originalname}`);
        console.log(`Mode: ${mode}, Language: ${language}`);

        // Step 1: Extract text from file (Pass buffer instead of path)
        console.log('Step 1: Extracting text...');
        const extractedData = await extractFromImage(fileBuffer, mimeType);

        // Step 2: Analyze medical content using Groq's llama-3.3-70b
        console.log('Step 2: Analyzing medical content...');
        const analysisPrompt = `You are a medical AI assistant. Analyze this medical report and provide a comprehensive analysis.

EXTRACTED DATA:
${JSON.stringify(extractedData, null, 2)}

Provide a JSON response with:
{
  "summary": "Brief 2-3 sentence overview",
  "reportType": "blood_test|radiology|prescription|other",
  "patientInfo": {
    "age": "if available",
    "gender": "if available"
  },
  "keyFindings": [
    {
      "finding": "description",
      "status": "normal|abnormal|critical",
      "significance": "low|medium|high"
    }
  ],
  "abnormalValues": [
    {
      "parameter": "name",
      "value": "measured value",
      "normalRange": "expected range",
      "deviation": "how much off normal"
    }
  ],
  "possibleConditions": [
    {
      "condition": "name",
      "confidence": "low|medium|high",
      "supportingFindings": ["finding1", "finding2"]
    }
  ],
  "severity": "low|medium|high",
  "recommendedSpecialist": "type of specialist needed",
  "nextSteps": ["action1", "action2", "action3"],
  "disclaimer": "Always consult a qualified healthcare professional for medical advice and diagnosis."
}

IMPORTANT: Return ONLY valid JSON. Be medically accurate but patient-friendly.`;

        const analysisResponse = await generateChatCompletion({
            messages: [
                {
                    role: 'system',
                    content: 'You are a medical AI providing safe, accurate analysis. Always include appropriate disclaimers and avoid dangerous advice.'
                },
                {
                    role: 'user',
                    content: analysisPrompt
                }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.2,
            maxTokens: 3000,
            responseFormat: { type: 'json_object' }
        });

        const analysis = JSON.parse(analysisResponse.content);

        // Step 3: Prepare hospital recommendation data (NO auto-search)
        // Hospital search is ON-DEMAND only - user clicks button to trigger Perplexity
        console.log('Step 3: Preparing hospital recommendation metadata...');

        const hospitalSearchParams = {
            condition: analysis.possibleConditions?.[0]?.condition || 'general checkup',
            specialistType: analysis.recommendedSpecialist || 'General Physician',
            severity: analysis.severity || 'medium',
            needsDoctor: analysis.severity === 'high' || analysis.severity === 'critical' ||
                (analysis.abnormalValues && analysis.abnormalValues.length > 0),
            recommendation: {
                title: analysis.severity === 'critical' ? 'Seek Immediate Medical Attention' :
                    analysis.severity === 'high' ? 'Doctor Visit Recommended' :
                        'Discuss with Your Doctor',
                message: analysis.severity === 'critical' ?
                    'Your results show critical findings. Please visit a hospital immediately.' :
                    analysis.severity === 'high' ?
                        'Some findings need medical attention. Please schedule an appointment soon.' :
                        'You may want to discuss these results with your healthcare provider.',
                action: 'Click "Find Hospitals & Doctors" below to find specialists in your area',
                timeline: analysis.severity === 'critical' ? 'Immediately' :
                    analysis.severity === 'high' ? 'Within 1-2 days' : 'At your convenience'
            }
        };

        console.log(`Doctor visit needed: ${hospitalSearchParams.needsDoctor}, Severity: ${hospitalSearchParams.severity}`);

        // Step 4: Generate patient-friendly explanation
        console.log('Step 4: Generating explanation...');
        const explanation = await generatePatientExplanation(extractedData);

        // Step 5: Detect red flags and add safety information
        const redFlags = detectRedFlags(extractedData);
        const disclaimers = getStandardDisclaimers();

        // Compile complete response
        const responseData = {
            success: true,
            reportId: `RPT-${Date.now()}`,
            timestamp: new Date().toISOString(),

            // Original extraction
            extraction: extractedData,

            // Analysis
            analysis,

            // Explanation
            explanation,

            // Hospitals and doctors (metadata only - NO auto-search results)
            // User must click button to search hospitals
            hospitalSearchParams,

            // Safety
            redFlags,
            disclaimers,

            // Metadata
            mode,
            language
        };

        // Step 6: Translate if needed
        if (language && language !== 'en') {
            console.log(`Step 5: Translating to ${language}...`);
            try {
                const translationContent = `
## Summary
${analysis.summary}

## Key Findings
${analysis.keyFindings.map(f => `- ${f.finding} (${f.status})`).join('\n')}

## Possible Conditions
${analysis.possibleConditions.map(c => `- ${c.condition} (${c.confidence} confidence)`).join('\n')}

## Next Steps
${analysis.nextSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

## Explanation
${explanation.explanation}

${analysis.disclaimer}
        `;

                const translated = await translateReport({
                    content: translationContent,
                    sourceLanguage: 'en',
                    targetLanguage: language,
                    reportType: 'medical_analysis'
                });

                responseData.translatedReport = translated;
            } catch (error) {
                console.error('Translation error:', error);
                responseData.translationError = error.message;
            }
        }

        console.log('=== Analysis Complete ===\n');

        res.json(responseData);

    } catch (error) {
        console.error('Enhanced analysis error:', error);
        res.status(500).json({
            success: false,
            error: 'Analysis failed',
            message: error.message
        });
    }
});

/**
 * POST /api/enhanced/text-analysis
 * Analyze pasted text
 */
router.post('/text-analysis', async (req, res) => {
    try {
        const { text, mode = 'patient', language = 'en', userLocation = null } = req.body;

        if (!text || text.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No text provided'
            });
        }

        console.log('Analyzing pasted text...');

        // Extract from text
        const extractedData = await extractFromText(text);

        // Similar analysis flow as file upload
        // (same as above but without file handling)

        const analysisPrompt = `Analyze this medical report text:

${text}

Provide analysis in JSON format with summary, findings, conditions, specialist recommendation, and next steps.`;

        const analysisResponse = await generateChatCompletion({
            messages: [{ role: 'user', content: analysisPrompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.2,
            responseFormat: { type: 'json_object' }
        });

        const analysis = JSON.parse(analysisResponse.content);
        const explanation = await generatePatientExplanation(extractedData);

        // Prepare hospital search params for on-demand search
        const hospitalSearchParams = {
            condition: analysis.possibleConditions?.[0]?.condition ||
                analysis.condition || 'general checkup',
            specialistType: analysis.recommendedSpecialist ||
                analysis.specialist || 'General Physician',
            severity: analysis.severity || 'medium',
            needsDoctor: analysis.severity === 'high' || analysis.severity === 'critical' ||
                (analysis.abnormalValues && analysis.abnormalValues.length > 0) ||
                (analysis.findingsToDiscuss && analysis.findingsToDiscuss.length > 0),
            recommendation: {
                title: analysis.severity === 'critical' ? 'Seek Immediate Medical Attention' :
                    analysis.severity === 'high' ? 'Doctor Visit Recommended' :
                        'Discuss with Your Doctor',
                message: analysis.severity === 'critical' ?
                    'Your results show critical findings. Please visit a hospital immediately.' :
                    analysis.severity === 'high' ?
                        'Some findings need medical attention. Please schedule an appointment soon.' :
                        'You may want to discuss these results with your healthcare provider.',
                action: 'Click "Find Hospitals & Doctors" below to find specialists in your area',
                timeline: analysis.severity === 'critical' ? 'Immediately' :
                    analysis.severity === 'high' ? 'Within 1-2 days' : 'At your convenience'
            }
        };

        res.json({
            success: true,
            extraction: extractedData,
            analysis,
            explanation,
            hospitalSearchParams,
            mode,
            language
        });

    } catch (error) {
        console.error('Text analysis error:', error);
        res.status(500).json({
            success: false,
            error: 'Text analysis failed',
            message: error.message
        });
    }
});

/**
 * POST /api/enhanced/ask-doubt
 * Q&A based on analysis context
 */
router.post('/ask-doubt', async (req, res) => {
    try {
        const { question, context, language = 'en' } = req.body;

        if (!question) {
            return res.status(400).json({
                success: false,
                error: 'No question provided'
            });
        }

        const prompt = `You are a helpful medical AI assistant. Answer the patient's question based ONLY on the medical report context provided.

MEDICAL REPORT CONTEXT:
${JSON.stringify(context, null, 2)}

PATIENT'S QUESTION:
${question}

GUIDELINES:
- Answer based only on the report context
- Be clear, simple, and reassuring
- If the question is outside the report scope, politely say so
- Always remind them to consult their doctor
- Keep answer under 150 words

Provide your answer:`;

        const response = await generateChatCompletion({
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful medical assistant. Provide safe, context-based answers to patient questions.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            model: 'llama-3.1-8b-instant', // Use fast model for Q&A
            temperature: 0.3,
            maxTokens: 300
        });

        res.json({
            success: true,
            question,
            answer: response.content,
            language
        });

    } catch (error) {
        console.error('Q&A error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to answer question',
            message: error.message
        });
    }
});

/**
 * POST /api/enhanced/find-hospitals
 * On-demand hospital search using Perplexity API
 * Only called when user clicks "Find Hospitals & Doctors" button
 */
router.post('/find-hospitals', async (req, res) => {
    try {
        const {
            condition,
            specialistType,
            location = null,
            reportText = '',
            severity = 'medium'
        } = req.body;

        if (!condition && !specialistType) {
            return res.status(400).json({
                success: false,
                error: 'Please provide either a condition or specialist type'
            });
        }

        console.log('\n=== On-Demand Hospital Search ===');
        console.log(`Condition: ${condition}`);
        console.log(`Specialist: ${specialistType}`);
        console.log(`Location: ${location || 'To be detected from report'}`);

        // Use the hospital finder service with Perplexity
        const hospitalsData = await findHospitalsAndDoctors({
            condition: condition || 'general health checkup',
            specialistType: specialistType || 'General Physician',
            reportText,
            userLocation: location,
            filterType: 'both' // Search both govt and private
        });

        // Add severity-based recommendations
        let urgencyMessage = '';
        switch (severity) {
            case 'critical':
                urgencyMessage = '🚨 URGENT: Please seek immediate medical attention. Visit the nearest emergency department.';
                break;
            case 'high':
                urgencyMessage = '⚠️ HIGH PRIORITY: Schedule an appointment within 1-2 days.';
                break;
            case 'medium':
                urgencyMessage = '📋 Schedule an appointment within 1-2 weeks for proper evaluation.';
                break;
            default:
                urgencyMessage = '✅ This can be discussed at your next routine checkup.';
        }

        res.json({
            success: true,
            hospitals: hospitalsData,
            urgencyMessage,
            searchedFor: {
                condition,
                specialistType,
                location: hospitalsData.location?.used || location || 'India'
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Hospital search error:', error);

        // Provide helpful error messages
        let userMessage = 'Unable to find hospitals at this time.';

        if (error.message.includes('API key')) {
            userMessage = 'Hospital search service is not configured. Please contact support.';
        } else if (error.message.includes('rate limit') || error.message.includes('429')) {
            userMessage = 'Too many requests. Please try again in a few moments.';
        } else if (error.message.includes('network') || error.message.includes('timeout')) {
            userMessage = 'Network error. Please check your connection and try again.';
        }

        res.status(500).json({
            success: false,
            error: userMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * POST /api/enhanced/translate
 * On-demand translation of analysis results to user's preferred language
 * Only called when user clicks "Translate" button
 */
router.post('/translate', async (req, res) => {
    try {
        const {
            content,
            targetLanguage,
            analysisData = null
        } = req.body;

        if (!targetLanguage) {
            return res.status(400).json({
                success: false,
                error: 'Please select a language to translate to'
            });
        }

        if (targetLanguage === 'en') {
            return res.json({
                success: true,
                translatedContent: content,
                targetLanguage: 'en',
                targetLanguageName: 'English',
                skipped: true,
                message: 'Content is already in English'
            });
        }

        console.log(`\n=== On-Demand Translation ===`);
        console.log(`Target Language: ${targetLanguage}`);

        // Build content to translate from analysis data
        let textToTranslate = content;

        if (!textToTranslate && analysisData) {
            const analysis = analysisData.analysis || {};
            const explanation = analysisData.explanation || {};

            textToTranslate = `
## Summary
${analysis.summary || explanation.summary || 'No summary available'}

## Key Findings
${(analysis.keyFindings || []).map(f => `- ${f.finding} (${f.status})`).join('\n') || 'No findings available'}

## What This Means
${explanation.whatItMeans || explanation.explanation || 'No explanation available'}

## Next Steps
${(analysis.nextSteps || explanation.nextSteps || []).map((step, i) => `${i + 1}. ${step}`).join('\n') || 'Please consult your doctor'}

## Questions to Ask Your Doctor
${(explanation.questionsForDoctor || []).map((q, i) => `${i + 1}. ${q}`).join('\n') || ''}

---
Note: This is an AI-generated analysis. Please consult a qualified healthcare professional for medical advice.
            `.trim();
        }

        if (!textToTranslate) {
            return res.status(400).json({
                success: false,
                error: 'No content provided for translation'
            });
        }

        // Use translation service
        const translationResult = await translateReport({
            content: textToTranslate,
            sourceLanguage: 'en',
            targetLanguage,
            reportType: 'medical_analysis'
        });

        console.log(`Translation successful to ${translationResult.targetLanguageName}`);

        res.json({
            success: true,
            translatedContent: translationResult.translatedContent,
            sourceLanguage: 'en',
            targetLanguage,
            targetLanguageName: translationResult.targetLanguageName,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Translation error:', error);

        res.status(500).json({
            success: false,
            error: 'Translation failed. Please try again.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/enhanced/languages
 * Get list of supported languages for translation
 */
router.get('/languages', (req, res) => {
    res.json({
        success: true,
        languages: [
            { code: 'en', name: 'English', nativeName: 'English' },
            { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
            { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
            { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
            { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
            { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
            { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
            { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
            { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
            { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
            { code: 'ur', name: 'Urdu', nativeName: 'اردو' }
        ]
    });
});

module.exports = router;


