const Resume = require("../models/Resume");
const User = require("../models/User");
const multer = require("multer");
const path = require("path");
const fs = require("fs"); // To delete files from the server
const { unlink } = require("fs/promises");

// Multer configuration for file upload (PDF, DOC, DOCX)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Directory where files will be stored
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique file name
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true); // Valid file
  } else {
    cb(new Error("Only PDF, DOC, DOCX files are allowed"));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10 MB
}).single("file"); // Form field name for the file

// Create a resume with an uploaded file
exports.createResume = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      console.log("request body", req.body);
      console.log("req file", req.file);
      const { name } = req.body;
      const applicantId = req.user._id;
      console.log(applicantId);

      // Check if the user exists
      const user = await User.findById(applicantId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create the resume with the file path
      const resume = new Resume({
        name,
        applicant: applicantId,
        path: req.file.path, // Save the file path
      });

      await resume.save();

      // Add the resume to the user's resumes list
      user.resumes.push(resume._id);
      await user.save();

      res.status(201).json(resume);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error creating the resume" });
    }
  });
};

// Get all resumes of a user

exports.getResumesByUser = async (req, res) => {
  try {
    // Find the user by ID and populate the "resumes" field
    const user = await User.findById(req.params.userId).populate("resumes");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // The populated resumes are available directly in the user object
    const resumes = user.resumes;
    res.status(200).json(resumes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching resumes" });
  }
};

// Update a resume's name or file
// exports.updateResume = async (req, res) => {
//   try {
//     const { name } = req.body;
//     const resumeId = req.params.resumeId;

//     // Find the resume by ID
//     const resume = await Resume.findById(resumeId);
//     if (!resume) {
//       return res.status(404).json({ message: "Resume not found" });
//     }

//     // Update the resume name (or other properties as needed)
//     if (name) resume.name = name;

//     // If a new file is uploaded, handle the file upload and replace the old file
//     if (req.file) {
//       // Delete the old file from the server
//       fs.unlink(resume.path, (err) => {
//         if (err) {
//           console.error("File deletion error:", err);
//           return res
//             .status(500)
//             .json({ message: "Error deleting the old file" });
//         }
//       });

//       // Update the resume file path with the new file path
//       resume.path = req.file.path;
//     }

//     await resume.save(); // Save the updated resume

//     res.status(200).json(resume); // Return the updated resume
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Error updating the resume" });
//   }
// };

// Delete a resume and its associated file
exports.deleteResume = async (req, res) => {
  try {
    // Find and delete the resume
    const resume = await Resume.findByIdAndDelete(req.params.resumeId);
    console.log("resume to delete", resume);

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    // Delete the file from the server
    await unlink(resume.path, (err) => {
      if (err) {
        console.error("File deletion error:", err);
        return res.status(500).json({ message: "Error deleting the file" });
      }
    });

    // Remove the resume from the user's resumes list
    const user = await User.findById(resume.applicant);
    user.resumes = user.resumes.filter(
      (r) => r.toString() !== resume._id.toString()
    );
    console.log("user resumes after deletion", user.resumes);

    await user.save();

    // Delete the resume from the database
    // await resume.remove();

    res.status(200).json({ message: "Resume deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting the resume" });
  }
};
