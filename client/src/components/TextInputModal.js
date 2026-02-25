import React, { useState } from 'react';
import { motion } from 'framer-motion';

function TextInputModal({ onSubmit, onClose }) {
    const [text, setText] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (text.trim().length >= 50) {
            onSubmit(text.trim());
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="glass-card w-full max-w-2xl p-6"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-white">Paste Report Text</h2>
                        <p className="text-gray-500 text-sm mt-1">Enter your medical report content below</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="CHEST X-RAY (PA AND LATERAL)&#10;&#10;FINDINGS: ...&#10;&#10;IMPRESSION: ..."
                        className="w-full h-64 input-field resize-none font-mono text-sm"
                        required
                        minLength={50}
                    />
                    <div className="flex items-center justify-between mt-3 mb-6">
                        <p className="text-xs text-gray-500">
                            {text.length} characters {text.length < 50 && <span className="text-amber-500">(min 50)</span>}
                        </p>
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Secure & private
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <motion.button
                            type="submit"
                            disabled={text.trim().length < 50}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            Analyze Report
                        </motion.button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

export default TextInputModal;
