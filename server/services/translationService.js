/**
 * Translation Service
 * Uses Groq's llama-3.3-70b-versatile for high-quality translation
 */

const { generateChatCompletion, GROQ_CONFIG } = require('./groqService');
const sarvamService = require('./sarvamService');

// Supported languages
const SUPPORTED_LANGUAGES = {
    en: 'English',
    hi: 'Hindi',
    ta: 'Tamil',
    te: 'Telugu',
    bn: 'Bengali',
    mr: 'Marathi',
    gu: 'Gujarati',
    kn: 'Kannada',
    ml: 'Malayalam',
    pa: 'Punjabi',
    ur: 'Urdu'
};

// Map to Sarvam language codes
const SARVAM_LANG_MAP = {
    hi: 'hi-IN',
    ta: 'ta-IN',
    te: 'te-IN',
    bn: 'bn-IN',
    mr: 'mr-IN',
    gu: 'gu-IN',
    kn: 'kn-IN',
    ml: 'ml-IN',
    pa: 'pa-IN',
    ur: 'ur-IN'
};

/**
 * Translate medical report to target language
 */
async function translateReport(params, targetLangArg, sourceLangArg) {
    let content, sourceLanguage = 'en', targetLanguage, reportType = 'medical_analysis';

    if (typeof params === 'object' && params !== null && !Array.isArray(params)) {
        content = params.content;
        sourceLanguage = params.sourceLanguage || 'en';
        targetLanguage = params.targetLanguage;
        reportType = params.reportType || 'medical_analysis';
    } else {
        content = params;
        targetLanguage = targetLangArg;
        sourceLanguage = sourceLangArg || 'en';
    }

    if (!targetLanguage || targetLanguage === 'en') {
        return {
            translatedContent: content,
            sourceLanguage,
            targetLanguage: 'en',
            skipped: true
        };
    }

    const targetLangName = SUPPORTED_LANGUAGES[targetLanguage] || targetLanguage;

    // 1. Primary: Use Sarvam AI if configured and target language is supported
    if (sarvamService.isConfigured() && SARVAM_LANG_MAP[targetLanguage]) {
        try {
            console.log(`Using Sarvam AI for translation to ${targetLangName}...`);
            const translatedContent = await sarvamService.translate(
                content,
                sourceLanguage === 'en' ? 'en-IN' : (SARVAM_LANG_MAP[sourceLanguage] || 'en-IN'),
                SARVAM_LANG_MAP[targetLanguage]
            );

            return {
                translatedContent,
                sourceLanguage,
                targetLanguage,
                targetLanguageName: targetLangName,
                success: true,
                provider: 'sarvam'
            };
        } catch (error) {
            console.warn('Sarvam translation failed, falling back to Groq:', error.message);
        }
    }

    const prompt = `You are a medical translation specialist. Translate the following medical report from ${sourceLanguage.toUpperCase()} to ${targetLangName}.

IMPORTANT GUIDELINES:
1. Maintain medical terminology accuracy
2. Keep the structure and sections intact
3. Preserve all medical values, measurements, and units
4. Keep doctor names, hospital names, and dates as-is
5. Translate explanations naturally for local understanding
6. Use culturally appropriate language

MEDICAL REPORT TO TRANSLATE:
${content}

Provide ONLY the translated content. Do not add any notes or explanations.`;

    // 2. Secondary: Groq with configured chat model, then fallback to fast instant model
    const candidateModels = [GROQ_CONFIG.models.chat, 'llama-3.1-8b-instant', 'llama-3.3-70b-versatile'].filter(Boolean);
    let lastGroqError = null;

    for (const modelToTry of candidateModels) {
        try {
            const response = await generateChatCompletion({
                messages: [
                    {
                        role: 'system',
                        content: 'You are a professional medical translator specializing in Indian languages. You maintain medical accuracy while ensuring cultural appropriateness.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                model: modelToTry,
                temperature: 0.3,
                maxTokens: 4000
            });

            return {
                translatedContent: response.content,
                sourceLanguage,
                targetLanguage,
                targetLanguageName: targetLangName,
                success: true,
                provider: `groq-${modelToTry}`
            };
        } catch (error) {
            console.warn(`Groq translation with [${modelToTry}] failed:`, error.message);
            lastGroqError = error;
        }
    }

    throw new Error(`Failed to translate to ${targetLangName}: ${lastGroqError?.message || 'All providers failed'}`);
}

/**
 * Translate a simple text (for UI elements, questions, etc.)
 */
async function translateText(text, targetLanguage) {
    if (!targetLanguage || targetLanguage === 'en') {
        return text;
    }

    const targetLangName = SUPPORTED_LANGUAGES[targetLanguage] || targetLanguage;

    // Use Sarvam if configured
    if (sarvamService.isConfigured() && SARVAM_LANG_MAP[targetLanguage]) {
        try {
            return await sarvamService.translate(text, 'en-IN', SARVAM_LANG_MAP[targetLanguage]);
        } catch (error) {
            console.warn('Sarvam text translation failed, falling back to Groq');
        }
    }

    const prompt = `Translate this text to ${targetLangName}: "${text}"

Provide ONLY the translation,no explanations.`;

    try {
        const response = await generateChatCompletion({
            messages: [{ role: 'user', content: prompt }],
            model: GROQ_CONFIG.models.fastChat || 'openai/gpt-oss-20b', // Fast model for simple translations
            temperature: 0.2,
            maxTokens: 200
        });

        return response.content.trim();
    } catch (error) {
        console.error('Text translation error:', error);
        return text; // Return original if translation fails
    }
}

module.exports = {
    translateReport,
    translateText,
    SUPPORTED_LANGUAGES
};
