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
    storage: storage,
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
 * On-demand hospital search using Gemini API
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

        // Use the hospital finder service with Gemini
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
## What This Report Is About
${analysis.summary || explanation.summary || 'No summary available'}

## Understanding Your Results
${explanation.explanation || explanation.whatItMeans || 'No detailed explanation available'}

## What's Normal vs. What Needs Attention
${(analysis.keyFindings || []).map(f => `- ${f.finding} (${f.status})`).join('\n') || 'No findings available'}

## Clear Next Steps
${(analysis.nextSteps || explanation.nextSteps || []).map((step, i) => `- ${step}`).join('\n') || 'Please consult your doctor'}

## Questions to Ask Your Doctor
${(explanation.questionsForDoctor || []).map((q, i) => `- ${q}`).join('\n') || ''}

## A Reassuring Closing Message
Remember: This is an AI-powered explanation. Always check with your doctor before making any medical decisions.
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

        console.log(`Translation successful to ${translationResult.targetLanguageName} `);

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

/**
 * POST /api/enhanced/analyze-stream
 * Streaming analysis using SSE — returns results incrementally as they are ready
 */
router.post('/analyze-stream', upload.single('file'), async (req, res) => {
    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const send = (event, data) => {
        res.write(`event: ${event} \ndata: ${JSON.stringify(data)} \n\n`);
    };

    try {
        const { mode = 'patient', language = 'en' } = req.body;

        if (!req.file) {
            send('error', { message: 'No file uploaded' });
            return res.end();
        }

        send('status', { message: 'Extracting text from your report...', progress: 10 });

        // Step 1: Extract
        const fileBuffer = req.file.buffer;
        const mimeType = req.file.mimetype;
        const { extractFromImage } = require('../services/geminiService');
        const extractedData = await extractFromImage(fileBuffer, mimeType);
        send('extraction', extractedData);
        send('status', { message: 'Analyzing medical findings...', progress: 30 });

        // Step 2: Analyze (Groq)
        const analysisPrompt = `You are a medical AI assistant.Analyze this medical report data and return ONLY valid JSON.

EXTRACTED DATA:
${JSON.stringify(extractedData, null, 2)}

Return JSON with these exact fields:
        {
            "summary": "2-3 sentence plain language overview",
                "reportType": "blood_test|radiology|prescription|other",
                    "patientInfo": { "age": "", "gender": "" },
            "keyFindings": [{ "finding": "", "status": "normal|abnormal|critical", "significance": "low|medium|high" }],
                "abnormalValues": [{ "parameter": "", "value": "", "normalRange": "", "deviation": "" }],
                    "possibleConditions": [{ "condition": "", "confidence": "low|medium|high", "supportingFindings": [] }],
                        "severity": "low|medium|high|critical",
                            "recommendedSpecialist": "specialist type",
                                "nextSteps": ["step1", "step2"],
                                    "questionsForDoctor": ["question1", "question2", "question3"],
                                        "disclaimer": "Always consult a qualified healthcare professional."
        } `;

        const analysisResponse = await generateChatCompletion({
            messages: [
                { role: 'system', content: 'You are a medical AI assistant. Return ONLY valid JSON, no markdown.' },
                { role: 'user', content: analysisPrompt }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.1,
            maxTokens: 3000,
            responseFormat: { type: 'json_object' }
        });

        const analysis = JSON.parse(analysisResponse.content);

        // Build hospital search params + detect location from report
        const { extractLocationFromReport } = require('../services/hospitalFinderService');
        const detectedLoc = extractLocationFromReport(extractedData.rawText || '');
        const detectedLocationStr = detectedLoc
            ? (detectedLoc.fullAddress || detectedLoc.city || (detectedLoc.pincode ? `Pincode ${detectedLoc.pincode} ` : null))
            : null;

        const hospitalSearchParams = {
            condition: analysis.possibleConditions?.[0]?.condition || 'general checkup',
            specialistType: analysis.recommendedSpecialist || 'General Physician',
            severity: analysis.severity || 'medium',
            needsDoctor: analysis.severity === 'high' || analysis.severity === 'critical' ||
                (analysis.abnormalValues && analysis.abnormalValues.length > 0),
            detectedLocation: detectedLocationStr,
            recommendation: {
                title: analysis.severity === 'critical' ? 'Seek Immediate Medical Attention' :
                    analysis.severity === 'high' ? 'Doctor Visit Recommended' : 'Discuss with Your Doctor',
                message: analysis.severity === 'critical'
                    ? 'Your results show critical findings. Please visit a hospital immediately.'
                    : analysis.severity === 'high'
                        ? 'Some findings need medical attention. Please schedule an appointment soon.'
                        : 'You may want to discuss these results with your healthcare provider.',
                timeline: analysis.severity === 'critical' ? 'Immediately' :
                    analysis.severity === 'high' ? 'Within 1-2 days' : 'At your convenience'
            }
        };

        send('analysis', { analysis, hospitalSearchParams });
        send('status', { message: 'Generating patient-friendly explanation...', progress: 55 });

        // Step 3: Stream Explanation (Gemini streaming)
        const { generatePatientExplanationStream, generateClinicianExplanationStream } = require('../services/geminiService');

        let fullExplanation = '';
        try {
            if (mode === 'clinician') {
                await generateClinicianExplanationStream(extractedData, (chunk) => {
                    fullExplanation += chunk;
                    send('explanation_chunk', { chunk, mode: 'clinician' });
                });
                send('explanation_final', { clinicalSummary: fullExplanation, mode: 'clinician' });
            } else {
                await generatePatientExplanationStream(extractedData, (chunk) => {
                    fullExplanation += chunk;
                    send('explanation_chunk', { chunk, mode: 'patient' });
                });
                // Build structured explanation from streamed text
                const paragraphs = fullExplanation.split('\n\n').filter(Boolean);
                send('explanation_final', {
                    summary: paragraphs[0] || '',
                    explanation: fullExplanation,
                    nextSteps: analysis.nextSteps || [],
                    questionsForDoctor: analysis.questionsForDoctor || [],
                    mode: 'patient'
                });
            }
        } catch (explainErr) {
            console.error('Explanation streaming error:', explainErr);
            // Fallback: use analysis summary
            send('explanation_final', {
                summary: analysis.summary || '',
                explanation: analysis.summary || 'Analysis complete. Please consult your doctor.',
                nextSteps: analysis.nextSteps || [],
                questionsForDoctor: analysis.questionsForDoctor || []
            });
        }

        send('status', { message: 'Running safety checks...', progress: 90 });

        // Step 4: Safety
        const redFlags = detectRedFlags(extractedData);
        const disclaimers = getStandardDisclaimers();
        send('safety', { redFlags, disclaimers });

        send('status', { message: 'Analysis complete! ✅', progress: 100 });
        send('done', { success: true });
        res.end();

    } catch (error) {
        console.error('Streaming analysis error:', error);
        send('error', { message: error.message || 'Analysis failed. Please try again.' });
        res.end();
    }
});

module.exports = router;



