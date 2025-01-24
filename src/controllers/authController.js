const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const logger = require("../config/logger");
const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // Or configure storage as needed
const Resume = require("../models/Resume");

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Register a new user
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists with this email",
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user,
    });
  } catch (error) {
    logger.error("Registration error:", error);
    res.status(500).json({
      message: "Error registering user",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: "Logged in successfully",
      token,
      user,
    });
  } catch (error) {
    logger.error("Login error:", error);
    res.status(500).json({
      message: "Error logging in",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id) // This assumes you have middleware to decode the JWT and add the user info to the request object.
      .select("-password")
      .populate("applications");

    res.json(user);
  } catch (error) {
    logger.error("Get current user error:", error);
    res.status(500).json({
      message: "Error getting user data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Update user profile
exports.updateProfile = [
  // Middleware to handle file uploads
  upload.single("file"), // "file" is the name of the input field for file upload
  async (req, res) => {
    try {
      const user = req.user; // Assuming you have middleware to extract the user from the token
      console.log("user to update", user);

      const updates = Object.keys(req.body);
      updates.forEach((update) => {
        if (req.body[update]) {
          user[update] = req.body[update]; // Update user fields from request body
        }
      });

      // Handle the uploaded resume if it exists
      if (req.file) {
        // Create a new Resume entry in the database
        const newResume = new Resume({
          name: req.file.originalname,
          path: req.file.path,
          applicant: user._id, // Link the resume to the user
        });

        // Save the resume to the database
        await newResume.save();

        // Add the new resume to the user's resumes array
        user.resumes.push(newResume._id);
        console.log("Updated resumes array", user.resumes);
      }

      // Save user changes to the database
      await user.save();

      res.json({
        message: "Profile updated successfully",
        user,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({
        message: "Error updating profile",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
];

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const isMatch = await req.user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    // Update password
    req.user.password = newPassword;
    await req.user.save();

    res.json({
      message: "Password changed successfully",
    });
  } catch (error) {
    logger.error("Change password error:", error);
    res.status(500).json({
      message: "Error changing password",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
