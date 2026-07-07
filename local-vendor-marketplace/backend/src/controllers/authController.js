import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken } from '../utils/jwt.js';

const buildAuthResponse = (user) => ({
  user,
  token: signToken(user)
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role = 'customer', address } = req.body;

  if (role === 'admin') {
    throw new ApiError(403, 'Admin users must be created directly by an existing admin');
  }

  const user = await User.create({ name, email, password, phone, role, address });
  res.status(201).json(buildAuthResponse(user));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (user.status !== 'active') {
    throw new ApiError(403, 'Your account has been suspended');
  }

  res.json(buildAuthResponse(user));
});

export const getMe = asyncHandler(async (req, res) => {
  res.json(req.user);
});
