import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDatabase } from '../src/config/db.js';
import { sampleCategories } from '../src/data/categories.js';
import { Category } from '../src/models/Category.js';
import { Product } from '../src/models/Product.js';
import { Shop, WEEK_DAYS } from '../src/models/Shop.js';
import { User } from '../src/models/User.js';

dotenv.config();

const setupPassword = 'Setup1234';
const adminPassword = 'admin123';
const standardWorkingHours = WEEK_DAYS.map((day) => ({ day, openTime: '09:00', closeTime: '21:00', closed: false }));

const restaurantItems = [
  ['Paneer Tikka', 'Smoky paneer cubes with peppers', 180, 'Veg', 'Starter'],
  ['Chicken Tikka', 'Classic char-grilled chicken starter', 220, 'Non-Veg', 'Starter'],
  ['Veg Spring Roll', 'Crispy rolls with mixed vegetables', 120, 'Veg', 'Starter'],
  ['Chilli Chicken', 'Spicy Indo-Chinese chicken bites', 210, 'Non-Veg', 'Starter'],
  ['Dal Makhani', 'Slow-cooked black lentils with butter', 160, 'Veg', 'Main Course'],
  ['Butter Chicken', 'Creamy tomato gravy with chicken', 280, 'Non-Veg', 'Main Course'],
  ['Paneer Butter Masala', 'Paneer in rich makhani gravy', 230, 'Veg', 'Main Course'],
  ['Chicken Biryani', 'Aromatic rice with chicken and spices', 260, 'Non-Veg', 'Main Course'],
  ['Masala Dosa', 'Crisp dosa with potato masala', 110, 'Veg', 'Snacks'],
  ['Egg Roll', 'Paratha roll with egg and onion', 100, 'Non-Veg', 'Snacks'],
  ['Veg Burger', 'Vegetable patty with house sauce', 130, 'Veg', 'Snacks'],
  ['Chicken Sandwich', 'Grilled chicken sandwich', 150, 'Non-Veg', 'Snacks'],
  ['Fresh Lime Soda', 'Sweet and salted lime soda', 70, 'Veg', 'Drinks'],
  ['Cold Coffee', 'Chilled coffee with milk', 120, 'Veg', 'Drinks'],
  ['Mango Lassi', 'Thick mango yogurt drink', 100, 'Veg', 'Drinks'],
  ['Masala Chai', 'Indian spiced tea', 40, 'Veg', 'Drinks'],
  ['Gulab Jamun', 'Warm syrup-soaked dessert', 80, 'Veg', 'Dessert'],
  ['Chocolate Brownie', 'Dense chocolate brownie', 130, 'Veg', 'Dessert'],
  ['Ice Cream Sundae', 'Vanilla ice cream with toppings', 140, 'Veg', 'Dessert'],
  ['Caramel Custard', 'Silky egg custard with caramel', 110, 'Non-Veg', 'Dessert']
];

