import { ApiError } from '../utils/ApiError.js';

export const notFound = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

export const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation failed',
      errors: Object.values(err.errors).map((error) => error.message)
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      message: 'Duplicate value',
      errors: Object.keys(err.keyValue || {})
    });
  }

  return res.status(statusCode).json({
    message: err.message || 'Internal server error',
    details: err.details || undefined
  });
};
