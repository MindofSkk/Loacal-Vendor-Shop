import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDatabase } from '../src/config/db.js';
import { sampleCategories } from '../src/data/categories.js';
import { Category } from '../src/models/Category.js';
import { Product } from '../src/models/Product.js';
import { Shop } from '../src/models/Shop.js';
import { User } from '../src/models/User.js';

dotenv.config();

const sellerEmail = 'biki@gmail.com';
const sellerPassword = '123456';
const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const standardWorkingHours = weekDays.map((day) => ({ day, openTime: '09:00', closeTime: '21:00', closed: false }));

const imageFor = (text, color = 'ecfdf5') =>
  `https://placehold.co/600x400/${color}/111827/png?text=${encodeURIComponent(text)}`;

const products = [
  ['Aashirvaad Shudh Chakki Atta', 'Aashirvaad', '5 kg', 'kg', 'Other', 265, 310, 25, 'Fresh chakki atta made from selected wheat grains, ideal for soft rotis and daily home cooking.', 'fef3c7'],
  ['Fortune Sunlite Refined Sunflower Oil', 'Fortune', '1 L', 'liter', 'Oil', 145, 170, 30, 'Light refined sunflower oil suitable for everyday cooking, frying, and sauteing.', 'fff7ed'],
  ['India Gate Basmati Rice', 'India Gate', '5 kg', 'kg', 'Rice', 620, 720, 15, 'Long-grain basmati rice with rich aroma, perfect for biryani, pulao, and daily meals.', 'ecfeff'],
  ['Tata Salt', 'Tata', '1 kg', 'kg', 'Other', 28, 32, 80, 'Vacuum evaporated iodized salt for everyday cooking and seasoning.', 'f8fafc'],
  ['Surf Excel Easy Wash Detergent', 'Surf Excel', '1 kg', 'kg', 'Household', 135, 155, 28, 'Detergent powder for effective stain removal and fresh daily laundry.', 'dbeafe'],
  ['Parle-G Original Gluco Biscuit', 'Parle', '250 g', 'g', 'Snacks', 25, 30, 90, 'Classic glucose biscuits for tea time, snacks, and kids tiffin.', 'ffedd5'],
  ['Maggi 2-Minute Noodles Family Pack', 'Maggi', '560 g', 'g', 'Other', 112, 130, 35, 'Masala instant noodles family pack for quick evening snacks.', 'fef9c3'],
  ['Brooke Bond Red Label Tea', 'Red Label', '500 g', 'g', 'Other', 285, 330, 18, 'Rich and strong tea blend for refreshing Indian chai.', 'fee2e2'],
  ['Amul Taaza Toned Milk', 'Amul', '1 L', 'liter', 'Other', 66, 70, 24, 'Toned milk for tea, coffee, cereals, and daily home use.', 'eff6ff'],
  ['Mother Dairy Classic Curd', 'Mother Dairy', '400 g', 'g', 'Other', 45, 50, 20, 'Thick and creamy curd for meals, raita, and snacks.', 'f0fdf4'],
  ['Haldiram Aloo Bhujia', 'Haldiram', '400 g', 'g', 'Snacks', 99, 120, 32, 'Crispy potato and gram flour namkeen with classic masala taste.', 'fff7ed'],
  ['Lay\'s Classic Salted Chips', 'Lay\'s', '52 g', 'g', 'Snacks', 20, 20, 75, 'Light salted potato chips for quick snacking.', 'fef3c7'],
  ['Coca-Cola Bottle', 'Coca-Cola', '750 ml', 'ml', 'Cold Drinks', 45, 50, 40, 'Chilled cola beverage for meals, snacks, and gatherings.', 'fee2e2'],
  ['Thums Up Bottle', 'Thums Up', '750 ml', 'ml', 'Cold Drinks', 45, 50, 42, 'Strong fizzy cola drink, best served chilled.', 'e0f2fe'],
  ['Colgate Strong Teeth Toothpaste', 'Colgate', '150 g', 'g', 'Personal Care', 92, 110, 36, 'Fluoride toothpaste for strong teeth and everyday oral care.', 'f8fafc'],
  ['Lux Soft Glow Soap', 'Lux', '100 g', 'piece', 'Personal Care', 38, 45, 48, 'Fragrant bathing soap for fresh and soft skin feel.', 'fce7f3'],
  ['Dettol Original Handwash', 'Dettol', '200 ml', 'ml', 'Personal Care', 89, 99, 26, 'Liquid handwash for hygienic everyday hand cleaning.', 'dcfce7'],
  ['Everest Turmeric Powder', 'Everest', '200 g', 'g', 'Other', 68, 82, 30, 'Haldi powder made from selected turmeric for Indian cooking.', 'fef9c3'],
  ['Everest Tikhalal Red Chilli Powder', 'Everest', '200 g', 'g', 'Other', 92, 110, 24, 'Bright and spicy red chilli powder for curries and tadka.', 'fee2e2'],
  ['Tata Sampann Toor Dal', 'Tata Sampann', '1 kg', 'kg', 'Other', 178, 210, 22, 'Unpolished toor dal rich in taste and protein for daily meals.', 'fef3c7'],
  ['Tata Sampann Chana Dal', 'Tata Sampann', '1 kg', 'kg', 'Other', 95, 120, 26, 'Quality chana dal for dal, snacks, and traditional recipes.', 'fffbeb'],
  ['Madhur Pure Sugar', 'Madhur', '1 kg', 'kg', 'Other', 48, 55, 50, 'Clean white sugar crystals for tea, sweets, and desserts.', 'f8fafc'],
  ['Kirana Fresh Thick Poha', 'Kirana Fresh', '1 kg', 'kg', 'Rice', 68, 85, 35, 'Thick flattened rice for breakfast poha and quick snacks.', 'fefce8'],
  ['Britannia White Bread', 'Britannia', '400 g', 'g', 'Other', 45, 50, 18, 'Soft white bread for sandwiches, toast, and breakfast.', 'f5f5f4'],
  ['Amul Butter', 'Amul', '100 g', 'g', 'Other', 58, 62, 20, 'Creamy salted butter for bread, parathas, and cooking.', 'fef9c3'],
  ['Britannia Good Day Cashew Biscuit', 'Britannia', '200 g', 'g', 'Snacks', 45, 50, 45, 'Crunchy cashew cookies for tea-time snacking.', 'ffedd5'],
  ['Vim Dishwash Bar', 'Vim', '300 g', 'g', 'Household', 30, 35, 65, 'Dishwash bar for tough grease cleaning and fresh utensils.', 'dcfce7'],
  ['Harpic Power Plus Toilet Cleaner', 'Harpic', '500 ml', 'ml', 'Household', 105, 120, 22, 'Toilet cleaner for stain removal, hygiene, and freshness.', 'dbeafe'],
  ['Daawat Rozana Super Rice', 'Daawat', '5 kg', 'kg', 'Rice', 385, 440, 16, 'Everyday rice with good grain length for regular family meals.', 'ecfeff'],
  ['Fortune Kachi Ghani Mustard Oil', 'Fortune', '1 L', 'liter', 'Oil', 168, 195, 24, 'Strong aromatic mustard oil for pickles, curries, and frying.', 'fef3c7'],
  ['Saffola Gold Refined Oil', 'Saffola', '1 L', 'liter', 'Oil', 185, 215, 20, 'Blended refined oil suitable for light and healthy cooking.', 'fff7ed'],
  ['Amul Pure Ghee', 'Amul', '500 ml', 'ml', 'Oil', 345, 390, 12, 'Rich pure ghee for sweets, dal tadka, and daily cooking.', 'fef9c3'],
  ['Kissan Fresh Tomato Ketchup', 'Kissan', '500 g', 'g', 'Other', 115, 140, 20, 'Tomato ketchup for sandwiches, pakoras, noodles, and snacks.', 'fee2e2'],
  ['Nescafe Classic Coffee', 'Nescafe', '50 g', 'g', 'Other', 165, 185, 18, 'Instant coffee powder for hot and cold coffee recipes.', 'f5f5f4'],
  ['Tide Plus Detergent Powder', 'Tide', '1 kg', 'kg', 'Household', 125, 145, 24, 'Laundry detergent powder for bright and clean clothes.', 'eff6ff'],
  ['Lizol Citrus Floor Cleaner', 'Lizol', '975 ml', 'ml', 'Household', 205, 235, 16, 'Disinfectant floor cleaner with fresh citrus fragrance.', 'ecfdf5'],
  ['Clinic Plus Strong & Long Shampoo', 'Clinic Plus', '340 ml', 'ml', 'Personal Care', 185, 220, 16, 'Daily shampoo for strong and healthy-looking hair.', 'dbeafe'],
  ['Dove Cream Beauty Bathing Bar', 'Dove', '100 g', 'piece', 'Personal Care', 65, 75, 24, 'Moisturizing bathing bar for soft and smooth skin.', 'f8fafc'],
  ['Sprite Lemon-Lime Bottle', 'Sprite', '750 ml', 'ml', 'Cold Drinks', 45, 50, 32, 'Refreshing lemon-lime fizzy drink for chilled serving.', 'dcfce7'],
  ['Real Mixed Fruit Juice', 'Real', '1 L', 'liter', 'Cold Drinks', 115, 135, 14, 'Mixed fruit juice for breakfast, snacks, and family refreshment.', 'ffedd5']
];