const groceryProducts = [
  ['India Gate Basmati Rice', 'India Gate', '1 kg', 145, 35, 'Rice'],
  ['Daawat Rozana Rice', 'Daawat', '1 kg', 110, 42, 'Rice'],
  ['Sona Masoori Rice', 'Local Gold', '5 kg', 310, 18, 'Rice'],
  ['Brown Rice', 'Healthy Bowl', '1 kg', 160, 14, 'Rice'],
  ['Poha Thick', 'Kirana Fresh', '500 g', 45, 28, 'Rice'],
  ['Fortune Sunflower Oil', 'Fortune', '1 L', 145, 25, 'Oil'],
  ['Saffola Gold Oil', 'Saffola', '1 L', 185, 20, 'Oil'],
  ['Mustard Oil', 'Dhara', '1 L', 170, 22, 'Oil'],
  ['Groundnut Oil', 'Local Press', '1 L', 210, 12, 'Oil'],
  ['Ghee Pouch', 'Amul', '500 ml', 310, 16, 'Oil'],
  ['Lays Classic Salted', 'Lays', '52 g', 20, 80, 'Snacks'],
  ['Kurkure Masala Munch', 'Kurkure', '75 g', 20, 75, 'Snacks'],
  ['Haldiram Aloo Bhujia', 'Haldiram', '200 g', 55, 38, 'Snacks'],
  ['Bingo Mad Angles', 'Bingo', '72 g', 20, 60, 'Snacks'],
  ['Parle-G Biscuits', 'Parle', '250 g', 35, 90, 'Snacks'],
  ['Good Day Cashew', 'Britannia', '200 g', 45, 65, 'Snacks'],
  ['Hide & Seek', 'Parle', '120 g', 35, 50, 'Snacks'],
  ['Marie Gold', 'Britannia', '250 g', 40, 52, 'Snacks'],
  ['Coca-Cola Bottle', 'Coca-Cola', '750 ml', 40, 48, 'Cold Drinks'],
  ['Pepsi Bottle', 'Pepsi', '750 ml', 40, 45, 'Cold Drinks'],
  ['Sprite Bottle', 'Sprite', '750 ml', 40, 42, 'Cold Drinks'],
  ['Thums Up Bottle', 'Thums Up', '750 ml', 40, 46, 'Cold Drinks'],
  ['Frooti Tetra Pack', 'Frooti', '160 ml', 10, 100, 'Cold Drinks'],
  ['Real Mixed Fruit Juice', 'Real', '1 L', 115, 20, 'Cold Drinks'],
  ['Red Bull Can', 'Red Bull', '250 ml', 125, 18, 'Cold Drinks'],
  ['Surf Excel Quick Wash', 'Surf Excel', '1 kg', 185, 24, 'Household'],
  ['Tide Plus Detergent', 'Tide', '1 kg', 135, 28, 'Household'],
  ['Vim Dishwash Bar', 'Vim', '300 g', 30, 70, 'Household'],
  ['Harpic Bathroom Cleaner', 'Harpic', '500 ml', 105, 24, 'Household'],
  ['Lizol Floor Cleaner', 'Lizol', '975 ml', 210, 18, 'Household'],
  ['Good Knight Refill', 'Good Knight', '45 ml', 85, 30, 'Household'],
  ['Aluminium Foil', 'Freshwrap', '9 m', 95, 22, 'Household'],
  ['Garbage Bags Medium', 'Clean Home', '30 pcs', 120, 15, 'Household'],
  ['Colgate Strong Teeth', 'Colgate', '200 g', 105, 36, 'Personal Care'],
  ['Closeup Toothpaste', 'Closeup', '150 g', 95, 32, 'Personal Care'],
  ['Dove Soap', 'Dove', '100 g', 65, 40, 'Personal Care'],
  ['Lifebuoy Soap Pack', 'Lifebuoy', '4 x 100 g', 120, 26, 'Personal Care'],
  ['Clinic Plus Shampoo', 'Clinic Plus', '340 ml', 185, 20, 'Personal Care'],
  ['Head & Shoulders Shampoo', 'Head & Shoulders', '180 ml', 195, 18, 'Personal Care'],
  ['Nivea Body Lotion', 'Nivea', '400 ml', 360, 10, 'Personal Care'],
  ['Dettol Handwash', 'Dettol', '750 ml', 145, 24, 'Personal Care'],
  ['Aashirvaad Atta', 'Aashirvaad', '5 kg', 260, 30, 'Other'],
  ['Tata Salt', 'Tata', '1 kg', 28, 100, 'Other'],
  ['Sugar', 'Madhur', '1 kg', 48, 70, 'Other'],
  ['Tea Powder', 'Tata Tea', '500 g', 265, 20, 'Other'],
  ['Nescafe Classic', 'Nescafe', '50 g', 165, 18, 'Other'],
  ['Maggi Noodles', 'Maggi', '12 pack', 168, 30, 'Other'],
  ['Kissan Mixed Fruit Jam', 'Kissan', '500 g', 165, 16, 'Other'],
  ['Amul Butter', 'Amul', '500 g', 285, 20, 'Other'],
  ['Mother Dairy Curd', 'Mother Dairy', '400 g', 45, 25, 'Other']
];

const dairyBakeryProducts = [
  ['Fresh Paneer', 'Dairy', '250 g', 80, true],
  ['Cow Milk', 'Dairy', '1 L', 64, true],
  ['Buffalo Milk', 'Dairy', '1 L', 78, true],
  ['Plain Curd', 'Dairy', '400 g', 45, true],
  ['Greek Yogurt', 'Dairy', '200 g', 95, true],
  ['Salted Butter', 'Dairy', '500 g', 285, true],
  ['Cheese Slices', 'Dairy', '200 g', 145, true],
  ['Fresh Cream', 'Dairy', '250 ml', 75, true],
  ['White Bread', 'Bakery', '400 g', 45, true],
  ['Brown Bread', 'Bakery', '400 g', 55, true],
  ['Pav Pack', 'Bakery', '6 pcs', 40, true],
  ['Chocolate Muffin', 'Bakery', '2 pcs', 90, true],
  ['Vanilla Cake Slice', 'Bakery', '1 pc', 75, true],
  ['Garlic Bread', 'Bakery', '200 g', 95, true],
  ['Atta Cookies', 'Bakery', '250 g', 120, true]
];

