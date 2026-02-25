/**
 * Perplexity AI Service
 * Handles all interactions with Perplexity API for medical report analysis
 */

const OpenAI = require("openai");
const fs = require("fs");

// Initialize Perplexity client lazily to prevent startup crashes if API key is missing
let perplexityInstance = null;
function getPerplexityClient() {
  if (!perplexityInstance) {
    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error(
        "PERPLEXITY_API_KEY is missing. Please configure it in your environment variables.",
      );
    }
    perplexityInstance = new OpenAI({
      apiKey: process.env.PERPLEXITY_API_KEY,
      baseURL: "https://api.perplexity.ai",
    });
  }
  return perplexityInstance;
}

// Model to use
const MODEL = "sonar"; // Perplexity's main model

/**
 * Extract content from text-based report
 */
async function extractFromText(reportText) {
  const extractionPrompt = `You are a medical report extraction specialist. Analyze this medical report text and extract all relevant information.

REPORT TEXT:
${reportText}

OUTPUT FORMAT (JSON only, no markdown):
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
      "isCritical": true or false
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

Respond ONLY with valid JSON, no explanation or markdown.`;

  try {
    const response = await perplexity.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a medical report extraction specialist. Always respond with valid JSON only.",
        },
        { role: "user", content: extractionPrompt },
      ],
      max_tokens: 2000,
    });

    const text = response.choices[0].message.content;

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No valid JSON in response");
  } catch (error) {
    console.error("Extraction error:", error);
    throw new Error(`Failed to extract report data: ${error.message}`);
  }
}

/**
 * Extract from image - Perplexity doesn't support vision, fallback to text
 */
async function extractFromImage(filePath, mimeType) {
  // Perplexity doesn't have vision capability, so we'll throw an error
  throw new Error(
    "Image analysis requires Gemini API. Please upload a text-based PDF or use text input.",
  );
}

/**
 * Generate Patient-Mode Explanation
 */
async function generatePatientExplanation(extractedData) {
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

OUTPUT FORMAT (JSON only, no markdown):
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

Respond ONLY with valid JSON, no explanation or markdown.`;

  try {
    const response = await perplexity.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a compassionate healthcare communication specialist. Always respond with valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 2000,
    });

    const text = response.choices[0].message.content;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No valid JSON in response");
  } catch (error) {
    console.error("Patient explanation error:", error);
    throw new Error(`Failed to generate patient explanation: ${error.message}`);
  }
}

/**
 * Generate Clinician-Mode Explanation
 */
async function generateClinicianExplanation(extractedData) {
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

OUTPUT FORMAT (JSON only, no markdown):
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

Respond ONLY with valid JSON, no explanation or markdown.`;

  try {
    const response = await perplexity.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a clinical decision support specialist. Always respond with valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 2000,
    });

    const text = response.choices[0].message.content;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No valid JSON in response");
  } catch (error) {
    console.error("Clinician explanation error:", error);
    throw new Error(
      `Failed to generate clinician explanation: ${error.message}`,
    );
  }
}

/**
 * Generate citations for the explanation
 */
async function generateCitations(extractedData, reportType) {
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

OUTPUT FORMAT (JSON only, no markdown):
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

Respond ONLY with valid JSON, no explanation or markdown.`;

  try {
    const response = await perplexity.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You generate medical citations. Always respond with valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 1500,
    });

    const text = response.choices[0].message.content;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { citations: [], terminologyCodes: [] };
  } catch (error) {
    console.error("Citation generation error:", error);
    return { citations: [], terminologyCodes: [] };
  }
}

/**
 * Search with Perplexity for real-time information
 * Used for hospital/doctor finding - ON-DEMAND ONLY
 */
async function searchWithPerplexity(params) {
  const {
    query,
    returnCitations = true,
    returnImages = false,
    maxRetries = 2,
  } = params;

  // Validate API key first
  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error(
      "Perplexity API key not configured. Please add PERPLEXITY_API_KEY to your .env file.",
    );
  }

  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Perplexity search attempt ${attempt}/${maxRetries}`);
      console.log(`Query: ${query.substring(0, 100)}...`);

      const response = await perplexity.chat.completions.create({
        model: "sonar", // Perplexity's search-enabled model
        messages: [
          {
            role: "system",
            content: `You are a healthcare facility finder assistant. Provide detailed, accurate, and up-to-date information about hospitals, clinics, and doctors in India. 

For each hospital/clinic, include:
- Full name
- Complete address with city
- Phone/contact numbers
- Specialties available
- Notable doctors in the relevant specialty
- Approximate consultation fees if available
- Ratings/reviews if available

Format the response clearly with each facility separated.`,
          },
          {
            role: "user",
            content: query,
          },
        ],
        max_tokens: 2000,
        temperature: 0.1, // Lower temperature for factual accuracy
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error("Empty response from Perplexity");
      }

      // Extract citations if available
      const citations = response.citations || [];

      console.log(
        `Perplexity search successful - ${content.length} characters returned`,
      );

      return {
        success: true,
        content,
        citations,
        model: "sonar",
        provider: "perplexity",
      };
    } catch (error) {
      lastError = error;
      console.error(
        `Perplexity search attempt ${attempt} failed:`,
        error.message,
      );

      // If it's a rate limit error, wait before retrying
      if (error.status === 429 && attempt < maxRetries) {
        console.log("Rate limited, waiting 2 seconds before retry...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  // All retries failed
  console.error("All Perplexity search attempts failed");
  throw new Error(
    `Perplexity search failed after ${maxRetries} attempts: ${lastError?.message || "Unknown error"}`,
  );
}

/**
 * Validate API key
 */
async function validateApiKey() {
  if (!process.env.PERPLEXITY_API_KEY) {
    return { valid: false, error: "PERPLEXITY_API_KEY not configured" };
  }

  try {
    await perplexity.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: "Test" }],
      max_tokens: 10,
    });
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

module.exports = {
  extractFromImage,
  extractFromText,
  generatePatientExplanation,
  generateClinicianExplanation,
  generateCitations,
  searchWithPerplexity, // Added for hospital finding
  validateApiKey,
};
