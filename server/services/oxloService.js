/**
 * Oxlo AI Service
 * Handles interactions with Oxlo AI API for specialized tasks
 * - Audio analysis (whisper-medium)
 * - Text-to-speech (kokoro-82m)
 * - Image OCR and analysis (gemma-3-4b)
 * - High-accuracy speech recognition (whisper-large)
 */

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

// Oxlo API Configuration
const OXLO_CONFIG = {
  apiKey: process.env.OXLO_API_KEY,
  endpoint: process.env.OXLO_API_ENDPOINT || 'https://api.oxlo.ai/v1/chat/completions',
  models: {
    audio: process.env.OXLO_MODEL_AUDIO || 'whisper-medium',
    tts: process.env.OXLO_MODEL_TTS || 'kokoro-82m',
    imageOCR: process.env.OXLO_MODEL_IMAGE_OCR || 'gemma-3-4b',
    speech: process.env.OXLO_MODEL_SPEECH || 'whisper-large'
  }
};

/**
 * Make a request to Oxlo AI API
 * @param {string} model - The model to use
 * @param {Array} messages - The messages array for chat completion
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} API response
 */
async function makeOxloRequest(model, messages, options = {}) {
  if (!OXLO_CONFIG.apiKey) {
    throw new Error('Oxlo API key not configured. Please add OXLO_API_KEY to your .env file.');
  }

  try {
    const response = await axios.post(
      OXLO_CONFIG.endpoint,
      {
        model: model,
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2048,
        ...options
      },
      {
        headers: {
          'Authorization': `Bearer ${OXLO_CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: options.timeout || 60000
      }
    );

    return response.data;
  } catch (error) {
    console.error('Oxlo API Error:', error.response?.data || error.message);
    throw new Error(
      `Oxlo API request failed: ${error.response?.data?.error?.message || error.message}`
    );
  }
}

/**
 * Extract text from medical report image using Oxlo's OCR model (gemma-3-4b)
 * This provides an alternative to Gemini for image analysis
 * @param {string} imageData - Base64 encoded image data
 * @param {string} mimeType - Image MIME type
 * @returns {Promise<Object>} Extracted data
 */
async function extractFromImageOCR(imageData, mimeType) {
  const messages = [
    {
      role: 'system',
      content: `You are a medical document OCR and analysis system. Extract all information from medical reports including:
- Report type and date
- Patient information (if visible)
- All findings, measurements, and test results
- Impressions and conclusions
- Any critical values or red flags

Return the data in a structured JSON format.`
    },
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Extract and analyze all information from this medical report image.'
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:${mimeType};base64,${imageData}`
          }
        }
      ]
    }
  ];

  const response = await makeOxloRequest(
    OXLO_CONFIG.models.imageOCR,
    messages,
    { temperature: 0.2, maxTokens: 3000 }
  );

  return parseOxloResponse(response);
}

/**
 * Analyze audio medical dictation using Oxlo's Whisper models
 * @param {string} audioFilePath - Path to audio file
 * @param {string} modelType - 'medium' or 'large' for accuracy/speed tradeoff
 * @returns {Promise<Object>} Transcription and analysis
 */
async function analyzeAudioReport(audioFilePath, modelType = 'medium') {
  const model = modelType === 'large' 
    ? OXLO_CONFIG.models.speech 
    : OXLO_CONFIG.models.audio;

  // For audio files, we might need to use a different endpoint or approach
  // This is a placeholder - adjust based on Oxlo's actual audio API
  const audioBuffer = fs.readFileSync(audioFilePath);
  const audioBase64 = audioBuffer.toString('base64');

  const messages = [
    {
      role: 'system',
      content: 'You are a medical transcription system. Transcribe the audio and identify medical terms, findings, and recommendations accurately.'
    },
    {
      role: 'user',
      content: `Transcribe this medical audio recording: ${audioBase64.substring(0, 100)}...`
    }
  ];

  const response = await makeOxloRequest(
    model,
    messages,
    { temperature: 0.1, maxTokens: 4000 }
  );

  return {
    transcription: response.choices[0]?.message?.content || '',
    model: model,
    timestamp: new Date().toISOString()
  };
}

