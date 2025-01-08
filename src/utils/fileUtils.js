const fs = require('fs').promises;
const path = require('path');
const { APIError } = require('./errorUtils');

// Allowed file types and their MIME types
const ALLOWED_FILE_TYPES = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
};

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Validate file type and size
 * @param {Object} file - File object from multer
 * @returns {Boolean} - True if file is valid
 */
exports.validateFile = (file) => {
  // Check file type
  if (!ALLOWED_FILE_TYPES[file.mimetype]) {
    throw new APIError('Invalid file type. Only PDF and Word documents are allowed.', 400);
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new APIError('File is too large. Maximum size is 5MB.', 400);
  }

  return true;
};

/**
 * Generate unique filename
 * @param {String} originalname - Original file name
 * @param {String} mimetype - File MIME type
 * @returns {String} - Unique filename
 */
exports.generateUniqueFilename = (originalname, mimetype) => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const extension = ALLOWED_FILE_TYPES[mimetype];
  return `${timestamp}-${random}${extension}`;
};

/**
 * Save file to disk
 * @param {Object} file - File object from multer
 * @param {String} directory - Directory to save file
 * @returns {Promise<String>} - Saved file path
 */
exports.saveFile = async (file, directory) => {
  try {
    // Validate file
    this.validateFile(file);

    // Create directory if it doesn't exist
    await fs.mkdir(directory, { recursive: true });

    // Generate unique filename
    const filename = this.generateUniqueFilename(file.originalname, file.mimetype);
    const filepath = path.join(directory, filename);

    // Save file
    await fs.writeFile(filepath, file.buffer);

    return filepath;
  } catch (error) {
    throw new APIError('Error saving file: ' + error.message, 500);
  }
};

/**
 * Delete file from disk
 * @param {String} filepath - Path to file
 * @returns {Promise<void>}
 */
exports.deleteFile = async (filepath) => {
  try {
    await fs.unlink(filepath);
  } catch (error) {
    if (error.code !== 'ENOENT') { // Ignore if file doesn't exist
      throw new APIError('Error deleting file: ' + error.message, 500);
    }
  }
};

/**
 * Create temporary file
 * @param {Buffer} data - File data
 * @param {String} extension - File extension
 * @returns {Promise<String>} - Temporary file path
 */
exports.createTempFile = async (data, extension) => {
  const tempDir = path.join(__dirname, '../temp');
  const filename = `temp-${Date.now()}-${Math.round(Math.random() * 1E9)}${extension}`;
  const filepath = path.join(tempDir, filename);

  try {
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(filepath, data);
    return filepath;
  } catch (error) {
    throw new APIError('Error creating temporary file: ' + error.message, 500);
  }
};

/**
 * Clean up temporary files
 * @param {String} directory - Directory to clean
 * @param {Number} maxAge - Maximum age in milliseconds
 * @returns {Promise<void>}
 */
exports.cleanupTempFiles = async (directory, maxAge = 24 * 60 * 60 * 1000) => {
  try {
    const files = await fs.readdir(directory);
    const now = Date.now();

    for (const file of files) {
      const filepath = path.join(directory, file);
      const stats = await fs.stat(filepath);
      
      if (now - stats.mtimeMs > maxAge) {
        await fs.unlink(filepath);
      }
    }
  } catch (error) {
    console.error('Error cleaning up temporary files:', error);
  }
};