const seedCategories = async () => {
  for (const category of sampleCategories) {
    await Category.findOneAndUpdate({ slug: category.slug }, category, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    });
  }

  return Category.findOne({ slug: 'grocery-kirana-store' });
};

const findOrCreateSeller = async () => {
  let seller = await User.findOne({ email: sellerEmail });

  if (!seller) {
    seller = await User.create({
      name: 'Biki Kirana Seller',
      email: sellerEmail,
      password: sellerPassword,
      role: 'seller',
      phone: '9876543210',
      status: 'active',
      address: {
        line1: 'Biki Kirana Store',
        area: 'Ranchi',
        city: 'Ranchi',
        pincode: '834001',
        landmark: 'Near Main Road'
      }
    });
  }

  if (seller.role !== 'seller') {
    seller.role = 'seller';
    seller.status = 'active';
    await seller.save();
  }

  return seller;
};

const findOrCreateShop = async (seller, groceryCategory) => {
  let shop = await Shop.findOne({ owner: seller._id });

  if (!shop) {
    shop = await Shop.create({
      owner: seller._id,
      name: 'Biki Kirana Store',
      description: 'Daily grocery, kirana essentials, snacks, drinks, household, and personal care items in Ranchi.',
      category: groceryCategory._id,
      businessType: 'Grocery / Kirana Store',
      phone: seller.phone || '9876543210',
      logoUrl: imageFor('Biki Kirana Store', 'dcfce7'),
      location: {
        area: 'Ranchi',
        city: 'Ranchi',
        pincode: '834001',
        landmark: 'Near Main Road',
        latitude: 23.3441,
        longitude: 85.3096
      },
      deliveryRadiusKm: 3,
      workingHours: standardWorkingHours,
      deliverySettings: {
        radiusKm: 3,
        minimumOrder: 100,
        deliveryCharge: 20,
        freeDeliveryAbove: 400,
        estimatedDeliveryTime: '25-35 min'
      },
      temporaryClosure: { enabled: false, reason: 'Holiday' },
      status: 'approved',
      isOpen: true
    });
  } else {
    shop.category = shop.category || groceryCategory._id;
    shop.businessType = 'Grocery / Kirana Store';
    shop.status = shop.status === 'suspended' ? shop.status : 'approved';
    shop.isOpen = true;
    shop.deliveryRadiusKm = shop.deliveryRadiusKm || 3;
    shop.deliverySettings = {
      radiusKm: shop.deliverySettings?.radiusKm || 3,
      minimumOrder: shop.deliverySettings?.minimumOrder ?? 100,
      deliveryCharge: shop.deliverySettings?.deliveryCharge ?? 20,
      freeDeliveryAbove: shop.deliverySettings?.freeDeliveryAbove ?? 400,
      estimatedDeliveryTime: shop.deliverySettings?.estimatedDeliveryTime || '25-35 min'
    };
    await shop.save();
  }

  return shop;
};

