const Application = require("../models/Application");
const Job = require("../models/Job");
const logger = require("../config/logger");

// Get user's applications
exports.getUserApplications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const applications = await Application.find({ applicant: req.user._id })
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "job",
        select: "title company location type salary",
      });

    const total = await Application.countDocuments({ applicant: req.user._id });

    res.json({
      applications,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    logger.error("Get user applications error:", error);
    res.status(500).json({
      message: "Error fetching applications",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get single application
exports.getApplicationById = async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      applicant: req.user._id,
    }).populate({
      path: "job",
      select: "title company location",
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json(application);
  } catch (error) {
    logger.error("Get application by ID error:", error);
    res.status(500).json({
      message: "Error fetching application",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get applications for a specific job (for employers)
exports.getJobApplications = async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.jobId,
      postedBy: req.user._id,
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { job: req.params.jobId };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const applications = await Application.find(filter)
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "applicant",
        select: "name email resumes",
      })
      .populate({
        path: "job",
        select: "title",
      });
    const total = await Application.countDocuments(filter);

    res.json({
      applications,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    logger.error("Get job applications error:", error);
    res.status(500).json({
      message: "Error fetching applications",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Update application status (for employers)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "under_review", "accepted", "rejected"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const application = await Application.findById(req.params.id).populate({
      path: "job",
      select: "postedBy",
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Check if the user is the employer who posted the job
    if (application.job.postedBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this application" });
    }

    application.status = status;
    application.statusHistory.push({
      status,
      updatedAt: new Date(),
      updatedBy: req.user._id,
    });

    await application.save();

    res.json({
      message: "Application status updated successfully",
      application,
    });
  } catch (error) {
    logger.error("Update application status error:", error);
    res.status(500).json({
      message: "Error updating application status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Withdraw application (for applicants)
exports.withdrawApplication = async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      applicant: req.user._id,
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.status === "withdrawn") {
      return res.status(400).json({ message: "Application already withdrawn" });
    }

    application.status = "withdrawn";
    application.statusHistory.push({
      status: "withdrawn",
      updatedAt: new Date(),
      updatedBy: req.user._id,
    });

    await application.save();

    res.json({
      message: "Application withdrawn successfully",
      application,
    });
  } catch (error) {
    logger.error("Withdraw application error:", error);
    res.status(500).json({
      message: "Error withdrawing application",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Add note to application (for employers)
exports.addApplicationNote = async (req, res) => {
  try {
    const { notes } = req.body;
    const application = await Application.findById(req.params.id).populate({
      path: "job",
      select: "postedBy",
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.job.postedBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to add notes to this application" });
    }

    application.notes = notes;

    await application.save();

    res.json({
      message: "Note added successfully",
      application,
    });
  } catch (error) {
    logger.error("Add application note error:", error);
    res.status(500).json({
      message: "Error adding note",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// get Applications By Id
exports.getApplicationsById = async (req, res) => {
  try {
    const { id } = req.params; // Retrieve the ID from the route parameter

    // Fetch the application by its ID
    const application = await Application.findById(id)
      .populate({
        path: "job",
        select: "title  location description requirements skills",
      })
      .populate({
        path: "applicant",
        select: "name email resumes",
      });
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Send the application data in the response
    res.status(200).json(application);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
