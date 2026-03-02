/**
 * Smart Hospital Recommendation Service
 * Analyzes medical results and determines if doctor visit is needed
 */

const { findHospitalsWithGemini } = require('./geminiService');
const { generateChatCompletion, GROQ_CONFIG } = require('./groqService');

/**
 * Determine if doctor visit is needed based on analysis
 */
async function determineIfDoctorNeeded(analysis) {
    const {
        abnormalValues = [],
        severity = 'unknown',
        redFlags = [],
        possibleConditions = [],
        findings = []
    } = analysis;

    // Critical conditions that always need doctor visit
    const criticalKeywords = [
        'cancer', 'tumor', 'malignant', 'emergency', 'critical', 'severe',
        'acute', 'hemorrhage', 'infarction', 'stroke', 'infection',
        'fracture', 'rupture', 'obstruction', 'abnormal mass'
    ];

    const analysisText = JSON.stringify(analysis).toLowerCase();
    const hasCriticalCondition = criticalKeywords.some(keyword =>
        analysisText.includes(keyword)
    );

    // Determine urgency level
    let urgencyLevel = 'routine';
    let needsDoctor = false;
    let reason = '';

    if (hasCriticalCondition || severity === 'critical' || redFlags.length > 0) {
        urgencyLevel = 'urgent';
        needsDoctor = true;
        reason = 'Critical findings detected that require immediate medical attention';
    } else if (abnormalValues.length > 0 || severity === 'moderate') {
        urgencyLevel = 'soon';
        needsDoctor = true;
        reason = 'Some abnormal values detected that should be discussed with a healthcare provider';
    } else if (possibleConditions.length > 0) {
        urgencyLevel = 'routine';
        needsDoctor = true;
        reason = 'Follow-up recommended to discuss findings';
    } else {
        urgencyLevel = 'none';
        needsDoctor = false;
        reason = 'Results appear normal. Routine check-ups recommended';
    }

    return {
        needsDoctor,
        urgencyLevel, // 'urgent', 'soon', 'routine', 'none'
        reason,
        hasCriticalCondition,
        recommendation: generateRecommendation(needsDoctor, urgencyLevel, reason)
    };
}

/**
 * Generate human-readable recommendation
 */
function generateRecommendation(needsDoctor, urgencyLevel, reason) {
    if (!needsDoctor) {
        return {
            title: '✅ Great News! Everything Looks Normal',
            message: 'Your test results appear to be within normal ranges. No immediate doctor visit is required.',
            action: 'Continue with your regular health checkups and maintain a healthy lifestyle.',
            timeline: 'Routine checkup as per your doctor\'s schedule'
        };
    }

    const recommendations = {
        urgent: {
            title: '🚨 Immediate Medical Attention Required',
            message: reason,
            action: 'Please consult with a healthcare provider immediately or visit the emergency department if you are experiencing symptoms.',
            timeline: 'Within 24 hours or immediately if symptoms worsen'
        },
        soon: {
            title: '⚠️ Medical Consultation Recommended',
            message: reason,
            action: 'Schedule an appointment with your healthcare provider to discuss these findings.',
            timeline: 'Within 1-2 weeks'
        },
        routine: {
            title: '📋 Follow-up Suggested',
            message: reason,
            action: 'Consider discussing these results with your healthcare provider at your next visit.',
            timeline: 'At your next scheduled appointment or within a month'
        }
    };

    return recommendations[urgencyLevel] || recommendations.routine;
}

/**
 * Find hospitals and doctors based on condition
 */
async function findRelevantHospitalsAndDoctors(params) {
    const {
        analysis,
        location = 'India',
        condition,
        specialistType
    } = params;

    // First determine if doctor visit is actually needed
    const doctorNeeded = await determineIfDoctorNeeded(analysis);

    // If no doctor needed, return early with message
    if (!doctorNeeded.needsDoctor) {
        return {
            needsDoctor: false,
            recommendation: doctorNeeded.recommendation,
            urgencyLevel: doctorNeeded.urgencyLevel,
            reason: doctorNeeded.reason,
            hospitals: null
        };
    }

    // Doctor is needed - find appropriate hospitals
    console.log(`Finding hospitals for ${condition} near ${location}`);

    try {
        // Build smart search query
        const searchQuery = buildSmartSearchQuery({
            condition,
            specialistType,
            location,
            urgencyLevel: doctorNeeded.urgencyLevel
        });

        // Search for government hospitals
        const govtSearch = await findHospitalsWithGemini(searchQuery.government);

        // Search for private hospitals
        const privateSearch = await findHospitalsWithGemini(searchQuery.private);

        // Parse results
        const govtHospitals = parseHospitalData(govtSearch.content, 'government');
        const privateHospitals = parseHospitalData(privateSearch.content, 'private');

        return {
            needsDoctor: true,
            recommendation: doctorNeeded.recommendation,
            urgencyLevel: doctorNeeded.urgencyLevel,
            reason: doctorNeeded.reason,
            condition,
            specialistType,
            location,
            hospitals: {
                government: {
                    hospitals: govtHospitals,
                    citations: govtSearch.citations || []
                },
                private: {
                    hospitals: privateHospitals,
                    citations: privateSearch.citations || []
                }
            }
        };
    } catch (error) {
        console.error('Hospital finding error:', error);
        return {
            needsDoctor: true,
            recommendation: doctorNeeded.recommendation,
            urgencyLevel: doctorNeeded.urgencyLevel,
            reason: doctorNeeded.reason,
            hospitals: null,
            error: error.message
        };
    }
}

