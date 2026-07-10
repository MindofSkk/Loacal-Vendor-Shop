import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Category } from '../src/models/Category.js';
import { Product } from '../src/models/Product.js';
import { BUSINESS_TYPES, Shop, WEEK_DAYS } from '../src/models/Shop.js';
import { User } from '../src/models/User.js';
import { sampleCategories } from '../src/data/categories.js';

dotenv.config({ quiet: true });

const defaultPassword = 'Setup1234';
const bikiPassword = '123456';
const workingHours = WEEK_DAYS.map((day) => ({ day, openTime: '09:00', closeTime: '21:00', closed: false }));

const groceryProducts = [
  ['Aashirvaad Shudh Chakki Atta', 'Aashirvaad', '5 kg', 'Other', 265, 25, 'Fresh chakki atta for soft daily rotis.', 'fef3c7'],
  ['Fortune Sunlite Sunflower Oil', 'Fortune', '1 L', 'Oil', 145, 30, 'Light sunflower oil for daily cooking.', 'fff7ed'],
  ['India Gate Basmati Rice', 'India Gate', '5 kg', 'Rice', 620, 15, 'Long grain basmati rice for pulao and biryani.', 'ecfeff'],
  ['Tata Salt', 'Tata', '1 kg', 'Other', 28, 80, 'Iodized salt for everyday cooking.', 'f8fafc'],
  ['Surf Excel Easy Wash', 'Surf Excel', '1 kg', 'Household', 135, 28, 'Detergent powder for daily laundry.', 'dbeafe'],
  ['Parle-G Gluco Biscuit', 'Parle', '250 g', 'Snacks', 25, 90, 'Classic tea-time glucose biscuits.', 'ffedd5'],
  ['Maggi 2-Minute Noodles', 'Maggi', '560 g', 'Snacks', 112, 35, 'Family pack masala instant noodles.', 'fef9c3'],
  ['Red Label Tea', 'Red Label', '500 g', 'Other', 285, 18, 'Strong tea blend for Indian chai.', 'fee2e2'],
  ['Amul Taaza Toned Milk', 'Amul', '1 L', 'Other', 66, 24, 'Toned milk for tea, coffee, and breakfast.', 'eff6ff'],
  ['Mother Dairy Classic Curd', 'Mother Dairy', '400 g', 'Other', 45, 20, 'Thick curd for meals and raita.', 'f0fdf4'],
  ['Haldiram Aloo Bhujia', 'Haldiram', '400 g', 'Snacks', 99, 32, 'Crispy masala namkeen for snacking.', 'fff7ed'],
  ['Lay’s Classic Salted Chips', 'Lay’s', '52 g', 'Snacks', 20, 75, 'Salted potato chips.', 'fef3c7'],
  ['Coca-Cola Bottle', 'Coca-Cola', '750 ml', 'Cold Drinks', 45, 40, 'Chilled cola beverage.', 'fee2e2'],
  ['Thums Up Bottle', 'Thums Up', '750 ml', 'Cold Drinks', 45, 42, 'Strong fizzy cola drink.', 'e0f2fe'],
  ['Colgate Strong Teeth Toothpaste', 'Colgate', '150 g', 'Personal Care', 92, 36, 'Daily fluoride toothpaste.', 'f8fafc'],
  ['Lux Soft Glow Soap', 'Lux', '100 g', 'Personal Care', 38, 48, 'Fragrant bathing soap.', 'fce7f3'],
  ['Dettol Original Handwash', 'Dettol', '200 ml', 'Personal Care', 89, 26, 'Hygienic liquid handwash.', 'dcfce7'],
  ['Everest Turmeric Powder', 'Everest', '200 g', 'Other', 68, 30, 'Haldi powder for Indian cooking.', 'fef9c3'],
  ['Tata Sampann Toor Dal', 'Tata Sampann', '1 kg', 'Other', 178, 22, 'Unpolished toor dal for daily meals.', 'fef3c7'],
  ['Madhur Pure Sugar', 'Madhur', '1 kg', 'Other', 48, 50, 'White sugar crystals for tea and sweets.', 'f8fafc'],
  ['Daawat Rozana Rice', 'Daawat', '5 kg', 'Rice', 385, 16, 'Everyday rice for family meals.', 'ecfeff'],
  ['Fortune Mustard Oil', 'Fortune', '1 L', 'Oil', 168, 24, 'Kachi ghani mustard oil.', 'fef3c7'],
  ['Vim Dishwash Bar', 'Vim', '300 g', 'Household', 30, 65, 'Dishwash bar for utensils.', 'dcfce7'],
  ['Harpic Toilet Cleaner', 'Harpic', '500 ml', 'Household', 105, 22, 'Toilet cleaner for hygiene.', 'dbeafe'],
  ['Sprite Bottle', 'Sprite', '750 ml', 'Cold Drinks', 45, 32, 'Lemon-lime fizzy drink.', 'dcfce7']
];

