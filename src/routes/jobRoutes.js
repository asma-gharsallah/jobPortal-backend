const express = require("express");
const { body } = require("express-validator");
const jobController = require("../controllers/jobController");
const { auth } = require("../middleware/auth");
const { cacheMiddleware } = require("../utils/cacheUtils");

const router = express.Router();

// Job creation/update validation
const jobValidation = [
  body("title").trim().notEmpty().withMessage("Job title is required"),
  body("company").trim().notEmpty().withMessage("Company name is required"),
  body("location").trim().notEmpty().withMessage("Location is required"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Job description is required"),
  body("requirements").isArray().withMessage("Requirements must be an array"),
  body("requirements.*")
    .trim()
    .notEmpty()
    .withMessage("Each requirement must not be empty"),
  body("type")
    .isIn(["Full-time", "Part-time", "Contract", "Internship", "Remote"])
    .withMessage("Invalid job type"),
  body("salary").isObject().withMessage("Salary must be an object"),
  body("salary.min").isNumeric().withMessage("Minimum salary must be a number"),
  body("salary.max").isNumeric().withMessage("Maximum salary must be a number"),
  body("experience").isObject().withMessage("Experience must be an object"),
  body("experience.min")
    .isNumeric()
    .withMessage("Minimum experience must be a number"),
  body("experience.max")
    .isNumeric()
    .withMessage("Maximum experience must be a number"),
];

// Public routes with caching
router.get("/", cacheMiddleware("jobs:list", 300), jobController.getAllJobs); // Cache for 5 minutes
router.get(
  "/:id",
  cacheMiddleware("jobs:detail", 300),
  jobController.getJobById
);

// Protected routes that invalidate cache
router.post("/", auth, jobValidation, jobController.createJob);

router.put("/:id", auth, jobValidation, jobController.updateJob);

router.delete("/:id", auth, jobController.deleteJob);

// Search endpoints
// router.get('/search/suggestions',
//   cacheMiddleware('jobs:suggestions', 3600),
//   jobController.getJobSuggestions
// );

// router.get('/stats/categories',
//   cacheMiddleware('jobs:stats:categories', 3600),
//   jobController.getJobStatsByCategory
// );

// router.get('/stats/locations',
//   cacheMiddleware('jobs:stats:locations', 3600),
//   jobController.getJobStatsByLocation
// );

// Application routes
router.post(
  "/:id/apply",
  auth,
  body("coverLetter").trim().notEmpty().withMessage("Cover letter is required"),
  jobController.applyForJob
);

// router.get('/:id/similar',
//   cacheMiddleware('jobs:similar', 300),
//   jobController.getSimilarJobs
// );

module.exports = router;
