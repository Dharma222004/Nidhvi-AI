import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function DisclaimerBanner() {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 relative overflow-hidden"
        >
            {/* Background gradient */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10" />

            {/* Animated border */}
            <div className="absolute inset-0 rounded-2xl border border-amber-500/20" />

            {/* Glowing accent */}
            <motion.div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gradient-to-b from-amber-400 via-orange-500 to-amber-400"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
            />

            <div className="relative p-5 pl-6">
                <div className="flex items-start gap-4">
                    {/* Icon */}
                    <motion.div
                        className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 
                            flex items-center justify-center border border-amber-500/20"
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                    >
                        <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </motion.div>

                    {/* Content */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <h3 className="text-amber-300 font-semibold text-base flex items-center gap-2">
                                <span>⚕️</span>
                                <span>Medical Disclaimer</span>
                            </h3>
                            <motion.button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-amber-400/60 hover:text-amber-300 text-xs flex items-center gap-1 transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {isExpanded ? 'Show less' : 'Learn more'}
                                <motion.svg
                                    className="w-4 h-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </motion.svg>
                            </motion.button>
                        </div>

                        <p className="text-purple-200/60 text-sm mt-2 leading-relaxed">
                            Nidhvi AI provides <strong className="text-amber-300/80">educational information only</strong>.
                            It is not a substitute for professional medical advice, diagnosis, or treatment.
                        </p>

                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-4 pt-4 border-t border-amber-500/10 space-y-3">
                                        <div className="flex items-start gap-3">
                                            <span className="text-lg">👨‍⚕️</span>
                                            <p className="text-purple-200/50 text-sm">
                                                <strong className="text-purple-200/70">Always consult</strong> a qualified healthcare
                                                professional for medical decisions.
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <span className="text-lg">🔒</span>
                                            <p className="text-purple-200/50 text-sm">
                                                <strong className="text-purple-200/70">Your privacy matters</strong> — uploaded files
                                                are processed securely and not stored permanently.
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <span className="text-lg">🤖</span>
                                            <p className="text-purple-200/50 text-sm">
                                                <strong className="text-purple-200/70">AI limitations</strong> — while our AI is trained
                                                on medical literature, it may not capture all nuances of your specific condition.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default DisclaimerBanner;
