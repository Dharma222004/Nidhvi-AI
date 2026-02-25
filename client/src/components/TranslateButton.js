import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useTypewriter } from '../hooks/useTypewriter';

/**
 * TranslateButton Component
 * Allows users to translate analysis results to their preferred language
 * Translation only happens when user clicks the button and selects a language
 */
function TranslateButton({ analysisData }) {
    const [showLanguageMenu, setShowLanguageMenu] = useState(false);
    const [languages, setLanguages] = useState([]);
    const [selectedLanguage, setSelectedLanguage] = useState(null);
    const [translatedContent, setTranslatedContent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch available languages on mount
    useEffect(() => {
        const fetchLanguages = async () => {
            try {
                const response = await axios.get('/api/enhanced/languages');
                if (response.data.success) {
                    // Filter out English as it's the source language
                    setLanguages(response.data.languages.filter(lang => lang.code !== 'en'));
                }
            } catch (err) {
                console.error('Failed to fetch languages:', err);
                // Fallback languages
                setLanguages([
                    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
                    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
                    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
                    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
                    { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
                    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
                    { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' }
                ]);
            }
        };
        fetchLanguages();
    }, []);

    const [audioChunks, setAudioChunks] = useState(null);
    const [isPreloadingAudio, setIsPreloadingAudio] = useState(false);

    // Handle translation
    const handleTranslate = async (language) => {
        setSelectedLanguage(language);
        setShowLanguageMenu(false);
        setLoading(true);
        setError(null);
        setAudioChunks(null);

        try {
            console.log(`Translating to ${language.name}...`);

            const response = await axios.post('/api/enhanced/translate', {
                targetLanguage: language.code,
                analysisData: analysisData
            });

            if (response.data.success) {
                const translated = {
                    content: response.data.translatedContent,
                    languageName: response.data.targetLanguageName,
                    languageCode: response.data.targetLanguage
                };
                setTranslatedContent(translated);

                // Automatically pre-generate TTS
                preloadTTS(translated.content, translated.languageCode);
            } else {
                throw new Error(response.data.error || 'Translation failed');
            }
        } catch (err) {
            console.error('Translation error:', err);
            setError(err.response?.data?.error || err.message || 'Failed to translate');
        } finally {
            setLoading(false);
        }
    };

    const preloadTTS = async (text, langCode) => {
        setIsPreloadingAudio(true);
        try {
            const response = await axios.post('/api/sarvam/speak', {
                text,
                targetLanguage: `${langCode}-IN`
            });
            if (response.data.success) {
                setAudioChunks(response.data.audios);
                console.log('TTS Preloaded and ready.');
            }
        } catch (err) {
            console.warn('Silent TTS preload failure:', err);
        } finally {
            setIsPreloadingAudio(false);
        }
    };

    const [speaking, setSpeaking] = useState(false);
    const [audio, setAudio] = useState(null);
    const speakingRef = useRef(false);

    const handleSpeak = async () => {
        if (!translatedContent) return;

        if (speaking) {
            setSpeaking(false);
            speakingRef.current = false;
            if (audio) {
                audio.pause();
                setAudio(null);
            }
            return;
        }

        setSpeaking(true);
        speakingRef.current = true;

        try {
            let chunks = audioChunks;

            // If not preloaded yet, fetch now
            if (!chunks) {
                console.log('Audio not preloaded, fetching now...');
                const response = await axios.post('/api/sarvam/speak', {
                    text: translatedContent.content,
                    targetLanguage: `${translatedContent.languageCode}-IN`
                });
                if (response.data.success) {
                    chunks = response.data.audios;
                }
            }

            if (chunks && chunks.length > 0 && speakingRef.current) {
                const playSequentially = async (index) => {
                    if (!speakingRef.current || index >= chunks.length) {
                        setSpeaking(false);
                        speakingRef.current = false;
                        setAudio(null);
                        return;
                    }

                    const audioBlob = await fetch(`data:audio/wav;base64,${chunks[index]}`).then(r => r.blob());
                    const audioUrl = URL.createObjectURL(audioBlob);
                    const audioInstance = new Audio(audioUrl);

                    audioInstance.onended = () => {
                        if (speakingRef.current) {
                            playSequentially(index + 1);
                        }
                    };

                    setAudio(audioInstance);
                    audioInstance.play();
                };

                playSequentially(0);
            } else {
                setSpeaking(false);
                speakingRef.current = false;
            }
        } catch (err) {
            console.error('TTS error:', err);
            setError('Failed to generate full speech result');
            setSpeaking(false);
            speakingRef.current = false;
        }
    };

    const handleClearTranslation = () => {
        if (audio) audio.pause();
        setTranslatedContent(null);
        setSelectedLanguage(null);
        setSpeaking(false);
        setAudio(null);
        setAudioChunks(null);
    };

    const { displayedText, isComplete } = useTypewriter(translatedContent?.content, 20, !!translatedContent);

    return (
        <div className="translate-section">
            {/* Translate Button */}
            <div className="translate-controls">
                <div className="translate-button-container">
                    <motion.button
                        onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                        disabled={loading}
                        whileHover={{ scale: loading ? 1 : 1.02 }}
                        whileTap={{ scale: loading ? 1 : 0.98 }}
                        className={`translate-btn ${loading ? 'loading' : ''} ${translatedContent ? 'translated' : ''}`}
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                <span>Translating to {selectedLanguage?.name}...</span>
                            </>
                        ) : translatedContent ? (
                            <>
                                <span className="btn-icon">✓</span>
                                <span>Translated to {translatedContent.languageName}</span>
                            </>
                        ) : (
                            <>
                                <span className="btn-icon">🌐</span>
                                <span>Translate Results</span>
                            </>
                        )}
                    </motion.button>

                    {/* Language Dropdown */}
                    <AnimatePresence>
                        {showLanguageMenu && !loading && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="language-menu"
                            >
                                <div className="language-menu-header">
                                    <span>Select Language</span>
                                    <button onClick={() => setShowLanguageMenu(false)} className="close-btn">×</button>
                                </div>
                                <div className="language-list">
                                    {languages.map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => handleTranslate(lang)}
                                            className="language-option"
                                        >
                                            <span className="native-name">{lang.nativeName}</span>
                                            <span className="english-name">{lang.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Clear Translation Button */}
                {translatedContent && !loading && (
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={handleClearTranslation}
                        className="clear-btn"
                    >
                        ✕ Clear Translation
                    </motion.button>
                )}
            </div>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="error-message"
                    >
                        <span className="error-icon">⚠️</span>
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="close-btn">×</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Translated Content */}
            <AnimatePresence>
                {translatedContent && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                        className="translated-content"
                    >
                        <div className="translated-header">
                            <div className="header-left">
                                <span className="language-badge">
                                    🌐 {translatedContent.languageName}
                                </span>
                                <span className="translation-label">Translated Version</span>
                            </div>
                            <div className="header-right">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleSpeak}
                                    disabled={!audioChunks && isPreloadingAudio}
                                    className={`listen-btn ${speaking ? 'speaking' : ''} ${(!audioChunks && isPreloadingAudio) ? 'preloading' : ''}`}
                                >
                                    {speaking ? '🔊 Stop' : (isPreloadingAudio && !audioChunks ? '⌛ Preparing Voice...' : '🔈 Listen Now')}
                                </motion.button>
                            </div>
                        </div>
                        <div className="translated-body">
                            {displayedText.split('\n').map((line, idx) => {
                                // Handle headings
                                if (line.startsWith('## ')) {
                                    return (
                                        <h3 key={idx} className="translated-heading">
                                            {line.replace('## ', '')}
                                        </h3>
                                    );
                                }
                                // Handle list items
                                if (line.startsWith('- ') || line.match(/^\d+\./)) {
                                    return (
                                        <p key={idx} className="translated-list-item">
                                            {line}
                                        </p>
                                    );
                                }
                                // Handle separator
                                if (line.startsWith('---')) {
                                    return <hr key={idx} className="translated-separator" />;
                                }
                                // Regular paragraphs
                                if (line.trim()) {
                                    return (
                                        <p key={idx} className="translated-paragraph">
                                            {line}
                                        </p>
                                    );
                                }
                                return null;
                            })}
                            {!isComplete && <span className="typing-cursor">|</span>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .translate-section {
                    margin: 1.5rem 0;
                }

                .translate-controls {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    flex-wrap: wrap;
                }

                .translate-button-container {
                    position: relative;
                }

                .translate-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.25rem;
                    background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
                    border: none;
                    border-radius: 0.75rem;
                    color: white;
                    font-size: 0.95rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 6px rgba(124, 58, 237, 0.25);
                }

                .translate-btn:hover:not(:disabled) {
                    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                    box-shadow: 0 6px 12px rgba(124, 58, 237, 0.35);
                }

                .translate-btn.loading {
                    background: linear-gradient(135deg, #475569 0%, #334155 100%);
                    cursor: not-allowed;
                }

                .translate-btn.translated {
                    background: linear-gradient(135deg, #059669 0%, #047857 100%);
                    box-shadow: 0 4px 6px rgba(5, 150, 105, 0.25);
                }

                .btn-icon {
                    font-size: 1.1rem;
                }

                .spinner {
                    width: 18px;
                    height: 18px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .language-menu {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    margin-top: 0.5rem;
                    min-width: 220px;
                    background: #1e293b;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 0.75rem;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
                    z-index: 50;
                    overflow: hidden;
                }

                .language-menu-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.75rem 1rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    color: #94a3b8;
                    font-size: 0.85rem;
                    font-weight: 600;
                }

                .close-btn {
                    background: none;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    font-size: 1.25rem;
                    line-height: 1;
                    padding: 0;
                }

                .close-btn:hover {
                    color: white;
                }

                .language-list {
                    max-height: 300px;
                    overflow-y: auto;
                    padding: 0.5rem;
                }

                .language-option {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    width: 100%;
                    padding: 0.75rem 1rem;
                    background: transparent;
                    border: none;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }

                .language-option:hover {
                    background: rgba(124, 58, 237, 0.2);
                }

                .native-name {
                    color: #f8fafc;
                    font-size: 1rem;
                    font-weight: 500;
                }

                .english-name {
                    color: #64748b;
                    font-size: 0.85rem;
                }

                .clear-btn {
                    padding: 0.5rem 1rem;
                    background: transparent;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 0.5rem;
                    color: #94a3b8;
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .clear-btn:hover {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: rgba(255, 255, 255, 0.3);
                    color: white;
                }

                .error-message {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-top: 1rem;
                    padding: 0.75rem 1rem;
                    background: rgba(239, 68, 68, 0.15);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 0.5rem;
                    color: #fca5a5;
                    font-size: 0.9rem;
                }

                .error-icon {
                    flex-shrink: 0;
                }

                .translated-content {
                    margin-top: 1.5rem;
                    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
                    border: 1px solid rgba(124, 58, 237, 0.3);
                    border-radius: 1rem;
                    overflow: hidden;
                }

                .translated-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem 1.25rem;
                    background: rgba(0, 0, 0, 0.2);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .language-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.375rem;
                    padding: 0.375rem 0.75rem;
                    background: rgba(124, 58, 237, 0.3);
                    border-radius: 0.5rem;
                    color: #c4b5fd;
                    font-size: 0.9rem;
                    font-weight: 600;
                }

                .translation-label {
                    color: #94a3b8;
                    font-size: 0.85rem;
                }

                .header-right {
                    display: flex;
                    align-items: center;
                }

                .listen-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.4rem 1rem;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 2rem;
                    color: white;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .listen-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                    border-color: white;
                }

                .listen-btn.speaking {
                    background: #ef4444;
                    border-color: #ef4444;
                    animation: pulse 1.5s infinite;
                }

                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.7; }
                    100% { opacity: 1; }
                }

                .translated-body {
                    padding: 1.5rem;
                    color: #e2e8f0;
                    line-height: 1.8;
                    font-size: 1.05rem;
                }

                .translated-heading {
                    color: #c4b5fd;
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin: 1.5rem 0 0.75rem 0;
                }

                .translated-heading:first-child {
                    margin-top: 0;
                }

                .translated-paragraph {
                    margin: 0.75rem 0;
                    color: #e2e8f0;
                }

                .translated-list-item {
                    margin: 0.5rem 0;
                    padding-left: 1rem;
                    color: #cbd5e1;
                }

                .translated-separator {
                    border: none;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    margin: 1.5rem 0;
                }

                .typing-cursor {
                    display: inline-block;
                    width: 2px;
                    height: 1.2rem;
                    background-color: #7c3aed;
                    margin-left: 2px;
                    animation: blink 1s step-end infinite;
                    vertical-align: middle;
                }

                @keyframes blink {
                    from, to { background-color: transparent; }
                    50% { background-color: #7c3aed; }
                }

                @media (max-width: 640px) {
                    .translate-controls {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .translate-btn {
                        width: 100%;
                        justify-content: center;
                    }

                    .language-menu {
                        width: 100%;
                    }

                    .translated-body {
                        padding: 1rem;
                        font-size: 1rem;
                    }
                }
            `}</style>
        </div>
    );
}

export default TranslateButton;
