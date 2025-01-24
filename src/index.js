require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const logger = require("./config/logger");
const routes = require("./routes");

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api", routes);

// Error handling middleware
// app.use((err, req, res, next) => {
//   logger.error(err.stack);
//   res.status(500).json({
//     message: "Something broke!",
//     error: process.env.NODE_ENV === "development" ? err.message : undefined,
//   });
// });

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    logger.info("Connected to MongoDB");
    // Start server
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error("MongoDB connection error:", err);
    process.exit(1);
  });
