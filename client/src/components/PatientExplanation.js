import React from 'react';
import { motion } from 'framer-motion';

const stagger = {
    visible: { transition: { staggerChildren: 0.08 } }
};

const fadeIn = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
};

// Utility function to parse markdown-style text and render with proper formatting
function FormattedText({ text, className = '' }) {
    if (!text) return null;

    // Parse the text and convert markdown to React elements
    const parseMarkdown = (str) => {
        const parts = [];
        let currentIndex = 0;

        // Match **bold** and *italic* patterns
        const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
        let match;

        while ((match = regex.exec(str)) !== null) {
            // Add text before the match
            if (match.index > currentIndex) {
                parts.push(str.substring(currentIndex, match.index));
            }

            // Add the formatted text
            if (match[2]) {
                // Bold text (**text**)
                parts.push(
                    <strong key={match.index} className="text-white font-semibold">
                        {match[2]}
                    </strong>
                );
            } else if (match[3]) {
                // Italic text (*text*)
                parts.push(
                    <em key={match.index} className="text-purple-200">
                        {match[3]}
                    </em>
                );
            }

            currentIndex = match.index + match[0].length;
        }

        // Add remaining text
        if (currentIndex < str.length) {
            parts.push(str.substring(currentIndex));
        }

        return parts.length > 0 ? parts : str;
    };

    // Split by paragraphs (double newlines) and single newlines
    const paragraphs = text.split(/\n\n+/);

    return (
        <div className={`formatted-text ${className}`}>
            {paragraphs.map((paragraph, pIndex) => {
                // Check if this paragraph contains section headers (lines ending with colon)
                const lines = paragraph.split('\n');

                return (
                    <div key={pIndex} className={pIndex > 0 ? 'mt-4' : ''}>
                        {lines.map((line, lIndex) => {
                            const trimmedLine = line.trim();

                            // Skip empty lines
                            if (!trimmedLine) return null;

                            // Check if line is a section header (bold text followed by colon)
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

                            // Regular paragraph text
                            return (
                                <p key={lIndex} className={`text-purple-100/80 leading-relaxed ${lIndex > 0 ? 'mt-2' : ''}`}>
                                    {parseMarkdown(trimmedLine)}
                                </p>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}

function PatientExplanation({ explanation }) {
    if (!explanation) return null;

    return (
        <motion.div
            className="space-y-6"
            initial="hidden"
            animate="visible"
            variants={stagger}
        >
            {/* Section 1: Summary Card - Premium Design */}
            {explanation.summary && (
                <motion.div
                    variants={fadeIn}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 via-slate-900/50 to-cyan-500/5 border border-purple-500/20 p-6"
                >
                    {/* Decorative gradient orb */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl" />

                    <div className="relative flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-cyan-500/20 flex items-center justify-center border border-purple-400/20">
                            <svg className="w-6 h-6 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                <span>📋</span>
                                <span>Report Overview</span>
                            </h3>
                            <p className="text-purple-100/80 leading-relaxed text-base">{explanation.summary}</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Section 2: Detailed Explanation - Professional Layout */}
            {explanation.explanation && (
                <motion.div
                    variants={fadeIn}
                    className="rounded-2xl bg-slate-900/50 border border-purple-500/10 overflow-hidden"
                >
                    {/* Header */}
                    <div className="px-6 py-4 bg-gradient-to-r from-purple-500/10 to-transparent border-b border-purple-500/10">
                        <h3 className="text-lg font-bold text-white flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                <svg className="w-5 h-5 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </span>
                            <span>Understanding Your Results</span>
                        </h3>
                    </div>

                    {/* Content - Properly formatted */}
                    <div className="p-6">
                        <FormattedText text={explanation.explanation} />
                    </div>
                </motion.div>
            )}

            {/* Section 3: Findings Grid - Normal and Discussion */}
            {(explanation.normalFindings?.length > 0 || explanation.findingsToDiscuss?.length > 0) && (
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Normal Findings - Good News */}
                    {explanation.normalFindings?.length > 0 && (
                        <motion.div
                            variants={fadeIn}
                            className="rounded-2xl bg-gradient-to-br from-emerald-500/5 to-slate-900/50 border border-emerald-500/20 overflow-hidden"
                        >
                            <div className="px-5 py-4 bg-emerald-500/10 border-b border-emerald-500/10">
                                <h3 className="font-bold text-emerald-300 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </span>
                                    <span>✅ Good News</span>
                                </h3>
                            </div>
                            <div className="p-5">
                                <ul className="space-y-3">
                                    {explanation.normalFindings.map((finding, i) => (
                                        <motion.li
                                            key={i}
                                            className="flex items-start gap-3"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                        >
                                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center mt-0.5">
                                                <span className="text-emerald-400 text-xs">✓</span>
                                            </span>
                                            <span className="text-purple-100/80 text-sm leading-relaxed">{finding}</span>
                                        </motion.li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>
                    )}

                    {/* Findings to Discuss */}
                    {explanation.findingsToDiscuss?.length > 0 && (
                        <motion.div
                            variants={fadeIn}
                            className="rounded-2xl bg-gradient-to-br from-amber-500/5 to-slate-900/50 border border-amber-500/20 overflow-hidden"
                        >
                            <div className="px-5 py-4 bg-amber-500/10 border-b border-amber-500/10">
                                <h3 className="font-bold text-amber-300 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                        </svg>
                                    </span>
                                    <span>💬 Discuss with Doctor</span>
                                </h3>
                            </div>
                            <div className="p-5 space-y-4">
                                {explanation.findingsToDiscuss.map((item, i) => (
                                    <motion.div
                                        key={i}
                                        className="p-4 rounded-xl bg-slate-800/50 border border-amber-500/10"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-white font-medium text-sm">{item.finding}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
                                                ${item.importance === 'high'
                                                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                                    : item.importance === 'medium'
                                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                }`}>
                                                {item.importance}
                                            </span>
                                        </div>
                                        {item.whatItMeans && (
                                            <p className="text-purple-200/60 text-sm leading-relaxed">{item.whatItMeans}</p>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Section 4: What It Means for Health */}
            {explanation.whatItMeans && (
                <motion.div
                    variants={fadeIn}
                    className="rounded-2xl bg-gradient-to-br from-blue-500/5 to-slate-900/50 border border-blue-500/20 overflow-hidden"
                >
                    <div className="px-6 py-4 bg-blue-500/10 border-b border-blue-500/10">
                        <h3 className="font-bold text-blue-300 flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
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

            {/* Section 5: Next Steps - Clear numbered actions */}
            {explanation.nextSteps?.length > 0 && (
                <motion.div
                    variants={fadeIn}
                    className="rounded-2xl bg-gradient-to-br from-purple-500/5 to-slate-900/50 border border-purple-500/20 overflow-hidden"
                >
                    <div className="px-6 py-4 bg-purple-500/10 border-b border-purple-500/10">
                        <h3 className="font-bold text-purple-300 flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M9 5l7 7-7 7" />
                                </svg>
                            </span>
                            <span>🎯 Recommended Next Steps</span>
                        </h3>
                    </div>
                    <div className="p-6">
                        <ol className="space-y-4">
                            {explanation.nextSteps.map((step, i) => (
                                <motion.li
                                    key={i}
                                    className="flex items-start gap-4"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/30 to-cyan-500/20 
                                        flex items-center justify-center text-white font-bold text-sm border border-purple-400/30">
                                        {i + 1}
                                    </span>
                                    <span className="text-purple-100/80 text-sm leading-relaxed pt-1">{step}</span>
                                </motion.li>
                            ))}
                        </ol>
                    </div>
                </motion.div>
            )}

            {/* Section 6: Doctor Contact & Questions Grid */}
            {(explanation.whenToContactDoctor?.length > 0 || explanation.questionsForDoctor?.length > 0) && (
                <div className="grid md:grid-cols-2 gap-6">
                    {/* When to Contact Doctor */}
                    {explanation.whenToContactDoctor?.length > 0 && (
                        <motion.div
                            variants={fadeIn}
                            className="rounded-2xl bg-gradient-to-br from-rose-500/5 to-slate-900/50 border border-rose-500/20 overflow-hidden"
                        >
                            <div className="px-5 py-4 bg-rose-500/10 border-b border-rose-500/10">
                                <h3 className="font-bold text-rose-300 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </span>
                                    <span>⚠️ When to Call Your Doctor</span>
                                </h3>
                            </div>
                            <div className="p-5">
                                <ul className="space-y-3">
                                    {explanation.whenToContactDoctor.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center mt-0.5">
                                                <span className="text-rose-400 text-xs">!</span>
                                            </span>
                                            <span className="text-purple-100/80 text-sm leading-relaxed">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>
                    )}

                    {/* Questions for Doctor */}
                    {explanation.questionsForDoctor?.length > 0 && (
                        <motion.div
                            variants={fadeIn}
                            className="rounded-2xl bg-gradient-to-br from-cyan-500/5 to-slate-900/50 border border-cyan-500/20 overflow-hidden"
                        >
                            <div className="px-5 py-4 bg-cyan-500/10 border-b border-cyan-500/10">
                                <h3 className="font-bold text-cyan-300 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </span>
                                    <span>❓ Questions to Ask Your Doctor</span>
                                </h3>
                            </div>
                            <div className="p-5">
                                <ul className="space-y-3">
                                    {explanation.questionsForDoctor.map((question, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center mt-0.5 text-cyan-400 text-xs font-bold">
                                                ?
                                            </span>
                                            <span className="text-purple-100/80 text-sm leading-relaxed">{question}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Section 7: Reassurance - Positive closing message */}
            {explanation.reassurance && (
                <motion.div
                    variants={fadeIn}
                    className="rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-900/50 to-cyan-500/5 border border-emerald-500/30 p-6"
                >
                    <div className="flex items-start gap-4">
                        <span className="text-4xl">💚</span>
                        <div>
                            <h3 className="text-emerald-300 font-bold text-lg mb-2">Remember</h3>
                            <p className="text-purple-100/80 leading-relaxed">{explanation.reassurance}</p>
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}

export default PatientExplanation;
