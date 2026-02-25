/**
 * Hospital & Doctor Finder Service
 * Uses Perplexity API to find nearby hospitals and specialists
 * Returns properly structured data with contact details
 */

const { searchWithPerplexity } = require('./perplexityService');

/**
 * Extract location from medical report text
 */
function extractLocationFromReport(reportText) {
    if (!reportText) return null;

    // Major Indian cities to detect
    const majorCities = [
        'Mumbai', 'Delhi', 'New Delhi', 'Bangalore', 'Bengaluru', 'Chennai',
        'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow',
        'Surat', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam',
        'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad',
        'Meerut', 'Rajkot', 'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad',
        'Amritsar', 'Allahabad', 'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur',
        'Gwalior', 'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur', 'Kota',
        'Chandigarh', 'Guwahati', 'Solapur', 'Hubli', 'Mysore', 'Tiruchirappalli',
        'Bareilly', 'Aligarh', 'Tiruppur', 'Moradabad', 'Jalandhar', 'Bhubaneswar',
        'Salem', 'Warangal', 'Guntur', 'Bhiwandi', 'Saharanpur', 'Gorakhpur',
        'Bikaner', 'Amravati', 'Noida', 'Jamshedpur', 'Bhilai', 'Cuttack',
        'Firozabad', 'Kochi', 'Nellore', 'Bhavnagar', 'Dehradun', 'Durgapur',
        'Asansol', 'Rourkela', 'Nanded', 'Kolhapur', 'Ajmer', 'Akola',
        'Gulbarga', 'Jamnagar', 'Ujjain', 'Loni', 'Siliguri', 'Jhansi',
        'Ulhasnagar', 'Navi Mumbai', 'Jammu', 'Sangli', 'Mangalore', 'Erode',
        'Belgaum', 'Ambattur', 'Tirunelveli', 'Malegaon', 'Gaya', 'Jalgaon',
        'Udaipur', 'Maheshtala', 'Chengalpattu', 'Tiruvannamalai', 'Thanjavur',
        'Thiruvananthapuram', 'Kurnool', 'Tirupati', 'Pondicherry', 'Puducherry'
    ];

    const textLower = reportText.toLowerCase();

    for (const city of majorCities) {
        if (textLower.includes(city.toLowerCase())) {
            return {
                city: city,
                area: null,
                detected: true
            };
        }
    }

    // Try to find from address patterns
    const addressPatterns = [
        /(?:hospital|clinic|center|centre)[^,\n]*,\s*([A-Za-z\s]+),?\s*(?:India)?/i,
        /(?:address|location|place)[:\s]*[^,\n]*,\s*([A-Za-z\s]+)/i,
        /(?:city|district)[:\s]*([A-Za-z\s]+)/i
    ];

    for (const pattern of addressPatterns) {
        const match = reportText.match(pattern);
        if (match && match[1]) {
            const cityName = match[1].trim();
            if (cityName.length > 2 && cityName.length < 30) {
                return {
                    city: cityName,
                    area: null,
                    detected: true
                };
            }
        }
    }

    return null;
}

/**
 * Find hospitals and doctors based on condition and location
 */
async function findHospitalsAndDoctors(params) {
    const {
        condition,
        specialistType,
        reportText = '',
        userLocation = null,
        filterType = 'both' // 'govt', 'private', 'both'
    } = params;

    // Try to extract location from report
    const reportLocation = extractLocationFromReport(reportText);
    const location = userLocation || reportLocation?.city || 'India';

    console.log(`Searching for ${specialistType} near ${location} for ${condition}`);

    // Build structured search query for Perplexity
    const searchQuery = buildHospitalSearchQuery({
        condition,
        specialistType,
        location,
        filterType
    });

    try {
        const searchResult = await searchWithPerplexity({
            query: searchQuery,
            returnCitations: true,
            returnImages: false
        });

        // Parse the structured response
        const parsedResults = parsePerplexityResponse(searchResult.content, filterType);

        return {
            location: {
                detected: reportLocation?.detected || false,
                used: location
            },
            results: parsedResults,
            specialistType,
            citations: searchResult.citations || []
        };
    } catch (error) {
        console.error('Perplexity search error:', error.message);

        // Fallback to Gemini if Perplexity fails
        try {
            console.log('Falling back to Gemini for hospital search...');
            const { findHospitalsWithGemini } = require('./geminiService');

            const geminiResult = await findHospitalsWithGemini(searchQuery);
            const parsedResults = parsePerplexityResponse(geminiResult.content, filterType);

            return {
                location: {
                    detected: reportLocation?.detected || false,
                    used: location
                },
                results: parsedResults,
                specialistType,
                condition,
                citations: [],
                isFallback: true
            };
        } catch (geminiError) {
            console.error('Gemini fallback failed:', geminiError);
            return {
                error: `Search failed: ${error.message}. Fallback also failed: ${geminiError.message}`,
                location: { used: location },
                results: [],
                specialistType,
                condition
            };
        }
    }
}

/**
 * Build a structured search query for better Perplexity results
 */
