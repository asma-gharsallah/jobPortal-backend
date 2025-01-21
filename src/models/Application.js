const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    coverLetter: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "under_review", "accepted", "rejected", "withdrawn"],
      default: "pending",
    },
    notes: [
      {
        type: String,
      },
    ],
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    lastStatusUpdate: {
      type: Date,
      default: Date.now,
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: [
            "pending",
            "under_review",
            "accepted",
            "rejected",
            "withdrawn",
          ],
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Add index for faster queries
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

// Middleware to update lastStatusUpdate when status changes
applicationSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.lastStatusUpdate = new Date();
    this.statusHistory.push({
      status: this.status,
      updatedAt: this.lastStatusUpdate,
      updatedBy: this.updatedBy,
    });
  }
  next();
});

const Application = mongoose.model("Application", applicationSchema);

module.exports = Application;
