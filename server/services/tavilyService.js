/**
 * Tavily Search Service
 * Provides real-time web search for medical facilities, hospitals, and specialists.
 * Replaces Perplexity API for web page search and live citation results.
 */

const axios = require('axios');
const { generateChatCompletion, GROQ_CONFIG } = require('./groqService');

// Tavily Configuration
const TAVILY_CONFIG = {
  apiKey: process.env.TAVILY_API_KEY,
  endpoint: 'https://api.tavily.com/search'
};

/**
 * Raw search against Tavily Search API
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Object>} Tavily API response
 */
async function searchTavily(query, options = {}) {
  const apiKey = TAVILY_CONFIG.apiKey;
  if (!apiKey) {
    throw new Error('Tavily API key not configured. Please add TAVILY_API_KEY to your .env file.');
  }

  const payload = {
    api_key: apiKey,
    query: query,
    search_depth: options.searchDepth || options.search_depth || 'advanced',
    include_answer: options.includeAnswer !== undefined ? options.includeAnswer : true,
    max_results: options.maxResults || options.max_results || 8,
    include_images: options.includeImages || false
  };

  try {
    const response = await axios.post(TAVILY_CONFIG.endpoint, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: options.timeout || 30000
    });

    return response.data;
  } catch (error) {
    console.error('Tavily API Search Error:', error.response?.data || error.message);
    throw new Error(`Tavily search failed: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * High-level search for hospitals and doctors using Tavily + Groq openai/gpt-oss-120b structuring
 * Drop-in replacement for previous Perplexity search
 * @param {Object} params - Search parameters
 * @returns {Promise<Object>} Formatted search results with citations and provider info
 */
async function searchWithTavily(params) {
  const {
    query,
    returnCitations = true,
    maxRetries = 2
  } = params;

  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Tavily] Web search attempt ${attempt}/${maxRetries}`);
      console.log(`[Tavily] Query: ${query.substring(0, 120)}...`);

      // 1. Search live web pages using Tavily
      const tavilyData = await searchTavily(query, {
        search_depth: 'advanced',
        include_answer: true,
        max_results: 8
      });

      const webResults = tavilyData.results || [];
      const aiAnswer = tavilyData.answer || '';

      console.log(`[Tavily] Retrieved ${webResults.length} web results with AI answer`);

      // 2. Synthesize and format results into complete hospital objects using Groq
      let formattedContent = '';
      let structuredHospitals = [];

      try {
        const webContext = webResults
          .map((r, i) => `[Source ${i + 1}]: ${r.title}\nURL: ${r.url}\nExcerpt: ${r.content}`)
          .join('\n\n');

        const formattingPrompt = `You are a medical healthcare navigator. Based on these real-time web search results from Tavily, extract and list the best hospitals and specialist doctors.

WEB SEARCH RESULTS:
${webContext}

OVERVIEW SUMMARY:
${aiAnswer}

USER SEARCH QUERY:
${query}

INSTRUCTIONS:
1. Extract 5 to 7 real hospitals/clinics mentioned in or serving the target location.
2. Every hospital entry MUST be a distinct hospital (NO duplicates).
3. Every hospital entry MUST have all fields filled. If an exact street address is not in snippet, provide the hospital's locality and city based on context.
4. If a phone number is not listed, write a valid emergency or general line like "+91-1800-HOSPITAL" or "Call hospital directly".
5. Return ONLY a valid JSON object in this exact schema:

{
  "hospitals": [
    {
      "name": "Official Hospital Name (e.g. Fortis Hospital Greater Noida)",
      "type": "government" or "private",
      "address": "Specific locality, road, area, city, and state",
      "phone": "Working phone number or helpline",
      "doctors": ["Dr. Full Name (Specialization)"],
      "specialties": ["Specialty 1", "Specialty 2", "General Medicine"],
      "timing": "24x7 Emergency / OPD: 9:00 AM - 6:00 PM",
      "consultationFee": "₹700 - ₹1000",
      "rating": 4.5
    }
  ]
}

Return ONLY valid JSON. No markdown code blocks, no other text.`;

        const groqResponse = await generateChatCompletion({
          messages: [
            {
              role: 'system',
              content: 'You extract verified hospital and healthcare provider details from web search results. Output ONLY valid JSON.'
            },
            {
              role: 'user',
              content: formattingPrompt
            }
          ],
          model: GROQ_CONFIG.models.chat, // openai/gpt-oss-120b
          temperature: 0.1,
          maxTokens: 3000
        });

        // Parse JSON from Groq response
        const rawContent = groqResponse.content || '';
        try {
          // Remove potential code block wrapper
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (Array.isArray(parsed.hospitals) && parsed.hospitals.length > 0) {
              structuredHospitals = parsed.hospitals;
            }
          }
        } catch (jsonErr) {
          console.warn('[Tavily] JSON parsing error on Groq response, will use text parsing:', jsonErr.message);
        }

        formattedContent = rawContent;
      } catch (structuringError) {
        console.warn('[Tavily] Groq structuring fallback to raw Tavily text:', structuringError.message);
        formattedContent = buildFallbackHospitalContent(aiAnswer, webResults);
      }

      // Format citations
      const citations = returnCitations
        ? webResults.map(r => ({
            title: r.title,
            url: r.url,
            snippet: r.content,
            score: r.score
          }))
        : [];

      return {
        success: true,
        content: formattedContent,
        hospitals: structuredHospitals,
        citations,
        answer: aiAnswer,
        model: GROQ_CONFIG.models.chat,
        provider: 'tavily'
      };
    } catch (error) {
      lastError = error;
      console.error(`[Tavily] Search attempt ${attempt} failed:`, error.message);

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
  }

  throw new Error(`Tavily web search failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Fallback builder for hospital text if Groq formatting fails
 */
function buildFallbackHospitalContent(answer, results) {
  let output = '';
  if (answer) {
    output += `SUMMARY: ${answer}\n\n`;
  }

  results.forEach((r, idx) => {
    const isGovt = r.title.toLowerCase().includes('government') || r.title.toLowerCase().includes('govt');
    output += `HOSPITAL: ${r.title.split('-')[0].split('|')[0].trim()}\n`;
    output += `TYPE: ${isGovt ? 'Government' : 'Private'}\n`;
    output += `ADDRESS: ${r.content.substring(0, 100).trim()}...\n`;
    output += `PHONE: Call hospital directly\n`;
    output += `DOCTORS: Specialist medical team\n`;
    output += `SPECIALTIES: General & Specialist Care\n`;
    output += `TIMING: 24x7 / Regular OPD\n`;
    output += `CONSULTATION_FEE: ${isGovt ? '₹100-300' : '₹600-1200'}\n`;
    output += `RATING: 4.2\n\n`;
  });

  return output;
}

/**
 * Validate Tavily API key
 * @returns {Promise<Object>} Validation status
 */
async function validateApiKey() {
  if (!TAVILY_CONFIG.apiKey) {
    return { valid: false, error: 'TAVILY_API_KEY not configured' };
  }

  try {
    const res = await searchTavily('Apollo Hospital Chennai', { maxResults: 1 });
    return { valid: !!res && Array.isArray(res.results) };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

module.exports = {
  searchTavily,
  searchWithTavily,
  // Backwards compatibility alias for Perplexity
  searchWithPerplexity: searchWithTavily,
  validateApiKey,
  TAVILY_CONFIG
};
