/**
 * Model Selection Strategy Service
 * Determines the best AI model for each specific task
 */

const geminiService = require('./geminiService');
const groqService = require('./groqService');
const oxloService = require('./oxloService');
const sarvamService = require('./sarvamService');

/**
 * MODEL SELECTION STRATEGY
 * 
 * 1. PDF Processing:
 *    - PDF with text → PDF parser (pdfplumber/pymupdf)
 *    - Scanned PDF/Images → Oxlo gemma-3-4b (OCR) → fallback: Gemini 2.5-flash
 * 
 * 2. Medical Analysis:
 *    - Groq llama-3.3-70b-versatile
 * 
 * 3. Hospital/Doctor Finder:
 *    - Gemini API (hospital search)
 *    - Groq llama-3.1-8b-instant (summarize results)
 * 
 * 4. Translation:
 *    - Sarvam AI (Best for Indic) → fallback: Groq llama-3.3-70b-versatile
 * 
 * 5. Q&A:
 *    - Complex: Groq llama-3.3-70b-versatile
 *    - Quick: Groq llama-3.1-8b-instant
 *    - Voice (STT): Sarvam (Indic) or Groq whisper-large-v3-turbo → fallback: Oxlo whisper-large
 *    - Voice (TTS): Sarvam (Indic) or Groq orpheus-v1-english or Oxlo kokoro-82m
 */

const MODEL_STRATEGY = {
    // PDF Processing
    PDF_TEXT_EXTRACTION: 'pdf-parser', // Use pdfplumber/pymupdf
    PDF_OCR_PRIMARY: 'oxlo-gemma-3-4b',
    PDF_OCR_FALLBACK: 'gemini-2.5-flash',

    // Medical Analysis
    MEDICAL_ANALYSIS: 'groq-llama-70b',
    ISSUE_IDENTIFICATION: 'groq-llama-70b',

    // Hospital/Doctor Finder
    WEB_RESEARCH: 'gemini',
    RESEARCH_SUMMARIZATION: 'groq-llama-8b',

    // Translation
    TRANSLATION: 'sarvam',
    TRANSLATION_FALLBACK: 'groq-llama-70b',

    // Q&A
    QA_COMPLEX: 'groq-llama-70b',
    QA_QUICK: 'groq-llama-8b',

    // Voice
    STT_INDIC: 'sarvam',
    STT_PRIMARY: 'groq-whisper-turbo',
    STT_FALLBACK: 'oxlo-whisper-large',
    TTS_INDIC: 'sarvam',
    TTS_PRIMARY: 'groq-orpheus',
    TTS_FALLBACK: 'oxlo-kokoro',

    // Report Generation
    REPORT_PATIENT_FRIENDLY: 'groq-llama-8b',
    REPORT_PROFESSIONAL: 'groq-llama-70b'
};

/**
 * Extract text from PDF with selectable text
 * Uses PDF parser (not LLM) - most efficient
 * @param {string} pdfPath - Path to PDF file
 * @returns {Promise<string>} Extracted text
 */
async function extractTextFromPDF(pdfPath) {
    // This would use pdfplumber or pymupdf
    // For now, returning placeholder - implement with actual PDF library
    const pdfParse = require('pdf-parse');
    const fs = require('fs');

    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } catch (error) {
        console.error('PDF text extraction failed:', error);
        throw error;
    }
}

/**
 * Extract text from scanned PDF or image using OCR
 * Primary: Oxlo gemma-3-4b (best for OCR + layout)
 * Fallback: Gemini 2.5-flash (for handwriting/complex)
 * @param {string} filePath - Path to file
 * @param {string} mimeType - File MIME type
 * @returns {Promise<Object>} Extracted data
 */
async function extractWithOCR(filePath, mimeType) {
    try {
        // Primary: Use Oxlo gemma-3-4b for fast OCR
        console.log('Using Oxlo gemma-3-4b for OCR...');
        const fs = require('fs');
        const imageBuffer = fs.readFileSync(filePath);
        const base64Image = imageBuffer.toString('base64');

        const result = await oxloService.extractFromImageOCR(base64Image, mimeType);
        return {
            provider: 'oxlo',
            model: 'gemma-3-4b',
            data: result
        };
    } catch (error) {
        console.log('Oxlo OCR failed, falling back to Gemini...');

        // Fallback: Use Gemini for complex/handwriting
        const result = await geminiService.extractFromImage(filePath, mimeType);
        return {
            provider: 'gemini',
            model: 'gemini-2.5-flash',
            data: result
        };
    }
}

/**
 * Perform medical analysis on extracted report data
 * Uses: Groq llama-3.3-70b-versatile (best for clinical interpretation)
 * @param {string} reportText - Extracted report text
 * @returns {Promise<Object>} Analysis result
 */
