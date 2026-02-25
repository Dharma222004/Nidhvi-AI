/**
 * Reports Route
 * Handle retrieval and export of analyzed reports
 */

const express = require('express');
const router = express.Router();
const analyzeRoutes = require('./analyze');

/**
 * GET /api/reports/:id
 * Retrieve a previously analyzed report
 */
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const cache = analyzeRoutes.getCache();
        const report = cache.get(id);

        if (!report) {
            return res.status(404).json({
                success: false,
                error: 'Report not found. Reports are cached temporarily and may have expired.'
            });
        }

        // Remove internal fields before sending
        const { filePath, ...safeReport } = report;

        res.json({
            success: true,
            report: safeReport
        });

    } catch (error) {
        console.error('Report retrieval error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve report'
        });
    }
});

/**
 * GET /api/reports/:id/export
 * Export report in specified format
 */
router.get('/:id/export', (req, res) => {
    try {
        const { id } = req.params;
        const { format = 'json' } = req.query;

        const cache = analyzeRoutes.getCache();
        const report = cache.get(id);

        if (!report) {
            return res.status(404).json({
                success: false,
                error: 'Report not found'
            });
        }

        const { filePath, ...exportData } = report;

        switch (format.toLowerCase()) {
            case 'json':
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', `attachment; filename=report-${id}.json`);
                res.json(exportData);
                break;

            case 'csv':
                const csv = convertToCSV(exportData);
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=report-${id}.csv`);
                res.send(csv);
                break;

            case 'fhir':
                const fhir = convertToFHIR(exportData);
                res.setHeader('Content-Type', 'application/fhir+json');
                res.setHeader('Content-Disposition', `attachment; filename=report-${id}-fhir.json`);
                res.json(fhir);
                break;

            default:
                res.status(400).json({
                    success: false,
                    error: 'Invalid format. Supported: json, csv, fhir'
                });
        }

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to export report'
        });
    }
});

/**
 * Convert report to CSV format
 */
function convertToCSV(report) {
    const rows = [];

    // Header
    rows.push('Category,Item,Value,Status,Notes');

    // Report info
    rows.push(`Report Info,ID,${report.reportId},,`);
    rows.push(`Report Info,Type,${report.reportType},,`);
    rows.push(`Report Info,Subtype,${report.reportSubtype || 'N/A'},,`);
    rows.push(`Report Info,Processed At,${report.metadata?.processedAt || 'N/A'},,`);

    // Findings
    if (report.extraction?.findings) {
        report.extraction.findings.forEach((finding, i) => {
            rows.push(`Finding ${i + 1},Description,"${escapeCsv(finding.finding)}",${finding.severity || 'N/A'},${finding.location || 'N/A'}`);
        });
    }

    // Measurements
    if (report.extraction?.measurements) {
        report.extraction.measurements.forEach((m, i) => {
            rows.push(`Measurement ${i + 1},${escapeCsv(m.item)},${m.value} ${m.unit},${m.status},Ref: ${m.referenceRange || 'N/A'}`);
        });
    }

    // Red flags
    if (report.redFlags?.length > 0) {
        report.redFlags.forEach((flag, i) => {
            rows.push(`Red Flag ${i + 1},${flag.type},"${escapeCsv(flag.message)}",${flag.urgency},${flag.action}`);
        });
    }

    return rows.join('\n');
}

/**
 * Escape CSV special characters
 */
function escapeCsv(str) {
    if (!str) return '';
    return str.replace(/"/g, '""').replace(/\n/g, ' ');
}

/**
 * Convert report to FHIR DiagnosticReport format
 */
function convertToFHIR(report) {
    const fhirReport = {
        resourceType: 'DiagnosticReport',
        id: report.reportId,
        meta: {
            lastUpdated: report.metadata?.processedAt || new Date().toISOString(),
            profile: ['http://hl7.org/fhir/StructureDefinition/DiagnosticReport']
        },
        status: 'final',
        category: [{
            coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
                code: report.reportType === 'radiology' ? 'RAD' : 'LAB',
                display: report.reportType === 'radiology' ? 'Radiology' : 'Laboratory'
            }]
        }],
        code: {
            coding: [{
                system: 'http://loinc.org',
                code: report.reportType === 'radiology' ? '18748-4' : '11502-2',
                display: report.reportSubtype || 'Diagnostic Report'
            }],
            text: report.reportSubtype || 'Medical Report'
        },
        effectiveDateTime: report.extraction?.dateOfStudy || new Date().toISOString(),
        issued: report.metadata?.processedAt || new Date().toISOString(),
        conclusion: report.extraction?.impressions?.join('; ') || 'See detailed findings',
        result: [],
        presentedForm: [{
            contentType: 'application/json',
            data: Buffer.from(JSON.stringify(report.explanation)).toString('base64')
        }]
    };

    // Add observations for measurements
    if (report.extraction?.measurements) {
        report.extraction.measurements.forEach((m, i) => {
            fhirReport.result.push({
                reference: `Observation/obs-${report.reportId}-${i}`,
                display: m.item
            });
        });
    }

    // Add interpretation for critical values
    if (report.hasCriticalValues) {
        fhirReport.interpretation = [{
            coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                code: 'A',
                display: 'Abnormal'
            }]
        }];
    }

    return fhirReport;
}

/**
 * GET /api/reports
 * List all cached reports (for demo purposes)
 */
router.get('/', (req, res) => {
    try {
        const cache = analyzeRoutes.getCache();
        const reports = [];

        cache.forEach((report, id) => {
            reports.push({
                reportId: id,
                reportType: report.reportType,
                reportSubtype: report.reportSubtype,
                mode: report.mode,
                hasCriticalValues: report.hasCriticalValues,
                processedAt: report.metadata?.processedAt
            });
        });

        res.json({
            success: true,
            count: reports.length,
            reports
        });

    } catch (error) {
        console.error('List reports error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list reports'
        });
    }
});

module.exports = router;