const upsertUser = async ({ name, email, role, phone, address, password = setupPassword }) => {
  let user = await User.findOne({ email }).select('+password');

  if (!user) {
    return User.create({ name, email, password, role, phone, address, status: 'active' });
  }

  user.name = name;
  user.password = password;
  user.role = role;
  user.phone = phone;
  user.address = address;
  user.status = 'active';
  await user.save();
  return user;
};

const seedCategories = async () => {
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

  return Category.find({ slug: { $in: sampleCategories.map((category) => category.slug) } });
};

const main = async () => {
  await connectDatabase();

  const categories = await seedCategories();
  const categoryByName = Object.fromEntries(categories.map((category) => [category.name, category]));

  const adminUser = await upsertUser({
    name: 'Admin User',
    email: 'admin@local.com',
    role: 'admin',
    phone: '9876500000',
    address: { line1: 'Admin Office', area: 'Central Market', city: 'Local City', pincode: '110001' },
    password: adminPassword
  });

  const restaurantSeller = await upsertUser({
    name: 'Amit Restaurant Seller',
    email: 'restaurant.seller@local.test',
    role: 'seller',
    phone: '9876501001',
    address: { line1: 'Shop 12, Food Street', area: 'Central Market', city: 'Local City', pincode: '110001' }
  });

  const grocerySeller = await upsertUser({
    name: 'Neha Kirana Seller',
    email: 'grocery.seller@local.test',
    role: 'seller',
    phone: '9876501002',
    address: { line1: 'Shop 3, Main Bazaar', area: 'Central Market', city: 'Local City', pincode: '110001' }
  });

  const dairySeller = await upsertUser({
    name: 'Pooja Dairy Seller',
    email: 'dairy.seller@local.test',
    role: 'seller',
    phone: '9876501003',
    address: { line1: 'Shop 8, Bakery Lane', area: 'Central Market', city: 'Local City', pincode: '110001' }
  });

  const customers = await Promise.all([
    upsertUser({
      name: 'Rahul Customer',
      email: 'rahul.customer@local.test',
      role: 'customer',
      phone: '9876502001',
      address: { line1: 'Flat 201, Green Homes', area: 'Central Market', city: 'Local City', pincode: '110001', landmark: 'Near city park' }
    }),
    upsertUser({
      name: 'Priya Customer',
      email: 'priya.customer@local.test',
      role: 'customer',
      phone: '9876502002',
      address: { line1: 'House 45, Lake View Road', area: 'Lake Colony', city: 'Local City', pincode: '110002', landmark: 'Opposite temple' }
    }),
    upsertUser({
      name: 'Imran Customer',
      email: 'imran.customer@local.test',
      role: 'customer',
      phone: '9876502003',
      address: { line1: 'B-14, Sunrise Apartments', area: 'Station Road', city: 'Local City', pincode: '110003', landmark: 'Near metro gate' }
    })
  ]);

  const restaurantShop = await Shop.findOneAndUpdate(
    { owner: restaurantSeller._id },
    {
      owner: restaurantSeller._id,
      name: 'Spice Junction Restaurant',
      description: 'Fresh Indian meals, snacks, drinks, and desserts for nearby homes.',
      category: categoryByName.Restaurant._id,
      businessType: 'Restaurant',
      phone: '9876501001',
      location: { area: 'Central Market', city: 'Local City', pincode: '110001', landmark: 'Near clock tower', latitude: 28.6139, longitude: 77.209 },
      deliveryRadiusKm: 6,
      deliverySettings: { radiusKm: 6, minimumOrder: 150, deliveryCharge: 25, freeDeliveryAbove: 500, estimatedDeliveryTime: '30 Minutes' },
      temporaryClosure: { enabled: false, reason: 'Holiday' },
      workingHours: standardWorkingHours,
      status: 'approved',
      isOpen: true,
      deliveryBoys: [
        { name: 'Ravi Rider', phone: '9876510001' },
        { name: 'Sohan Delivery', phone: '9876510002' }
      ]
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const groceryShop = await Shop.findOneAndUpdate(
    { owner: grocerySeller._id },
    {
      owner: grocerySeller._id,
      name: 'Daily Needs Kirana',
      description: 'Rice, oil, snacks, cold drinks, household, and personal care essentials.',
      category: categoryByName['Grocery / Kirana Store']._id,
      businessType: 'Grocery / Kirana Store',
      phone: '9876501002',
      location: { area: 'Central Market', city: 'Local City', pincode: '110001', landmark: 'Next to pharmacy', latitude: 28.6145, longitude: 77.2085 },
      deliveryRadiusKm: 5,
      deliverySettings: { radiusKm: 5, minimumOrder: 100, deliveryCharge: 20, freeDeliveryAbove: 400, estimatedDeliveryTime: '25 Minutes' },
      temporaryClosure: { enabled: false, reason: 'Holiday' },
      workingHours: standardWorkingHours,
      status: 'approved',
      isOpen: true,
      deliveryBoys: [
        { name: 'Manoj Delivery', phone: '9876520001' },
        { name: 'Karan Helper', phone: '9876520002' }
      ]
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const dairyShop = await Shop.findOneAndUpdate(
    { owner: dairySeller._id },
    {
      owner: dairySeller._id,
      name: 'Morning Fresh Dairy & Bakery',
      description: 'Fresh milk, paneer, bread, cakes, and bakery items for same-day delivery.',
      category: categoryByName['Dairy and Bakery']._id,
      businessType: 'Dairy and Bakery',
      phone: '9876501003',
      location: { area: 'Central Market', city: 'Local City', pincode: '110001', landmark: 'Near bakery lane', latitude: 28.615, longitude: 77.2078 },
      deliveryRadiusKm: 4,
      deliverySettings: { radiusKm: 4, minimumOrder: 120, deliveryCharge: 20, freeDeliveryAbove: 350, estimatedDeliveryTime: '20 Minutes' },
      temporaryClosure: { enabled: false, reason: 'Holiday' },
      workingHours: standardWorkingHours,
      status: 'approved',
      isOpen: true,
      deliveryBoys: [
        { name: 'Arjun Delivery', phone: '9876530001' },
        { name: 'Deepak Runner', phone: '9876530002' }
      ]
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Product.deleteMany({ shop: { $in: [restaurantShop._id, groceryShop._id, dairyShop._id] } });

  const restaurantProducts = restaurantItems.map(([name, description, price, vegType, foodCategory]) => ({
    seller: restaurantSeller._id,
    shop: restaurantShop._id,
    category: categoryByName.Restaurant._id,
    businessType: 'Restaurant',
    name,
    description,
    price,
    stock: 0,
    vegType,
    foodCategory,
    status: 'active'
  }));

  const groceryProductDocs = groceryProducts.map(([name, brand, packSize, price, stock, groceryCategory]) => ({
    seller: grocerySeller._id,
    shop: groceryShop._id,
    category: categoryByName['Grocery / Kirana Store']._id,
    businessType: 'Grocery / Kirana Store',
    name,
    description: `${brand} ${packSize} pack available for local delivery.`,
    price,
    stock,
    brand,
    packSize,
    groceryCategory,
    status: 'active'
  }));

  const dairyProductDocs = dairyBakeryProducts.map(([name, dairyBakeryType, packSize, price, freshStockToday]) => ({
    seller: dairySeller._id,
    shop: dairyShop._id,
    category: categoryByName['Dairy and Bakery']._id,
    businessType: 'Dairy and Bakery',
    name,
    description: `${name} available fresh for local delivery.`,
    price,
    stock: 0,
    packSize,
    dairyBakeryType,
    freshStockToday,
    status: 'active'
  }));

  await Product.insertMany([...restaurantProducts, ...groceryProductDocs, ...dairyProductDocs]);

  console.log('Quick setup data seeded successfully');
  console.table([
    { role: 'admin', email: adminUser.email, password: adminPassword, shop: '-', products: '-' },
    { role: 'seller', email: restaurantSeller.email, password: setupPassword, shop: restaurantShop.name, products: restaurantProducts.length },
    { role: 'seller', email: grocerySeller.email, password: setupPassword, shop: groceryShop.name, products: groceryProductDocs.length },
    { role: 'seller', email: dairySeller.email, password: setupPassword, shop: dairyShop.name, products: dairyProductDocs.length },
    ...customers.map((customer) => ({ role: 'customer', email: customer.email, password: setupPassword, shop: '-', products: '-' }))
  ]);
};

try {
  await main();
  await mongoose.disconnect();
  process.exit(0);
} catch (error) {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
}
