/**
 * Gemini AI Service
 * Handles all interactions with Google's Gemini API for medical report analysis
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Initialize Gemini API Keys from environment
const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY // Legacy fallback
].filter(Boolean);

let currentKeyIndex = 0;

/**
 * Get current GoogleGenerativeAI instance with rotating keys
 */
function getGenAI() {
  const key = GEMINI_KEYS[currentKeyIndex];
  return new GoogleGenerativeAI(key);
}

/**
 * Rotate to the next available API key
 */
function rotateKey() {
  if (GEMINI_KEYS.length <= 1) return false;
  currentKeyIndex = (currentKeyIndex + 1) % GEMINI_KEYS.length;
  console.log(`Rotating Gemini API key. Now using key ${currentKeyIndex + 1} of ${GEMINI_KEYS.length}`);
  return true;
}

// Model configurations - using gemini-2.5-flash (latest model)
const MODELS = {
  vision: process.env.GEMINI_MODEL || 'gemini-2.5-flash',  // Vision-capable model for images/PDFs
  text: process.env.GEMINI_MODEL || 'gemini-2.5-flash'      // Text generation for explanations
};

// Generation config for optimized responses
const generationConfig = {
  temperature: 0.2,
  maxOutputTokens: 4096,
};

/**
 * Retry helper with exponential backoff and API key rotation
 */
