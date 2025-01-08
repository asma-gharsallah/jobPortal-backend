const express = require('express');
const { checkHealth: checkDBHealth } = require('../utils/dbUtils');
const { checkHealth: checkCacheHealth } = require('../utils/cacheUtils');
const { auth, adminAuth } = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const dbStatus = await checkDBHealth();
    const cacheStatus = await checkCacheHealth();

    const status = {
      status: dbStatus.connected && cacheStatus.connected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        cache: cacheStatus
      }
    };

    const statusCode = status.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(status);
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error performing health check'
    });
  }
});

// Cache management (admin only)
router.post('/cache/clear', adminAuth, async (req, res) => {
  try {
    const { pattern } = req.body;
    const cacheUtils = require('../utils/cacheUtils');
    await cacheUtils.clearPattern(pattern || '*');
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    logger.error('Cache clear error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error clearing cache'
    });
  }
});

// System statistics (admin only)
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const User = require('../models/User');
    const Job = require('../models/Job');
    const Application = require('../models/Application');

    const stats = {
      users: await User.countDocuments(),
      jobs: await Job.countDocuments(),
      applications: await Application.countDocuments(),
      activeJobs: await Job.countDocuments({ status: 'active' }),
      metrics: {
        applicationsToday: await Application.countDocuments({
          createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
        }),
        newUsersThisWeek: await User.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        })
      }
    };

    res.json(stats);
  } catch (error) {
    logger.error('Stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching statistics'
    });
  }
});

// Export data (admin only)
router.post('/export', adminAuth, async (req, res) => {
  try {
    const { model, format = 'json', dateRange } = req.body;
    const Model = require(`../models/${model}`);
    
    let query = {};
    if (dateRange) {
      query.createdAt = {
        $gte: new Date(dateRange.start),
        $lte: new Date(dateRange.end)
      };
    }

    const data = await Model.find(query);

    if (format === 'csv') {
      const { Parser } = require('json2csv');
      const fields = Object.keys(Model.schema.paths);
      const parser = new Parser({ fields });
      const csv = parser.parse(data);
      
      res.header('Content-Type', 'text/csv');
      res.attachment(`${model}-export.csv`);
      return res.send(csv);
    }

    res.json(data);
  } catch (error) {
    logger.error('Export error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error exporting data'
    });
  }
});

// System logs (admin only)
router.get('/logs', adminAuth, async (req, res) => {
  try {
    const { tail = 100 } = req.query;
    const fs = require('fs').promises;
    const path = require('path');

    const logFile = path.join(__dirname, '../../logs/combined.log');
    const data = await fs.readFile(logFile, 'utf8');
    const lines = data.split('\n').filter(Boolean).slice(-tail);

    res.json({
      total: lines.length,
      logs: lines.map(line => JSON.parse(line))
    });
  } catch (error) {
    logger.error('Logs error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching logs'
    });
  }
});

module.exports = router;