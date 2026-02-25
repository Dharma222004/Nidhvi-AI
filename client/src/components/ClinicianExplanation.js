import React from 'react';
import { motion } from 'framer-motion';
import { useTypewriter } from '../hooks/useTypewriter';

const stagger = {
    visible: { transition: { staggerChildren: 0.08 } }
};

const fadeIn = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
};

function ClinicianExplanation({ explanation }) {
    const { displayedText: typedSummary, isComplete: summaryComplete } = useTypewriter(explanation?.clinicalSummary, 5);

    if (!explanation) return null;

    return (
        <motion.div
            className="api-results-container clinician-results space-y-6"
            initial="hidden"
            animate="visible"
            variants={stagger}
        >
            {/* Clinical Summary */}
            {explanation.clinicalSummary && (
                <motion.div variants={fadeIn} className="glass-card p-6 result-section">
                    <h3 className="section-title">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Clinical Summary
                    </h3>
                    <div className="result-text-block">
                        <p className="text-gray-300 leading-relaxed text-left">
                            {typedSummary}
                            {!summaryComplete && <span className="typing-cursor">|</span>}
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Critical Values */}
            {explanation.criticalValues?.length > 0 && (
                <motion.div variants={fadeIn} className="glass-card p-6 result-section border-red-500/30 bg-red-500/5">
                    <h3 className="section-title text-red-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Critical Values
                    </h3>
                    <div className="space-y-4">
                        {explanation.criticalValues.map((cv, i) => (
                            <div key={i} className="finding-card critical">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-white font-medium">{cv.value}</span>
                                    <span className={`badge ${cv.urgency === 'immediate' ? 'badge-danger' : 'badge-warning'}`}>{cv.urgency}</span>
                                </div>
                                <p className="text-gray-400 text-sm mb-2">{cv.interpretation}</p>
                                <div className="flex items-center gap-2 text-red-400 text-sm">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                    <span>{cv.action}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Findings Grid */}
            {(explanation.findingsSummary?.length > 0 || explanation.abnormalFindings?.length > 0) && (
                <div className="grid lg:grid-cols-2 gap-6 result-grid">
                    {explanation.findingsSummary?.length > 0 && (
                        <motion.div variants={fadeIn} className="glass-card p-6 result-section">
                            <h3 className="section-title">
                                <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Key Findings
                            </h3>
                            <ul className="result-list space-y-3">
                                {explanation.findingsSummary.map((finding, i) => (
                                    <li key={i} className="result-list-item">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0 mt-2" />
                                        <span className="result-item-text text-gray-300 text-sm">{finding}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}

                    {explanation.abnormalFindings?.length > 0 && (
                        <motion.div variants={fadeIn} className="glass-card p-6 result-section">
                            <h3 className="section-title">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Abnormal Findings
                            </h3>
                            <div className="space-y-3">
                                {explanation.abnormalFindings.map((af, i) => (
                                    <div key={i} className="finding-card warning">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-gray-200 text-sm font-medium">{af.finding}</span>
                                            <span className={`badge ${af.trend === 'worsening' ? 'badge-danger' : af.trend === 'improving' ? 'badge-success' : af.trend === 'new' ? 'badge-warning' : 'badge-info'}`}>{af.trend}</span>
                                        </div>
                                        <p className="text-gray-400 text-sm">{af.significance}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Differential Diagnosis */}
            {explanation.differentialDiagnosis?.length > 0 && (
                <motion.div variants={fadeIn} className="glass-card p-6">
                    <h3 className="section-title">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Differential Diagnosis
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {explanation.differentialDiagnosis.map((ddx, i) => (
                            <div key={i} className="finding-card">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-white font-medium text-sm">{ddx.diagnosis}</span>
                                    <span className={`badge ${ddx.likelihood === 'high' ? 'badge-success' : ddx.likelihood === 'medium' ? 'badge-warning' : 'badge-info'}`}>{ddx.likelihood}</span>
                                </div>
                                {ddx.supportingFindings?.length > 0 && (
                                    <div className="space-y-1">
                                        {ddx.supportingFindings.slice(0, 3).map((sf, j) => (
                                            <p key={j} className="text-gray-500 text-xs flex items-start gap-1.5"><span className="text-gray-600">→</span>{sf}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Suggested Next Steps */}
            {explanation.suggestedNextSteps?.length > 0 && (
                <motion.div variants={fadeIn} className="glass-card p-6">
                    <h3 className="section-title">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        Suggested Next Steps
                    </h3>
                    <div className="space-y-4">
                        {explanation.suggestedNextSteps.map((step, i) => (
                            <div key={i} className="flex items-start gap-4">
                                <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${step.timeframe === 'immediate' ? 'bg-red-500/20 text-red-400' : step.timeframe === 'days' ? 'bg-amber-500/20 text-amber-400' : 'bg-primary-500/20 text-primary-400'}`}>{i + 1}</span>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-gray-200 font-medium text-sm">{step.action}</span>
                                        <span className={`badge text-xs ${step.timeframe === 'immediate' ? 'badge-danger' : step.timeframe === 'days' ? 'badge-warning' : 'badge-info'}`}>{step.timeframe}</span>
                                    </div>
                                    <p className="text-gray-400 text-sm">{step.rationale}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                {/* References and Pearls */}
                {explanation.guidelineReferences?.length > 0 && (
                    <motion.div variants={fadeIn} className="glass-card p-6">
                        <h3 className="section-title">Guideline References</h3>
                        <div className="space-y-3">
                            {explanation.guidelineReferences.map((gr, i) => (
                                <div key={i} className="finding-card">
                                    <p className="text-gray-200 text-sm font-medium mb-1">{gr.guideline}</p>
                                    <p className="text-gray-500 text-xs mb-1">{gr.source}</p>
                                    <p className="text-gray-400 text-sm">{gr.relevance}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
                {explanation.clinicalPearls?.length > 0 && (
                    <motion.div variants={fadeIn} className="glass-card p-6 bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/20">
                        <h3 className="section-title text-purple-400">Clinical Pearls</h3>
                        <ul className="space-y-3">
                            {explanation.clinicalPearls.map((pearl, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="text-purple-400 mt-0.5">💡</span>
                                    <span className="text-gray-300 text-sm">{pearl}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </div>

            <style jsx>{`
                .typing-cursor {
                    display: inline-block;
                    width: 2px;
                    height: 1.1em;
                    background-color: #a855f7;
                    animation: blink 1s step-end infinite;
                    vertical-align: middle;
                    margin-left: 2px;
                }
                @keyframes blink {
                    from, to { background-color: transparent; }
                    50% { background-color: #a855f7; }
                }
            `}</style>
        </motion.div>
    );
}

export default ClinicianExplanation;
