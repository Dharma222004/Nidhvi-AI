import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PatientExplanation from './PatientExplanation';
import ClinicianExplanation from './ClinicianExplanation';
import CitationsPanel from './CitationsPanel';
import SafetyAlerts from './SafetyAlerts';
import TranslateButton from './TranslateButton';

const fadeIn = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

function ResultsPanel({ results, mode, onNewUpload }) {
    const [activeTab, setActiveTab] = useState('explanation');
    const [showExportMenu, setShowExportMenu] = useState(false);

    const handleExport = async (format) => {
        try {
            const response = await fetch(`/api/reports/${results.reportId}/export?format=${format}`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report-${results.reportId}.${format === 'fhir' ? 'json' : format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (error) {
            console.error('Export failed:', error);
        }
        setShowExportMenu(false);
    };

    const tabs = [
        { id: 'explanation', label: 'Explanation', icon: '📋', description: 'Detailed analysis' },
        { id: 'findings', label: 'Findings', icon: '🔍', description: 'Key observations' },
        { id: 'citations', label: 'Citations', icon: '📚', description: 'Medical references' }
    ];

    return (
        <motion.div
            className="space-y-8"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
            {/* Professional Header Card */}
            <motion.div
                variants={fadeIn}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-500/10 via-slate-900/80 to-cyan-500/10 border border-purple-500/20"
            >
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-cyan-500/10 to-transparent rounded-full blur-3xl" />

                <div className="relative p-6 lg:p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        {/* Left side - Report info */}
                        <div className="flex items-start gap-4">
                            {/* Success checkmark icon */}
                            <motion.div
                                className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-cyan-500/20 
                                    flex items-center justify-center border border-emerald-400/30"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.2 }}
                            >
                                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </motion.div>

                            <div>
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                                        ${results.reportType === 'radiology'
                                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        }`}>
                                        {results.reportType || 'Medical Report'}
                                    </span>
                                    {results.reportSubtype && (
                                        <>
                                            <span className="w-1 h-1 rounded-full bg-purple-400/50" />
                                            <span className="text-purple-300/60 text-sm">{results.reportSubtype}</span>
                                        </>
                                    )}
                                </div>

                                <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                                    Analysis <span className="gradient-text">Complete</span> ✨
                                </h2>

                                <div className="flex items-center gap-4 text-sm">
                                    <span className="flex items-center gap-1.5 text-purple-300/50">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {results.processingTimeMs ? `${(results.processingTimeMs / 1000).toFixed(1)}s` : 'Instant'}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-purple-400/30" />
                                    <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs
                                        ${mode === 'patient'
                                            ? 'bg-purple-500/20 text-purple-300'
                                            : 'bg-cyan-500/20 text-cyan-300'
                                        }`}>
                                        {mode === 'patient' ? '👤 Patient View' : '🩺 Clinician View'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right side - Action buttons */}
                        <div className="flex items-center gap-3 no-print">
                            {/* Export dropdown */}
                            <div className="relative">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowExportMenu(!showExportMenu)}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 
                                        border border-purple-500/20 hover:border-purple-400/40 
                                        text-purple-200 text-sm font-medium transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Export
                                </motion.button>

                                <AnimatePresence>
                                    {showExportMenu && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            className="absolute right-0 mt-2 w-44 rounded-xl bg-slate-800 border border-purple-500/20 p-2 z-20 shadow-xl"
                                        >
                                            {['JSON', 'CSV', 'FHIR'].map((format) => (
                                                <button
                                                    key={format}
                                                    onClick={() => handleExport(format.toLowerCase())}
                                                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-purple-500/10 
                                                        text-purple-200 text-sm transition-colors flex items-center gap-2"
                                                >
                                                    <span className="text-purple-400">📄</span>
                                                    Export as {format}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Print button */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => window.print()}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 
                                    border border-purple-500/20 hover:border-purple-400/40 
                                    text-purple-200 text-sm font-medium transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z" />
                                </svg>
                                Print
                            </motion.button>

                            {/* New Analysis button */}
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={onNewUpload}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl 
                                    bg-gradient-to-r from-purple-500 to-cyan-500 
                                    text-white text-sm font-bold transition-all
                                    shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                New Analysis
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Safety Alerts */}
            {results.redFlags && results.redFlags.length > 0 && (
                <motion.div variants={fadeIn}>
                    <SafetyAlerts
                        redFlags={results.redFlags}
                        safetyWarnings={results.safetyWarnings}
                        needsEscalation={results.needsEscalation}
                    />
                </motion.div>
            )}

            {/* Professional Tab Navigation */}
            <motion.div variants={fadeIn} className="no-print">
                <div className="flex flex-wrap gap-3 p-1.5 rounded-2xl bg-slate-900/50 border border-purple-500/10">
                    {tabs.map((tab) => (
                        <motion.button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                                font-medium text-sm transition-all duration-300
                                ${activeTab === tab.id
                                    ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg shadow-purple-500/30'
                                    : 'text-purple-300/60 hover:text-purple-200 hover:bg-purple-500/10'
                                }`}
                        >
                            <span className="text-lg">{tab.icon}</span>
                            <span>{tab.label}</span>
                        </motion.button>
                    ))}
                </div>
            </motion.div>

            {/* Tab Content with smooth transitions */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                    {activeTab === 'explanation' && (
                        mode === 'patient'
                            ? <PatientExplanation explanation={results.explanation} />
                            : <ClinicianExplanation explanation={results.explanation} />
                    )}
                    {activeTab === 'findings' && <FindingsPanel extraction={results.extraction} />}
                    {activeTab === 'citations' && (
                        <CitationsPanel
                            citations={results.citations}
                            terminologyCodes={results.terminologyCodes}
                        />
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Translate Button */}
            <motion.div variants={fadeIn}>
                <TranslateButton analysisData={results} />
            </motion.div>

            {/* Professional Disclaimers Section */}
            <motion.div
                variants={fadeIn}
                className="rounded-2xl bg-slate-900/30 border border-purple-500/10 overflow-hidden"
            >
                <div className="px-6 py-4 bg-slate-800/30 border-b border-purple-500/10">
                    <h3 className="text-purple-300/60 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Important Disclaimers
                    </h3>
                </div>
                <div className="p-6 space-y-4">
                    {results.disclaimers?.slice(0, 3).map((disclaimer, index) => (
                        <div key={disclaimer.id || index} className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center mt-0.5">
                                <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </span>
                            <p className="text-purple-200/50 text-sm leading-relaxed">{disclaimer.text}</p>
                        </div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}

// Professional Findings Panel
function FindingsPanel({ extraction }) {
    if (!extraction) return null;

    return (
        <div className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Findings */}
                {extraction.findings?.length > 0 && (
                    <motion.div
                        className="rounded-2xl bg-slate-900/50 border border-purple-500/10 overflow-hidden"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="px-5 py-4 bg-purple-500/10 border-b border-purple-500/10">
                            <h3 className="font-bold text-purple-300 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </span>
                                <span>📋 Key Findings</span>
                            </h3>
                        </div>
                        <div className="p-5 space-y-3">
                            {extraction.findings.map((finding, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={`p-4 rounded-xl border transition-all
                                        ${finding.isCritical
                                            ? 'bg-red-500/10 border-red-500/30'
                                            : finding.severity === 'normal'
                                                ? 'bg-emerald-500/5 border-emerald-500/20'
                                                : 'bg-slate-800/50 border-purple-500/10'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="text-purple-100/80 text-sm leading-relaxed">{finding.finding}</p>
                                        <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold
                                            ${finding.isCritical
                                                ? 'bg-red-500/20 text-red-300'
                                                : finding.severity === 'normal'
                                                    ? 'bg-emerald-500/20 text-emerald-300'
                                                    : 'bg-amber-500/20 text-amber-300'
                                            }`}>
                                            {finding.isCritical ? '⚠️ Critical' : finding.severity}
                                        </span>
                                    </div>
                                    {finding.location && (
                                        <p className="text-purple-300/40 text-xs mt-2 flex items-center gap-1">
                                            <span>📍</span> {finding.location}
                                        </p>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Measurements */}
                {extraction.measurements?.length > 0 && (
                    <motion.div
                        className="rounded-2xl bg-slate-900/50 border border-purple-500/10 overflow-hidden"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="px-5 py-4 bg-cyan-500/10 border-b border-cyan-500/10">
                            <h3 className="font-bold text-cyan-300 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </span>
                                <span>📊 Measurements</span>
                            </h3>
                        </div>
                        <div className="p-5 overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs text-purple-300/50 uppercase tracking-wider">
                                        <th className="pb-3 font-semibold">Test</th>
                                        <th className="pb-3 font-semibold">Value</th>
                                        <th className="pb-3 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-purple-500/10">
                                    {extraction.measurements.map((m, i) => (
                                        <tr key={i} className="group">
                                            <td className="py-3 text-purple-100/70 text-sm">{m.item}</td>
                                            <td className="py-3 font-mono text-white text-sm">{m.value} {m.unit}</td>
                                            <td className="py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
                                                    ${m.status === 'critical' ? 'bg-red-500/20 text-red-300'
                                                        : m.status === 'high' || m.status === 'low' ? 'bg-amber-500/20 text-amber-300'
                                                            : 'bg-emerald-500/20 text-emerald-300'
                                                    }`}>
                                                    {m.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Impressions - Full width */}
            {extraction.impressions?.length > 0 && (
                <motion.div
                    className="rounded-2xl bg-slate-900/50 border border-purple-500/10 overflow-hidden"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="px-5 py-4 bg-purple-500/10 border-b border-purple-500/10">
                        <h3 className="font-bold text-purple-300 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </span>
                            <span>💡 Clinical Impressions</span>
                        </h3>
                    </div>
                    <div className="p-5">
                        <ol className="space-y-4">
                            {extraction.impressions.map((item, i) => (
                                <motion.li
                                    key={i}
                                    className="flex items-start gap-4"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + i * 0.1 }}
                                >
                                    <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/30 to-cyan-500/20 
                                        flex items-center justify-center text-white font-bold text-sm border border-purple-400/30">
                                        {i + 1}
                                    </span>
                                    <span className="text-purple-100/80 text-sm leading-relaxed pt-1">{item}</span>
                                </motion.li>
                            ))}
                        </ol>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

export default ResultsPanel;
