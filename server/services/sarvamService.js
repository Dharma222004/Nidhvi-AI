/**
 * Sarvam AI Service
 * Specialized in Indian languages for Translation, STT, and TTS
 * Handles automatic chunking for long text to ensure "one call" behavior
 */

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
require('dotenv').config();

const API_KEY = process.env.SARVAM_API_KEY;
const BASE_URL = process.env.SARVAM_API_URL || 'https://api.sarvam.ai';

// Constants for limits
const LIMITS = {
    TRANSLATE: 1800, // Safe limit for Sarvam v1 (2000 actual)
    TTS: 2000        // Safe limit for Bulbul v3 (2500 actual)
};

/**
 * Check if Sarvam AI is configured
 */
function isConfigured() {
    return !!API_KEY && API_KEY !== 'your_sarvam_api_key_here';
}

/**
 * Helper to split text into manageable chunks at sentence/space boundaries
 */
function splitIntoChunks(text, limit) {
    if (text.length <= limit) return [text];

    const chunks = [];
    let remainingText = text;

    while (remainingText.length > 0) {
        if (remainingText.length <= limit) {
            chunks.push(remainingText);
            break;
        }

        let breakIdx = remainingText.lastIndexOf('. ', limit);
        if (breakIdx === -1) breakIdx = remainingText.lastIndexOf(', ', limit);
        if (breakIdx === -1) breakIdx = remainingText.lastIndexOf(' ', limit);
        if (breakIdx === -1) breakIdx = limit;

        chunks.push(remainingText.substring(0, breakIdx + 1).trim());
        remainingText = remainingText.substring(breakIdx + 1).trim();
    }

    return chunks;
}

/**
 * Translate text between Indian languages and English
 */
async function translate(input, sourceLanguageCode, targetLanguageCode) {
    if (!isConfigured()) {
        throw new Error('Sarvam API key not configured');
    }

    // Handle chunking for long text
    const chunks = splitIntoChunks(input, LIMITS.TRANSLATE);

    try {
        const translationPromises = chunks.map(async (chunk) => {
            const response = await axios.post(`${BASE_URL}/text-to-text/translate/v1`, {
                input: chunk,
                source_language_code: sourceLanguageCode,
                target_language_code: targetLanguageCode,
                mode: 'formal'
            }, {
                headers: {
                    'api-subscription-key': API_KEY,
                    'Content-Type': 'application/json'
                }
            });
            return response.data.translated_text;
        });

        const results = await Promise.all(translationPromises);
        return results.join(' ');
    } catch (error) {
        console.error('Sarvam translation error:', error.response?.data || error.message);
        throw new Error(`Sarvam translation failed: ${error.message}`);
    }
}

/**
 * Convert speech to text (STT)
 */
async function speechToText(audioPath, languageCode = 'hi-IN') {
    if (!isConfigured()) {
        throw new Error('Sarvam API key not configured');
    }

    try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(audioPath));
        formData.append('model', 'saaras:v3');

        const response = await axios.post(`${BASE_URL}/speech-to-text`, formData, {
            headers: {
                ...formData.getHeaders(),
                'api-subscription-key': API_KEY
            }
        });

        return response.data.transcript;
    } catch (error) {
        console.error('Sarvam STT error:', error.response?.data || error.message);
        throw new Error(`Sarvam STT failed: ${error.message}`);
    }
}

/**
 * Convert text to speech (TTS)
 * Returns an array of base64 encoded audio chunks for long text
 */
async function textToSpeech(text, targetLanguageCode = 'hi-IN') {
    if (!isConfigured()) {
        throw new Error('Sarvam API key not configured');
    }

    // Clean text: remove characters that might cause TTS issues
    const cleanText = text.replace(/[*#]/g, '').trim();
    const chunks = splitIntoChunks(cleanText, LIMITS.TTS);

    try {
        const ttsPromises = chunks.map(async (chunk) => {
            const response = await axios.post(`${BASE_URL}/text-to-speech`, {
                text: chunk,
                target_language_code: targetLanguageCode,
                speaker: 'shubh',
                model: 'bulbul:v3'
            }, {
                headers: {
                    'api-subscription-key': API_KEY,
                    'Content-Type': 'application/json'
                }
            });
            return response.data.audios[0];
        });

        // Return array of audios to frontend can play sequentially
        return await Promise.all(ttsPromises);
    } catch (error) {
        console.error('Sarvam TTS error:', error.response?.data || error.message);
        throw new Error(`Sarvam TTS failed: ${error.message}`);
    }
}

module.exports = {
    isConfigured,
    translate,
    speechToText,
    textToSpeech
};
