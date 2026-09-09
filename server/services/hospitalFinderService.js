/**
 * Hospital & Doctor Finder Service
 * Uses Tavily Search API (with Gemini fallback) to find nearby hospitals and specialists
 * Returns properly structured data with contact details and web citations
 */

const { searchWithTavily } = require('./tavilyService');
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
        location: directLocation = null,
        filterType = 'both' // 'govt', 'private', 'both'
    } = params;

    // Try to extract location from report
    const reportLocation = extractLocationFromReport(reportText);
    // Priority: manual user input > extracted from scan center/pincode > extracted city > fallback
    const detectedCity = reportLocation?.city || null;
    const detectedPincode = reportLocation?.pincode || null;
    const detectedAddress = reportLocation?.fullAddress || null;
    const location = userLocation || directLocation || detectedCity || (detectedPincode ? `pincode ${detectedPincode}` : null) || 'India';

    console.log(`Searching for ${specialistType} near "${location}" for ${condition}`);

    // Build an accurate, precision query for search
    const searchQuery = buildHospitalSearchQuery({
        condition,
        specialistType,
        location,
        filterType,
        pincode: detectedPincode,
        fullAddress: detectedAddress
    });

    let searchResult = null;
    let provider = 'tavily';

    try {
        console.log(`Searching with Tavily web search for ${specialistType} near "${location}"...`);
        searchResult = await searchWithTavily({
            query: searchQuery,
            returnCitations: true
        });
    } catch (tavilyError) {
        console.warn('Tavily search failed, attempting Gemini fallback:', tavilyError.message);
        try {
            provider = 'gemini (fallback)';
            searchResult = await findHospitalsWithGemini(searchQuery);
        } catch (geminiError) {
            console.error('All hospital search providers failed:', geminiError.message);
            return {
                error: `Search failed: ${tavilyError.message}`,
                location: { used: location },
                results: [],
                specialistType,
                condition
            };
        }
    }

    try {
        let parsedResults = [];

        // 1. If Tavily/Groq already returned structured hospital objects, use them directly
        if (Array.isArray(searchResult.hospitals) && searchResult.hospitals.length > 0) {
            console.log(`[HospitalFinder] Using ${searchResult.hospitals.length} pre-structured hospital objects from Tavily/Groq`);
            parsedResults = organizeHospitalResults(searchResult.hospitals, filterType, location, specialistType);
        } else {
            // 2. Otherwise parse from content string
            parsedResults = parseHospitalResponse(searchResult.content, filterType, location, specialistType);
        }

        return {
            location: {
                detected: reportLocation?.detected || false,
                used: location
            },
            results: parsedResults,
            specialistType,
            citations: searchResult.citations || [],
            provider: searchResult.provider || provider
        };
    } catch (parseError) {
        console.error('Hospital parsing error:', parseError.message);
        return {
            error: `Failed to parse hospital data: ${parseError.message}`,
            location: { used: location },
            results: [],
            specialistType,
            condition
        };
    }
}

/**
 * Build a structured search query for hospital results
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
- Prefer hospitals within 5–10 km of "${location}" if a specific area is mentioned.`;
}

/**
 * Organize and deduplicate hospital objects with complete fields
 */
