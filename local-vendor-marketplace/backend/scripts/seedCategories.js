import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDatabase } from '../src/config/db.js';
import { sampleCategories } from '../src/data/categories.js';
import { Category } from '../src/models/Category.js';

dotenv.config();

try {
  await connectDatabase();

  for (const category of sampleCategories) {
    await Category.findOneAndUpdate({ slug: category.slug }, category, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    });
  }

  await Category.updateMany(
    { slug: { $nin: sampleCategories.map((category) => category.slug) } },
    { isActive: false }
  );

  console.log(`Seeded ${sampleCategories.length} categories`);
  await mongoose.disconnect();
  process.exit(0);
} catch (error) {
  console.error(error.message);
  await mongoose.disconnect();
  process.exit(1);
}
