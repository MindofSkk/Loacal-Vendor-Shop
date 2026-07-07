import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

export const validate = (req, _res, next) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    return next(new ApiError(400, 'Invalid request data', result.array()));
  }

  return next();
};