async function withRetry(fn, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const errorMsg = error.message?.toLowerCase() || '';
      const isRateLimit = errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('limit');
      const isAuthError = errorMsg.includes('401') || errorMsg.includes('invalid') || errorMsg.includes('key');

      if ((isRateLimit || isAuthError) && attempt < maxRetries) {
        // Try rotating the key if we have more than one
        if (rotateKey()) {
          console.log(`Key ${isRateLimit ? 'rate limited' : 'invalid'}, switched to a new key. Retrying immediately.`);
          // After rotation, we retry without much delay as it's a fresh key
          continue;
        }

        // If no more keys to rotate, use exponential backoff
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`Rate limited and no more keys to rotate, retrying in ${delay / 1000}s (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}


/**
 * Clean and parse potentially malformed JSON from AI responses
 */
function cleanAndParseJSON(text) {
  console.log('=== JSON Parsing Debug ===');
  console.log('Raw text length:', text.length);
  console.log('First 300 chars:', text.substring(0, 300));

  try {
    // First, try to extract JSON from markdown code blocks
    let jsonText = text;

    // Remove markdown code blocks if present
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1];
      console.log('Extracted from markdown code block');
    } else {
      // Try to find JSON object boundaries
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
        console.log('Extracted JSON object from text');
      }
    }

    console.log('Extracted JSON length:', jsonText.length);
    console.log('First 300 chars of extracted:', jsonText.substring(0, 300));

    // Multi-pass cleaning for robust handling
    let cleanedText = jsonText;

    // Pass 1: Remove comments and normalize whitespace
    cleanedText = cleanedText
      .replace(/\/\/.*$/gm, '')              // Remove // comments
      .replace(/\/\*[\s\S]*?\*\//g, '')      // Remove /* */ comments
      .replace(/[\r\n\t]/g, ' ')             // Convert control chars to spaces
      .replace(/\s+/g, ' ')                  // Normalize multiple spaces
      .trim();

    // Pass 2: Fix common JSON syntax issues
    cleanedText = cleanedText
      .replace(/,(\s*[}\]])/g, '$1')         // Remove trailing commas before } or ]
      .replace(/,\s*,+/g, ',')               // Fix multiple consecutive commas
      .replace(/:\s*,/g, ': null,')          // Fix missing values (: , -> : null,)
      .replace(/:\s*}/g, ': null}')          // Fix missing values (: } -> : null})
      .replace(/:\s*]/g, ': null]')          // Fix missing values (: ] -> : null])
      .replace(/"\s*:\s*"/g, '": "');        // Normalize spacing around colons

    // Pass 3: Handle incomplete arrays/objects (truncated responses)
    const openBraces = (cleanedText.match(/\{/g) || []).length;
    const closeBraces = (cleanedText.match(/\}/g) || []).length;
    const openBrackets = (cleanedText.match(/\[/g) || []).length;
    const closeBrackets = (cleanedText.match(/\]/g) || []).length;

    // Close unclosed arrays
    for (let i = closeBrackets; i < openBrackets; i++) {
      cleanedText += ']';
    }

    // Close unclosed objects
    for (let i = closeBraces; i < openBraces; i++) {
      cleanedText += '}';
    }

    console.log('Cleaned JSON (first 300 chars):', cleanedText.substring(0, 300));

    // Try to parse the cleaned JSON
    const parsed = JSON.parse(cleanedText);
    console.log('✓ JSON parsed successfully');
    return parsed;

  } catch (error) {
    console.error('❌ JSON parsing failed:', error.message);
    console.error('Error at position:', error.message.match(/position (\d+)/)?.[1]);

    // Ultra-aggressive fallback: construct a minimal valid response
    try {
      console.log('Attempting aggressive repair...');

      // Try to extract at least the report type and key fields
      const reportTypeMatch = text.match(/"reportType"\s*:\s*"([^"]+)"/);
      const reportSubtypeMatch = text.match(/"reportSubtype"\s*:\s*"([^"]+)"/);

      // If we can't parse at all, return a minimal object
      const fallbackResponse = {
        reportType: reportTypeMatch?.[1] || 'other',
        reportSubtype: reportSubtypeMatch?.[1] || 'Medical Report',
        patientInfo: { age: null, gender: null },
        dateOfStudy: null,
        orderingPhysician: null,
        findings: [],
        measurements: [],
        impressions: ['Report data extraction incomplete. Please verify manually.'],
        recommendations: [],
        criticalValues: [],
        rawText: text.substring(0, 1000)
      };

      console.log('⚠ Using fallback minimal response');
      return fallbackResponse;

    } catch (finalError) {
      console.error('❌ All parsing attempts failed');
      throw new Error(`Failed to parse JSON after all attempts: ${error.message}. Preview: ${text.substring(0, 200)}`);
    }
  }
}

/**
 * Convert file to Gemini-compatible format
 */
function fileToGenerativePart(filePath, mimeType) {
  const fileData = fs.readFileSync(filePath);
  return {
    inlineData: {
      data: Buffer.from(fileData).toString('base64'),
      mimeType
    }
  };
}

/**
 * Extract content from medical report image/PDF
 */
async function extractFromImage(filePath, mimeType) {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: MODELS.vision, generationConfig });


  const imagePart = fileToGenerativePart(filePath, mimeType);

  const extractionPrompt = `You are a medical report extraction specialist. Analyze this medical report image and extract all relevant information.

TASK: Extract structured data from this medical report.

OUTPUT FORMAT (JSON):
{
  "reportType": "radiology" | "lab" | "pathology" | "other",
  "reportSubtype": "X-Ray" | "CT" | "MRI" | "Mammogram" | "CBC" | "Metabolic Panel" | etc.,
  "patientInfo": {
    "age": "if visible",
    "gender": "if visible"
  },
  "dateOfStudy": "date if available",
  "orderingPhysician": "name if available",
  "findings": [
    {
      "finding": "description of finding",
      "location": "anatomical location",
      "severity": "normal" | "mild" | "moderate" | "severe",
      "isCritical": true/false
    }
  ],
  "measurements": [
    {
      "item": "what was measured",
      "value": "numeric value",
      "unit": "unit of measurement",
      "referenceRange": "normal range if provided",
      "status": "normal" | "low" | "high" | "critical"
    }
  ],
  "impressions": ["list of impressions/conclusions"],
  "recommendations": ["any recommendations noted"],
  "criticalValues": [
    {
      "item": "critical finding/value",
      "reason": "why it's critical",
      "urgency": "immediate" | "urgent" | "routine"
    }
  ],
  "rawText": "full text transcription of the report"
}

IMPORTANT:
1. Extract ALL findings, even if normal
2. Flag any critical or abnormal values
3. Include exact measurements with units
4. Note any recommendations from the report
5. If information is not available, use null

Respond ONLY with valid JSON.`;

  try {
    const result = await withRetry(async () => {
      return await model.generateContent([extractionPrompt, imagePart]);
    });
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response using robust parser
    return cleanAndParseJSON(text);
  } catch (error) {
    console.error('Extraction error:', error);
    throw new Error(`Failed to extract report data: ${error.message}`);
  }
}

/**
 * Extract content from text-based report
 */
async function extractFromText(reportText) {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: MODELS.text, generationConfig });


  const extractionPrompt = `You are a medical report extraction specialist. Analyze this medical report text and extract all relevant information.

REPORT TEXT:
${reportText}

OUTPUT FORMAT (JSON):
{
  "reportType": "radiology" | "lab" | "pathology" | "other",
  "reportSubtype": "specific type of report",
  "patientInfo": {
    "age": "if visible",
    "gender": "if visible"
  },
  "dateOfStudy": "date if available",
  "orderingPhysician": "name if available",
  "findings": [
    {
      "finding": "description of finding",
      "location": "anatomical location",
      "severity": "normal" | "mild" | "moderate" | "severe",
      "isCritical": true/false
    }
  ],
  "measurements": [
    {
      "item": "what was measured",
      "value": "numeric value",
      "unit": "unit of measurement",
      "referenceRange": "normal range if provided",
      "status": "normal" | "low" | "high" | "critical"
    }
  ],
  "impressions": ["list of impressions/conclusions"],
  "recommendations": ["any recommendations noted"],
  "criticalValues": [],
  "rawText": "original text"
}

Respond ONLY with valid JSON.`;

  try {
    const result = await withRetry(async () => {
      return await model.generateContent(extractionPrompt);
    });
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response using robust parser
    return cleanAndParseJSON(text);
  } catch (error) {
    console.error('Extraction error:', error);
    throw new Error(`Failed to extract report data: ${error.message}`);
  }
}

/**
 * Generate Patient-Mode Explanation
 */
async function generatePatientExplanation(extractedData) {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: MODELS.text, generationConfig });


  const prompt = `You are a compassionate healthcare communication specialist. Your job is to explain medical reports to patients in simple, reassuring language.

EXTRACTED REPORT DATA:
${JSON.stringify(extractedData, null, 2)}

TASK: Generate a patient-friendly explanation of this medical report.

GUIDELINES:
1. Use simple, non-medical language (8th-10th grade reading level)
2. Be reassuring but honest
3. Avoid alarming language, but don't hide important information
4. Explain what each finding means in everyday terms
5. Provide clear next steps
6. Include questions they might want to ask their doctor

OUTPUT FORMAT (JSON):
{
  "summary": "A 2-3 sentence overview of the report in simple terms",
  "explanation": "Detailed explanation of findings (150-300 words)",
  "whatItMeans": "What these results mean for the patient's health",
  "normalFindings": ["List of things that look normal/healthy"],
  "findingsToDiscuss": [
    {
      "finding": "simplified description",
      "whatItMeans": "explanation in lay terms",
      "importance": "low" | "medium" | "high"
    }
  ],
  "whenToContactDoctor": [
    "Specific symptoms to watch for",
    "Timeline for follow-up"
  ],
  "nextSteps": [
    "Clear action item 1",
    "Clear action item 2",
    "Clear action item 3"
  ],
  "questionsForDoctor": [
    "Suggested question 1",
    "Suggested question 2",
    "Suggested question 3"
  ],
  "reassurance": "A supportive, encouraging closing message"
}

Remember: Patients may be anxious. Be kind, clear, and helpful.

Respond ONLY with valid JSON.`;

  try {
    const result = await withRetry(async () => {
      return await model.generateContent(prompt);
    });
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response using robust parser
    return cleanAndParseJSON(text);
  } catch (error) {
    console.error('Patient explanation error:', error);
    throw new Error(`Failed to generate patient explanation: ${error.message}`);
  }
}

/**
 * Generate Clinician-Mode Explanation
 */
async function generateClinicianExplanation(extractedData) {
  const model = genAI.getGenerativeModel({ model: MODELS.text, generationConfig });

  const prompt = `You are a clinical decision support specialist. Your job is to provide concise, actionable summaries for healthcare providers.

EXTRACTED REPORT DATA:
${JSON.stringify(extractedData, null, 2)}

TASK: Generate a clinician-focused summary of this medical report.

GUIDELINES:
1. Be concise and scannable (bullet points preferred)
2. Highlight critical/abnormal values prominently
3. Include relevant differential diagnoses
4. Reference evidence-based guidelines
5. Suggest appropriate next steps (non-prescriptive)
6. Include relevant clinical context

OUTPUT FORMAT (JSON):
{
  "clinicalSummary": "One-paragraph clinical synopsis",
  "findingsSummary": [
    "Key finding 1 with clinical significance",
    "Key finding 2 with clinical significance"
  ],
  "criticalValues": [
    {
      "value": "the critical finding",
      "interpretation": "clinical interpretation",
      "urgency": "immediate" | "urgent" | "routine",
      "action": "suggested action"
    }
  ],
  "abnormalFindings": [
    {
      "finding": "description",
      "significance": "clinical significance",
      "trend": "improving" | "stable" | "worsening" | "new" | "unknown"
    }
  ],
  "differentialDiagnosis": [
    {
      "diagnosis": "DDx 1",
      "likelihood": "high" | "medium" | "low",
      "supportingFindings": ["finding 1", "finding 2"]
    }
  ],
  "suggestedNextSteps": [
    {
      "action": "recommended action",
      "rationale": "evidence-based rationale",
      "timeframe": "immediate" | "days" | "weeks" | "routine"
    }
  ],
  "guidelineReferences": [
    {
      "guideline": "guideline name",
      "source": "organization",
      "relevance": "how it applies"
    }
  ],
  "clinicalPearls": [
    "Relevant clinical insight or consideration"
  ]
}

Respond ONLY with valid JSON.`;

  try {
    const result = await withRetry(async () => {
      return await model.generateContent(prompt);
    });
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response using robust parser
    return cleanAndParseJSON(text);
  } catch (error) {
    console.error('Clinician explanation error:', error);
    throw new Error(`Failed to generate clinician explanation: ${error.message}`);
  }
}

/**
 * Generate citations for the explanation
 */
async function generateCitations(extractedData, reportType) {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: MODELS.text, generationConfig });


  const prompt = `Based on this medical report analysis, generate relevant citations from authoritative medical sources.

REPORT TYPE: ${reportType}
FINDINGS: ${JSON.stringify(extractedData.findings, null, 2)}
IMPRESSIONS: ${JSON.stringify(extractedData.impressions, null, 2)}

Generate citations from these sources:
- RSNA (Radiological Society of North America)
- ACR (American College of Radiology)
- CDC (Centers for Disease Control)
- NIH (National Institutes of Health)
- SNOMED CT terminology
- LOINC codes (if lab results)
- UpToDate
- PubMed references

OUTPUT FORMAT (JSON):
{
  "citations": [
    {
      "id": "citation-1",
      "title": "Title of resource",
      "source": "Organization name",
      "type": "guideline" | "reference" | "terminology" | "research",
      "url": "https://example.com/resource",
      "relevance": "Why this citation is relevant",
      "accessDate": "2024"
    }
  ],
  "terminologyCodes": [
    {
      "term": "medical term used",
      "code": "code value",
      "system": "SNOMED CT" | "LOINC" | "ICD-10" | "CPT"
    }
  ]
}

Note: Generate realistic, representative citations for educational purposes. In production, these would be validated against live databases.

Respond ONLY with valid JSON.`;

  try {
    const result = await withRetry(async () => {
      return await model.generateContent(prompt);
    });
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response using robust parser
    return cleanAndParseJSON(text);
  } catch (error) {
    console.error('Citation generation error:', error);
    return { citations: [], terminologyCodes: [] };
  }
}

/**
 * Validate API key
 */
async function validateApiKey() {
  if (!process.env.GEMINI_API_KEY) {
    return { valid: false, error: 'GEMINI_API_KEY not configured' };
  }

  try {
    const model = genAI.getGenerativeModel({ model: MODELS.text });
    await model.generateContent('Test');
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Find hospitals and doctors using Gemini (Fallback)
 */
async function findHospitalsWithGemini(query) {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: MODELS.text, generationConfig });


  const prompt = `You are a healthcare facility finder assistant. Provide detailed information about hospitals, clinics, and doctors in India based on your knowledge.
  
  QUERY: ${query}
  
  IMPORTANT: Since you are acting as a fallback for a real-time search engine:
  1. Provide ACCURATE, well-known, and established hospitals/clinics.
  2. Do not invent phone numbers or addresses. If you don't know the exact phone number, use "Contact Hospital" or a generic valid format if known.
  3. Clearly state if the information might need verification.
  
  For each hospital/clinic, include:
  - Full name
  - Complete address with city
  - Phone/contact numbers (if known)
  - Specialties available
  - Notable doctors in the relevant specialty
  - Approximate consultation fees (estimate based on hospital tier)
  - Ratings/reviews (estimate based on reputation, e.g., 4.5/5)
  
  Format the response clearly with each facility separated.
  
  Respond with PLAIN TEXT info, similar to a search result list.`;

  try {
    const result = await withRetry(async () => {
      return await model.generateContent(prompt);
    });
    const response = await result.response;
    const text = response.text();

    return {
      success: true,
      content: text,
      citations: [], // Gemini basic doesn't provide citations easily in this format
      model: MODELS.text,
      provider: 'gemini (fallback)'
    };
  } catch (error) {
    console.error('Gemini hospital search error:', error);
    throw new Error(`Gemini fallback failed: ${error.message}`);
  }
}

module.exports = {
  extractFromImage,
  extractFromText,
  generatePatientExplanation,
  generateClinicianExplanation,
  generateCitations,
  validateApiKey,
  findHospitalsWithGemini
};
