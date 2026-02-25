import React from 'react';
import { motion } from 'framer-motion';

const LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
    { code: 'bn', name: 'বাংলা', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
    { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
    { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' },
];

function LanguageSelector({ selectedLanguage, onLanguageChange, className = '' }) {
    return (
        <div className={`language-selector ${className}`}>
            <label className="language-label">
                <span className="icon">🌐</span>
                <span>Language:</span>
            </label>

            <div className="language-dropdown">
                <select
                    value={selectedLanguage}
                    onChange={(e) => onLanguageChange(e.target.value)}
                    className="language-select"
                >
                    {LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                            {lang.flag} {lang.name}
                        </option>
                    ))}
                </select>
            </div>

            <style jsx>{`
        .language-selector {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .language-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.95rem;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
        }

        .language-label .icon {
          font-size: 1.25rem;
        }

        .language-dropdown {
          position: relative;
        }

        .language-select {
          appearance: none;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 0.625rem 2.5rem 0.625rem 1rem;
          font-size: 0.95rem;
          font-weight: 500;
          color: #1e293b;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 150px;
        }

        .language-select:hover {
          border-color: #0ea5e9;
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
        }

        .language-select:focus {
          outline: none;
          border-color: #0ea5e9;
          box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.15);
        }

        .language-dropdown::after {
          content: '▼';
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: #64748b;
          font-size: 0.75rem;
        }

        @media (max-width: 640px) {
          .language-selector {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .language-select {
            width: 100%;
          }
        }
      `}</style>
        </div>
    );
}

export default LanguageSelector;
