const { body } = require("express-validator");

// Common validation rules
const commonValidations = {
  // User validations
  name: body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  email: body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),

  password: body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/\d/)
    .withMessage("Password must contain at least one number")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter"),

  // Job validations
  jobTitle: body("title")
    .trim()
    .notEmpty()
    .withMessage("Job title is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Job title must be between 3 and 100 characters"),

  salary: [
    body("salary.min")
      .isNumeric()
      .withMessage("Minimum salary must be a number")
      .custom((value, { req }) => value <= req.body.salary.max)
      .withMessage("Minimum salary must be less than maximum salary"),
    body("salary.max")
      .isNumeric()
      .withMessage("Maximum salary must be a number"),
  ],

  experience: [
    body("experience.min")
      .isNumeric()
      .withMessage("Minimum experience must be a number")
      .custom((value, { req }) => value <= req.body.experience.max)
      .withMessage("Minimum experience must be less than maximum experience"),
    body("experience.max")
      .isNumeric()
      .withMessage("Maximum experience must be a number"),
  ],
};

// Validation schemas
exports.validationSchemas = {
  // User registration validation
  registration: [
    commonValidations.name,
    commonValidations.email,
    commonValidations.password,
  ],

  // User login validation
  login: [
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],

  // Job creation/update validation
  job: [
    commonValidations.jobTitle,
    body("company").trim().notEmpty().withMessage("Company name is required"),
    body("location").trim().notEmpty().withMessage("Location is required"),
    body("type")
      .isIn(["Full-time", "Part-time", "Contract", "Internship", "Remote"])
      .withMessage("Invalid job type"),
    body("category")
      .isIn([
        "Software Development",
        "Design",
        "Marketing",
        "Sales",
        "Customer Service",
        "Data Science",
        "Project Management",
        "Human Resources",
        "Other",
      ])
      .withMessage("Invalid job category"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Job description is required")
      .isLength({ min: 50 })
      .withMessage("Job description must be at least 50 characters long"),
    body("requirements")
      .isArray()
      .withMessage("Requirements must be an array")
      .custom((value) => value.length > 0)
      .withMessage("At least one requirement is required"),
    body("requirements.*")
      .trim()
      .notEmpty()
      .withMessage("Each requirement must not be empty"),
    commonValidations.salary,
    commonValidations.experience,
    body("skills")
      .isArray()
      .withMessage("Skills must be an array")
      .custom((value) => value.length > 0)
      .withMessage("At least one skill is required"),
    body("skills.*")
      .trim()
      .notEmpty()
      .withMessage("Each skill must not be empty"),
  ],

  // Application submission validation
  application: [
    body("coverLetter")
      .trim()
      .notEmpty()
      .withMessage("Cover letter is required")
      .isLength({ min: 100, max: 5000 })
      .withMessage("Cover letter must be between 100 and 5000 characters"),
  ],

  // Profile update validation
  profileUpdate: [
    commonValidations.name,

    body("location")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Location cannot be empty if provided"),
    body("skills").optional().isArray().withMessage("Skills must be an array"),
    body("skills.*")
      .trim()
      .notEmpty()
      .withMessage("Each skill must not be empty"),
    body("education")
      .optional()
      .isArray()
      .withMessage("Education must be an array"),
    body("education.*.institution")
      .trim()
      .notEmpty()
      .withMessage("Institution name is required"),
    body("education.*.degree")
      .trim()
      .notEmpty()
      .withMessage("Degree is required"),
    body("experience")
      .optional()
      .isArray()
      .withMessage("Experience must be an array"),
    body("experience.*.company")
      .trim()
      .notEmpty()
      .withMessage("Company name is required"),
    body("experience.*.position")
      .trim()
      .notEmpty()
      .withMessage("Position is required"),
  ],
};

// Validation middleware
exports.validateRequest = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array(),
    });
  };
};
