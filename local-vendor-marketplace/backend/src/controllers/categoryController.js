import { Category } from '../models/Category.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const toSlug = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const listCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json(categories);
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, isActive = true } = req.body;
  const category = await Category.create({ name, slug: toSlug(name), description, isActive });
  res.status(201).json(category);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const update = { ...req.body };

  if (update.name) {
    update.slug = toSlug(update.name);
  }

  const category = await Category.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true
  });

  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  res.json(category);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);

  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  res.status(204).send();
});
