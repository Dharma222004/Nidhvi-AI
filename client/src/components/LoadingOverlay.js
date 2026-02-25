import React from 'react';
import { motion } from 'framer-motion';

function LoadingOverlay({ message }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
                background: 'radial-gradient(ellipse at center, rgba(88, 28, 135, 0.3) 0%, rgba(12, 10, 29, 0.98) 70%)'
            }}
        >
            {/* Animated background orbs */}
            <motion.div
                className="absolute w-96 h-96 rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%)',
                    filter: 'blur(60px)'
                }}
                animate={{
                    scale: [1, 1.2, 1],
                    x: [-50, 50, -50],
                    y: [-30, 30, -30]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                className="absolute w-72 h-72 rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, transparent 70%)',
                    filter: 'blur(50px)'
                }}
                animate={{
                    scale: [1.2, 1, 1.2],
                    x: [50, -50, 50],
                    y: [30, -30, 30]
                }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            />

            <motion.div
                className="text-center relative z-10"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            >
                {/* DNA Helix Loader */}
                <div className="relative w-28 h-28 mx-auto mb-10">
                    {/* Outer glowing ring */}
                    <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{
                            background: 'conic-gradient(from 0deg, transparent, rgba(168, 85, 247, 0.5), transparent, rgba(6, 182, 212, 0.5), transparent)'
                        }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    />

                    {/* Inner circle */}
                    <div className="absolute inset-2 rounded-full bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
                        {/* Heartbeat icon */}
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1, 1.1, 1],
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                times: [0, 0.2, 0.4, 0.6, 1]
                            }}
                        >
                            <svg className="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </motion.div>
                    </div>

                    {/* Orbiting particles */}
                    {[0, 1, 2, 3].map((i) => (
                        <motion.div
                            key={i}
                            className="absolute w-3 h-3 rounded-full"
                            style={{
                                background: i % 2 === 0
                                    ? 'linear-gradient(135deg, #a855f7, #c084fc)'
                                    : 'linear-gradient(135deg, #06b6d4, #22d3ee)',
                                boxShadow: i % 2 === 0
                                    ? '0 0 15px rgba(168, 85, 247, 0.6)'
                                    : '0 0 15px rgba(6, 182, 212, 0.6)',
                                top: '50%',
                                left: '50%',
                                marginTop: '-6px',
                                marginLeft: '-6px'
                            }}
                            animate={{
                                x: [
                                    Math.cos((i * Math.PI / 2)) * 50,
                                    Math.cos((i * Math.PI / 2) + Math.PI) * 50,
                                    Math.cos((i * Math.PI / 2)) * 50
                                ],
                                y: [
                                    Math.sin((i * Math.PI / 2)) * 50,
                                    Math.sin((i * Math.PI / 2) + Math.PI) * 50,
                                    Math.sin((i * Math.PI / 2)) * 50
                                ],
                                scale: [1, 0.8, 1]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.25,
                                ease: 'easeInOut'
                            }}
                        />
                    ))}
                </div>

                {/* Text */}
                <motion.h2
                    className="text-2xl font-bold mb-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <span className="gradient-text">Analyzing Your Report</span>
                </motion.h2>

                <motion.p
                    className="text-purple-300/60 text-base max-w-sm mx-auto mb-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    {message || 'Our AI is processing your medical report...'}
                </motion.p>

                {/* Progress bar */}
                <motion.div
                    className="w-64 mx-auto h-1.5 rounded-full bg-purple-900/30 overflow-hidden"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 256 }}
                    transition={{ delay: 0.5 }}
                >
                    <motion.div
                        className="h-full rounded-full"
                        style={{
                            background: 'linear-gradient(90deg, #a855f7, #06b6d4, #a855f7)',
                            backgroundSize: '200% 100%'
                        }}
                        animate={{
                            backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'],
                            width: ['0%', '60%', '80%', '90%', '95%', '100%']
                        }}
                        transition={{
                            backgroundPosition: { duration: 2, repeat: Infinity, ease: 'linear' },
                            width: { duration: 8, ease: 'easeOut' }
                        }}
                    />
                </motion.div>

                {/* Status steps */}
                <motion.div
                    className="flex items-center justify-center gap-6 mt-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    {['Extracting', 'Analyzing', 'Generating'].map((step, i) => (
                        <motion.div
                            key={step}
                            className="flex items-center gap-2"
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.7 }}
                        >
                            <motion.div
                                className="w-2 h-2 rounded-full"
                                style={{
                                    background: i === 0 ? '#a855f7' : i === 1 ? '#06b6d4' : '#f43f5e'
                                }}
                                animate={{ scale: [1, 1.3, 1] }}
                                transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
                            />
                            <span className="text-xs text-purple-300/50">{step}</span>
                        </motion.div>
                    ))}
                </motion.div>
            </motion.div>
        </motion.div>
    );
}

export default LoadingOverlay;
