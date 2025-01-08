const express = require('express');
const authRoutes = require('./authRoutes');
const jobRoutes = require('./jobRoutes');
const applicationRoutes = require('./applicationRoutes');
const utilityRoutes = require('./utilityRoutes');

const router = express.Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);
router.use('/utility', utilityRoutes);

// API Documentation
router.get('/', (req, res) => {
  res.json({
    name: 'Job Portal API',
    version: '1.0.0',
    endpoints: {
      auth: {
        base: '/api/auth',
        routes: [
          { path: '/register', method: 'POST', description: 'Register new user' },
          { path: '/login', method: 'POST', description: 'Login user' },
          { path: '/me', method: 'GET', description: 'Get current user' }
        ]
      },
      jobs: {
        base: '/api/jobs',
        routes: [
          { path: '/', method: 'GET', description: 'Get all jobs' },
          { path: '/:id', method: 'GET', description: 'Get job by ID' },
          { path: '/', method: 'POST', description: 'Create new job' },
          { path: '/:id', method: 'PUT', description: 'Update job' },
          { path: '/:id', method: 'DELETE', description: 'Delete job' },
          { path: '/:id/apply', method: 'POST', description: 'Apply for job' }
        ]
      },
      applications: {
        base: '/api/applications',
        routes: [
          { path: '/my-applications', method: 'GET', description: 'Get user applications' },
          { path: '/jobs/:jobId/applications', method: 'GET', description: 'Get job applications' },
          { path: '/:id/status', method: 'PATCH', description: 'Update application status' }
        ]
      },
      utility: {
        base: '/api/utility',
        routes: [
          { path: '/health', method: 'GET', description: 'Check system health' },
          { path: '/stats', method: 'GET', description: 'Get system statistics' },
          { path: '/cache/clear', method: 'POST', description: 'Clear cache' },
          { path: '/export', method: 'POST', description: 'Export data' },
          { path: '/logs', method: 'GET', description: 'Get system logs' }
        ]
      }
    }
  });
});

module.exports = router;