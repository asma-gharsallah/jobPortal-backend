// Custom error class for API errors
class APIError extends Error {
  constructor(message, statusCode, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
exports.errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack
    });
  } else {
    // Production error response
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        errors: err.errors
      });
    } else {
      // Programming or unknown errors
      console.error('ERROR 💥', err);
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong!'
      });
    }
  }
};

// Not found error handler
exports.notFound = (req, res, next) => {
  const err = new APIError(`Cannot find ${req.originalUrl} on this server!`, 404);
  next(err);
};

// Mongoose error handler
exports.handleMongooseError = (err) => {
  if (err.name === 'CastError') {
    return new APIError(`Invalid ${err.path}: ${err.value}`, 400);
  }
  
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(el => el.message);
    return new APIError('Invalid input data', 400, errors);
  }
  
  if (err.code === 11000) {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    return new APIError(`Duplicate field value: ${value}. Please use another value!`, 400);
  }

  return err;
};

// JWT error handler
exports.handleJWTError = () => 
  new APIError('Invalid token. Please log in again!', 401);

exports.handleJWTExpiredError = () =>
  new APIError('Your token has expired! Please log in again.', 401);

// Export the API error class
exports.APIError = APIError;

// Async error handler wrapper
exports.catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Response formatter
exports.formatResponse = (data, message = 'Success') => ({
  status: 'success',
  message,
  data
});