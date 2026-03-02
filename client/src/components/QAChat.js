import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

function QAChat({ analysisContext, language = 'en' }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const transcriptRef = useRef('');

  // Automatic scrolling removed as per user request



  // Voice Input Functions
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice input is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = true;

    const langMap = {
      en: 'en-US', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN',
      bn: 'bn-IN', mr: 'mr-IN', gu: 'gu-IN', kn: 'kn-IN', ml: 'ml-IN'
    };
    recognitionInstance.lang = langMap[language] || 'en-US';

    // Reset transcript ref
    transcriptRef.current = '';

    recognitionInstance.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInputText(transcript);
      transcriptRef.current = transcript;
    };

    recognitionInstance.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
      // Auto-submit if we have text
      if (transcriptRef.current && transcriptRef.current.trim().length > 0) {
        askQuestion(transcriptRef.current);
      }
    };

    recognitionInstance.start();
    setRecognition(recognitionInstance);
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setRecognition(null);
    }
    setIsListening(false);
  };

  const toggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const askQuestion = async (question) => {
    if (!question.trim()) return;

    const userMessage = {
      role: 'user',
      content: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const serverUrl = process.env.REACT_APP_API_URL || "https://nidhvi-ai.onrender.com";
      const response = await axios.post(`${serverUrl}/api/enhanced/ask-doubt`, {
        question,
        context: analysisContext,
        language
      });

      const aiMessage = {
        role: 'assistant',
        content: response.data.answer,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Q&A error:', error);
      const errorMessage = {
        role: 'error',
        content: 'Sorry, I couldn\'t process your question. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    askQuestion(inputText);
  };

  const suggestedQuestions = [
    "What do these results mean for my health?",
    "Should I be worried about any findings?",
    "What lifestyle changes should I consider?",
    "When should I schedule a follow-up?"
  ];

  return (
    <div className="qa-container">
      {/* Header */}
      <div className="qa-header">
        <div className="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div className="header-text">
          <h3>Questions About Your Report</h3>
          <p>Get instant AI-powered answers based on your medical analysis</p>
        </div>
      </div>

      {/* Suggested Questions - Only show when no messages */}
      {messages.length === 0 && (
        <div className="suggestions-panel">
          <p className="suggestions-title">Quick Questions</p>
          <div className="suggestions-list">
            {suggestedQuestions.map((question, idx) => (
              <motion.button
                key={idx}
                className="suggestion-chip"
                onClick={() => askQuestion(question)}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="chip-icon">?</span>
                <span className="chip-text">{question}</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="messages-area">
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`message ${msg.role}`}
            >
              <div className="message-avatar">
                {msg.role === 'user' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                ) : msg.role === 'assistant' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a3 3 0 0 0-3 3v1H7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2V5a3 3 0 0 0-3-3z" />
                    <circle cx="9" cy="12" r="1" />
                    <circle cx="15" cy="12" r="1" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                )}
              </div>
              <div className="message-content">
                <div className="message-text">{msg.content}</div>
                <div className="message-time">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="message assistant"
          >
            <div className="message-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a3 3 0 0 0-3 3v1H7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2V5a3 3 0 0 0-3-3z" />
                <circle cx="9" cy="12" r="1" />
                <circle cx="15" cy="12" r="1" />
              </svg>
            </div>
            <div className="message-content">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Professional with integrated mic */}
      <form onSubmit={handleSubmit} className="input-area">
        <div className={`input-wrapper ${isListening ? 'listening' : ''}`}>
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? "Listening..." : "Ask a question about your report..."}
            disabled={loading}
            className="question-input"
          />

          {/* Mic Button - Inside input */}
          <motion.button
            type="button"
            onClick={toggleVoice}
            disabled={loading}
            className={`mic-btn ${isListening ? 'active' : ''}`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title={isListening ? "Stop listening" : "Voice input"}
          >
            {isListening && <span className="mic-pulse"></span>}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </motion.button>
        </div>

        {/* Send Button */}
        <motion.button
          type="submit"
          disabled={loading || !inputText.trim()}
          className="send-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </motion.button>
      </form>

      <style jsx>{`
                .qa-container {
                    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
                    border-radius: 20px;
                    border: 1px solid rgba(139, 92, 246, 0.2);
                    overflow: hidden;
                    max-width: 800px;
                    margin: 24px auto;
                }

                .qa-header {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 20px 24px;
                    background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.1));
                    border-bottom: 1px solid rgba(139, 92, 246, 0.1);
                }

                .header-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #8b5cf6, #06b6d4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .header-icon svg {
                    width: 24px;
                    height: 24px;
                    color: white;
                }

                .header-text h3 {
                    color: #f1f5f9;
                    font-size: 1.1rem;
                    font-weight: 700;
                    margin: 0 0 4px;
                }

                .header-text p {
                    color: #94a3b8;
                    font-size: 0.85rem;
                    margin: 0;
                }

                .suggestions-panel {
                    padding: 20px 24px;
                    border-bottom: 1px solid rgba(139, 92, 246, 0.1);
                }

                .suggestions-title {
                    color: #94a3b8;
                    font-size: 0.8rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin: 0 0 12px;
                }

                .suggestions-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .suggestion-chip {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    background: rgba(139, 92, 246, 0.08);
                    border: 1px solid rgba(139, 92, 246, 0.15);
                    border-radius: 10px;
                    color: #c4b5fd;
                    font-size: 0.9rem;
                    text-align: left;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .suggestion-chip:hover {
                    background: rgba(139, 92, 246, 0.15);
                    border-color: rgba(139, 92, 246, 0.3);
                    color: #e9d5ff;
                }

                .chip-icon {
                    width: 24px;
                    height: 24px;
                    border-radius: 6px;
                    background: rgba(139, 92, 246, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 0.8rem;
                    flex-shrink: 0;
                }

                .chip-text {
                    flex: 1;
                }

                .messages-area {
                    min-height: 200px;
                    max-height: 400px;
                    overflow-y: auto;
                    padding: 20px 24px;
                }

                .messages-area::-webkit-scrollbar {
                    width: 6px;
                }

                .messages-area::-webkit-scrollbar-track {
                    background: transparent;
                }

                .messages-area::-webkit-scrollbar-thumb {
                    background: rgba(139, 92, 246, 0.3);
                    border-radius: 3px;
                }

                .message {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .message.user {
                    flex-direction: row-reverse;
                }

                .message-avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .message.user .message-avatar {
                    background: linear-gradient(135deg, #8b5cf6, #a78bfa);
                }

                .message.assistant .message-avatar {
                    background: linear-gradient(135deg, #06b6d4, #22d3ee);
                }

                .message.error .message-avatar {
                    background: linear-gradient(135deg, #ef4444, #f87171);
                }

                .message-avatar svg {
                    width: 18px;
                    height: 18px;
                    color: white;
                }

                .message-content {
                    max-width: 75%;
                }

                .message.user .message-content {
                    text-align: right;
                }

                .message-text {
                    padding: 12px 16px;
                    border-radius: 16px;
                    font-size: 0.9rem;
                    line-height: 1.5;
                }

                .message.user .message-text {
                    background: linear-gradient(135deg, #8b5cf6, #a78bfa);
                    color: white;
                    border-bottom-right-radius: 4px;
                }

                .message.assistant .message-text {
                    background: rgba(30, 41, 59, 0.8);
                    color: #e2e8f0;
                    border: 1px solid rgba(139, 92, 246, 0.15);
                    border-bottom-left-radius: 4px;
                }

                .message.error .message-text {
                    background: rgba(239, 68, 68, 0.15);
                    color: #fca5a5;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                }

                .message-time {
                    font-size: 0.7rem;
                    color: #64748b;
                    margin-top: 4px;
                    padding: 0 8px;
                }

                .typing-dots {
                    display: flex;
                    gap: 4px;
                    padding: 8px 0;
                }

                .typing-dots span {
                    width: 8px;
                    height: 8px;
                    background: #8b5cf6;
                    border-radius: 50%;
                    animation: bounce 1.4s infinite;
                }

                .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
                .typing-dots span:nth-child(3) { animation-delay: 0.4s; }

                @keyframes bounce {
                    0%, 60%, 100% { transform: translateY(0); }
                    30% { transform: translateY(-8px); }
                }

                .input-area {
                    display: flex;
                    gap: 12px;
                    padding: 16px 20px;
                    background: rgba(15, 23, 42, 0.6);
                    border-top: 1px solid rgba(139, 92, 246, 0.1);
                }

                .input-wrapper {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    background: rgba(30, 41, 59, 0.8);
                    border: 1px solid rgba(139, 92, 246, 0.2);
                    border-radius: 12px;
                    padding: 0 4px 0 16px;
                    transition: all 0.2s;
                }

                .input-wrapper:focus-within {
                    border-color: rgba(139, 92, 246, 0.5);
                    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
                }

                .input-wrapper.listening {
                    border-color: #ef4444;
                    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
                }

                .question-input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    outline: none;
                    color: #e2e8f0;
                    font-size: 0.9rem;
                    padding: 12px 8px 12px 0;
                    font-family: inherit;
                }

                .question-input::placeholder {
                    color: #64748b;
                }

                .question-input:disabled {
                    opacity: 0.6;
                }

                .mic-btn {
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    background: transparent;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    position: relative;
                }

                .mic-btn:hover {
                    background: rgba(139, 92, 246, 0.15);
                    color: #a78bfa;
                }

                .mic-btn.active {
                    background: rgba(239, 68, 68, 0.2);
                    color: #f87171;
                }

                .mic-btn svg {
                    width: 18px;
                    height: 18px;
                }

                .mic-pulse {
                    position: absolute;
                    inset: 0;
                    border-radius: 8px;
                    border: 2px solid #ef4444;
                    animation: mic-pulse-anim 1.5s ease-out infinite;
                }

                @keyframes mic-pulse-anim {
                    0% { transform: scale(1); opacity: 1; }
                    100% { transform: scale(1.5); opacity: 0; }
                }

                .send-btn {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #8b5cf6, #06b6d4);
                    border: none;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
                }

                .send-btn:hover:not(:disabled) {
                    box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
                }

                .send-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .send-btn svg {
                    width: 20px;
                    height: 20px;
                }

                @media (max-width: 640px) {
                    .qa-container {
                        margin: 16px;
                        border-radius: 16px;
                    }

                    .qa-header {
                        padding: 16px;
                    }

                    .header-icon {
                        width: 40px;
                        height: 40px;
                    }

                    .header-text h3 {
                        font-size: 1rem;
                    }

                    .messages-area {
                        max-height: 300px;
                    }

                    .message-content {
                        max-width: 85%;
                    }

                    .input-area {
                        padding: 12px 16px;
                    }

                    .send-btn {
                        width: 44px;
                        height: 44px;
                    }
                }
            `}</style>
    </div>
  );
}

export default QAChat;
