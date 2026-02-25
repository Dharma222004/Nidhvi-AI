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

/**
 * Utility function to parse markdown-style text and render with proper formatting
 */
function FormattedText({ text, className = '', showCursor = false }) {
    if (!text) return null;

    const parseMarkdown = (str) => {
        const parts = [];
        let currentIndex = 0;
        const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
        let match;

        while ((match = regex.exec(str)) !== null) {
            if (match.index > currentIndex) {
                parts.push(str.substring(currentIndex, match.index));
            }
            if (match[2]) {
                parts.push(<strong key={match.index} className="text-white font-semibold">{match[2]}</strong>);
            } else if (match[3]) {
                parts.push(<em key={match.index} className="text-purple-200">{match[3]}</em>);
            }
            currentIndex = match.index + match[0].length;
        }
        if (currentIndex < str.length) {
            parts.push(str.substring(currentIndex));
        }
        return parts.length > 0 ? parts : str;
    };

    const paragraphs = text.split(/\n\n+/);

    return (
        <div className={`formatted-text ${className}`}>
            {paragraphs.map((paragraph, pIndex) => {
                const lines = paragraph.split('\n');
                return (
                    <div key={pIndex} className={pIndex > 0 ? 'mt-4' : ''}>
                        {lines.map((line, lIndex) => {
                            const trimmedLine = line.trim();
                            if (!trimmedLine) return null;
                            const headerMatch = trimmedLine.match(/^\*\*([^*]+)\*\*:?\s*(.*)$/);
                            if (headerMatch) {
                                return (
                                    <div key={lIndex} className={lIndex > 0 ? 'mt-4' : ''}>
                                        <h4 className="text-purple-300 font-semibold text-base mb-2 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-cyan-400" />
                                            {headerMatch[1]}
                                        </h4>
                                        {headerMatch[2] && (
                                            <p className="text-purple-100/80 leading-relaxed pl-4 border-l-2 border-purple-500/20">
                                                {parseMarkdown(headerMatch[2])}
                                            </p>
                                        )}
                                    </div>
                                );
                            }
                            return (
                                <p key={lIndex} className={`text-purple-100/80 leading-relaxed ${lIndex > 0 ? 'mt-2' : ''}`}>
                                    {parseMarkdown(trimmedLine)}
                                </p>
                            );
                        })}
                    </div>
                );
            })}
            {showCursor && <span className="typing-cursor ml-1">|</span>}
        </div>
    );
}

