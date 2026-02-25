/**
 * Safety Service
 * Handles disclaimers, red-flag detection, and safety warnings
 */

// Standard medical disclaimers
const DISCLAIMERS = {
    general: {
        id: 'disclaimer-general',
        title: 'Important Notice',
        text: 'This analysis is provided for educational and informational purposes only. It is NOT a medical diagnosis and should NOT be used as a substitute for professional medical advice, diagnosis, or treatment.',
        priority: 'high'
    },
    consultDoctor: {
        id: 'disclaimer-consult',
        title: 'Consult Your Healthcare Provider',
        text: 'Always seek the advice of your physician or other qualified healthcare provider with any questions you may have regarding a medical condition or test results.',
        priority: 'high'
    },
    aiLimitations: {
        id: 'disclaimer-ai',
        title: 'AI System Limitations',
        text: 'This AI system may not capture all nuances of your medical report. The analysis is based on pattern recognition and may not account for your complete medical history or individual circumstances.',
        priority: 'medium'
    },
    emergency: {
        id: 'disclaimer-emergency',
        title: 'Medical Emergency',
        text: 'If you are experiencing a medical emergency, call emergency services (911) immediately. Do not wait based on this analysis.',
        priority: 'critical'
    },
    privacy: {
        id: 'disclaimer-privacy',
        title: 'Privacy Notice',
        text: 'Your uploaded report is processed securely and is not stored permanently. We do not share your medical information with third parties. For production use, this system is designed to be HIPAA-compliant.',
        priority: 'medium'
    },
    notDiagnosis: {
        id: 'disclaimer-diagnosis',
        title: 'Not a Diagnosis',
        text: 'The findings and explanations provided by this tool do not constitute a medical diagnosis. Only a licensed healthcare provider can diagnose medical conditions.',
        priority: 'high'
    }
};

// Critical value thresholds (simplified for demo)
const CRITICAL_THRESHOLDS = {
    // Lab values
    hemoglobin: { low: 7.0, high: 20.0, unit: 'g/dL' },
    potassium: { low: 2.5, high: 6.5, unit: 'mEq/L' },
    sodium: { low: 120, high: 160, unit: 'mEq/L' },
    glucose: { low: 40, high: 500, unit: 'mg/dL' },
    creatinine: { high: 10.0, unit: 'mg/dL' },
    troponin: { high: 0.04, unit: 'ng/mL' },
    wbc: { low: 2.0, high: 30.0, unit: 'x10^9/L' },
    platelets: { low: 50, high: 1000, unit: 'x10^9/L' },
    inr: { high: 5.0, unit: '' },

    // Common terms that indicate urgency
    urgentTerms: [
        'acute', 'emergent', 'critical', 'severe', 'unstable',
        'hemorrhage', 'rupture', 'mass', 'tumor', 'malignant',
        'fracture', 'obstruction', 'infarct', 'embolism', 'dissection',
        'pneumothorax', 'effusion', 'abscess', 'sepsis'
    ]
};

/**
 * Get all applicable disclaimers
 */
function getDisclaimers(reportType, hasCriticalValues) {
    const disclaimers = [
        DISCLAIMERS.general,
        DISCLAIMERS.notDiagnosis,
        DISCLAIMERS.consultDoctor,
        DISCLAIMERS.aiLimitations,
        DISCLAIMERS.privacy
    ];

    // Add emergency disclaimer if critical values present
    if (hasCriticalValues) {
        disclaimers.unshift(DISCLAIMERS.emergency);
    }

    return disclaimers;
}

/**
 * Detect red flags in extracted data
 */
function detectRedFlags(extractedData) {
    const redFlags = [];

    // Check for critical values in measurements
    if (extractedData.measurements) {
        for (const measurement of extractedData.measurements) {
            if (measurement.status === 'critical') {
                redFlags.push({
                    type: 'critical_value',
                    item: measurement.item,
                    value: `${measurement.value} ${measurement.unit}`,
                    message: `Critical ${measurement.item} level detected`,
                    urgency: 'immediate',
                    action: 'Contact healthcare provider immediately'
                });
            }
        }
    }

    // Check for critical findings
    if (extractedData.findings) {
        for (const finding of extractedData.findings) {
            if (finding.isCritical) {
                redFlags.push({
                    type: 'critical_finding',
                    finding: finding.finding,
                    location: finding.location,
                    message: `Critical finding: ${finding.finding}`,
                    urgency: 'urgent',
                    action: 'Discuss with healthcare provider promptly'
                });
            }

            // Check for urgent terms
            const findingText = finding.finding.toLowerCase();
            for (const term of CRITICAL_THRESHOLDS.urgentTerms) {
                if (findingText.includes(term)) {
                    redFlags.push({
                        type: 'urgent_term',
                        term: term,
                        context: finding.finding,
                        message: `Report contains term requiring attention: "${term}"`,
                        urgency: 'urgent',
                        action: 'Follow up with healthcare provider'
                    });
                    break; // Only flag once per finding
                }
            }
        }
    }

    // Check explicitly flagged critical values
    if (extractedData.criticalValues && extractedData.criticalValues.length > 0) {
        for (const cv of extractedData.criticalValues) {
            redFlags.push({
                type: 'explicit_critical',
                item: cv.item,
                reason: cv.reason,
                message: cv.item,
                urgency: cv.urgency || 'urgent',
                action: 'Follow recommended action'
            });
        }
    }

    // Deduplicate by message
    const uniqueFlags = [];
    const seen = new Set();
    for (const flag of redFlags) {
        if (!seen.has(flag.message)) {
            seen.add(flag.message);
            uniqueFlags.push(flag);
        }
    }

    return uniqueFlags;
}

/**
 * Generate safety warnings based on analysis
 */
function generateSafetyWarnings(extractedData, redFlags) {
    const warnings = [];

    if (redFlags.length > 0) {
        const immediateFlags = redFlags.filter(f => f.urgency === 'immediate');
        const urgentFlags = redFlags.filter(f => f.urgency === 'urgent');

        if (immediateFlags.length > 0) {
            warnings.push({
                level: 'critical',
                title: 'Immediate Attention Required',
                message: `This report contains ${immediateFlags.length} finding(s) that may require immediate medical attention. Please contact your healthcare provider or seek emergency care if you are experiencing symptoms.`,
                icon: '🚨'
            });
        }

        if (urgentFlags.length > 0) {
            warnings.push({
                level: 'warning',
                title: 'Follow-Up Recommended',
                message: `This report contains ${urgentFlags.length} finding(s) that should be discussed with your healthcare provider soon.`,
                icon: '⚠️'
            });
        }
    }

    // General reminder
    warnings.push({
        level: 'info',
        title: 'Remember',
        message: 'This AI analysis is a tool to help you understand your report. Your healthcare provider has access to your complete medical history and can provide personalized guidance.',
        icon: 'ℹ️'
    });

    return warnings;
}

/**
 * Check if escalation is needed
 */
function needsEscalation(redFlags) {
    return redFlags.some(flag => flag.urgency === 'immediate');
}

/**
 * Get standard disclaimers (alias for backward compatibility)
 */
function getStandardDisclaimers() {
    return [
        DISCLAIMERS.general,
        DISCLAIMERS.notDiagnosis,
        DISCLAIMERS.consultDoctor,
        DISCLAIMERS.aiLimitations,
        DISCLAIMERS.privacy
    ];
}

module.exports = {
    getDisclaimers,
    getStandardDisclaimers, // Added alias
    detectRedFlags,
    generateSafetyWarnings,
    needsEscalation,
    DISCLAIMERS,
    CRITICAL_THRESHOLDS
};
