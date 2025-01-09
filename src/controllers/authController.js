const jwt = require("jsonwebtoken"); //importer la bibliothèque
const { validationResult } = require("express-validator");
const User = require("../models/User");
const logger = require("../config/logger");
const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // Or configure storage as needed

// Generate JWT token
//Créer un token JWT pour l’utilisateur : userId (ID unique de l'utilisateur)
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

    const { name, email, password, phone } = req.body;

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
      phone,
    });

    await user.save();

    // Generate token
    //Lorsqu'un utilisateur s’inscrit, un token JWT est généré et envoyé au client : l'utilisateur reste authentifié directement après l'inscription
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
    //Génère un token JWT valide : Permet au client de prouver son identité lors des requêtes suivantes
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
    const user = await User.findById(req.user._id) //Cette route nécessite un token valide envoyé par le client : déchiffre le token et ajoute userId à req.use ;  déchiffre le token et ajoute userId à req.use
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
// exports.updateProfile = async (req, res) => {
//   console.log("update request", req.body);
//   try {
//     const updates = Object.keys(req.body);
//     const allowedUpdates = [
//       "name",
//       "phone",
//       "email",
//       "location",
//       "skills",
//       "education",
//       "experience",
//     ];
//     const isValidOperation = updates.every((update) =>
//       allowedUpdates.includes(update)
//     );

//     if (!isValidOperation) {
//       return res.status(400).json({ message: "Invalid updates" });
//     }

//     // Validation spécifique pour le champ phone
//     if (req.body.phone && !/^\d{8}$/.test(req.body.phone)) {
//       return res
//         .status(400)
//         .json({ message: "Phone must be exactly 8 numeric characters" });
//     }

//     const user = req.user; //
//     updates.forEach((update) => {
//       if (update === "name" || update === "email" || update === "phone") {
//         user[update] = req.body[update];
//       } else {
//         user.profile[update] = req.body[update];
//       }
//     });

//     await user.save();
//     res.json({
//       message: "Profile updated successfully",
//       user,
//     });
//   } catch (error) {
//     logger.error("Update profile error:", error);
//     res.status(500).json({
//       message: "Error updating profile",
//       error: process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// };

exports.updateProfile = [
  // Middleware to handle file uploads
  upload.single("resume"), // Assuming "resume" is the field name for the file
  async (req, res) => {
    console.log("update request", req.body); // This should now show the form fields
    console.log("Uploaded file", req.file); // This will show the uploaded file

    try {
      const updates = Object.keys(req.body);

      // Validation spécifique pour le champ phone
      if (req.body.phone && !/^\d{8}$/.test(req.body.phone)) {
        return res
          .status(400)
          .json({ message: "Phone must be exactly 8 numeric characters" });
      }

      const user = req.user; // Assuming you have middleware to get the authenticated user

      updates.forEach((update) => {
        user[update] = req.body[update];
      });

      // Handle the uploaded resume if it exists
      if (req.file) {
        // For example, save the file path in the user object
        user.profile = user.profile || {};
        user.profile.resume = req.file.path; // Save file path in `profile.resume`      }
      }
      await user.save();

      res.json({
        message: "Profile updated successfully",
        user,
      });
    } catch (error) {
      logger.error("Update profile error:", error);
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
