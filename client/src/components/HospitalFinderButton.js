import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import HospitalFinder from './HospitalFinder';

/**
 * HospitalFinderButton Component
 * - Auto-detects location from scan report
 * - Allows user to manually type any city (Chennai, Madurai, etc.)
 * - Uses Gemini AI for high-accuracy hospital search
 * - Fully responsive (mobile + desktop)
 */
function HospitalFinderButton({ analysisData, reportText = '' }) {
    const [hospitalsData, setHospitalsData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);

    // Location state
    const [locationInput, setLocationInput] = useState('');
    const [isEditingLocation, setIsEditingLocation] = useState(false);

    const searchParams = analysisData?.hospitalSearchParams || {};
    const {
        condition = 'general checkup',
        specialistType = 'General Physician',
        severity = 'medium',
        needsDoctor = false,
        recommendation = {},
        detectedLocation = null
    } = searchParams;

    // Auto-fill location when detectedLocation arrives from the report
    useEffect(() => {
        if (detectedLocation && !locationInput) {
            setLocationInput(detectedLocation);
        }
    }, [detectedLocation]); // eslint-disable-line

    const effectiveLocation = locationInput.trim() || detectedLocation || '';

    const handleFindHospitals = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post('/api/enhanced/find-hospitals', {
                condition,
                specialistType,
                severity,
                reportText: reportText || analysisData?.extraction?.rawText || '',
                location: effectiveLocation || undefined
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

    const handleReset = () => {
        setHospitalsData(null);
        setHasSearched(false);
        setError(null);
    };

    const showButton = needsDoctor || severity === 'high' || severity === 'critical' || severity === 'medium';

    if (!showButton) return null;

    const severityColor =
        severity === 'critical' ? '#ef4444' :
            severity === 'high' ? '#f59e0b' : '#0ea5e9';

    const severityEmoji =
        severity === 'critical' ? '🚨' :
            severity === 'high' ? '⚠️' :
                needsDoctor ? '🏥' : '📋';

    return (
        <div className="hfb-wrapper">
            {/* Recommendation Card */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="hfb-card"
                style={{ '--accent': severityColor }}
            >
                {/* Header row */}
                <div className="hfb-header">
                    <span className="hfb-emoji">{severityEmoji}</span>
                    <div className="hfb-header-text">
                        <h4>{recommendation.title || 'Doctor Visit Recommended'}</h4>
                        <p>{recommendation.message || 'Discuss these results with your doctor.'}</p>
                        {recommendation.timeline && (
                            <span className="hfb-badge">🕐 {recommendation.timeline}</span>
                        )}
                    </div>
                </div>

                {/* What we're searching for */}
                <div className="hfb-meta">
                    <div className="hfb-meta-item">
                        <span className="hfb-meta-label">Specialist needed</span>
                        <span className="hfb-meta-value">🩺 {specialistType}</span>
                    </div>
                    <div className="hfb-meta-item">
                        <span className="hfb-meta-label">Condition</span>
                        <span className="hfb-meta-value">📋 {condition}</span>
                    </div>
                </div>

                {/* Location selector */}
                <div className="hfb-location-box">
                    <div className="hfb-loc-row">
                        <span className="hfb-loc-icon">📍</span>
                        <div className="hfb-loc-content">
                            <span className="hfb-loc-label">
                                {detectedLocation ? 'Detected from report' : 'Search location'}
                            </span>
                            {isEditingLocation ? (
                                <div className="hfb-loc-input-row">
                                    <input
                                        type="text"
                                        value={locationInput}
                                        onChange={e => setLocationInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') setIsEditingLocation(false); if (e.key === 'Escape') setIsEditingLocation(false); }}
                                        placeholder="e.g. Chennai, Madurai, Mumbai..."
                                        className="hfb-loc-input"
                                        autoFocus
                                    />
                                    <button
                                        className="hfb-loc-save"
                                        onClick={() => setIsEditingLocation(false)}
                                    >✓ Set</button>
                                </div>
                            ) : (
                                <div className="hfb-loc-display">
                                    <span className="hfb-loc-value">
                                        {effectiveLocation || 'Not detected — type a city below'}
                                    </span>
                                    <button
                                        className="hfb-loc-edit"
                                        onClick={() => setIsEditingLocation(true)}
                                    >
                                        {effectiveLocation ? '✏️ Change' : '+ Add city'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    {!effectiveLocation && !isEditingLocation && (
                        <p className="hfb-loc-hint">
                            💡 Type your city (like "Chennai" or "Madurai") for more accurate results
                        </p>
                    )}
                </div>

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="hfb-error"
                        >
                            <span>⚠️ {error}</span>
                            <button onClick={() => setError(null)} className="hfb-error-close">×</button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Action buttons */}
                {!hasSearched ? (
                    <motion.button
                        onClick={handleFindHospitals}
                        disabled={loading}
                        whileHover={{ scale: loading ? 1 : 1.02 }}
                        whileTap={{ scale: loading ? 1 : 0.97 }}
                        className={`hfb-btn${severity === 'critical' ? ' hfb-btn--critical' : severity === 'high' ? ' hfb-btn--high' : ''}${loading ? ' hfb-btn--loading' : ''}`}
                    >
                        {loading ? (
                            <>
                                <span className="hfb-spinner" />
                                <span>Searching hospitals{effectiveLocation ? ` in ${effectiveLocation}` : ''}…</span>
                            </>
                        ) : (
                            <>
                                <span>🔍</span>
                                <span>Find {specialistType} Hospitals{effectiveLocation ? ` in ${effectiveLocation}` : ' Near Me'}</span>
                            </>
                        )}
                    </motion.button>
                ) : (
                    <div className="hfb-searched-actions">
                        <button className="hfb-change-loc" onClick={() => setIsEditingLocation(true)}>
                            📍 Search Different City
                        </button>
                        <button className="hfb-refresh" onClick={() => { handleReset(); setTimeout(handleFindHospitals, 100); }}>
                            🔄 Refresh Results
                        </button>
                    </div>
                )}

                {hasSearched && hospitalsData?.location?.used && (
                    <p className="hfb-searched-note">
                        ✅ Showing hospitals in <strong>{hospitalsData.location.used}</strong>
                    </p>
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
                        <HospitalFinder hospitalsData={hospitalsData} loading={loading} />
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .hfb-wrapper { margin: 1.5rem 0; }

                .hfb-card {
                    background: linear-gradient(145deg, #1a2744 0%, #0f172a 100%);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-left: 4px solid var(--accent, #0ea5e9);
                    border-radius: 1rem;
                    padding: 1.5rem;
                    margin-bottom: 1rem;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.3);
                }

                .hfb-header {
                    display: flex;
                    gap: 1rem;
                    align-items: flex-start;
                    margin-bottom: 1.25rem;
                }
                .hfb-emoji { font-size: 2.2rem; flex-shrink: 0; line-height: 1; }
                .hfb-header-text h4 {
                    color: #f1f5f9;
                    font-size: 1.1rem;
                    font-weight: 700;
                    margin: 0 0 0.35rem;
                }
                .hfb-header-text p {
                    color: #94a3b8;
                    font-size: 0.9rem;
                    margin: 0 0 0.5rem;
                    line-height: 1.5;
                }
                .hfb-badge {
                    display: inline-block;
                    background: rgba(14,165,233,0.15);
                    color: #38bdf8;
                    padding: 0.25rem 0.65rem;
                    border-radius: 999px;
                    font-size: 0.8rem;
                    font-weight: 500;
                }

                .hfb-meta {
                    display: flex;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                    margin-bottom: 1.25rem;
                }
                .hfb-meta-item {
                    display: flex;
                    flex-direction: column;
                    gap: 0.15rem;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 0.6rem;
                    padding: 0.5rem 0.9rem;
                    flex: 1;
                    min-width: 130px;
                }
                .hfb-meta-label { color: #64748b; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; }
                .hfb-meta-value { color: #e2e8f0; font-size: 0.88rem; font-weight: 600; }

                /* Location box */
                .hfb-location-box {
                    background: rgba(14,165,233,0.06);
                    border: 1px solid rgba(14,165,233,0.2);
                    border-radius: 0.75rem;
                    padding: 1rem;
                    margin-bottom: 1.25rem;
                }
                .hfb-loc-row { display: flex; gap: 0.75rem; align-items: flex-start; }
                .hfb-loc-icon { font-size: 1.2rem; flex-shrink: 0; padding-top: 0.15rem; }
                .hfb-loc-content { flex: 1; }
                .hfb-loc-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: #38bdf8; display: block; margin-bottom: 0.35rem; }

                .hfb-loc-display { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
                .hfb-loc-value { color: #e2e8f0; font-size: 0.95rem; font-weight: 600; }
                .hfb-loc-edit {
                    background: rgba(14,165,233,0.12);
                    border: 1px solid rgba(14,165,233,0.3);
                    border-radius: 0.4rem;
                    color: #38bdf8;
                    cursor: pointer;
                    font-size: 0.78rem;
                    padding: 0.2rem 0.55rem;
                    transition: all 0.15s;
                }
                .hfb-loc-edit:hover { background: rgba(14,165,233,0.22); }

                .hfb-loc-input-row { display: flex; gap: 0.5rem; align-items: center; }
                .hfb-loc-input {
                    flex: 1;
                    background: rgba(255,255,255,0.08);
                    border: 1px solid rgba(14,165,233,0.4);
                    border-radius: 0.5rem;
                    color: #f1f5f9;
                    font-size: 0.95rem;
                    outline: none;
                    padding: 0.45rem 0.75rem;
                    transition: border-color 0.2s;
                }
                .hfb-loc-input:focus { border-color: #38bdf8; }
                .hfb-loc-input::placeholder { color: #475569; }
                .hfb-loc-save {
                    background: rgba(14,165,233,0.2);
                    border: 1px solid rgba(14,165,233,0.5);
                    border-radius: 0.5rem;
                    color: #38bdf8;
                    cursor: pointer;
                    font-size: 0.85rem;
                    font-weight: 600;
                    padding: 0.45rem 0.85rem;
                    white-space: nowrap;
                    transition: all 0.15s;
                }
                .hfb-loc-save:hover { background: rgba(14,165,233,0.32); }

                .hfb-loc-hint {
                    font-size: 0.78rem;
                    color: #64748b;
                    margin: 0.6rem 0 0;
                }

                /* Error */
                .hfb-error {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: rgba(239,68,68,0.12);
                    border: 1px solid rgba(239,68,68,0.25);
                    border-radius: 0.5rem;
                    color: #fca5a5;
                    font-size: 0.88rem;
                    margin-bottom: 1rem;
                    overflow: hidden;
                    padding: 0.65rem 0.9rem;
                }
                .hfb-error-close { background: none; border: none; color: #fca5a5; cursor: pointer; font-size: 1.2rem; padding: 0; }

                /* Main button */
                .hfb-btn {
                    align-items: center;
                    background: linear-gradient(135deg, #0ea5e9, #0284c7);
                    border: none;
                    border-radius: 0.75rem;
                    box-shadow: 0 4px 14px rgba(14,165,233,0.3);
                    color: white;
                    cursor: pointer;
                    display: flex;
                    font-size: 1rem;
                    font-weight: 700;
                    gap: 0.6rem;
                    justify-content: center;
                    padding: 0.95rem 1.5rem;
                    transition: all 0.2s;
                    width: 100%;
                    letter-spacing: 0.01em;
                }
                .hfb-btn:hover:not(:disabled) {
                    background: linear-gradient(135deg, #38bdf8, #0ea5e9);
                    box-shadow: 0 6px 20px rgba(14,165,233,0.4);
                }
                .hfb-btn--critical {
                    background: linear-gradient(135deg, #dc2626, #b91c1c);
                    box-shadow: 0 4px 14px rgba(220,38,38,0.35);
                    animation: hfb-pulse 1.8s ease-in-out infinite;
                }
                .hfb-btn--high {
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    box-shadow: 0 4px 14px rgba(245,158,11,0.3);
                }
                .hfb-btn--loading {
                    background: linear-gradient(135deg, #334155, #1e293b) !important;
                    cursor: not-allowed !important;
                    box-shadow: none !important;
                }

                @keyframes hfb-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.82; } }

                .hfb-spinner {
                    animation: hfb-spin 0.7s linear infinite;
                    border: 3px solid rgba(255,255,255,0.25);
                    border-radius: 50%;
                    border-top-color: white;
                    flex-shrink: 0;
                    height: 18px;
                    width: 18px;
                }
                @keyframes hfb-spin { to { transform: rotate(360deg); } }

                .hfb-searched-actions {
                    display: flex;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                }
                .hfb-change-loc, .hfb-refresh {
                    flex: 1;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.12);
                    border-radius: 0.6rem;
                    color: #94a3b8;
                    cursor: pointer;
                    font-size: 0.88rem;
                    font-weight: 500;
                    padding: 0.65rem 1rem;
                    transition: all 0.15s;
                    min-width: 140px;
                }
                .hfb-change-loc:hover { background: rgba(14,165,233,0.1); color: #38bdf8; border-color: rgba(14,165,233,0.3); }
                .hfb-refresh:hover { background: rgba(255,255,255,0.1); color: #e2e8f0; }

                .hfb-searched-note {
                    color: #64748b;
                    font-size: 0.82rem;
                    margin: 0.75rem 0 0;
                    text-align: center;
                }
                .hfb-searched-note strong { color: #38bdf8; }

                /* Mobile responsive */
                @media (max-width: 640px) {
                    .hfb-card { padding: 1.1rem; }
                    .hfb-header { gap: 0.75rem; }
                    .hfb-emoji { font-size: 1.8rem; }
                    .hfb-header-text h4 { font-size: 1rem; }
                    .hfb-meta { gap: 0.5rem; }
                    .hfb-meta-item { min-width: 100%; }
                    .hfb-btn { font-size: 0.92rem; padding: 0.85rem 1rem; }
                    .hfb-loc-input-row { flex-direction: column; }
                    .hfb-loc-save { width: 100%; }
                    .hfb-searched-actions { flex-direction: column; }
                }
            `}</style>
        </div>
    );
}

export default HospitalFinderButton;