function buildHospitalSearchQuery({ condition, specialistType, location, filterType }) {
    const hospitalType = filterType === 'govt' ? 'government' :
        filterType === 'private' ? 'private' :
            'government and private';

    return `I need a list of the TOP 10 real, verified, and highly-rated ${hospitalType} hospitals and specialized ${specialistType} doctors in ${location}, India, specifically for treating ${condition}.

CRITICAL INSTRUCTIONS:
1. Only include medical facilities that ACTUALLY EXIST in ${location}.
2. Provide the EXACT, full address including the pin code if possible.
3. Provide the CURRENT, WORKING phone numbers (mobile or landline).
4. List at least 2-3 specific doctors (specialists) for each facility.
5. Provide real Google/Practo ratings if you can find them.
6. Mention if the hospital has a dedicated ${specialistType} department.

For EACH facility, follow this EXACT template:

HOSPITAL: [Full Legal Name]
TYPE: [Government/Private]
ADDRESS: [Complete detailed address]
PHONE: [Active phone number(s)]
DOCTORS: [Dr. Name 1 (Specialty), Dr. Name 2 (Specialty)]
SPECIALTIES: [Department Name 1, Department Name 2]
TIMING: [Consultation hours, e.g., 24x7 or 9AM-5PM]
CONSULTATION_FEE: [Estimated INR amount]
RATING: [X.X/5 based on real reviews]

Ensure the information is as current as possible. If you are unsure of a specific detail like the fee, use an estimate like "₹500 - ₹1000".`;
}

/**
 * Parse Perplexity response into structured hospital data
 */
function parsePerplexityResponse(content, filterType) {
    const results = [];
    const governmentHospitals = [];
    const privateHospitals = [];

    if (!content) return results;

    // Clean up the content - remove markdown artifacts
    const cleanContent = content
        .replace(/\*\*/g, '')  // Remove bold markers
        .replace(/\[(\d+)\]/g, '') // Remove citation numbers
        .replace(/\n{3,}/g, '\n\n'); // Normalize line breaks

    // Split by hospital entries
    const hospitalBlocks = cleanContent.split(/(?=HOSPITAL:|(?:\d+\.)\s*(?:Hospital|Medical|[A-Z][a-z]+\s+Hospital))/i);

    for (const block of hospitalBlocks) {
        if (block.length < 30) continue;

        const hospital = extractHospitalFromBlock(block);

        if (hospital.name) {
            // Determine type
            const isGovernment =
                hospital.type?.toLowerCase().includes('government') ||
                hospital.type?.toLowerCase().includes('govt') ||
                hospital.name.toLowerCase().includes('government') ||
                hospital.name.toLowerCase().includes('district') ||
                hospital.name.toLowerCase().includes('civil') ||
                hospital.name.toLowerCase().includes('medical college');

            hospital.type = isGovernment ? 'government' : 'private';

            if (isGovernment) {
                governmentHospitals.push(hospital);
            } else {
                privateHospitals.push(hospital);
            }
        }
    }

    // Build results based on filter
    if (filterType === 'govt' || filterType === 'both') {
        if (governmentHospitals.length > 0) {
            results.push({
                type: 'government',
                hospitals: governmentHospitals.slice(0, 10)
            });
        }
    }

    if (filterType === 'private' || filterType === 'both') {
        if (privateHospitals.length > 0) {
            results.push({
                type: 'private',
                hospitals: privateHospitals.slice(0, 10)
            });
        }
    }

    return results;
}

/**
 * Extract hospital details from a text block
 */
