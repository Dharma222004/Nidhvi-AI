import React, { useState } from 'react';
import { motion } from 'framer-motion';

function VoiceInput({ onTranscript, disabled, language = 'en' }) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [recognition, setRecognition] = useState(null);

    const startListening = () => {
        // Check browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert('Sorry, your browser does not support voice input. Please use Chrome, Edge, or Safari.');
            return;
        }

        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;

        // Map language codes
        const langMap = {
            en: 'en-US',
            hi: 'hi-IN',
            ta: 'ta-IN',
            te: 'te-IN',
            bn: 'bn-IN',
            mr: 'mr-IN',
            gu: 'gu-IN',
            kn: 'kn-IN',
            ml: 'ml-IN'
        };

        recognitionInstance.lang = langMap[language] || 'en-US';

        recognitionInstance.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcriptPiece = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcriptPiece + ' ';
                } else {
                    interimTranscript += transcriptPiece;
                }
            }

            setTranscript(finalTranscript + interimTranscript);
        };

        recognitionInstance.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'no-speech') {
                // Just continue listening
            } else {
                setIsListening(false);
                alert(`Voice input error: ${event.error}`);
            }
        };

        recognitionInstance.onend = () => {
            if (isListening) {
                // Restart if still supposed to be listening
                recognitionInstance.start();
            }
        };

        recognitionInstance.start();
        setRecognition(recognitionInstance);
        setIsListening(true);
        setTranscript('');
    };

    const stopListening = () => {
        if (recognition) {
            recognition.stop();
            setRecognition(null);
        }
        setIsListening(false);

        if (transcript.trim()) {
            onTranscript(transcript.trim());
            setTranscript('');
        }
    };

    return (
        <div className="voice-input">
            <motion.button
                className={`mic-button ${isListening ? 'listening' : ''}`}
                onClick={isListening ? stopListening : startListening}
                disabled={disabled}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: disabled ? 1 : 1.05 }}
            >
                {isListening && <span className="pulse-ring"></span>}
                <span className="mic-icon">{isListening ? '🎙️' : '🎤'}</span>
                <span className="text">
                    {isListening ? 'Tap to Stop' : 'Tap to Speak'}
                </span>
            </motion.button>

            {transcript && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="transcript-preview"
                >
                    <p className="label">You're saying:</p>
                    <p className="transcript-text">{transcript}</p>
                </motion.div>
            )}

            <style jsx>{`
        .voice-input {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .mic-button {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
          color: white;
          border: none;
          border-radius: 2rem;
          padding: 1rem 2rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
          overflow: hidden;
        }

        .mic-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(14, 165, 233, 0.4);
        }

        .mic-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #94a3b8;
        }

        .mic-button.listening {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          animation: pulse-glow 2s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
          }
          50% {
            box-shadow: 0 4px 24px rgba(239, 68, 68, 0.6);
          }
        }

        .pulse-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 3px solid rgba(255, 255, 255, 0.6);
          border-radius: 2rem;
          animation: pulse-ring 1.5s ease-out infinite;
          pointer-events: none;
        }

        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }

        .mic-icon {
          font-size: 1.5rem;
          z-index: 1;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        }

        .text {
          z-index: 1;
          font-weight: 600;
        }

        .transcript-preview {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          padding: 1.25rem;
          border-radius: 1rem;
          border: 2px solid #bae6fd;
          border-left: 4px solid #0ea5e9;
        }

        .transcript-preview .label {
          margin: 0 0 0.5rem 0;
          color: #0c4a6e;
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .transcript-preview .transcript-text {
          margin: 0;
          color: #0369a1;
          font-size: 1rem;
          line-height: 1.6;
          font-weight: 500;
        }

        @media (max-width: 640px) {
          .mic-button {
            width: 100%;
            padding: 1.125rem 1.5rem;
          }

          .mic-icon {
            font-size: 1.75rem;
          }
        }
      `}</style>
        </div>
    );
}

export default VoiceInput;