async function analyzeMedicalReport(reportText) {
    console.log('Analyzing medical report with Groq llama-3.3-70b...');

    const analysis = await groqService.analyzeReport(reportText, 'chat');

    return {
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        analysis
    };
}

/**
 * Identify issues and provide suggestions
 * Uses: Groq llama-3.3-70b-versatile
 * @param {Object} analysis - Medical analysis data
 * @returns {Promise<Object>} Issues and suggestions
 */
async function identifyIssuesAndSuggestions(analysis) {
    const prompt = `Based on this medical analysis, identify any health issues and provide actionable suggestions:

${JSON.stringify(analysis, null, 2)}

Provide:
1. Key health issues identified
2. Severity level for each issue
3. Recommended next steps
4. When to seek medical attention`;

    const response = await groqService.medicalQA(prompt);

    return {
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        issues: response
    };
}

/**
 * Find hospitals and specialist doctors using web research
 * Primary: Gemini API (hospital search)
 * Summarization: Groq llama-3.1-8b-instant
 * @param {Object} searchParams - Search parameters (location, specialty, condition)
 * @returns {Promise<Object>} Hospital and doctor recommendations
 */
async function findHospitalsAndDoctors(searchParams) {
    const { location, specialty, condition } = searchParams;

    // Use Gemini for web research
    const searchQuery = `Find best hospitals and specialist doctors for ${condition} in ${location}. Include:
- Hospital names and ratings
- Specialist doctors with qualifications
- Contact information
- Patient reviews`;

    // Note: Implement actual Gemini API call here
    // For now, using Groq as placeholder
    const researchResults = await groqService.medicalQA(searchQuery);

    // Summarize results with fast Groq model
    const summary = await groqService.fastChat(
        `Summarize these hospital/doctor recommendations in a clear, organized format:\n\n${researchResults}`
    );

    return {
        research: {
            provider: 'gemini',
            rawResults: researchResults
        },
        summary: {
            provider: 'groq',
            model: 'llama-3.1-8b-instant',
            content: summary
        }
    };
}

/**
 * Translate medical content to target language
 * Uses: Groq llama-3.3-70b-versatile (best translation quality)
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language (ta, te, hi, etc.)
 * @returns {Promise<string>} Translated text
 */
async function translateContent(text, targetLanguage) {
    const languageNames = {
        ta: 'Tamil',
        te: 'Telugu',
        hi: 'Hindi',
        en: 'English'
    };

    const prompt = `Translate this medical content to ${languageNames[targetLanguage] || targetLanguage}.
Maintain medical accuracy and use simple, patient-friendly language:

${text}`;

    const translation = await groqService.medicalQA(prompt);

    return {
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        targetLanguage,
        translation
    };
}

/**
 * Handle user Q&A - complex questions
 * Uses: Groq llama-3.3-70b-versatile
 * @param {string} question - User question
 * @param {string} context - Optional context
 * @returns {Promise<string>} Answer
 */
async function handleComplexQA(question, context = '') {
    return await groqService.medicalQA(question, context);
}

/**
 * Handle user Q&A - quick questions
 * Uses: Groq llama-3.1-8b-instant (faster)
 * @param {string} question - User question
 * @param {Array} history - Conversation history
 * @returns {Promise<string>} Answer
 */
async function handleQuickQA(question, history = []) {
    return await groqService.fastChat(question, history);
}

/**
 * Transcribe voice question
 * Primary: Groq whisper-large-v3-turbo (fast + accurate)
 * Fallback: Oxlo whisper-large
 * @param {string} audioPath - Path to audio file
 * @returns {Promise<Object>} Transcription
 */
async function transcribeVoiceQuestion(audioPath) {
    try {
        // Primary: Groq Whisper Turbo
        const result = await groqService.transcribeAudio(audioPath);
        return {
            provider: 'groq',
            model: 'whisper-large-v3-turbo',
            transcription: result
        };
    } catch (error) {
        console.log('Groq STT failed, using Oxlo fallback...');

        // Fallback: Oxlo Whisper Large
        const result = await oxloService.analyzeAudioReport(audioPath, 'large');
        return {
            provider: 'oxlo',
            model: 'whisper-large',
            transcription: result
        };
    }
}

/**
 * Generate voice answer (Text-to-Speech)
 * Primary: Groq orpheus-v1-english
 * Fallback: Oxlo kokoro-82m
 * @param {string} text - Text to convert to speech
 * @param {Object} options - Voice options
 * @returns {Promise<Buffer>} Audio buffer
 */
