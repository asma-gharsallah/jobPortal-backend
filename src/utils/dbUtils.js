const mongoose = require("mongoose");
const logger = require("../config/logger");

/**
 * Initialize database connection
 * @returns {Promise<void>}
 */
exports.initializeDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info("Connected to MongoDB");

    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });

    // Handle process termination
    process.on("SIGINT", async () => {
      try {
        await mongoose.connection.close();
        logger.info("MongoDB connection closed through app termination");
        process.exit(0);
      } catch (err) {
        logger.error("Error closing MongoDB connection:", err);
        process.exit(1);
      }
    });
  } catch (error) {
    logger.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

/**
 * Create indexes for collections
 * @returns {Promise<void>}
 */
exports.createIndexes = async () => {
  try {
    // Ensure text indexes for job search
    await mongoose.model("Job").collection.createIndex({
      title: "text",
      company: "text",
      description: "text",
      skills: "text",
    });

    // Create compound index for applications
    await mongoose
      .model("Application")
      .collection.createIndex({ job: 1, applicant: 1 }, { unique: true });

    // Create indexes for user email
    await mongoose
      .model("User")
      .collection.createIndex({ email: 1 }, { unique: true });

    logger.info("Database indexes created successfully");
  } catch (error) {
    logger.error("Error creating database indexes:", error);
    throw error;
  }
};

/**
 * Start database transaction
 * @returns {Promise<mongoose.ClientSession>}
 */
exports.startTransaction = async () => {
  const session = await mongoose.startSession();
  session.startTransaction();
  return session;
};

/**
 * Commit transaction
 * @param {mongoose.ClientSession} session - Mongoose session
 * @returns {Promise<void>}
 */
exports.commitTransaction = async (session) => {
  await session.commitTransaction();
  session.endSession();
};

/**
 * Abort transaction
 * @param {mongoose.ClientSession} session - Mongoose session
 * @returns {Promise<void>}
 */
exports.abortTransaction = async (session) => {
  await session.abortTransaction();
  session.endSession();
};

/**
 * Execute function within transaction
 * @param {Function} fn - Function to execute
 * @returns {Promise<any>}
 */
exports.withTransaction = async (fn) => {
  const session = await this.startTransaction();
  try {
    const result = await fn(session);
    await this.commitTransaction(session);
    return result;
  } catch (error) {
    await this.abortTransaction(session);
    throw error;
  }
};

/**
 * Create bulk write operations with retries
 * @param {String} modelName - Name of the model
 * @param {Array} operations - Array of operations
 * @param {Object} options - Options for bulk write
 * @returns {Promise<any>}
 */
exports.bulkWrite = async (modelName, operations, options = {}) => {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await mongoose.model(modelName).bulkWrite(operations, {
        ordered: false,
        ...options,
      });
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) break;
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }

  throw lastError;
};

/**
 * Check database health
 * @returns {Promise<Object>}
 */
exports.checkHealth = async () => {
  try {
    const status = {
      connected: mongoose.connection.readyState === 1,
      status: "healthy",
    };

    if (!status.connected) {
      status.status = "unhealthy";
      status.error = "Database not connected";
    }

    return status;
  } catch (error) {
    return {
      connected: false,
      status: "unhealthy",
      error: error.message,
    };
  }
};