function extractHospitalFromBlock(block) {
    const hospital = {
        name: null,
        type: null,
        address: null,
        phone: null,
        doctors: [],
        specialties: [],
        timing: null,
        consultationFee: null,
        rating: null
    };

    // Extract hospital name
    const namePatterns = [
        /HOSPITAL:\s*([^\n]+)/i,
        /^(?:\d+\.?\s*)?([A-Z][A-Za-z\s]+(?:Hospital|Medical Centre|Medical Center|Institute|Clinic))/m,
        /(?:^|\n)([A-Z][A-Za-z\s]+Hospital)/m
    ];

    for (const pattern of namePatterns) {
        const match = block.match(pattern);
        if (match && match[1]) {
            hospital.name = cleanText(match[1]);
            break;
        }
    }

    // Extract type
    const typeMatch = block.match(/TYPE:\s*([^\n]+)/i);
    if (typeMatch) {
        hospital.type = cleanText(typeMatch[1]);
    }

    // Extract address
    const addressPatterns = [
        /ADDRESS:\s*([^\n]+(?:\n(?![A-Z]+:)[^\n]+)*)/i,
        /(?:Address|Location):\s*([^\n]+)/i,
        /📍\s*([^\n]+)/
    ];

    for (const pattern of addressPatterns) {
        const match = block.match(pattern);
        if (match && match[1]) {
            hospital.address = cleanText(match[1]);
            break;
        }
    }

    // Extract phone - look for Indian phone number formats
    const phonePatterns = [
        /PHONE:\s*([\d\s\-\+\(\)]+)/i,
        /(?:Phone|Contact|Tel|Call):\s*([\d\s\-\+\(\)]+)/i,
        /(\+91[\s\-]?\d{2,5}[\s\-]?\d{6,8})/,
        /(0\d{2,4}[\s\-]?\d{6,8})/,
        /📞\s*([\d\s\-\+\(\)]+)/
    ];

    for (const pattern of phonePatterns) {
        const match = block.match(pattern);
        if (match && match[1]) {
            const phone = cleanPhone(match[1]);
            if (phone.length >= 10) {
                hospital.phone = phone;
                break;
            }
        }
    }

    // Extract doctors
    const doctorsMatch = block.match(/DOCTORS?:\s*([^\n]+(?:\n(?![A-Z]+:)[^\n]+)*)/i);
    if (doctorsMatch) {
        const doctorNames = extractDoctorNames(doctorsMatch[1]);
        hospital.doctors = doctorNames;
    } else {
        // Try to find Dr. mentions
        const drMatches = block.match(/Dr\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g);
        if (drMatches) {
            hospital.doctors = [...new Set(drMatches.map(d => d.trim()))].slice(0, 5);
        }
    }

    // Extract specialties
    const specialtiesMatch = block.match(/SPECIALT(?:Y|IES):\s*([^\n]+)/i);
    if (specialtiesMatch) {
        hospital.specialties = specialtiesMatch[1]
            .split(/[,;]/)
            .map(s => s.trim())
            .filter(s => s.length > 2);
    } else {
        hospital.specialties = extractSpecialtiesFromText(block);
    }

    // Extract timing
    const timingMatch = block.match(/(?:TIMING|Hours|OPD|Availability):\s*([^\n]+)/i);
    if (timingMatch) {
        hospital.timing = cleanText(timingMatch[1]);
    }

    // Extract consultation fee
    const feeMatch = block.match(/(?:CONSULTATION_FEE|Fee|Consultation):\s*(?:₹|Rs\.?|INR)?\s*([\d,]+)/i);
    if (feeMatch) {
        hospital.consultationFee = `₹${feeMatch[1].replace(/,/g, '')}`;
    }

    // Extract rating
    const ratingMatch = block.match(/RATING:\s*([\d.]+)/i) ||
        block.match(/([\d.]+)\s*(?:\/\s*5|stars?|rating)/i);
    if (ratingMatch) {
        const rating = parseFloat(ratingMatch[1]);
        if (rating >= 1 && rating <= 5) {
            hospital.rating = rating;
        }
    }

    return hospital;
}

/**
 * Extract doctor names from text
 */
function extractDoctorNames(text) {
    const doctors = [];

    // Match patterns like "Dr. Name" or "Dr Name"
    const patterns = [
        /Dr\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s*\([^)]+\))?)/g,
        /(?:Doctor|Specialist)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi
    ];

    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const name = `Dr. ${match[1]}`.trim();
            if (!doctors.includes(name) && name.length < 50) {
                doctors.push(name);
            }
        }
    }

    return doctors.slice(0, 5);
}

/**
 * Extract specialties from text
 */
function extractSpecialtiesFromText(text) {
    const specialties = [];
    const commonSpecialties = [
        'Cardiology', 'Cardiologist', 'Neurology', 'Neurologist',
        'Orthopedic', 'Orthopaedic', 'Pediatric', 'Paediatric',
        'Dermatology', 'Dermatologist', 'Gynecology', 'Gynaecology',
        'Oncology', 'Oncologist', 'ENT', 'Ophthalmology', 'Ophthalmologist',
        'Psychiatry', 'Psychiatrist', 'Urology', 'Urologist',
        'Radiology', 'Radiologist', 'Gastroenterology', 'Gastroenterologist',
        'Pulmonology', 'Pulmonologist', 'Nephrology', 'Nephrologist',
        'Endocrinology', 'Endocrinologist', 'Rheumatology', 'Rheumatologist',
        'General Surgery', 'General Medicine', 'Internal Medicine',
        'Emergency Medicine', 'Critical Care', 'ICU', 'Trauma'
    ];

    const textLower = text.toLowerCase();
    for (const specialty of commonSpecialties) {
        if (textLower.includes(specialty.toLowerCase())) {
            // Normalize to "-ology" form
            const normalized = specialty.replace(/ist$/i, 'y').replace(/yy$/, 'gy');
            if (!specialties.includes(normalized)) {
                specialties.push(specialty);
            }
        }
    }

    return [...new Set(specialties)].slice(0, 5);
}

/**
 * Clean and normalize text
 */
function cleanText(text) {
    if (!text) return null;
    return text
        .replace(/\*\*/g, '')
        .replace(/\[(\d+)\]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Clean and format phone number
 */
function cleanPhone(phone) {
    if (!phone) return '';
    return phone.replace(/[^\d\+\-\s]/g, '').trim();
}

module.exports = {
    findHospitalsAndDoctors,
    extractLocationFromReport
};