const imageFor = (text, color = 'ecfdf5') =>
  `https://placehold.co/600x400/${color}/111827/png?text=${encodeURIComponent(text)}`;

const mapUrl = (latitude, longitude) => `https://www.google.com/maps?q=${latitude},${longitude}`;

const ensureUser = async ({ email, password, ...payload }) => {
  let user = await User.findOne({ email }).select('+password');

  if (!user) {
    return User.create({ email, password, ...payload });
  }

  Object.assign(user, payload);
  user.password = password;
  await user.save();
  return user;
};

const ensureCategories = async () => {
  for (const category of sampleCategories) {
    await Category.findOneAndUpdate({ slug: category.slug }, category, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    });
  }

  await Category.updateMany(
    { slug: { $nin: sampleCategories.map((category) => category.slug) } },
    { $set: { isActive: false } }
  );

  return Category.find({ slug: { $in: sampleCategories.map((category) => category.slug) } });
};

const categoryByName = (categories, name) => {
  const category = categories.find((item) => item.name === name);
  if (!category) throw new Error(`Missing category: ${name}`);
  return category;
};

const ensureShop = async ({ owner, category, ...payload }) => {
  const existing = await Shop.findOne({ owner: owner._id });
  const shopPayload = {
    ...payload,
    owner: owner._id,
    category: category._id,
    status: 'approved',
    workingHours,
    temporaryClosure: { enabled: false, reason: 'Holiday' },
    isOpen: true
  };

  if (!existing) {
    return Shop.create(shopPayload);
  }

  Object.assign(existing, shopPayload);
  await existing.save();
  return existing;
};

