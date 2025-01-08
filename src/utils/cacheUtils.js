const Redis = require('ioredis');
const logger = require('../config/logger');

let redisClient = null;

/**
 * Initialize Redis connection
 * @returns {Promise<void>}
 */
exports.initializeCache = async () => {
  try {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    redisClient.on('error', (err) => {
      logger.error('Redis error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis');
    });

    await redisClient.ping();
  } catch (error) {
    logger.error('Error connecting to Redis:', error);
    redisClient = null;
  }
};

/**
 * Get value from cache
 * @param {String} key - Cache key
 * @returns {Promise<any>}
 */
exports.get = async (key) => {
  if (!redisClient) return null;

  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error('Redis get error:', error);
    return null;
  }
};

/**
 * Set value in cache
 * @param {String} key - Cache key
 * @param {any} value - Value to cache
 * @param {Number} ttl - Time to live in seconds
 * @returns {Promise<void>}
 */
exports.set = async (key, value, ttl = 3600) => {
  if (!redisClient) return;

  try {
    await redisClient.set(key, JSON.stringify(value), 'EX', ttl);
  } catch (error) {
    logger.error('Redis set error:', error);
  }
};

/**
 * Delete value from cache
 * @param {String} key - Cache key
 * @returns {Promise<void>}
 */
exports.del = async (key) => {
  if (!redisClient) return;

  try {
    await redisClient.del(key);
  } catch (error) {
    logger.error('Redis delete error:', error);
  }
};

/**
 * Clear cache by pattern
 * @param {String} pattern - Key pattern to clear
 * @returns {Promise<void>}
 */
exports.clearPattern = async (pattern) => {
  if (!redisClient) return;

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch (error) {
    logger.error('Redis clear pattern error:', error);
  }
};

/**
 * Cache middleware factory
 * @param {String} prefix - Cache key prefix
 * @param {Number} ttl - Time to live in seconds
 * @returns {Function} Express middleware
 */
exports.cacheMiddleware = (prefix, ttl = 3600) => {
  return async (req, res, next) => {
    if (!redisClient || req.method !== 'GET') {
      return next();
    }

    const key = `${prefix}:${req.originalUrl}`;

    try {
      const cachedData = await exports.get(key);
      if (cachedData) {
        return res.json(cachedData);
      }

      // Store original json method
      const originalJson = res.json;

      // Override json method
      res.json = function(data) {
        exports.set(key, data, ttl);
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Check cache health
 * @returns {Promise<Object>}
 */
exports.checkHealth = async () => {
  try {
    if (!redisClient) {
      return {
        connected: false,
        status: 'unhealthy',
        error: 'Redis client not initialized'
      };
    }

    await redisClient.ping();
    return {
      connected: true,
      status: 'healthy'
    };
  } catch (error) {
    return {
      connected: false,
      status: 'unhealthy',
      error: error.message
    };
  }
};