function PatientExplanation({ explanation }) {
    const { displayedText: typedSummary, isComplete: summaryComplete } = useTypewriter(explanation?.summary, 10);
    const { displayedText: typedExplanation, isComplete: explanationComplete } = useTypewriter(explanation?.explanation, 2);

    if (!explanation) return null;

    return (
        <motion.div
            className="space-y-6"
            initial="hidden"
            animate="visible"
            variants={stagger}
        >
            {/* Summary Card */}
            {explanation.summary && (
                <motion.div
                    variants={fadeIn}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 via-slate-900/50 to-cyan-500/5 border border-purple-500/20 p-6"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl" />
                    <div className="relative flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-cyan-500/20 flex items-center justify-center border border-purple-400/20">
                            <svg className="w-6 h-6 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                <span>📋</span>
                                <span>Report Overview</span>
                            </h3>
                            <p className="text-purple-100/80 leading-relaxed text-base">
                                {typedSummary}
                                {!summaryComplete && <span className="typing-cursor ml-1">|</span>}
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Detailed Explanation */}
            {explanation.explanation && (
                <motion.div
                    variants={fadeIn}
                    className="rounded-2xl bg-slate-900/50 border border-purple-500/10 overflow-hidden"
                >
                    <div className="px-6 py-4 bg-gradient-to-r from-purple-500/10 to-transparent border-b border-purple-500/10">
                        <h3 className="text-lg font-bold text-white flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                <svg className="w-5 h-5 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </span>
                            <span>Understanding Your Results</span>
                        </h3>
                    </div>
                    <div className="p-6">
                        <FormattedText text={typedExplanation} showCursor={!explanationComplete} />
                    </div>
                </motion.div>
            )}

            {/* Findings Grid */}
            {(explanation.normalFindings?.length > 0 || explanation.findingsToDiscuss?.length > 0) && (
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Normal Findings */}
                    {explanation.normalFindings?.length > 0 && (
                        <motion.div variants={fadeIn} className="rounded-2xl bg-gradient-to-br from-emerald-500/5 to-slate-900/50 border border-emerald-500/20 overflow-hidden">
                            <div className="px-5 py-4 bg-emerald-500/10 border-b border-emerald-500/10">
                                <h3 className="font-bold text-emerald-300 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </span>
                                    <span>✅ Good News</span>
                                </h3>
                            </div>
                            <div className="p-5">
                                <ul className="space-y-3">
                                    {explanation.normalFindings.map((finding, i) => (
                                        <motion.li key={i} className="flex items-start gap-3" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center mt-0.5"><span className="text-emerald-400 text-xs">✓</span></span>
                                            <span className="text-purple-100/80 text-sm leading-relaxed">{finding}</span>
                                        </motion.li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>
                    )}

                    {/* Findings to Discuss */}
                    {explanation.findingsToDiscuss?.length > 0 && (
                        <motion.div variants={fadeIn} className="rounded-2xl bg-gradient-to-br from-amber-500/5 to-slate-900/50 border border-amber-500/20 overflow-hidden">
                            <div className="px-5 py-4 bg-amber-500/10 border-b border-amber-500/10">
                                <h3 className="font-bold text-amber-300 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                        </svg>
                                    </span>
                                    <span>💬 Discuss with Doctor</span>
                                </h3>
                            </div>
                            <div className="p-5 space-y-4">
                                {explanation.findingsToDiscuss.map((item, i) => (
                                    <motion.div key={i} className="p-4 rounded-xl bg-slate-800/50 border border-amber-500/10" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-white font-medium text-sm">{item.finding}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${item.importance === 'high' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : item.importance === 'medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>{item.importance}</span>
                                        </div>
                                        {item.whatItMeans && <p className="text-purple-200/60 text-sm leading-relaxed">{item.whatItMeans}</p>}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            )}

            {/* What It Means */}
            {explanation.whatItMeans && (
                <motion.div variants={fadeIn} className="rounded-2xl bg-gradient-to-br from-blue-500/5 to-slate-900/50 border border-blue-500/20 overflow-hidden">
                    <div className="px-6 py-4 bg-blue-500/10 border-b border-blue-500/10">
                        <h3 className="font-bold text-blue-300 flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </span>
                            <span>❤️ What This Means for Your Health</span>
                        </h3>
                    </div>
                    <div className="p-6">
                        <FormattedText text={explanation.whatItMeans} />
                    </div>
                </motion.div>
            )}

            {/* Next Steps */}
            {explanation.nextSteps?.length > 0 && (
                <motion.div variants={fadeIn} className="rounded-2xl bg-gradient-to-br from-purple-500/5 to-slate-900/50 border border-purple-500/20 overflow-hidden">
                    <div className="px-6 py-4 bg-purple-500/10 border-b border-purple-500/10">
                        <h3 className="font-bold text-purple-300 flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </span>
                            <span>🎯 Recommended Next Steps</span>
                        </h3>
                    </div>
                    <div className="p-6">
                        <ol className="space-y-4">
                            {explanation.nextSteps.map((step, i) => (
                                <motion.li key={i} className="flex items-start gap-4" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                                    <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/30 to-cyan-500/20 flex items-center justify-center text-white font-bold text-sm border border-purple-400/30">{i + 1}</span>
                                    <span className="text-purple-100/80 text-sm leading-relaxed pt-1">{step}</span>
                                </motion.li>
                            ))}
                        </ol>
                    </div>
                </motion.div>
            )}

            {/* Bottom Note */}
            {explanation.reassurance && (
                <motion.div variants={fadeIn} className="rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-900/50 to-cyan-500/5 border border-emerald-500/30 p-6">
                    <div className="flex items-start gap-4">
                        <span className="text-4xl">💚</span>
                        <div>
                            <h3 className="text-emerald-300 font-bold text-lg mb-2">Remember</h3>
                            <p className="text-purple-100/80 leading-relaxed">{explanation.reassurance}</p>
                        </div>
                    </div>
                </motion.div>
            )}

            <style jsx>{`
                .typing-cursor {
                    display: inline-block;
                    width: 2px;
                    height: 1.1em;
                    background-color: #a855f7;
                    animation: blink 1s step-end infinite;
                    vertical-align: middle;
                }
                @keyframes blink {
                    from, to { background-color: transparent; }
                    50% { background-color: #a855f7; }
                }
            `}</style>
        </motion.div>
    );
}

export default PatientExplanation;
