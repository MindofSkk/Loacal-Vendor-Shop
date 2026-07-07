import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listUsers = asyncHandler(async (req, res) => {
  const { role, status, q } = req.query;
  const query = {};

  if (role) query.role = role;
  if (status) query.status = status;
  if (q) {
    query.$or = [
      { name: new RegExp(q, 'i') },
      { email: new RegExp(q, 'i') },
      { phone: new RegExp(q, 'i') }
    ];
  }

  const users = await User.find(query).sort({ createdAt: -1 });
  res.json(users);
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (req.params.id === req.user._id.toString()) {
    throw new ApiError(400, 'Admins cannot suspend their own account');
  }

  const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.json(user);
});
