const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Register validation
const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("phone")
    .trim()
    .isLength({ min: 8, max: 8 })
    .withMessage("Phone must be exactly 8 characters long")
    .isNumeric()
    .withMessage("Phone must contain only numbers"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

// Login validation
const loginValidation = [
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Password change validation
const passwordChangeValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long"),
];

// Routes
router.post("/register", registerValidation, authController.register);
router.post("/login", loginValidation, authController.login);
router.get("/me", auth, authController.getCurrentUser);
router.put("/profile", auth, authController.updateProfile);
router.post(
  "/change-password",
  auth,
  passwordChangeValidation,
  authController.changePassword
);

module.exports = router;
