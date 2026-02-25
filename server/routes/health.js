/**
 * Health Check Route
 * System health and status endpoints
 */

const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');

/**
 * GET /api/health
 * Basic health check
 */
router.get('/', async (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        services: {}
    };

    // Check Gemini API
    try {
        const geminiStatus = await geminiService.validateApiKey();
        health.services.Gemini = {
            status: geminiStatus.valid ? 'connected' : 'error',
            error: geminiStatus.error || null
        };
    } catch (error) {
        health.services.Gemini = {
            status: 'error',
            error: error.message
        };
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    health.memory = {
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`
    };

    // Determine overall status
    const hasErrors = Object.values(health.services).some(s => s.status === 'error');
    if (hasErrors) {
        health.status = 'degraded';
    }

    res.status(hasErrors ? 503 : 200).json(health);
});

/**
 * GET /api/health/ready
 * Readiness check (for k8s/container orchestration)
 */
router.get('/ready', async (req, res) => {
    try {
        // Check if Gemini API is accessible
        const geminiStatus = await geminiService.validateApiKey();

        if (geminiStatus.valid) {
            res.status(200).json({ ready: true });
        } else {
            res.status(503).json({
                ready: false,
                reason: 'Gemini API not accessible',
                error: geminiStatus.error
            });
        }
    } catch (error) {
        res.status(503).json({
            ready: false,
            reason: error.message
        });
    }
});

/**
 * GET /api/health/live
 * Liveness check
 */
router.get('/live', (req, res) => {
    res.status(200).json({ alive: true });
});

module.exports = router;
