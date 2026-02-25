import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';

function FileUpload({ onFileSelect, disabled }) {
    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            onFileSelect(acceptedFiles[0]);
        }
    }, [onFileSelect]);

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/webp': ['.webp']
        },
        maxFiles: 1,
        maxSize: 10 * 1024 * 1024,
        disabled
    });

    return (
        <div className="w-full max-w-2xl mx-auto">
            <motion.div
                {...getRootProps()}
                whileHover={!disabled ? { scale: 1.01, y: -4 } : {}}
                whileTap={!disabled ? { scale: 0.99 } : {}}
                className={`
                    relative glass-card p-12 text-center cursor-pointer transition-all duration-500
                    ${isDragActive && !isDragReject ? 'border-purple-400/60 bg-purple-500/10 shadow-[0_0_60px_rgba(168,85,247,0.3)]' : ''}
                    ${isDragReject ? 'border-red-400/60 bg-red-500/10' : ''}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-[0_0_50px_rgba(168,85,247,0.2)]'}
                `}
            >
                <input {...getInputProps()} aria-label="File input" />

                {/* Decorative corner accents */}
                <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-purple-500/30 rounded-tl-3xl pointer-events-none" />
                <div className="absolute top-0 right-0 w-20 h-20 border-r-2 border-t-2 border-cyan-500/30 rounded-tr-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-20 h-20 border-l-2 border-b-2 border-cyan-500/30 rounded-bl-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-purple-500/30 rounded-br-3xl pointer-events-none" />

                {/* Animated background gradient */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 pointer-events-none" />

                {/* Icon */}
                <div className="relative mb-8">
                    <motion.div
                        className={`
                            w-24 h-24 mx-auto rounded-3xl flex items-center justify-center relative
                            ${isDragActive ? 'bg-gradient-to-br from-purple-500/30 to-cyan-500/20' : 'bg-gradient-to-br from-purple-500/10 to-cyan-500/10'}
                            transition-all duration-300 border border-purple-500/20
                        `}
                        animate={isDragActive ? {
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0]
                        } : {}}
                        transition={{ duration: 0.5 }}
                    >
                        {/* Glow effect */}
                        <div className="absolute inset-0 rounded-3xl bg-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />

                        {isDragReject ? (
                            <svg className="w-12 h-12 text-red-400 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <motion.svg
                                className="w-12 h-12 text-purple-400 relative z-10"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                animate={{ y: isDragActive ? [-2, 2, -2] : 0 }}
                                transition={{ duration: 1, repeat: isDragActive ? Infinity : 0 }}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </motion.svg>
                        )}

                        {/* Floating particles */}
                        {!isDragReject && (
                            <>
                                <motion.div
                                    className="absolute w-2 h-2 rounded-full bg-purple-400/60"
                                    animate={{
                                        y: [-10, 10, -10],
                                        x: [-5, 5, -5],
                                        opacity: [0.4, 1, 0.4]
                                    }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    style={{ top: '10%', left: '20%' }}
                                />
                                <motion.div
                                    className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400/60"
                                    animate={{
                                        y: [10, -10, 10],
                                        x: [5, -5, 5],
                                        opacity: [0.4, 1, 0.4]
                                    }}
                                    transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                                    style={{ top: '20%', right: '15%' }}
                                />
                                <motion.div
                                    className="absolute w-1 h-1 rounded-full bg-pink-400/60"
                                    animate={{
                                        y: [-8, 8, -8],
                                        opacity: [0.3, 1, 0.3]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                                    style={{ bottom: '25%', left: '30%' }}
                                />
                            </>
                        )}
                    </motion.div>
                </div>

                {/* Text */}
                <div className="relative">
                    {isDragReject ? (
                        <>
                            <h3 className="text-xl font-bold text-red-400 mb-2">Invalid File Type</h3>
                            <p className="text-red-300/70 text-sm">Please upload a PDF or image file</p>
                        </>
                    ) : isDragActive ? (
                        <>
                            <motion.h3
                                className="text-xl font-bold gradient-text mb-2"
                                animate={{ scale: [1, 1.02, 1] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                            >
                                Drop to Upload
                            </motion.h3>
                            <p className="text-purple-300/70 text-sm">Release to start AI analysis</p>
                        </>
                    ) : (
                        <>
                            <h3 className="text-2xl font-bold text-white mb-3">
                                Upload Your <span className="gradient-text">Medical Report</span>
                            </h3>
                            <p className="text-purple-200/60 text-base mb-6 max-w-md mx-auto">
                                Drag and drop your report here, or click to browse your files
                            </p>

                            {/* File type badges */}
                            <div className="flex items-center justify-center gap-3 flex-wrap">
                                {['PDF', 'JPEG', 'PNG', 'WebP'].map((type, index) => (
                                    <motion.span
                                        key={type}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="px-4 py-2 text-sm font-medium rounded-xl 
                                            bg-gradient-to-r from-purple-500/10 to-cyan-500/10
                                            border border-purple-500/20 text-purple-300
                                            hover:border-purple-400/40 hover:bg-purple-500/15
                                            transition-all duration-300"
                                    >
                                        {type}
                                    </motion.span>
                                ))}
                            </div>

                            <p className="mt-4 text-purple-400/50 text-xs">Maximum file size: 10MB</p>
                        </>
                    )}
                </div>
            </motion.div>

            {/* Supported report types */}
            <motion.div
                className="mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <p className="text-center text-purple-400/50 text-xs mb-4 uppercase tracking-wider font-semibold">
                    Supported Medical Reports
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
                    {[
                        { name: 'X-Ray', icon: '🩻' },
                        { name: 'CT Scan', icon: '🔬' },
                        { name: 'MRI', icon: '🧲' },
                        { name: 'ECG', icon: '💓' },
                        { name: 'EEG', icon: '🧠' },
                        { name: 'Ultrasound', icon: '📡' },
                        { name: 'Lab Tests', icon: '🧪' },
                        { name: 'Blood Work', icon: '🩸' },
                        { name: 'PFT', icon: '🫁' },
                        { name: 'Urine Test', icon: '🧬' },
                        { name: 'Pathology', icon: '🔬' },
                        { name: 'Radiology', icon: '☢️' }
                    ].map((type, index) => (
                        <motion.div
                            key={type.name}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 + index * 0.03 }}
                            whileHover={{ scale: 1.05, y: -2 }}
                            className="px-3 py-2.5 text-sm text-purple-300/70 bg-purple-500/5 
                                rounded-xl border border-purple-500/10 hover:border-purple-500/30
                                hover:bg-purple-500/10 transition-all duration-300 cursor-default
                                flex items-center justify-center gap-2"
                        >
                            <span className="text-base">{type.icon}</span>
                            <span className="font-medium">{type.name}</span>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Privacy note */}
            <motion.p
                className="mt-8 text-center text-sm text-purple-400/40 flex items-center justify-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Your files are processed securely and never stored permanently</span>
            </motion.p>
        </div>
    );
}

export default FileUpload;