/**
 * Generate speech from text using Oxlo's TTS model (kokoro-82m)
 * Useful for creating audio versions of patient explanations
 * @param {string} text - Text to convert to speech
 * @param {Object} options - Voice and speech options
 * @returns {Promise<Buffer>} Audio buffer
 */
async function generateSpeech(text, options = {}) {
  const messages = [
    {
      role: 'system',
      content: 'You are a text-to-speech system. Convert the provided medical explanation to natural, clear speech.'
    },
    {
      role: 'user',
      content: text
    }
  ];

  const response = await makeOxloRequest(
    OXLO_CONFIG.models.tts,
    messages,
    {
      temperature: 0.5,
      voice: options.voice || 'default',
      speed: options.speed || 1.0,
      ...options
    }
  );

  // Response handling will depend on Oxlo's actual TTS response format
  return response;
}

/**
 * Smart model selection based on task type
 * @param {string} taskType - Type of task: 'ocr', 'audio', 'speech', 'tts'
 * @param {Object} data - Input data
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Processing result
 */
async function processWithOxlo(taskType, data, options = {}) {
  switch (taskType) {
    case 'ocr':
    case 'image':
      return await extractFromImageOCR(data.imageData, data.mimeType);
    
    case 'audio':
    case 'transcribe':
      return await analyzeAudioReport(data.audioPath, options.accuracy || 'medium');
    
    case 'tts':
    case 'speech':
      return await generateSpeech(data.text, options);
    
    default:
      throw new Error(`Unsupported task type: ${taskType}`);
  }
}

/**
 * Parse Oxlo API response and extract structured data
 * @param {Object} response - Raw Oxlo API response
 * @returns {Object} Parsed data
 */
function parseOxloResponse(response) {
  try {
    const content = response.choices[0]?.message?.content || '';
    
    // Try to parse as JSON if the response looks like JSON
    if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
      return JSON.parse(content);
    }
    
    // Otherwise return raw content
    return {
      content: content,
      model: response.model,
      usage: response.usage
    };
  } catch (error) {
    console.error('Error parsing Oxlo response:', error);
    return {
      content: response.choices[0]?.message?.content || '',
      parseError: error.message
    };
  }
}

/**
 * Validate Oxlo API key
 * @returns {Promise<boolean>} True if valid
 */
async function validateOxloApiKey() {
  if (!OXLO_CONFIG.apiKey) {
    return false;
  }

  try {
    const response = await makeOxloRequest(
      OXLO_CONFIG.models.imageOCR,
      [
        {
          role: 'user',
          content: 'Hello, testing API connection.'
        }
      ],
      { maxTokens: 10 }
    );
    
    return !!response.choices;
  } catch (error) {
    console.error('Oxlo API validation failed:', error.message);
    return false;
  }
}

/**
 * Get available Oxlo models and their status
 * @returns {Object} Models configuration
 */
function getAvailableModels() {
  return {
    configured: !!OXLO_CONFIG.apiKey,
    models: {
      audioAnalysis: {
        name: OXLO_CONFIG.models.audio,
        description: 'Medium accuracy audio analysis and transcription',
        useCases: ['Quick transcription', 'Audio dictation']
      },
      textToSpeech: {
        name: OXLO_CONFIG.models.tts,
        description: 'Natural text-to-speech generation',
        useCases: ['Patient explanation audio', 'Accessibility features']
      },
      imageOCR: {
        name: OXLO_CONFIG.models.imageOCR,
        description: 'Fast image analysis and OCR for document processing',
        useCases: ['Quick report scanning', 'Document digitization', 'OCR extraction']
      },
      speechRecognition: {
        name: OXLO_CONFIG.models.speech,
        description: 'High accuracy speech recognition for professional transcription',
        useCases: ['Professional transcription', 'Critical medical dictation']
      }
    }
  };
}

module.exports = {
  extractFromImageOCR,
  analyzeAudioReport,
  generateSpeech,
  processWithOxlo,
  validateOxloApiKey,
  getAvailableModels,
  OXLO_CONFIG
};
