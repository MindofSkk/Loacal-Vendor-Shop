import { Notification } from '../models/Notification.js';
import { Shop } from '../models/Shop.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const buildShopQuery = (queryParams) => {
  const { q, area, city, category, status } = queryParams;
  const query = {};

  if (status) {
    query.status = status;
  } else {
    query.status = 'approved';
  }

  if (area) query['location.area'] = new RegExp(area, 'i');
  if (city) query['location.city'] = new RegExp(city, 'i');
  if (category) query.category = category;
  if (q) query.$text = { $search: q };

  return query;
};

const normalizeApprovalFields = (shopLike) =>
  JSON.stringify({
    name: shopLike.name || '',
    description: shopLike.description || '',
    category: shopLike.category?.toString?.() || shopLike.category || '',
    businessType: shopLike.businessType || '',
    phone: shopLike.phone || '',
    deliveryRadiusKm: Number(shopLike.deliveryRadiusKm || 5),
    location: {
      area: shopLike.location?.area || '',
      city: shopLike.location?.city || '',
      pincode: shopLike.location?.pincode || '',
      landmark: shopLike.location?.landmark || ''
    }
  });

export const listShops = asyncHandler(async (req, res) => {
  const shops = await Shop.find(buildShopQuery(req.query))
    .populate('category', 'name slug')
    .populate('owner', 'name email phone')
    .sort({ createdAt: -1 });

  res.json(shops);
});

export const adminListShops = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.status) query.status = req.query.status;
  if (req.query.category) query.category = req.query.category;
  if (req.query.businessType) query.businessType = req.query.businessType;

  const shops = await Shop.find(query)
    .populate('category', 'name slug')
    .populate('owner', 'name email phone status')
    .sort({ createdAt: -1 });

  res.json(shops);
});

export const getShopById = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.id)
    .populate('category', 'name slug')
    .populate('owner', 'name email phone');

  if (!shop || (shop.status !== 'approved' && req.user?.role !== 'admin')) {
    throw new ApiError(404, 'Shop not found');
  }

  res.json(shop);
});

export const getMyShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id }).populate('category', 'name slug');
  res.json(shop);
});

export const createOrUpdateMyShop = asyncHandler(async (req, res) => {
  const deliveryBoys = (req.body.deliveryBoys || []).filter((contact) => contact?.name || contact?.phone);
  const payload = {
    ...req.body,
    deliveryBoys,
    owner: req.user._id
  };

  const existingShop = await Shop.findOne({ owner: req.user._id });
  let shop;

  if (existingShop) {
    const approvalFieldsChanged = normalizeApprovalFields(existingShop) !== normalizeApprovalFields(payload);
    const nextStatus = existingShop.status === 'approved' && !approvalFieldsChanged ? 'approved' : 'pending';

    Object.assign(existingShop, payload, {
      status: nextStatus,
      rejectionReason: nextStatus === 'pending' ? undefined : existingShop.rejectionReason
    });
    shop = await existingShop.save();
  } else {
    shop = await Shop.create(payload);
  }

  res.status(existingShop ? 200 : 201).json(shop);
});

export const updateShopStatus = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;
  const shop = await Shop.findById(req.params.id);

  if (!shop) {
    throw new ApiError(404, 'Shop not found');
  }

  shop.status = status;
  shop.rejectionReason = status === 'rejected' ? rejectionReason : undefined;
  await shop.save();

  await Notification.create({
    user: shop.owner,
    title: `Shop ${status}`,
    message: `Your shop "${shop.name}" has been ${status}.`,
    type: 'shop',
    link: '/seller'
  });

  res.json(shop);
});
