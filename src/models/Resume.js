const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  path: {
    type: String,
    required: true,
    trim: true,
  },

  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  application: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
    },
  ],

  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const Resume = mongoose.model("Resume", resumeSchema);

module.exports = Resume;
