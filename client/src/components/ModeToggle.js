import React from 'react';
import { motion } from 'framer-motion';

function ModeToggle({ mode, onModeChange, disabled }) {
    return (
        <div className="mode-toggle-wrapper">
            {/* Background glow */}
            <div className="mode-toggle-glow" />

            <div className="mode-toggle" role="tablist" aria-label="Explanation mode">
                {/* Animated indicator */}
                <motion.div
                    className="mode-toggle-indicator"
                    initial={false}
                    animate={{
                        left: mode === 'patient' ? '4px' : 'calc(50% + 2px)',
                        width: 'calc(50% - 6px)'
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />

                {/* Patient Mode Button */}
                <motion.button
                    role="tab"
                    aria-selected={mode === 'patient'}
                    onClick={() => onModeChange('patient')}
                    disabled={disabled}
                    className={`mode-toggle-btn ${mode === 'patient' ? 'active' : ''}`}
                    whileHover={{ scale: mode !== 'patient' ? 1.01 : 1 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <svg className="mode-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="mode-label">Patient</span>
                    {mode === 'patient' && (
                        <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mode-badge"
                        >
                            Simple
                        </motion.span>
                    )}
                </motion.button>

                {/* Clinician Mode Button */}
                <motion.button
                    role="tab"
                    aria-selected={mode === 'clinician'}
                    onClick={() => onModeChange('clinician')}
                    disabled={disabled}
                    className={`mode-toggle-btn ${mode === 'clinician' ? 'active' : ''}`}
                    whileHover={{ scale: mode !== 'clinician' ? 1.01 : 1 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <svg className="mode-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <span className="mode-label">Clinician</span>
                    {mode === 'clinician' && (
                        <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mode-badge"
                        >
                            Technical
                        </motion.span>
                    )}
                </motion.button>
            </div>

            {/* Description text */}
            <motion.p
                className="mode-description"
                key={mode}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                {mode === 'patient'
                    ? 'Easy-to-understand explanations for patients'
                    : 'Detailed technical analysis for healthcare professionals'}
            </motion.p>

            <style jsx>{`
                .mode-toggle-wrapper {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    width: 100%;
                    max-width: 420px;
                    margin: 0 auto;
                }

                .mode-toggle-glow {
                    position: absolute;
                    inset: -10px;
                    border-radius: 30px;
                    background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15));
                    filter: blur(20px);
                    opacity: 0.6;
                    pointer-events: none;
                }

                .mode-toggle {
                    position: relative;
                    display: flex;
                    width: 100%;
                    background: rgba(15, 23, 42, 0.8);
                    border: 1px solid rgba(139, 92, 246, 0.2);
                    border-radius: 16px;
                    padding: 4px;
                    gap: 4px;
                    box-shadow: 
                        inset 0 2px 10px rgba(0, 0, 0, 0.3),
                        0 4px 20px rgba(0, 0, 0, 0.2);
                }

                .mode-toggle-indicator {
                    position: absolute;
                    top: 4px;
                    height: calc(100% - 8px);
                    background: linear-gradient(135deg, #8b5cf6, #06b6d4);
                    border-radius: 12px;
                    box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
                    z-index: 0;
                }

                .mode-toggle-btn {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 12px 16px;
                    font-family: inherit;
                    font-weight: 600;
                    font-size: 0.9rem;
                    color: rgba(148, 163, 184, 0.8);
                    background: transparent;
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    position: relative;
                    z-index: 1;
                    white-space: nowrap;
                }

                .mode-toggle-btn.active {
                    color: white;
                    text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
                }

                .mode-toggle-btn:not(.active):hover {
                    color: rgba(203, 213, 225, 0.9);
                    background: rgba(139, 92, 246, 0.1);
                }

                .mode-toggle-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .mode-icon {
                    width: 18px;
                    height: 18px;
                    flex-shrink: 0;
                }

                .mode-label {
                    font-weight: 600;
                }

                .mode-badge {
                    display: none;
                    background: rgba(255, 255, 255, 0.2);
                    padding: 2px 8px;
                    border-radius: 6px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .mode-description {
                    text-align: center;
                    font-size: 0.85rem;
                    color: rgba(148, 163, 184, 0.6);
                    margin: 0;
                    padding: 0 16px;
                    line-height: 1.4;
                }

                @media (min-width: 480px) {
                    .mode-toggle-btn {
                        padding: 14px 20px;
                        gap: 10px;
                    }

                    .mode-badge {
                        display: inline-block;
                    }

                    .mode-icon {
                        width: 20px;
                        height: 20px;
                    }
                }

                @media (max-width: 380px) {
                    .mode-toggle-btn {
                        padding: 10px 12px;
                        font-size: 0.85rem;
                    }

                    .mode-icon {
                        width: 16px;
                        height: 16px;
                    }

                    .mode-description {
                        font-size: 0.75rem;
                    }
                }
            `}</style>
        </div>
    );
}

export default ModeToggle;
