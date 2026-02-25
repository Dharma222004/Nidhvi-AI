import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// Components
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import ModeToggle from './components/ModeToggle';
import ResultsPanel from './components/ResultsPanel';
import DisclaimerBanner from './components/DisclaimerBanner';
import LoadingOverlay from './components/LoadingOverlay';
import TextInputModal from './components/TextInputModal';
import HospitalFinderButton from './components/HospitalFinderButton';
import QAChat from './components/QAChat';
import DownloadReport from './components/DownloadReport';

// Animation variants
const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
    }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
    }
};

function App() {
    // State
    const [mode, setMode] = useState('patient');
    const [selectedLanguage] = useState('en');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [results, setResults] = useState(null);

    const scrollPositionRef = useRef(0);

    // Stop automatic scrolling to top when results change
    // And instead restore the previous scroll position
    useEffect(() => {
        if (results) {
            window.scrollTo(0, scrollPositionRef.current);
        }
    }, [results]);
    const [uploadedFileName, setUploadedFileName] = useState('');
    // hospitalsData removed - now using on-demand search via HospitalFinderButton
    const [error, setError] = useState(null);
    const [showTextInput, setShowTextInput] = useState(false);
    const [highContrast, setHighContrast] = useState(false);
    const [fontSize, setFontSize] = useState('normal');

    // Handle file upload with enhanced analysis
    const handleFileUpload = useCallback(async (file) => {
        setIsLoading(true);
        setLoadingMessage('Uploading your report...');
        setError(null);
        setResults(null);
        // Store the original filename (without extension)
        const originalName = file.name.replace(/\.[^/.]+$/, '');
        setUploadedFileName(originalName);
        // Hospital data is now loaded on-demand via button click

        try {
            setLoadingMessage('Extracting text from report...');

            const formData = new FormData();
            formData.append('file', file);
            formData.append('mode', mode);
            formData.append('language', selectedLanguage);

            setLoadingMessage('Analyzing medical content...');

            const response = await axios.post('/api/enhanced/analyze', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                // Save current scroll position before updating UI
                scrollPositionRef.current = window.scrollY;
                setResults(response.data);
                // Hospital data will be loaded on-demand when user clicks button
                setLoadingMessage('Analysis complete!');
            } else {
                throw new Error(response.data.error || 'Analysis failed');
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to analyze report');
        } finally {
            setIsLoading(false);
        }
    }, [mode, selectedLanguage]);

    // Handle text submit
    const handleTextSubmit = useCallback(async (text) => {
        setShowTextInput(false);
        setIsLoading(true);
        setLoadingMessage('Processing your report...');
        setError(null);
        setResults(null);
        // Hospital data is now loaded on-demand via button click

        try {
            const response = await axios.post('/api/enhanced/text-analysis', {
                text,
                mode,
                language: selectedLanguage
            });

            if (response.data.success) {
                // Save current scroll position before updating UI
                scrollPositionRef.current = window.scrollY;
                setResults(response.data);
                // Text analysis may not have hospital data
            } else {
                throw new Error(response.data.error || 'Analysis failed');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to analyze report');
        } finally {
            setIsLoading(false);
        }
    }, [mode, selectedLanguage]);

    // Handle mode switch
    const handleModeSwitch = useCallback(async (newMode) => {
        setMode(newMode);

        // If we have results, we could re-analyze with new mode
        // For now, just update the mode
    }, []);

    const handleNewUpload = useCallback(() => {
        setResults(null);
        // Hospital data is now loaded on-demand
        setError(null);
    }, []);

    const toggleHighContrast = () => {
        setHighContrast(!highContrast);
        document.documentElement.classList.toggle('high-contrast');
    };

    const cycleFontSize = () => {
        const sizes = ['small', 'normal', 'large'];
        const currentIndex = sizes.indexOf(fontSize);
        setFontSize(sizes[(currentIndex + 1) % sizes.length]);
    };

    const fontSizeClass = {
        small: 'text-sm',
        normal: 'text-base',
        large: 'text-lg'
    }[fontSize];

    return (
        <div className={`min-h-screen ${fontSizeClass}`}>
            {/* Animated gradient background */}
            <div className="animated-gradient-bg" />

            {/* Loading Overlay */}
            <AnimatePresence>
                {isLoading && <LoadingOverlay message={loadingMessage} />}
            </AnimatePresence>

            {/* Text Input Modal */}
            <AnimatePresence>
                {showTextInput && (
                    <TextInputModal
                        onSubmit={handleTextSubmit}
                        onClose={() => setShowTextInput(false)}
                    />
                )}
            </AnimatePresence>

            {/* Header */}
            <Header
                highContrast={highContrast}
                onToggleContrast={toggleHighContrast}
                fontSize={fontSize}
                onCycleFontSize={cycleFontSize}
            />

            {/* Main Content */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
                {/* Disclaimer Banner */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeInUp}
                >
                    <DisclaimerBanner />
                </motion.div>

                {/* Mode Toggle */}
                <motion.div
                    className="flex justify-center mb-10"
                    initial="hidden"
                    animate="visible"
                    variants={fadeInUp}
                >
                    <ModeToggle
                        mode={mode}
                        onModeChange={handleModeSwitch}
                        disabled={isLoading}
                    />
                </motion.div>

                {/* Error Display */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-8 glass-card p-5 border-red-500/30"
                        >
                            <div className="flex items-start gap-4">
                                <div className="icon-container danger">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-red-400 font-semibold mb-1">Analysis Error</h3>
                                    <p className="text-red-300/80 text-sm">{error}</p>
                                </div>
                                <button
                                    onClick={() => setError(null)}
                                    className="text-gray-400 hover:text-white p-1 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Upload Section or Results */}
                <AnimatePresence mode="wait">
                    {!results ? (
                        <motion.div
                            key="upload"
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0, y: -20 }}
                            variants={staggerContainer}
                            className="space-y-8"
                        >
                            {/* File Upload */}
                            <motion.div variants={fadeInUp}>
                                <FileUpload
                                    onFileSelect={handleFileUpload}
                                    disabled={isLoading}
                                />
                            </motion.div>

                            {/* Text input link */}
                            <motion.div variants={fadeInUp} className="text-center">
                                <span className="text-gray-500">or</span>
                                <button
                                    onClick={() => setShowTextInput(true)}
                                    className="ml-2 text-primary-400 hover:text-primary-300 font-medium transition-colors"
                                    disabled={isLoading}
                                >
                                    paste report text directly
                                </button>
                            </motion.div>

                            {/* Sample Reports */}
                            <motion.div variants={fadeInUp} className="pt-12">
                                <div className="text-center mb-10">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full 
                                            bg-purple-500/10 border border-purple-500/20 mb-4"
                                    >
                                        <span className="text-lg">🧪</span>
                                        <span className="text-sm font-medium text-purple-300">Demo Mode</span>
                                    </motion.div>
                                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                                        Try with <span className="gradient-text">Sample Reports</span>
                                    </h2>
                                    <p className="text-purple-200/50 text-base max-w-md mx-auto">
                                        Click on any sample below to see our AI analysis in action
                                    </p>
                                </div>
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">

                                    <SampleReportCard
                                        type="radiology"
                                        title="Ultrasound (USG)"
                                        description="Abdominal ultrasound scan"
                                        icon="📡"
                                        onClick={() => handleTextSubmit(SAMPLE_REPORTS.ultrasound)}
                                        disabled={isLoading}
                                    />
                                    <SampleReportCard
                                        type="radiology"
                                        title="X-Ray"
                                        description="Chest X-Ray radiograph"
                                        icon="🩻"
                                        onClick={() => handleTextSubmit(SAMPLE_REPORTS.chestXray)}
                                        disabled={isLoading}
                                    />
                                    <SampleReportCard
                                        type="radiology"
                                        title="CT Scan"
                                        description="CT Abdomen with contrast"
                                        icon="🔬"
                                        onClick={() => handleTextSubmit(SAMPLE_REPORTS.ctAbdomen)}
                                        disabled={isLoading}
                                    />
                                    <SampleReportCard
                                        type="radiology"
                                        title="MRI Scan"
                                        description="Brain MRI with findings"
                                        icon="🧲"
                                        onClick={() => handleTextSubmit(SAMPLE_REPORTS.mri)}
                                        disabled={isLoading}
                                    />
                                    <SampleReportCard
                                        type="cardiology"
                                        title="ECG / EKG"
                                        description="Electrocardiogram report"
                                        icon="💓"
                                        onClick={() => handleTextSubmit(SAMPLE_REPORTS.ecg)}
                                        disabled={isLoading}
                                    />
                                    <SampleReportCard
                                        type="cardiology"
                                        title="2D ECHO"
                                        description="Echocardiography report"
                                        icon="❤️"
                                        onClick={() => handleTextSubmit(SAMPLE_REPORTS.echo)}
                                        disabled={isLoading}
                                    />
                                    <SampleReportCard
                                        type="radiology"
                                        title="Mammography"
                                        description="Breast screening scan"
                                        icon="🎀"
                                        onClick={() => handleTextSubmit(SAMPLE_REPORTS.mammography)}
                                        disabled={isLoading}
                                    />
                                    <SampleReportCard
                                        type="radiology"
                                        title="DEXA Scan"
                                        description="Bone density test"
                                        icon="🦴"
                                        onClick={() => handleTextSubmit(SAMPLE_REPORTS.dexa)}
                                        disabled={isLoading}
                                    />
                                    <SampleReportCard
                                        type="cardiology"
                                        title="TMT / Stress Test"
                                        description="Treadmill stress test"
                                        icon="🏃"
                                        onClick={() => handleTextSubmit(SAMPLE_REPORTS.tmt)}
                                        disabled={isLoading}
                                    />
                                    <SampleReportCard
                                        type="radiology"
                                        title="PET Scan"
                                        description="Positron emission tomography"
                                        icon="☢️"
                                        onClick={() => handleTextSubmit(SAMPLE_REPORTS.pet)}
                                        disabled={isLoading}
                                    />
                                    <SampleReportCard
                                        type="neurology"
                                        title="EEG"
                                        description="Electroencephalogram"
                                        icon="🧠"
                                        onClick={() => handleTextSubmit(SAMPLE_REPORTS.eeg)}
                                        disabled={isLoading}
                                    />
                                    <SampleReportCard
                                        type="pulmonology"
                                        title="PFT"
                                        description="Pulmonary function test"
                                        icon="🫁"
                                        onClick={() => handleTextSubmit(SAMPLE_REPORTS.pft)}
                                        disabled={isLoading}
                                    />
                                </div>
                            </motion.div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="results"
                            initial="hidden"
                            animate="visible"
                            variants={scaleIn}
                            className="space-y-6"
                        >
                            {/* Results Panel */}
                            <ResultsPanel
                                results={results}
                                mode={mode}
                                onNewUpload={handleNewUpload}
                            />

                            {/* Hospital Finder - On-Demand Button */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <HospitalFinderButton
                                    analysisData={results}
                                    reportText={results?.extraction?.rawText || ''}
                                />
                            </motion.div>

                            {/* Download Report Button */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <DownloadReport
                                    reportData={results}
                                    language={selectedLanguage}
                                    fileName={uploadedFileName}
                                />
                            </motion.div>

                            {/* Q&A Chat Section */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <QAChat
                                    analysisContext={results}
                                    language={selectedLanguage}
                                />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Footer */}
            <footer className="relative mt-20 border-t border-purple-500/10 overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/10 to-transparent pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-12"
                >
                    {/* Logo and tagline */}
                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold mb-2">
                            <span className="gradient-text">Nidhvi</span>
                            <span className="text-white/80"> AI</span>
                        </h3>
                        <p className="text-purple-300/50 text-sm max-w-md mx-auto">
                            Empowering healthcare understanding through intelligent AI analysis
                        </p>
                    </div>

                    {/* Disclaimer */}
                    <div className="text-center space-y-2">
                        <p className="text-purple-400/40 text-xs flex items-center justify-center gap-2">
                            <span>⚕️</span>
                            <span>For educational purposes only • Not a substitute for professional medical advice</span>
                        </p>
                        <p className="text-purple-500/30 text-xs">
                            © 2026 Nidhvi AI. Built with 💜 for better healthcare understanding.
                        </p>
                    </div>
                </motion.div>
            </footer>
        </div>
    );
}

// Sample Report Card Component
function SampleReportCard({ type, title, description, icon, onClick, disabled }) {
    const getTypeStyles = () => {
        switch (type) {
            case 'radiology':
                return {
                    gradient: 'from-blue-500/20 to-cyan-500/10',
                    text: 'text-cyan-300',
                    border: 'border-cyan-500/30',
                    glow: 'group-hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]',
                    iconBg: 'bg-cyan-500/20'
                };
            case 'cardiology':
                return {
                    gradient: 'from-rose-500/20 to-pink-500/10',
                    text: 'text-rose-300',
                    border: 'border-rose-500/30',
                    glow: 'group-hover:shadow-[0_0_30px_rgba(244,63,94,0.2)]',
                    iconBg: 'bg-rose-500/20'
                };
            case 'lab':
            default:
                return {
                    gradient: 'from-emerald-500/20 to-green-500/10',
                    text: 'text-emerald-300',
                    border: 'border-emerald-500/30',
                    glow: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]',
                    iconBg: 'bg-emerald-500/20'
                };
        }
    };

    const styles = getTypeStyles();
    const typeLabel = type === 'cardiology' ? 'Cardiology' : type === 'radiology' ? 'Radiology' : 'Laboratory';

    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className={`
                group w-full text-left p-5 rounded-2xl transition-all duration-300
                bg-gradient-to-br ${styles.gradient}
                border ${styles.border}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${styles.glow}
                hover:border-opacity-60
            `}
        >
            <div className="flex items-start gap-4">
                {/* Icon with background */}
                <motion.div
                    className={`w-12 h-12 rounded-xl ${styles.iconBg} flex items-center justify-center
                        border border-white/10 group-hover:scale-110 transition-transform duration-300`}
                >
                    <span className="text-2xl">{icon}</span>
                </motion.div>

                <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-base mb-1 truncate group-hover:text-white/90 transition-colors">
                        {title}
                    </h3>
                    <p className="text-purple-200/50 text-sm truncate mb-3">{description}</p>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full 
                        ${styles.iconBg} ${styles.text} border ${styles.border}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        {typeLabel}
                    </span>
                </div>

                {/* Arrow indicator */}
                <motion.div
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    initial={{ x: -5 }}
                    whileHover={{ x: 0 }}
                >
                    <svg className={`w-5 h-5 ${styles.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </motion.div>
            </div>
        </motion.button>
    );
}

// Sample reports data
const SAMPLE_REPORTS = {
    ultrasound: `ULTRASOUND SCAN (USG) ABDOMEN

CLINICAL INDICATION: Abdominal pain, rule out gallstones

TECHNIQUE: Real-time ultrasound examination of the abdomen was performed using a curvilinear transducer.

FINDINGS:

LIVER:
- Size: Normal (15.2 cm in midclavicular line)
- Echotexture: Homogeneous, normal
- No focal lesions identified
- Portal vein patent, normal caliber

GALLBLADDER:
- Well distended, wall thickness 3mm (normal <3mm)
- Multiple hyperechoic foci with posterior acoustic shadowing noted
- Largest stone measures 8mm
- No pericholecystic fluid

COMMON BILE DUCT: 4mm (normal <6mm)

PANCREAS: Visualized portions appear normal

SPLEEN: Normal size (10cm), homogeneous echotexture

RIGHT KIDNEY: 10.5 x 4.8 cm, normal cortical thickness, no hydronephrosis
LEFT KIDNEY: 10.8 x 4.5 cm, normal cortical thickness, no hydronephrosis

AORTA: Normal caliber, no aneurysm

IMPRESSION:
1. CHOLELITHIASIS (gallstones) - multiple small stones identified
2. No signs of acute cholecystitis
3. Liver, kidneys, spleen, and pancreas appear normal

Reported by: Dr. Priya Sharma, MD
Radiology Department
Date: January 15, 2026`,

    chestXray: `CHEST X-RAY (PA AND LATERAL)

CLINICAL INDICATION: Routine pre-operative evaluation

TECHNIQUE: PA and lateral chest radiographs were obtained.

COMPARISON: None available

FINDINGS:
- Heart size: Normal cardiothoracic ratio (0.45)
- Lungs: Clear bilaterally. No consolidation, masses, or nodules identified.
- Pleural spaces: No pleural effusion or pneumothorax.
- Mediastinum: Unremarkable. Trachea is midline.
- Osseous structures: No acute osseous abnormality. Mild degenerative changes in thoracic spine.
- Diaphragm: Normal position bilaterally.

IMPRESSION:
1. Normal chest radiograph.
2. No acute cardiopulmonary findings.
3. Mild degenerative changes in thoracic spine, likely age-related.

Reported by: Dr. Sarah Johnson, MD
Date: January 8, 2026`,

    ctAbdomen: `CT ABDOMEN AND PELVIS WITH CONTRAST

CLINICAL INDICATION: Right lower quadrant pain, fever. Rule out appendicitis.

TECHNIQUE: Axial CT images of the abdomen and pelvis were obtained following administration of oral and IV contrast.

COMPARISON: No prior studies available.

FINDINGS:

APPENDIX: 
- The appendix measures 12mm in diameter (normal <6mm) - ABNORMAL
- Wall thickening and enhancement present
- Periappendiceal fat stranding noted
- No extraluminal air or abscess identified
- Small amount of free fluid in the right lower quadrant

BOWEL:
- No small bowel obstruction
- Colon is unremarkable

SOLID ORGANS:
- Liver: Normal size and attenuation. No focal lesions.
- Gallbladder: Normal, no stones.
- Pancreas: Unremarkable
- Spleen: Normal
- Kidneys: Normal bilaterally. No hydronephrosis.
- Adrenal glands: Normal

VASCULATURE: Patent major vessels. No aneurysm.

LYMPH NODES: Scattered small mesenteric lymph nodes, likely reactive.

PELVIS: Urinary bladder is unremarkable. No pelvic free fluid.

OSSEOUS STRUCTURES: No acute osseous abnormality.

IMPRESSION:
1. ACUTE UNCOMPLICATED APPENDICITIS - surgical consultation recommended
2. Small amount of reactive free fluid in right lower quadrant
3. Reactive mesenteric lymphadenopathy
4. No evidence of perforation or abscess formation

CRITICAL VALUE NOTIFICATION: Findings communicated to ordering physician Dr. Smith at 14:32pm.

Reported by: Dr. Michael Chen, MD
Radiology Department`,

    mri: `MRI BRAIN WITH AND WITHOUT CONTRAST

CLINICAL INDICATION: Chronic headaches, rule out intracranial pathology

TECHNIQUE: Multiplanar MRI of the brain was performed using T1, T2, FLAIR, DWI, and post-contrast T1 sequences at 3.0 Tesla.

COMPARISON: None available

FINDINGS:

BRAIN PARENCHYMA:
- No acute infarct on diffusion-weighted imaging
- No intracranial hemorrhage
- Gray-white matter differentiation preserved
- Ventricles and sulci are normal in size and configuration
- No midline shift

WHITE MATTER:
- Few scattered punctate T2/FLAIR hyperintensities in periventricular and subcortical white matter
- Likely represent small vessel ischemic changes or normal variants for age

SELLAR/PARASELLAR REGION: Normal pituitary gland

POSTERIOR FOSSA: Cerebellum and brainstem are normal

EXTRA-AXIAL SPACES: No subdural or epidural collections

CONTRAST ENHANCEMENT: No abnormal enhancement noted

CALVARIUM: Normal

IMPRESSION:
1. No acute intracranial abnormality
2. No mass, hemorrhage, or acute infarct identified
3. Few nonspecific white matter T2 hyperintensities - likely age-related small vessel changes
4. Consider clinical correlation for headache etiology

Reported by: Dr. Arun Kumar, MD
Neuroradiology Department
Date: January 16, 2026`,

    ecg: `ELECTROCARDIOGRAM (ECG/EKG) REPORT

CLINICAL INDICATION: Routine cardiac evaluation, palpitations

DATE/TIME: January 17, 2026, 10:30 AM

TECHNICAL DATA:
- Paper speed: 25 mm/sec
- Gain: 10 mm/mV
- Limb leads: Standard 12-lead ECG

MEASUREMENTS:
- Heart Rate: 78 bpm (Regular)
- PR Interval: 160 ms (Normal: 120-200 ms)
- QRS Duration: 88 ms (Normal: <120 ms)
- QT/QTc Interval: 380/420 ms (Normal)
- Axis: +45 degrees (Normal)

RHYTHM ANALYSIS:
- Sinus rhythm
- Regular rate and rhythm
- Normal P wave morphology (upright in leads I, II, aVF)

WAVEFORM ANALYSIS:
- P waves: Normal morphology, consistent
- QRS complexes: Normal amplitude and duration
- ST segments: No elevation or depression
- T waves: Upright in all leads except aVR
- No Q waves suggestive of prior MI

INTERPRETATION:
1. Normal sinus rhythm at 78 bpm
2. Normal ECG
3. No evidence of ischemia, infarction, or arrhythmia
4. No significant conduction abnormalities

COMPARISON: No prior ECG available

Interpreted by: Dr. Rajesh Patel, MD, FACC
Cardiology Department`,

    echo: `2D ECHOCARDIOGRAPHY (ECHO) REPORT

CLINICAL INDICATION: Evaluation of cardiac function, shortness of breath

DATE: January 17, 2026

TECHNIQUE: Complete 2D, M-mode, and Doppler echocardiographic examination was performed.

FINDINGS:

LEFT VENTRICLE:
- LV End-Diastolic Diameter: 48 mm (Normal: 39-53 mm)
- LV End-Systolic Diameter: 32 mm
- Interventricular Septum: 9 mm (Normal: 6-11 mm)
- Posterior Wall: 9 mm (Normal: 6-11 mm)
- LV Ejection Fraction (EF): 55-60% (Normal: >55%)
- No regional wall motion abnormalities
- Normal LV systolic function

LEFT ATRIUM:
- LA Diameter: 36 mm (Normal: <40 mm)
- No left atrial enlargement

RIGHT HEART:
- Right ventricle normal in size and function
- Right atrium normal
- TAPSE: 22 mm (Normal: >16 mm)

VALVES:
- Mitral Valve: Normal structure, trace regurgitation (physiologic)
- Aortic Valve: Trileaflet, opens well, no stenosis, trace regurgitation
- Tricuspid Valve: Normal, mild regurgitation
- Pulmonary Valve: Normal

PERICARDIUM: No pericardial effusion

DOPPLER FINDINGS:
- E/A ratio: 1.2 (Normal diastolic function)
- Estimated RVSP: 28 mmHg (Normal)

IMPRESSION:
1. Normal left ventricular size and systolic function (EF 55-60%)
2. Normal diastolic function
3. No significant valvular abnormalities
4. No pericardial effusion
5. Normal study

Reported by: Dr. Sunita Gupta, MD, DM Cardiology`,

    mammography: `DIGITAL MAMMOGRAPHY REPORT

CLINICAL INDICATION: Routine screening mammogram

DATE: January 18, 2026

COMPARISON: Prior mammogram dated January 2025

TECHNIQUE: Full-field digital mammography including craniocaudal (CC) and mediolateral oblique (MLO) views of both breasts.

BREAST COMPOSITION: Scattered areas of fibroglandular density (Category B)

FINDINGS:

RIGHT BREAST:
- No suspicious masses or architectural distortion
- No suspicious microcalcifications
- No skin thickening or nipple retraction
- Axillary lymph nodes appear normal
- Stable benign-appearing calcifications in upper outer quadrant

LEFT BREAST:
- No suspicious masses or architectural distortion
- No suspicious microcalcifications
- No skin thickening or nipple retraction
- Axillary lymph nodes appear normal
- Unchanged from prior examination

IMPRESSION:
1. Negative mammogram - No evidence of malignancy
2. Stable bilateral breast tissue
3. BI-RADS Category 1: Negative

RECOMMENDATION:
Continue routine screening mammography annually.

Reported by: Dr. Meena Krishnan, MD
Breast Imaging Department`,

    dexa: `DEXA SCAN (BONE MINERAL DENSITY) REPORT

CLINICAL INDICATION: Postmenopausal female, risk assessment for osteoporosis

DATE: January 18, 2026

TECHNIQUE: Dual-energy X-ray absorptiometry (DXA) of the lumbar spine and bilateral proximal femora.

COMPARISON: No prior DEXA scan available

PATIENT DATA:
- Age: 58 years
- Sex: Female
- Height: 162 cm
- Weight: 65 kg

RESULTS:

LUMBAR SPINE (L1-L4):
- BMD: 0.892 g/cm²
- T-score: -1.8
- Z-score: -0.5

LEFT FEMORAL NECK:
- BMD: 0.756 g/cm²
- T-score: -1.6
- Z-score: -0.3

LEFT TOTAL HIP:
- BMD: 0.845 g/cm²
- T-score: -1.2
- Z-score: -0.1

RIGHT FEMORAL NECK:
- BMD: 0.768 g/cm²
- T-score: -1.5
- Z-score: -0.2

INTERPRETATION:
According to WHO criteria:
- T-score ≥ -1.0: Normal
- T-score -1.0 to -2.5: Osteopenia (low bone mass)
- T-score ≤ -2.5: Osteoporosis

IMPRESSION:
1. OSTEOPENIA at lumbar spine and bilateral hips
2. Lowest T-score: -1.8 (Lumbar Spine)
3. 10-year FRAX fracture risk should be calculated

RECOMMENDATIONS:
1. Calcium and Vitamin D supplementation
2. Weight-bearing exercise
3. Fall prevention measures
4. Consider pharmacological therapy based on FRAX score
5. Follow-up DEXA in 2 years

Reported by: Dr. Anil Mehta, MD
Nuclear Medicine Department`,

    tmt: `TREADMILL TEST (TMT) / EXERCISE STRESS TEST REPORT

CLINICAL INDICATION: Chest pain on exertion, CAD risk assessment

DATE: January 18, 2026

PROTOCOL: Bruce Protocol

BASELINE DATA:
- Resting Heart Rate: 72 bpm
- Resting Blood Pressure: 128/82 mmHg
- Resting ECG: Normal sinus rhythm, no ST changes

EXERCISE DATA:
- Maximum Heart Rate Achieved: 156 bpm (96% of predicted maximum)
- Target Heart Rate: 162 bpm (100% of age-predicted)
- Maximum Blood Pressure: 168/88 mmHg
- Total Exercise Time: 9 minutes 45 seconds
- METs Achieved: 10.1 (Good exercise capacity)
- Reason for Termination: Achieved target heart rate, patient fatigue

ECG CHANGES DURING EXERCISE:
- No significant ST segment depression or elevation
- No arrhythmias noted during exercise
- Appropriate heart rate response to exercise

RECOVERY PHASE:
- Heart rate recovery at 1 minute: 24 bpm drop (Normal: >12 bpm)
- Blood pressure response: Normal decline
- No ST changes during recovery
- No arrhythmias

SYMPTOMS:
- No chest pain during test
- No shortness of breath
- Mild leg fatigue at peak exercise

INTERPRETATION:
1. NEGATIVE for exercise-induced ischemia
2. Good exercise capacity (>10 METs)
3. Normal blood pressure response
4. Normal heart rate recovery
5. No exercise-induced arrhythmias

IMPRESSION:
Clinically and electrically NEGATIVE stress test. Low probability of significant coronary artery disease.

Reported by: Dr. Vikram Singh, MD, DM Cardiology`,

    pet: `PET-CT SCAN REPORT

CLINICAL INDICATION: Staging evaluation for newly diagnosed lung carcinoma

DATE: January 18, 2026

RADIOPHARMACEUTICAL: F-18 FDG, 10 mCi IV
BLOOD GLUCOSE: 98 mg/dL (Fasting)
UPTAKE TIME: 60 minutes

TECHNIQUE: Whole body PET-CT from skull base to mid-thigh following IV administration of F-18 FDG.

FINDINGS:

PRIMARY LESION:
- Right upper lobe spiculated mass measuring 3.2 x 2.8 cm
- Maximum SUV: 12.4 (Highly FDG-avid, concerning for malignancy)
- Associated pleural thickening

LYMPH NODES:
- Right hilar lymph node: 1.8 cm, SUV 6.2 - SUSPICIOUS
- Subcarinal lymph node: 1.2 cm, SUV 4.8 - SUSPICIOUS
- Right paratracheal node: 0.9 cm, SUV 3.2 - INDETERMINATE
- No contralateral or supraclavicular lymphadenopathy

DISTANT SITES:
- Brain: No FDG-avid lesions
- Liver: Homogeneous uptake, no focal lesions
- Adrenal glands: Normal
- Bones: No suspicious osseous lesions
- No distant metastatic disease identified

OTHER FINDINGS:
- Mild diffuse FDG uptake in thyroid (correlate clinically)
- Physiologic bowel and urinary tract activity

IMPRESSION:
1. Intensely FDG-avid right upper lobe lung mass - consistent with primary malignancy
2. FDG-avid ipsilateral hilar and mediastinal lymph nodes - concerning for nodal metastases
3. No evidence of distant metastatic disease on this study
4. Clinical staging: Likely T2N2M0 (Stage IIIA) - recommend tissue confirmation of nodal disease

RECOMMENDATION:
1. EBUS/mediastinoscopy for nodal staging
2. Brain MRI for complete staging

Reported by: Dr. Neha Sharma, MD
Nuclear Medicine & PET-CT Department`,

    eeg: `ELECTROENCEPHALOGRAM (EEG) REPORT

CLINICAL INDICATION: Evaluation of suspected seizure disorder, episodes of loss of consciousness

DATE: January 19, 2026

PATIENT DATA:
- Age: 32 years
- Sex: Male
- Mental Status: Alert and cooperative

TECHNIQUE: 
- Standard 21-channel digital EEG recording
- Electrodes placed according to 10-20 International System
- Recording duration: 45 minutes
- Awake and drowsy states captured

ACTIVATION PROCEDURES:
- Hyperventilation: 3 minutes
- Photic stimulation: Performed at frequencies 1-30 Hz

FINDINGS:

BACKGROUND ACTIVITY:
- Posterior dominant rhythm: 9-10 Hz alpha activity (Normal)
- Good organization and symmetry
- Appropriate reactivity to eye opening/closing
- Normal amplitude

STATE CHANGES:
- Normal sleep transition patterns
- No abnormal slowing during drowsiness

ABNORMAL FINDINGS:
- Brief episodes of rhythmic 3-4 Hz spike-and-wave discharges
- Duration: 2-3 seconds bursts
- Generalized distribution, bilateral synchronous
- Frequency: 4-5 bursts per 10 minutes
- No clinical correlation during discharges

ACTIVATION RESPONSES:
- Hyperventilation: Elicited mild slowing (physiologic)
- Photic stimulation: Normal photic driving response
- No photoparoxysmal response

IMPRESSION:
1. ABNORMAL EEG due to:
   - Generalized spike-and-wave discharges suggestive of EPILEPTIFORM ACTIVITY
   - Pattern consistent with GENERALIZED EPILEPSY
2. No focal abnormalities detected
3. Background rhythm is normal

CLINICAL CORRELATION:
These findings are consistent with a primary generalized epilepsy syndrome. Clinical correlation with seizure semiology is recommended. Consider starting anti-epileptic medication.

Reported by: Dr. Ramesh Iyer, MD, DM Neurology
Neurophysiology Department`,

    pft: `PULMONARY FUNCTION TEST (PFT) REPORT

CLINICAL INDICATION: Chronic cough, evaluation for obstructive airway disease

DATE: January 19, 2026

PATIENT DATA:
- Age: 55 years
- Sex: Male
- Height: 170 cm
- Weight: 75 kg
- Smoking History: Ex-smoker (20 pack-years, quit 2 years ago)

QUALITY OF TEST: Good patient cooperation, acceptable reproducibility

SPIROMETRY RESULTS:

                      MEASURED    PREDICTED    % PREDICTED    INTERPRETATION
FVC (L)                3.12        3.85          81%          Mild reduction
FEV1 (L)               2.18        3.08          71%          Moderate reduction
FEV1/FVC (%)           69.9        80.0          87%          Reduced ratio
PEF (L/min)            385         450           86%          Mildly reduced

FORCED EXPIRATORY FLOW:
FEF 25-75% (L/s)       1.45        3.20          45%          Markedly reduced

POST-BRONCHODILATOR RESPONSE (After 400 mcg Salbutamol):
FVC (L)                3.28        3.85          85%          
FEV1 (L)               2.45        3.08          80%          +12% improvement
FEV1/FVC (%)           74.7        80.0          93%

BRONCHODILATOR RESPONSE: POSITIVE (12% and 270 mL improvement in FEV1)

LUNG VOLUMES (Body Plethysmography):
Total Lung Capacity    5.85 L      6.20 L        94%          Normal
Residual Volume        2.45 L      2.10 L        117%         Mildly increased
RV/TLC Ratio           41.9%       34%           --           Elevated (air trapping)

DIFFUSION CAPACITY (DLCO):
DLCO                   22.5        28.0          80%          Mildly reduced

INTERPRETATION:
1. MODERATE OBSTRUCTIVE VENTILATORY DEFECT
   - FEV1 71% of predicted
   - Reduced FEV1/FVC ratio (69.9%)
   
2. POSITIVE BRONCHODILATOR RESPONSE
   - 12% improvement in FEV1 post-bronchodilator
   - Suggests reversible airway obstruction
   
3. EVIDENCE OF AIR TRAPPING
   - Elevated RV/TLC ratio (41.9%)
   
4. MILDLY REDUCED DIFFUSION CAPACITY

IMPRESSION:
Findings are consistent with BRONCHIAL ASTHMA with moderate obstruction and significant reversibility. The air trapping and reduced diffusion may also suggest early COPD changes given smoking history.

RECOMMENDATIONS:
1. Initiate inhaled corticosteroid + long-acting beta-agonist therapy
2. Continue smoking cessation
3. Consider pulmonary rehabilitation
4. Repeat PFT in 3 months to assess treatment response

Reported by: Dr. Kavita Desai, MD, DM Pulmonology
Pulmonary Function Laboratory`
};

export default App;
