const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const logger = require("../config/logger");
const multer = require("multer");
const Resume = require("../models/Resume");
const upload = require("../middleware/upload");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");

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

// Update profile and handle CV upload
exports.updateProfile = async (req, res) => {
  try {
    const user = req.user; // Assuming you have middleware to extract the user from the token
    console.log("user to update", user);

    const updates = Object.keys(req.body);
    updates.forEach((update) => {
      if (req.body[update]) {
        user[update] = req.body[update]; // Update user fields from request body
      }
    });

    // Gestion du fichier uploadé
    if (req.file) {
      const fileExtension = path.extname(req.file.originalname);
      const uniqueFileName = `${uuidv4()}${fileExtension}`;
      const filePath = path.join("uploads", uniqueFileName);

      // Déplacer et renommer le fichier
      fs.renameSync(req.file.path, filePath);

      // Enregistrement du nouveau CV
      const newResume = new Resume({
        name: req.file.originalname,
        path: filePath,
        applicant: user._id,
      });

      // Enregistrer en base de données
      await newResume.save();

      // Ajouter le nouveau CV sans supprimer les anciens

      user.resumes.push(newResume._id); // Ajouter le nouveau CV sans supprimer les anciens
    }

    // Sauvegarder les modifications de l'utilisateur
    await user.save();

    res.json({
      message: "Profil mis à jour avec succès",
      user,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil :", error);
    res.status(500).json({
      message: "Erreur lors de la mise à jour du profil",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

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
