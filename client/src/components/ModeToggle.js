import React from 'react';
import { motion } from 'framer-motion';
import './ModeToggle.css';

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
        </div>
    );
}

export default ModeToggle;
