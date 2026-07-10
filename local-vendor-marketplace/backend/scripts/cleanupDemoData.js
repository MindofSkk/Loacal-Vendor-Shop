import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Category } from '../src/models/Category.js';
import { Order } from '../src/models/Order.js';
import { Product } from '../src/models/Product.js';
import { Shop } from '../src/models/Shop.js';
import { User } from '../src/models/User.js';

dotenv.config({ quiet: true });

const dryRun = process.env.DRY_RUN !== 'false' && !process.argv.includes('--run');
const protectedEmails = new Set(['admin@local.com', 'biki@gmail.com']);
const demoEmailPattern = /(test|demo|sample|dummy|local\.test|test\.local|example\.com)/i;
const demoNamePattern = /\b(test|demo|sample|dummy)\b/i;
const knownDemoShopNames = new Set([
  'Restaurant A',
  'Grocery / Kirana Store B',
  'Dairy and Bakery C',
  'Restaurant Reject',
  'Daily Needs Kirana',
  'Morning Fresh Dairy & Bakery'
]);

const toIds = (docs) => docs.map((doc) => doc._id);
const asIdStrings = (ids) => ids.map((id) => String(id));

const summarize = (label, docs, pick) => {
  console.log(`\n${label}: ${docs.length}`);
  console.table(docs.map(pick));
};

const countAll = async () => ({
  users: await User.countDocuments(),
  shops: await Shop.countDocuments(),
  products: await Product.countDocuments(),
  orders: await Order.countDocuments(),
  categories: await Category.countDocuments()
});

const findDuplicateCategories = async () => {
  const categories = await Category.find().sort({ createdAt: 1 }).lean();
  const grouped = categories.reduce((acc, category) => {
    const key = String(category.name || '').trim().toLowerCase();
    acc[key] = acc[key] || [];
    acc[key].push(category);
    return acc;
  }, {});

  return Object.values(grouped)
    .filter((group) => group.length > 1)
    .flatMap((group) => group.slice(1));
};

const main = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('Missing MONGO_URI or MONGODB_URI in backend environment');
  }

  await mongoose.connect(mongoUri);

  console.log(`Cleanup mode: ${dryRun ? 'DRY_RUN - no records will be deleted' : 'RUN - matching records will be deleted'}`);
  console.log('\nRecord counts before cleanup:');
  console.table(await countAll());

  const users = await User.find({}, 'name email role status').lean();
  const shops = await Shop.find({}, 'name status owner businessType').populate('owner', 'email name role').lean();

  const approvedShopOwnerIds = new Set(
    shops.filter((shop) => shop.status === 'approved').map((shop) => String(shop.owner?._id || shop.owner))
  );

  const demoUsers = users.filter((user) => {
    const email = String(user.email || '').toLowerCase();
    if (user.role === 'admin' || protectedEmails.has(email)) return false;
    if (approvedShopOwnerIds.has(String(user._id))) return false;
    return demoEmailPattern.test(email) || demoNamePattern.test(user.name || '');
  });

  const demoUserIds = new Set(asIdStrings(toIds(demoUsers)));
  const demoShops = shops.filter((shop) => {
    const ownerEmail = String(shop.owner?.email || '').toLowerCase();
    if (shop.status === 'approved') return false;
    if (ownerEmail === 'biki@gmail.com') return false;
    return (
      demoNamePattern.test(shop.name || '') ||
      knownDemoShopNames.has(shop.name) ||
      demoUserIds.has(String(shop.owner?._id || shop.owner)) ||
      demoEmailPattern.test(ownerEmail)
    );
  });

  const demoShopIds = new Set(asIdStrings(toIds(demoShops)));
  const demoProducts = await Product.find({
    $or: [{ isDemoProduct: true }, { shop: { $in: [...demoShopIds] } }]
  })
    .select('name shop isDemoProduct')
    .populate('shop', 'name status')
    .lean();

  const demoOrders = await Order.find({
    $or: [{ customer: { $in: [...demoUserIds] } }, { shop: { $in: [...demoShopIds] } }]
  })
    .select('customer shop status subtotal')
    .populate('customer', 'email name')
    .populate('shop', 'name status')
    .lean();

  const duplicateCategories = await findDuplicateCategories();

  summarize('Demo/test users selected', demoUsers, (user) => ({
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status
  }));
  summarize('Demo/test shops selected', demoShops, (shop) => ({
    name: shop.name,
    status: shop.status,
    ownerEmail: shop.owner?.email,
    businessType: shop.businessType
  }));
  summarize('Products selected', demoProducts, (product) => ({
    name: product.name,
    shop: product.shop?.name,
    isDemoProduct: product.isDemoProduct
  }));
  summarize('Orders selected', demoOrders, (order) => ({
    id: String(order._id).slice(-8),
    customer: order.customer?.email,
    shop: order.shop?.name,
    status: order.status
  }));
  summarize('Duplicate categories selected', duplicateCategories, (category) => ({
    id: String(category._id),
    name: category.name,
    slug: category.slug
  }));

  if (dryRun) {
    console.log('\nDry run complete. Set DRY_RUN=false or pass --run to delete these records.');
    return;
  }

  const demoProductIds = toIds(demoProducts);
  const demoOrderIds = toIds(demoOrders);
  const duplicateCategoryIds = toIds(duplicateCategories);

  const results = {
    orders: demoOrderIds.length ? await Order.deleteMany({ _id: { $in: demoOrderIds } }) : { deletedCount: 0 },
    products: demoProductIds.length ? await Product.deleteMany({ _id: { $in: demoProductIds } }) : { deletedCount: 0 },
    shops: demoShopIds.size ? await Shop.deleteMany({ _id: { $in: [...demoShopIds] } }) : { deletedCount: 0 },
    users: demoUserIds.size ? await User.deleteMany({ _id: { $in: [...demoUserIds] } }) : { deletedCount: 0 },
    duplicateCategories: duplicateCategoryIds.length
      ? await Category.deleteMany({ _id: { $in: duplicateCategoryIds } })
      : { deletedCount: 0 }
  };

  console.log('\nDeleted records:');
  console.table({
    orders: results.orders.deletedCount,
    products: results.products.deletedCount,
    shops: results.shops.deletedCount,
    users: results.users.deletedCount,
    duplicateCategories: results.duplicateCategories.deletedCount
  });

  console.log('\nRecord counts after cleanup:');
  console.table(await countAll());
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