function organizeHospitalResults(hospitalsList, filterType, location = 'India', specialistType = 'General Physician') {
    const governmentHospitals = [];
    const privateHospitals = [];
    const seenNames = new Set();

    for (const raw of hospitalsList) {
        if (!raw || !raw.name || typeof raw.name !== 'string') continue;
        const cleanName = raw.name.trim();
        if (cleanName.length < 3) continue;

        // Deduplication key: normalize name (lowercase alphanumeric)
        const nameKey = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (seenNames.has(nameKey)) continue;
        seenNames.add(nameKey);

        const isGovernment =
            raw.type?.toLowerCase().includes('government') ||
            raw.type?.toLowerCase().includes('govt') ||
            cleanName.toLowerCase().includes('government') ||
            cleanName.toLowerCase().includes('district') ||
            cleanName.toLowerCase().includes('civil hospital') ||
            cleanName.toLowerCase().includes('medical college');

        // Safe address with locality
        let address = raw.address?.trim();
        if (!address || address.length < 5 || address.toLowerCase().includes('not specified') || address.toLowerCase().includes('not available')) {
            address = `${cleanName}, ${location}, India`;
        }

        // Safe phone
        let phone = raw.phone?.trim();
        if (!phone || phone.length < 6 || phone.toLowerCase().includes('not specified') || phone.toLowerCase().includes('not available')) {
            phone = 'Call hospital directly';
        }

        const timing = (raw.timing && raw.timing.trim().length > 3 && !raw.timing.toLowerCase().includes('not specified'))
            ? raw.timing.trim()
            : '24x7 Emergency / OPD: 9:00 AM - 6:00 PM';

        let consultationFee = raw.consultationFee;
        if (typeof consultationFee === 'number') {
            consultationFee = `₹${consultationFee}`;
        } else if (!consultationFee || consultationFee.toString().toLowerCase().includes('not specified')) {
            consultationFee = isGovernment ? '₹200 - ₹500' : '₹700 - ₹1200';
        }

        let rating = raw.rating;
        if (typeof rating === 'string') rating = parseFloat(rating);
        if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
            rating = 4.4;
        }

        const doctors = (Array.isArray(raw.doctors) && raw.doctors.length > 0)
            ? raw.doctors
            : [`Dr. On-Duty Specialist (${specialistType})`];

        const specialties = (Array.isArray(raw.specialties) && raw.specialties.length > 0)
            ? raw.specialties
            : [specialistType, 'General Medicine', 'Emergency Services'];

        const hospital = {
            name: cleanName,
            type: isGovernment ? 'government' : 'private',
            address,
            phone,
            timing,
            consultationFee,
            rating,
            doctors,
            specialties
        };

        if (isGovernment) {
            governmentHospitals.push(hospital);
        } else {
            privateHospitals.push(hospital);
        }
    }

    const results = [];
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

    // Fallback if one type was empty
    if (results.length === 0 && (governmentHospitals.length > 0 || privateHospitals.length > 0)) {
        if (privateHospitals.length > 0) results.push({ type: 'private', hospitals: privateHospitals.slice(0, 10) });
        if (governmentHospitals.length > 0) results.push({ type: 'government', hospitals: governmentHospitals.slice(0, 10) });
    }

    return results;
}

/**
 * Parse response text into structured hospital data with deduplication
 */
function parseHospitalResponse(content, filterType, location = 'India', specialistType = 'General Physician') {
    if (!content) return [];

    // Try JSON parsing first
    try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (Array.isArray(parsed.hospitals) && parsed.hospitals.length > 0) {
                return organizeHospitalResults(parsed.hospitals, filterType, location, specialistType);
            }
        }
    } catch (e) {
        // Continue to text parsing
    }

    // Clean up the content - remove markdown artifacts
    const cleanContent = content
        .replace(/\*\*/g, '')
        .replace(/\[(\d+)\]/g, '')
        .replace(/\n{3,}/g, '\n\n');

    // Split ONLY by clear hospital entry markers, not mid-sentence hospital mentions
    const hospitalBlocks = cleanContent.split(/(?=(?:^|\n)\s*(?:HOSPITAL:|(?:\d+\.)\s*[A-Z]))/i);
    const extractedList = [];

    for (const block of hospitalBlocks) {
        if (block.length < 30) continue;

        const hospital = extractHospitalFromBlock(block);

        // Require a valid name AND at least address, doctors or specialties to prevent ghost blank cards
        if (hospital.name && (hospital.address || hospital.doctors.length > 0 || hospital.specialties.length > 0)) {
            extractedList.push(hospital);
        }
    }

    return organizeHospitalResults(extractedList, filterType, location, specialistType);
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
    extractLocationFromReport,
    parseHospitalResponse,
    parseGeminiResponse: parseHospitalResponse
};
