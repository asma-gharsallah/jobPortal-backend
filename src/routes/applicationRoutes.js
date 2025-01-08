const express = require('express');
const { body } = require('express-validator');
const applicationController = require('../controllers/applicationController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Status update validation
const statusUpdateValidation = [
  body('status')
    .isIn(['pending', 'under_review', 'accepted', 'rejected'])
    .withMessage('Invalid status')
];

// Note addition validation
const noteValidation = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Note content is required')
];

// Routes for applicants
router.get('/my-applications', auth, applicationController.getUserApplications);
router.get('/my-applications/:id', auth, applicationController.getApplicationById);
router.post('/my-applications/:id/withdraw', auth, applicationController.withdrawApplication);

// Routes for employers
router.get('/jobs/:jobId/applications', auth, applicationController.getJobApplications);
router.patch('/:id/status', auth, statusUpdateValidation, applicationController.updateApplicationStatus);
router.post('/:id/notes', auth, noteValidation, applicationController.addApplicationNote);

module.exports = router;