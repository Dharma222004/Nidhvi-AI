/**
 * Hospital & Doctor Finder Service
 * Uses Gemini API to find nearby hospitals and specialists
 * Returns properly structured data with contact details
 */

const { findHospitalsWithGemini } = require('./geminiService');

/**
 * Extract location from medical report text (smart multi-pass extraction)
 */
function extractLocationFromReport(reportText) {
    if (!reportText) return null;

    const text = reportText;
    const textLower = text.toLowerCase();

    // ── Pass 1: Scan/Lab/Diagnostic center header with address ──
    const centerHeaderPatterns = [
        /(?:scan\s*center|diagnostic\s*center|imaging\s*center|pathology\s*lab|laboratory|medical\s*center|radiology\s*center)[^\n]*\n([^\n]+(?:,\s*[^\n]+){1,3})/gi,
        /(?:centre|center|lab|laboratory|clinic|hospital)\s*[:–-]\s*([^\n,]+(?:,\s*[^\n,]+){1,4})/gi,
        /(?:address|addr\.?)\s*[:–-]\s*([^\n]+(?:\n[^\n]+){0,2})/gi,
    ];

    for (const pattern of centerHeaderPatterns) {
        const match = pattern.exec(text);
        if (match && match[1] && match[1].trim().length > 10) {
            const addr = match[1].trim().replace(/\n/g, ', ');
            const pinMatch = addr.match(/\b(\d{6})\b/);
            const cityFromAddr = extractCityFromString(addr);
            return {
                fullAddress: addr,
                city: cityFromAddr,
                pincode: pinMatch ? pinMatch[1] : null,
                type: 'center_address',
                detected: true
            };
        }
    }

    // ── Pass 2: Pincode (6-digit Indian) anywhere in text ──
    const pinMatch = text.match(/\b(\d{6})\b/);
    if (pinMatch) {
        const surroundingText = text.substring(Math.max(0, pinMatch.index - 80), pinMatch.index + 20);
        const cityFromSurround = extractCityFromString(surroundingText);
        return {
            pincode: pinMatch[1],
            city: cityFromSurround,
            type: 'pincode',
            detected: true
        };
    }

    // ── Pass 3: Major Indian cities ──
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
        'Kochi', 'Nellore', 'Bhavnagar', 'Dehradun', 'Durgapur', 'Asansol',
        'Rourkela', 'Nanded', 'Kolhapur', 'Ajmer', 'Ujjain', 'Siliguri',
        'Jhansi', 'Jammu', 'Sangli', 'Mangalore', 'Erode', 'Belgaum',
        'Tirunelveli', 'Gaya', 'Jalgaon', 'Udaipur', 'Chengalpattu',
        'Tiruvannamalai', 'Thanjavur', 'Thiruvananthapuram', 'Kurnool', 'Tirupati',
        'Pondicherry', 'Puducherry', 'Vellore', 'Trichy', 'Nagercoil', 'Cuddalore'
    ];

    for (const city of majorCities) {
        if (textLower.includes(city.toLowerCase())) {
            return { city, type: 'city', detected: true };
        }
    }

    return null;
}

/**
 * Helper: extract a known city name from an arbitrary string
 */
function extractCityFromString(str) {
    if (!str) return null;
    const strLower = str.toLowerCase();
    const cities = [
        'Chennai', 'Mumbai', 'Delhi', 'Bangalore', 'Bengaluru', 'Kolkata', 'Hyderabad',
        'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Coimbatore', 'Madurai', 'Salem',
        'Erode', 'Vellore', 'Trichy', 'Tirunelveli', 'Pondicherry', 'Kochi',
        'Thiruvananthapuram', 'Mysore', 'Mangalore', 'Chandigarh', 'Indore', 'Nagpur',
        'Bhopal', 'Surat', 'Vadodara', 'Rajkot', 'Jodhpur', 'Udaipur',
        'Patna', 'Ranchi', 'Bhubaneswar', 'Guwahati', 'Dehradun', 'Noida',
        'Gurgaon', 'Faridabad', 'Agra', 'Varanasi', 'Allahabad', 'Kanpur',
        'Amritsar', 'Ludhiana', 'Jalandhar', 'Visakhapatnam', 'Vijayawada',
        'Guntur', 'Kurnool', 'Tirupati', 'Warangal', 'Nellore', 'Nashik', 'Aurangabad'
    ];
    for (const c of cities) {
        if (strLower.includes(c.toLowerCase())) return c;
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
    // Priority: manual user input > extracted from scan center/pincode > extracted city > fallback
    const detectedCity = reportLocation?.city || null;
    const detectedPincode = reportLocation?.pincode || null;
    const detectedAddress = reportLocation?.fullAddress || null;
    const location = userLocation || detectedCity || (detectedPincode ? `pincode ${detectedPincode}` : null) || 'India';

    console.log(`Searching for ${specialistType} near "${location}" for ${condition}`);

    // Build an accurate, precision query for Gemini
    const searchQuery = buildHospitalSearchQuery({
        condition,
        specialistType,
        location,
        filterType,
        pincode: detectedPincode,
        fullAddress: detectedAddress
    });

    try {
        const searchResult = await findHospitalsWithGemini(searchQuery);

        // Parse the structured response
        const parsedResults = parseGeminiResponse(searchResult.content, filterType);

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
        console.error('Gemini search error:', error.message);

        return {
            error: `Search failed: ${error.message}`,
            location: { used: location },
            results: [],
            specialistType,
            condition
        };
    }
}

/**
 * Build a structured search query for better Gemini results
 */
function buildHospitalSearchQuery({ condition, specialistType, location, filterType, pincode, fullAddress }) {
    const hospitalType = filterType === 'govt' ? 'government' :
        filterType === 'private' ? 'private' :
            'both government and private';

    // Build location context string
    let locationContext = location;
    if (pincode && !location.includes(pincode)) {
        locationContext = `${location} (pincode: ${pincode})`;
    }
    if (fullAddress) {
        locationContext = `${location} — near "${fullAddress}"`;
    }

    return `Search for the best real hospitals and specialist doctors for a patient with "${condition}" who needs a "${specialistType}" in ${locationContext}, India.

Find ${hospitalType} hospitals. Requirements:
- The hospitals MUST be physically located IN or very near ${location}.
- Only include REAL, verifiable hospitals that you are confident exist.
- Prioritize hospitals with dedicated ${specialistType} departments.
- Prefer hospitals within 5–10 km of "${location}" if a specific area is mentioned.

For EACH hospital, provide this EXACT structured format:

HOSPITAL: [Exact legal name of the hospital]
TYPE: [Government / Private]
ADDRESS: [Full street address with area, city, and PIN code]
PHONE: [Correct working phone number(s)]
DOCTORS: [Dr. Name 1 (Specialization), Dr. Name 2 (Specialization)]
SPECIALTIES: [${specialistType} Dept, other relevant depts]
TIMING: [OPD hours or 24x7]
CONSULTATION_FEE: [Estimated fee in INR, e.g. ₹300-500 for govt, ₹700-1500 for private]
RATING: [Google/Practo rating out of 5]

List at least 5 hospitals. Start with the most reputed/closest ones. Do NOT invent details — if you are not sure about a phone number, write "Call hospital directly".`;
}


/**
 * Parse Gemini response into structured hospital data
 */
function parseGeminiResponse(content, filterType) {
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
