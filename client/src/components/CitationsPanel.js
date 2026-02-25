import React from 'react';
import { motion } from 'framer-motion';

const fadeIn = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
};

function CitationsPanel({ citations, terminologyCodes }) {
    return (
        <motion.div
            className="space-y-6"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
            {/* Citations */}
            {citations?.length > 0 && (
                <motion.div variants={fadeIn} className="glass-card p-6">
                    <h3 className="section-title">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        References & Citations
                    </h3>
                    <div className="space-y-3">
                        {citations.map((citation, index) => (
                            <motion.div
                                key={citation.id || index}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className="finding-card group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="badge badge-info text-xs">{citation.type || 'reference'}</span>
                                            <span className="text-gray-500 text-xs">{citation.source}</span>
                                        </div>
                                        <h4 className="text-gray-200 font-medium text-sm mb-1">{citation.title}</h4>
                                        <p className="text-gray-500 text-xs">{citation.relevance}</p>
                                        {citation.url && (
                                            <a
                                                href={citation.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 mt-2 text-primary-400 hover:text-primary-300 text-xs transition-colors"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                                View Source
                                            </a>
                                        )}
                                    </div>
                                    {citation.accessDate && (
                                        <span className="text-gray-600 text-xs flex-shrink-0">{citation.accessDate}</span>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Terminology Codes */}
            {terminologyCodes?.length > 0 && (
                <motion.div variants={fadeIn} className="glass-card p-6">
                    <h3 className="section-title">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Medical Terminology Codes
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Term</th>
                                    <th>Code</th>
                                    <th>System</th>
                                </tr>
                            </thead>
                            <tbody>
                                {terminologyCodes.map((tc, index) => (
                                    <tr key={index}>
                                        <td className="text-gray-300">{tc.term}</td>
                                        <td className="font-mono text-primary-400">{tc.code}</td>
                                        <td>
                                            <span className="badge badge-info text-xs">{tc.system}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* Information about sources */}
            <motion.div variants={fadeIn} className="glass-card p-6 border-gray-800">
                <h3 className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-4">
                    About These Sources
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {SOURCES.map((source) => (
                        <a
                            key={source.name}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="finding-card group p-3"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-gray-200 font-medium text-sm">{source.name}</span>
                                <svg className="w-4 h-4 text-gray-600 group-hover:text-primary-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </div>
                            <p className="text-gray-500 text-xs leading-relaxed">{source.description}</p>
                        </a>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}

const SOURCES = [
    {
        name: 'RSNA',
        description: 'Radiological Society of North America',
        url: 'https://www.rsna.org'
    },
    {
        name: 'ACR',
        description: 'American College of Radiology',
        url: 'https://www.acr.org'
    },
    {
        name: 'SNOMED CT',
        description: 'Clinical terminology standard',
        url: 'https://www.snomed.org'
    },
    {
        name: 'LOINC',
        description: 'Lab test identification codes',
        url: 'https://loinc.org'
    },
    {
        name: 'NIH/PubMed',
        description: 'Medical research database',
        url: 'https://pubmed.ncbi.nlm.nih.gov'
    },
    {
        name: 'CDC',
        description: 'Public health guidelines',
        url: 'https://www.cdc.gov'
    }
];

export default CitationsPanel;