const main = async () => {
  await connectDatabase();

  const groceryCategory = await seedCategories();
  if (!groceryCategory) {
    throw new Error('Grocery / Kirana Store category could not be created');
  }

  const seller = await findOrCreateSeller();
  const shop = await findOrCreateShop(seller, groceryCategory);

  let upserted = 0;
  let updated = 0;

  for (const [name, brand, packSize, unit, groceryCategoryName, price, mrp, stock, description, color] of products) {
    const result = await Product.updateOne(
      { shop: shop._id, name },
      {
        $set: {
          seller: seller._id,
          shop: shop._id,
          category: groceryCategory._id,
          businessType: 'Grocery / Kirana Store',
          name,
          brand,
          packSize,
          description: `${description} Pack size: ${packSize}. Unit: ${unit}. MRP Rs.${mrp}.`,
          price,
          stock,
          groceryCategory: groceryCategoryName,
          images: [{ url: imageFor(name, color), publicId: `seed-biki/${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` }],
          status: 'active'
        },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );

    if (result.upsertedCount) upserted += 1;
    else updated += result.modifiedCount ? 1 : 0;
  }

  const total = await Product.countDocuments({ shop: shop._id, businessType: 'Grocery / Kirana Store' });

  console.log('Biki grocery products seeded successfully');
  console.table([
    {
      seller: seller.email,
      shop: shop.name,
      upserted,
      updated,
      requestedProducts: products.length,
      totalGroceryProductsInShop: total
    }
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