/**
 * Build smart search query based on condition
 */
function buildSmartSearchQuery({ condition, specialistType, location, urgencyLevel }) {
    const baseLocation = location || 'India';

    const governmentQuery = urgencyLevel === 'urgent'
        ? `Emergency government hospitals for ${condition} in ${baseLocation} with ${specialistType}. Include hospital name, address, emergency contact number, and 24/7 availability`
        : `Best government hospitals for ${condition} treatment in ${baseLocation}. Include hospital name, address, contact number, ${specialistType} availability, OPD timings`;

    const privateQuery = `Top-rated private hospitals and ${specialistType} doctors for ${condition} in ${baseLocation}. Include hospital name, doctor names, address, phone number, consultation fees, ratings, patient reviews`;

    return {
        government: governmentQuery,
        private: privateQuery
    };
}

/**
 * Parse hospital data from Gemini response
 */
function parseHospitalData(content, type) {
    const hospitals = [];

    // Split content by numbered sections or line breaks
    const sections = content.split(/\n\d+\.\s+|\n\n/).filter(s => s.trim().length > 20);

    for (const section of sections) {
        const hospital = {
            type,
            name: extractHospitalName(section),
            address: extractAddress(section),
            phone: extractPhone(section),
            doctors: extractDoctors(section),
            specialties: extractSpecialties(section),
            rating: extractRating(section),
            fees: extractFees(section),
            availability: extractAvailability(section),
            emergency: section.toLowerCase().includes('24/7') || section.toLowerCase().includes('emergency')
        };

        if (hospital.name) {
            hospitals.push(hospital);
        }
    }

    return hospitals.slice(0, 5); // Top 5 hospitals
}

/**
 * Helper extraction functions
 */
function extractHospitalName(text) {
    // Look for hospital names
    const patterns = [
        /(?:^|\n)([A-Z][A-Za-z\s&]+(?:Hospital|Medical Center|Clinic|Healthcare|Institute))/,
        /Hospital[:\s]*([A-Z][A-Za-z\s&]+)/i,
        /(?:Name|Hospital)[:\s]*([A-Z][A-Za-z\s&]+)/i
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) return match[1].trim();
    }
    return null;
}

function extractAddress(text) {
    const match = text.match(/(?:Address|Location)[:\s]*([^\n]+)/i);
    return match ? match[1].trim() : null;
}

function extractPhone(text) {
    const match = text.match(/(?:Phone|Contact|Tel|Mobile)[:\s]*([\d\s\-+()]+)/i);
    return match ? match[1].trim() : null;
}

function extractDoctors(text) {
    const doctors = [];
    const regex = /Dr\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
        if (!doctors.includes(match[1])) {
            doctors.push(match[1]);
        }
    }
    return doctors.slice(0, 3);
}

function extractSpecialties(text) {
    const specialties = [
        'Cardiologist', 'Neurologist', 'Oncologist', 'Orthopedic',
        'Pediatrician', 'Gynecologist', 'Dermatologist', 'ENT',
        'Ophthalmologist', 'Psychiatrist', 'Gastroenterologist'
    ];

    return specialties.filter(s => text.toLowerCase().includes(s.toLowerCase()));
}

function extractRating(text) {
    const match = text.match(/([\d.]+)\s*(?:\/\s*5|stars?|rating)/i);
    return match ? parseFloat(match[1]) : null;
}

function extractFees(text) {
    const match = text.match(/(?:fee|consultation|charge)[:\s]*(?:₹|Rs\.?|INR)\s*([\d,]+)/i);
    return match ? `₹${match[1]}` : null;
}

function extractAvailability(text) {
    const match = text.match(/(?:timing|hours|opd|available)[:\s]*([^\n]+)/i);
    return match ? match[1].trim() : null;
}

module.exports = {
    determineIfDoctorNeeded,
    findRelevantHospitalsAndDoctors,
    generateRecommendation
};
