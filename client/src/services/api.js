import axios from 'axios';

// API base URL - uses proxy in development, full URL in production
const API_BASE = process.env.REACT_APP_API_URL || '';

// Create axios instance with defaults
const api = axios.create({
    baseURL: API_BASE,
    timeout: 180000, // 180 second (3 min) timeout for AI vision processing
    headers: {
        'Content-Type': 'application/json'
    }
});

/**
 * Analyze a medical report file
 * @param {File} file - The report file (PDF or image)
 * @param {string} mode - 'patient' or 'clinician'
 * @param {string} language - Language code (default: 'en')
 * @returns {Promise<Object>} Analysis results
 */
export async function analyzeReport(file, mode = 'patient', language = 'en') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode);
    formData.append('language', language);

    try {
        const response = await api.post('/api/analyze', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error('API Error:', error);
        throw new Error(
            error.response?.data?.error ||
            error.message ||
            'Failed to analyze report'
        );
    }
}

/**
 * Analyze report from text input
 * @param {string} reportText - The report text content
 * @param {string} mode - 'patient' or 'clinician'
 * @param {string} language - Language code (default: 'en')
 * @returns {Promise<Object>} Analysis results
 */
export async function analyzeReportText(reportText, mode = 'patient', language = 'en') {
    try {
        const response = await api.post('/api/analyze/text', {
            reportText,
            mode,
            language
        });
        return response.data;
    } catch (error) {
        console.error('API Error:', error);
        throw new Error(
            error.response?.data?.error ||
            error.message ||
            'Failed to analyze report text'
        );
    }
}

/**
 * Switch explanation mode for an existing report
 * @param {string} reportId - The report ID
 * @param {string} newMode - 'patient' or 'clinician'
 * @returns {Promise<Object>} New explanation
 */
export async function switchMode(reportId, newMode) {
    try {
        const response = await api.post('/api/analyze/switch-mode', {
            reportId,
            newMode
        });
        return response.data;
    } catch (error) {
        console.error('Mode switch error:', error);
        throw new Error(
            error.response?.data?.error ||
            'Failed to switch mode'
        );
    }
}

/**
 * Get a previously analyzed report
 * @param {string} reportId - The report ID
 * @returns {Promise<Object>} Report data
 */
export async function getReport(reportId) {
    try {
        const response = await api.get(`/api/reports/${reportId}`);
        return response.data;
    } catch (error) {
        console.error('Get report error:', error);
        throw new Error(
            error.response?.data?.error ||
            'Failed to retrieve report'
        );
    }
}

/**
 * Export report in specified format
 * @param {string} reportId - The report ID
 * @param {string} format - 'json', 'csv', or 'fhir'
 * @returns {Promise<Blob>} File blob
 */
export async function exportReport(reportId, format = 'json') {
    try {
        const response = await api.get(`/api/reports/${reportId}/export`, {
            params: { format },
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        console.error('Export error:', error);
        throw new Error('Failed to export report');
    }
}

/**
 * Check API health status
 * @returns {Promise<Object>} Health status
 */
export async function checkHealth() {
    try {
        const response = await api.get('/api/health');
        return response.data;
    } catch (error) {
        console.error('Health check error:', error);
        return { status: 'error', error: error.message };
    }
}

/**
 * List all cached reports (for demo purposes)
 * @returns {Promise<Object>} List of reports
 */
export async function listReports() {
    try {
        const response = await api.get('/api/reports');
        return response.data;
    } catch (error) {
        console.error('List reports error:', error);
        throw new Error('Failed to list reports');
    }
}

export default api;