const seedBikiProducts = async (seller, shop, category) => {
  let upserted = 0;
  let updated = 0;

  for (const [name, brand, packSize, groceryCategory, price, stock, description, color] of groceryProducts) {
    const result = await Product.updateOne(
      { shop: shop._id, name },
      {
        $set: {
          seller: seller._id,
          shop: shop._id,
          category: category._id,
          businessType: 'Grocery / Kirana Store',
          name,
          brand,
          packSize,
          groceryCategory,
          description,
          price,
          stock,
          status: 'active',
          isDemoProduct: false,
          images: [
            {
              url: imageFor(name, color),
              publicId: `fresh-mvp/biki/${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
            }
          ]
        },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );

    if (result.upsertedCount) upserted += 1;
    else if (result.modifiedCount) updated += 1;
  }

  return { upserted, updated, total: groceryProducts.length };
};

const main = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('Missing MONGO_URI or MONGODB_URI in backend environment');

  await mongoose.connect(mongoUri);

  const categories = await ensureCategories();
  const groceryCategory = categoryByName(categories, 'Grocery / Kirana Store');
  const restaurantCategory = categoryByName(categories, 'Restaurant');

  const admin = await ensureUser({
    name: 'Admin User',
    email: 'admin@local.com',
    password: 'admin123',
    role: 'admin',
    phone: '9000000000',
    status: 'active'
  });

  const bikiSeller = await ensureUser({
    name: 'Biki Kirana Seller',
    email: 'biki@gmail.com',
    password: bikiPassword,
    role: 'seller',
    phone: '9876543210',
    status: 'active',
    address: {
      line1: 'Biki Kirana Store',
      area: 'Nagri',
      city: 'Ranchi',
      pincode: '835303',
      landmark: 'Near Main Road'
    }
  });

  const restaurantSeller = await ensureUser({
    name: 'Local Restaurant Seller',
    email: 'restaurant@localshop.in',
    password: defaultPassword,
    role: 'seller',
    phone: '9876500001',
    status: 'active',
    address: {
      line1: 'Spice Junction',
      area: 'Nagri',
      city: 'Ranchi',
      pincode: '835303',
      landmark: 'Market Road'
    }
  });

  const customer = await ensureUser({
    name: 'Local Customer',
    email: 'customer@localshop.in',
    password: defaultPassword,
    role: 'customer',
    phone: '9876500002',
    status: 'active',
    address: {
      line1: 'House 12',
      area: 'Nagri',
      city: 'Ranchi',
      pincode: '835303',
      landmark: 'Near school'
    }
  });

  const bikiShop = await ensureShop({
    owner: bikiSeller,
    category: groceryCategory,
    name: 'Biki Kirana Store',
    description: 'Daily grocery, kirana essentials, snacks, drinks, household, and personal care items in Ranchi.',
    businessType: 'Grocery / Kirana Store',
    phone: bikiSeller.phone,
    logoUrl: imageFor('Biki Kirana Store', 'dcfce7'),
    location: {
      area: 'Nagri',
      city: 'Ranchi',
      pincode: '835303',
      landmark: 'Near Main Road',
      latitude: 23.3441,
      longitude: 85.3096,
      mapUrl: mapUrl(23.3441, 85.3096)
    },
    deliveryRadiusKm: 3,
    deliverySettings: {
      radiusKm: 3,
      minimumOrder: 100,
      deliveryCharge: 20,
      freeDeliveryAbove: 400,
      estimatedDeliveryTime: '25-35 min'
    }
  });

  const restaurantShop = await ensureShop({
    owner: restaurantSeller,
    category: restaurantCategory,
    name: 'Spice Junction Restaurant',
    description: 'Fresh meals and snacks for nearby homes.',
    businessType: BUSINESS_TYPES[0],
    phone: restaurantSeller.phone,
    logoUrl: imageFor('Spice Junction', 'ffedd5'),
    location: {
      area: 'Nagri',
      city: 'Ranchi',
      pincode: '835303',
      landmark: 'Market Road',
      latitude: 23.347,
      longitude: 85.312,
      mapUrl: mapUrl(23.347, 85.312)
    },
    deliveryRadiusKm: 3,
    deliverySettings: {
      radiusKm: 3,
      minimumOrder: 150,
      deliveryCharge: 25,
      freeDeliveryAbove: 500,
      estimatedDeliveryTime: '30-40 min'
    }
  });

  const productResult = await seedBikiProducts(bikiSeller, bikiShop, groceryCategory);

  console.log('Fresh MVP seed completed');
  console.table([
    { type: 'admin', email: admin.email, password: 'admin123' },
    { type: 'seller', email: bikiSeller.email, password: bikiPassword, shop: bikiShop.name },
    { type: 'seller', email: restaurantSeller.email, password: defaultPassword, shop: restaurantShop.name },
    { type: 'customer', email: customer.email, password: defaultPassword },
    { type: 'products', shop: bikiShop.name, total: productResult.total, upserted: productResult.upserted, updated: productResult.updated }
  ]);
};

try {
  await main();
  await mongoose.disconnect();
  process.exit(0);
} catch (error) {
  console.error(error.message);
  await mongoose.disconnect();
  process.exit(1);
}
