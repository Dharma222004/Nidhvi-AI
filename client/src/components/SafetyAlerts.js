import React from 'react';
import { motion } from 'framer-motion';

const fadeIn = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
};

function SafetyAlerts({ redFlags, safetyWarnings, needsEscalation }) {
    return (
        <div className="space-y-4">
            {/* Emergency Escalation Alert */}
            {needsEscalation && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-6 border-2 border-red-500/50 bg-red-500/10"
                    role="alert"
                    aria-live="assertive"
                >
                    <div className="flex items-start gap-4">
                        <div className="icon-container danger flex-shrink-0 pulse-alert">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-red-400 mb-2">
                                Immediate Attention May Be Required
                            </h3>
                            <p className="text-red-300/80 mb-4 text-sm">
                                This report contains findings that may require urgent medical attention.
                                Please contact your healthcare provider immediately.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <motion.a
                                    href="tel:911"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 
                           text-white font-medium px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-red-500/20"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    Call 911
                                </motion.a>
                                <button className="btn-secondary">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Find Nearby ER
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Safety Warnings */}
            {safetyWarnings?.length > 0 && (
                <div className="space-y-3">
                    {safetyWarnings.map((warning, index) => (
                        <motion.div
                            key={index}
                            variants={fadeIn}
                            initial="hidden"
                            animate="visible"
                            transition={{ delay: index * 0.1 }}
                            className={`glass-card p-4 ${warning.level === 'critical' ? 'border-red-500/30 bg-red-500/5'
                                    : warning.level === 'warning' ? 'border-amber-500/30 bg-amber-500/5'
                                        : 'border-blue-500/20'
                                }`}
                            role="alert"
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-xl" role="img" aria-hidden="true">{warning.icon}</span>
                                <div>
                                    <h4 className={`font-medium text-sm mb-0.5 ${warning.level === 'critical' ? 'text-red-400'
                                            : warning.level === 'warning' ? 'text-amber-400'
                                                : 'text-blue-400'
                                        }`}>
                                        {warning.title}
                                    </h4>
                                    <p className="text-gray-400 text-sm">{warning.message}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Red Flags List */}
            {redFlags?.length > 0 && !needsEscalation && (
                <motion.div
                    variants={fadeIn}
                    initial="hidden"
                    animate="visible"
                    className="glass-card p-6 border-orange-500/20"
                >
                    <h3 className="section-title text-orange-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                        </svg>
                        Findings Requiring Attention
                    </h3>
                    <div className="space-y-3">
                        {redFlags.map((flag, index) => (
                            <div
                                key={index}
                                className={`finding-card ${flag.urgency === 'immediate' ? 'critical' : 'warning'}`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-gray-200 text-sm font-medium">{flag.message}</span>
                                    <span className={`badge ${flag.urgency === 'immediate' ? 'badge-danger' : 'badge-warning'
                                        }`}>
                                        {flag.urgency}
                                    </span>
                                </div>
                                <p className="text-gray-400 text-sm">{flag.action}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}

export default SafetyAlerts;
