const Job = require('../models/Job');
const Application = require('../models/Application');
const logger = require('../config/logger');

// Get all jobs with filters and pagination
exports.getAllJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { status: 'active' };
    
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    if (req.query.location) {
      filter.location = { $regex: req.query.location, $options: 'i' };
    }

    if (req.query.type) {
      filter.type = req.query.type;
    }

    if (req.query.minSalary) {
      filter['salary.min'] = { $gte: parseInt(req.query.minSalary) };
    }

    if (req.query.maxSalary) {
      filter['salary.max'] = { $lte: parseInt(req.query.maxSalary) };
    }

    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    // Execute query with filters and pagination
    const jobs = await Job.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('postedBy', 'name company');

    // Get total count for pagination
    const total = await Job.countDocuments(filter);

    res.json({
      jobs,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    logger.error('Get all jobs error:', error);
    res.status(500).json({
      message: 'Error fetching jobs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single job by ID
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'name company');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Increment view count
    job.views += 1;
    await job.save();

    res.json(job);
  } catch (error) {
    logger.error('Get job by ID error:', error);
    res.status(500).json({
      message: 'Error fetching job',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new job
exports.createJob = async (req, res) => {
  try {
    const job = new Job({
      ...req.body,
      postedBy: req.user._id
    });

    await job.save();
    res.status(201).json({
      message: 'Job created successfully',
      job
    });
  } catch (error) {
    logger.error('Create job error:', error);
    res.status(500).json({
      message: 'Error creating job',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update job
exports.updateJob = async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = [
      'title', 'description', 'requirements', 'responsibilities',
      'location', 'salary', 'type', 'category', 'skills',
      'experience', 'status', 'applicationDeadline'
    ];
    
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));
    if (!isValidOperation) {
      return res.status(400).json({ message: 'Invalid updates' });
    }

    const job = await Job.findOne({
      _id: req.params.id,
      postedBy: req.user._id
    });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    updates.forEach(update => job[update] = req.body[update]);
    await job.save();

    res.json({
      message: 'Job updated successfully',
      job
    });
  } catch (error) {
    logger.error('Update job error:', error);
    res.status(500).json({
      message: 'Error updating job',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete job
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({
      _id: req.params.id,
      postedBy: req.user._id
    });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Delete all associated applications
    await Application.deleteMany({ job: req.params.id });

    res.json({
      message: 'Job deleted successfully',
      job
    });
  } catch (error) {
    logger.error('Delete job error:', error);
    res.status(500).json({
      message: 'Error deleting job',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Apply for a job
exports.applyForJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.status !== 'active') {
      return res.status(400).json({ message: 'This job is no longer accepting applications' });
    }

    // Check if user already applied
    const existingApplication = await Application.findOne({
      job: job._id,
      applicant: req.user._id
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    const application = new Application({
      job: job._id,
      applicant: req.user._id,
      resume: req.body.resumeId,
      coverLetter: req.body.coverLetter
    });

    await application.save();

    // Update job and user with new application
    job.applications.push(application._id);
    await job.save();

    req.user.applications.push(application._id);
    await req.user.save();

    res.status(201).json({
      message: 'Application submitted successfully',
      application
    });
  } catch (error) {
    logger.error('Apply for job error:', error);
    res.status(500).json({
      message: 'Error submitting application',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};