async function generateVoiceAnswer(text, options = {}) {
    try {
        // Primary: Groq Orpheus
        const audio = await groqService.textToSpeech(text, options);
        return {
            provider: 'groq',
            model: 'orpheus-v1-english',
            audio
        };
    } catch (error) {
        console.log('Groq TTS failed, using Oxlo fallback...');

        // Fallback: Oxlo Kokoro
        const audio = await oxloService.generateSpeech(text, options);
        return {
            provider: 'oxlo',
            model: 'kokoro-82m',
            audio
        };
    }
}

/**
 * Generate patient-friendly report summary
 * Uses: Groq llama-3.1-8b-instant (fast, simple language)
 * @param {Object} reportData - Report data
 * @returns {Promise<string>} Patient-friendly summary
 */
async function generatePatientSummary(reportData) {
    const result = await groqService.generatePatientExplanation(reportData, 'fast');

    return {
        provider: 'groq',
        model: 'llama-3.1-8b-instant',
        summary: result
    };
}

/**
 * Generate professional doctor-style report
 * Uses: Groq llama-3.3-70b-versatile (professional, structured)
 * @param {Object} reportData - Report data
 * @returns {Promise<string>} Professional report
 */
async function generateProfessionalReport(reportData) {
    const prompt = `Generate a professional medical report based on this data.
Use proper medical terminology, structured format, and clinical language.
Include: Chief Complaint, Findings, Impressions, Recommendations.

Data:
${JSON.stringify(reportData, null, 2)}`;

    const result = await groqService.medicalQA(prompt);

    return {
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        report: result
    };
}

/**
 * Process report end-to-end with optimal model selection
 * @param {Object} file - Uploaded file
 * @param {string} mode - 'patient' or 'clinician'
 * @returns {Promise<Object>} Complete analysis
 */
async function processReportOptimized(file, mode = 'patient') {
    const result = {
        step1_extraction: null,
        step2_analysis: null,
        step3_issues: null,
        step4_report: null,
        metadata: {
            modelsUsed: [],
            processingTime: {}
        }
    };

    const startTime = Date.now();

    // Step 1: Extract text/data from file
    let extractedText;
    if (file.mimetype === 'application/pdf') {
        try {
            // Try PDF parser first
            extractedText = await extractTextFromPDF(file.path);
            result.step1_extraction = {
                method: 'pdf-parser',
                text: extractedText
            };
            result.metadata.modelsUsed.push('pdf-parser');
        } catch (error) {
            // If parser fails, use OCR
            const ocrResult = await extractWithOCR(file.path, file.mimetype);
            extractedText = ocrResult.data.content || JSON.stringify(ocrResult.data);
            result.step1_extraction = ocrResult;
            result.metadata.modelsUsed.push(ocrResult.model);
        }
    } else {
        // Image file - use OCR
        const ocrResult = await extractWithOCR(file.path, file.mimetype);
        extractedText = ocrResult.data.content || JSON.stringify(ocrResult.data);
        result.step1_extraction = ocrResult;
        result.metadata.modelsUsed.push(ocrResult.model);
    }

    result.metadata.processingTime.extraction = Date.now() - startTime;

    // Step 2: Medical Analysis
    const analysisStart = Date.now();
    const analysis = await analyzeMedicalReport(extractedText);
    result.step2_analysis = analysis;
    result.metadata.modelsUsed.push('llama-3.3-70b-versatile');
    result.metadata.processingTime.analysis = Date.now() - analysisStart;

    // Step 3: Issue Identification
    const issuesStart = Date.now();
    const issues = await identifyIssuesAndSuggestions(analysis.analysis);
    result.step3_issues = issues;
    result.metadata.processingTime.issues = Date.now() - issuesStart;

    // Step 4: Generate Report
    const reportStart = Date.now();
    if (mode === 'patient') {
        result.step4_report = await generatePatientSummary(analysis.analysis);
        result.metadata.modelsUsed.push('llama-3.1-8b-instant');
    } else {
        result.step4_report = await generateProfessionalReport(analysis.analysis);
        result.metadata.modelsUsed.push('llama-3.3-70b-versatile');
    }
    result.metadata.processingTime.report = Date.now() - reportStart;

    result.metadata.processingTime.total = Date.now() - startTime;

    return result;
}

module.exports = {
    MODEL_STRATEGY,

    // PDF Processing
    extractTextFromPDF,
    extractWithOCR,

    // Medical Analysis
    analyzeMedicalReport,
    identifyIssuesAndSuggestions,

    // Hospital/Doctor Finder
    findHospitalsAndDoctors,

    // Translation
    translateContent,

    // Q&A
    handleComplexQA,
    handleQuickQA,

    // Voice
    transcribeVoiceQuestion,
    generateVoiceAnswer,

    // Report Generation
    generatePatientSummary,
    generateProfessionalReport,

    // End-to-end processing
    processReportOptimized
};
