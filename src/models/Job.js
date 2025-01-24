const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["Full-time", "Part-time", "Contract", "Internship", "Remote"],
      default: "Full-time",
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Software Development",
        "Design",
        "Marketing",
        "Sales",
        "Customer Service",
        "Data Science",
        "Project Management",
        "Human Resources",
        "Other",
      ],
    },
    description: {
      type: String,
      required: true,
    },
    requirements: [
      {
        type: String,
        required: true,
      },
    ],
    responsibilities: [
      {
        type: String,
        required: true,
      },
    ],
    skills: [
      {
        type: String,
        required: true,
      },
    ],

    experience: {
      type: Number,
      required: true,
    },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "closed", "draft"],
      default: "active",
    },
    applications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Application",
      },
    ],
    applicationDeadline: {
      type: Date,
    },
    views: {
      type: Number,
      default: 0,
    },
  },

  {
    timestamps: true,
  }
);

// Add text index for search functionality
jobSchema.index({
  title: "text",
  location: "text",
  description: "text",
  skills: "text",
});

const Job = mongoose.model("Job", jobSchema);

module.exports = Job;
