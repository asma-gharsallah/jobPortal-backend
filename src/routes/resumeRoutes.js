const express = require("express");
const { body, param } = require("express-validator");
const resumeController = require("../controllers/resumeController");
const { auth } = require("../middleware/auth");
const upload = require("../middleware/upload"); // Middleware pour gérer les fichiers
const Resume = require("../models/Resume");

const router = express.Router();

// Validation pour créer ou mettre à jour un résumé
const resumeValidation = [
  body("name").optional().trim().notEmpty().withMessage("Name is required"),
];

// Validation pour vérifier l'ID du résumé
const resumeIdValidation = [
  param("resumeId").isMongoId().withMessage("Invalid resume ID"),
];

// Routes pour les résumés

// Créer un résumé avec un fichier (auth requis)
router.post("/", auth, resumeValidation, resumeController.createResume);

// Obtenir tous les résumés d'un utilisateur (auth requis)
router.get(
  "/user/:userId",
  auth,
  [
    param("userId").isMongoId().withMessage("Invalid user ID"), // Validation de l'ID utilisateur
  ],
  resumeController.getResumesByUser
);

// route pour récupérer un résumé par son ID
router.get("/:resumeId", async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.resumeId);
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }
    res.json(resume);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Supprimer un résumé et son fichier
router.delete(
  "/:resumeId",
  auth,
  resumeIdValidation,
  resumeController.deleteResume
);

// Route pour récupérer un résumé par son ID
router.get("/:resumeId", resumeIdValidation, resumeController.viewCV);

module.exports = router;
