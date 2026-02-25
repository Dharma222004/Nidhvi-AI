import React from 'react';
import { motion } from 'framer-motion';

function Header({ highContrast, onToggleContrast, fontSize, onCycleFontSize, children }) {
    return (
        <header className="relative overflow-hidden border-b border-purple-500/10">
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-transparent to-cyan-500/5 pointer-events-none" />

            {/* Glowing line at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5">
                <div className="flex items-center justify-between">
                    {/* Logo and Title */}
                    <motion.div
                        className="flex items-center gap-4"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                        {/* Animated Logo */}
                        <div className="relative group">
                            {/* Glow effect */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 blur-xl opacity-50 
                                group-hover:opacity-70 transition-opacity duration-500" />

                            {/* Logo container */}
                            <motion.div
                                className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-cyan-500 
                                    flex items-center justify-center shadow-lg shadow-purple-500/30
                                    group-hover:shadow-purple-500/50 transition-all duration-300"
                                whileHover={{ scale: 1.05, rotate: 5 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {/* Heartbeat icon */}
                                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>

                                {/* Pulse animation */}
                                <motion.div
                                    className="absolute inset-0 rounded-2xl bg-white/20"
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                />
                            </motion.div>
                        </div>

                        {/* Title */}
                        <div>
                            <motion.h1
                                className="text-2xl sm:text-3xl font-bold tracking-tight"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                            >
                                <span className="gradient-text">Nidhvi</span>
                                <span className="text-white/90"> AI</span>
                            </motion.h1>
                            <motion.p
                                className="text-purple-300/60 text-sm hidden sm:block font-medium"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4, duration: 0.5 }}
                            >
                                AI-Powered Medical Report Analysis
                            </motion.p>
                        </div>
                    </motion.div>

                    {/* Controls */}
                    <motion.div
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >

                        {/* Font Size Toggle */}
                        <motion.button
                            onClick={onCycleFontSize}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 
                                border border-purple-500/20 hover:border-purple-500/40
                                text-purple-300 hover:text-purple-200
                                transition-all duration-300 group"
                            title={`Font size: ${fontSize}`}
                            aria-label="Change font size"
                        >
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M4 6h16M4 12h8m-8 6h16" />
                            </svg>
                        </motion.button>

                        {/* High Contrast Toggle */}
                        <motion.button
                            onClick={onToggleContrast}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`p-3 rounded-xl border transition-all duration-300 group
                                ${highContrast
                                    ? 'bg-gradient-to-br from-purple-500/30 to-cyan-500/30 border-purple-400/50 text-cyan-300'
                                    : 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20 hover:border-purple-500/40 text-purple-300 hover:text-purple-200'
                                }`}
                            title="Toggle high contrast"
                            aria-label={`High contrast ${highContrast ? 'on' : 'off'}`}
                        >
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        </header>
    );
}

export default Header;
