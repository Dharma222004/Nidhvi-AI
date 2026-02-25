import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import HospitalFinder from './HospitalFinder';

/**
 * HospitalFinderButton Component
 * Shows a button to trigger on-demand hospital search using Perplexity AI
 * Only searches when user explicitly clicks the button
 */
function HospitalFinderButton({ analysisData, reportText = '' }) {
    const [hospitalsData, setHospitalsData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);

    // Extract hospital search params from analysis
    const searchParams = analysisData?.hospitalSearchParams || {};
    const {
        condition = 'general checkup',
        specialistType = 'General Physician',
        severity = 'medium',
        needsDoctor = false,
        recommendation = {}
    } = searchParams;

    // Handle the hospital search using Perplexity
    const handleFindHospitals = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log('Searching for hospitals...');
            const response = await axios.post('/api/enhanced/find-hospitals', {
                condition,
                specialistType,
                severity,
                reportText: reportText || analysisData?.extraction?.rawText || ''
            });

            if (response.data.success) {
                setHospitalsData(response.data.hospitals);
                setHasSearched(true);
            } else {
                throw new Error(response.data.error || 'Failed to find hospitals');
            }
        } catch (err) {
            console.error('Hospital search error:', err);
            setError(err.response?.data?.error || err.message || 'Unable to find hospitals');
        } finally {
            setLoading(false);
        }
    };

    // Don't show if there's no need for a doctor (unless severity is high)
    const showButton = needsDoctor || severity === 'high' || severity === 'critical' || severity === 'medium';

    if (!showButton) {
        return null;
    }

    return (
        <div className="hospital-finder-section">
            {/* Recommendation Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="recommendation-card"
            >
                <div className="recommendation-content">
                    <div className="recommendation-icon">
                        {severity === 'critical' ? '🚨' :
                            severity === 'high' ? '⚠️' :
                                needsDoctor ? '🏥' : '📋'}
                    </div>
                    <div className="recommendation-text">
                        <h4>{recommendation.title || 'Doctor Visit Recommended'}</h4>
                        <p>{recommendation.message || 'Discuss these results with your doctor.'}</p>
                        {recommendation.timeline && (
                            <span className="timeline-badge">
                                🕐 {recommendation.timeline}
                            </span>
                        )}
                    </div>
                </div>

                {/* Search Info */}
                {!hasSearched && (
                    <div className="search-info">
                        <p>
                            <strong>Looking for:</strong> {specialistType} for {condition}
                        </p>
                    </div>
                )}

                {/* Error Display */}
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

                {/* Find Hospitals Button */}
                {!hasSearched && (
                    <motion.button
                        onClick={handleFindHospitals}
                        disabled={loading}
                        whileHover={{ scale: loading ? 1 : 1.02 }}
                        whileTap={{ scale: loading ? 1 : 0.98 }}
                        className={`find-hospitals-btn ${loading ? 'loading' : ''} ${severity === 'critical' ? 'critical' : severity === 'high' ? 'high' : ''}`}
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                <span>Finding best hospitals near you...</span>
                            </>
                        ) : (
                            <>
                                <span className="btn-icon">🔍</span>
                                <span>Find Hospitals & Doctors Near Me</span>
                            </>
                        )}
                    </motion.button>
                )}

                {/* Search Again Button */}
                {hasSearched && !loading && (
                    <button
                        onClick={handleFindHospitals}
                        className="search-again-btn"
                    >
                        🔄 Search Again
                    </button>
                )}
            </motion.div>

            {/* Hospital Results */}
            <AnimatePresence>
                {(hasSearched || loading) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <HospitalFinder
                            hospitalsData={hospitalsData}
                            loading={loading}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .hospital-finder-section {
                    margin: 1.5rem 0;
                }

                .recommendation-card {
                    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 1rem;
                    padding: 1.5rem;
                    margin-bottom: 1rem;
                }

                .recommendation-content {
                    display: flex;
                    align-items: flex-start;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }

                .recommendation-icon {
                    font-size: 2.5rem;
                    flex-shrink: 0;
                }

                .recommendation-text h4 {
                    color: #f8fafc;
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin: 0 0 0.5rem 0;
                }

                .recommendation-text p {
                    color: #94a3b8;
                    font-size: 0.95rem;
                    margin: 0 0 0.75rem 0;
                    line-height: 1.5;
                }

                .timeline-badge {
                    display: inline-block;
                    background: rgba(14, 165, 233, 0.2);
                    color: #38bdf8;
                    padding: 0.375rem 0.75rem;
                    border-radius: 0.5rem;
                    font-size: 0.85rem;
                    font-weight: 500;
                }

                .search-info {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 0.5rem;
                    padding: 0.75rem 1rem;
                    margin-bottom: 1rem;
                }

                .search-info p {
                    color: #cbd5e1;
                    font-size: 0.9rem;
                    margin: 0;
                }

                .search-info strong {
                    color: #38bdf8;
                }

                .error-message {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: rgba(239, 68, 68, 0.15);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 0.5rem;
                    padding: 0.75rem 1rem;
                    margin-bottom: 1rem;
                    color: #fca5a5;
                    font-size: 0.9rem;
                }

                .error-icon {
                    flex-shrink: 0;
                }

                .close-btn {
                    margin-left: auto;
                    background: none;
                    border: none;
                    color: #fca5a5;
                    cursor: pointer;
                    font-size: 1.25rem;
                    padding: 0;
                    line-height: 1;
                }

                .find-hospitals-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    width: 100%;
                    padding: 1rem 1.5rem;
                    background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
                    border: none;
                    border-radius: 0.75rem;
                    color: white;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 6px rgba(14, 165, 233, 0.25);
                }

                .find-hospitals-btn:hover:not(:disabled) {
                    background: linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%);
                    box-shadow: 0 6px 12px rgba(14, 165, 233, 0.35);
                }

                .find-hospitals-btn.loading {
                    background: linear-gradient(135deg, #475569 0%, #334155 100%);
                    cursor: not-allowed;
                }

                .find-hospitals-btn.critical {
                    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                    box-shadow: 0 4px 6px rgba(220, 38, 38, 0.25);
                    animation: pulse 2s infinite;
                }

                .find-hospitals-btn.high {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    box-shadow: 0 4px 6px rgba(245, 158, 11, 0.25);
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.85; }
                }

                .btn-icon {
                    font-size: 1.25rem;
                }

                .spinner {
                    width: 20px;
                    height: 20px;
                    border: 3px solid rgba(255, 255, 255, 0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .search-again-btn {
                    display: block;
                    width: 100%;
                    padding: 0.75rem 1rem;
                    background: transparent;
                    border: 2px solid rgba(14, 165, 233, 0.5);
                    border-radius: 0.5rem;
                    color: #38bdf8;
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .search-again-btn:hover {
                    background: rgba(14, 165, 233, 0.15);
                    border-color: #38bdf8;
                }

                @media (max-width: 640px) {
                    .recommendation-content {
                        flex-direction: column;
                        align-items: center;
                        text-align: center;
                    }

                    .recommendation-icon {
                        font-size: 3rem;
                    }

                    .find-hospitals-btn {
                        padding: 0.875rem 1rem;
                        font-size: 0.95rem;
                    }
                }
            `}</style>
        </div>
    );
}

export default HospitalFinderButton;
