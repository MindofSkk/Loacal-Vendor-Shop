import { Notification } from '../models/Notification.js';
import { Order, ORDER_STATUSES } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Shop } from '../models/Shop.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getDeliveryEligibility, getOpenStatus } from '../utils/shopStatus.js';

const statusFlow = {
  Pending: ['Accepted', 'Rejected', 'Cancelled'],
  Accepted: ['Packed', 'Cancelled'],
  Packed: ['Out for Delivery', 'Cancelled'],
  'Out for Delivery': ['Delivered'],
  Delivered: [],
  Cancelled: [],
  Rejected: []
};

const isStockTracked = (product) => product.businessType === 'Grocery / Kirana Store';

const isOrderable = (product) => {
  if (product.status !== 'active') return false;
  if (product.businessType === 'Dairy and Bakery') return product.freshStockToday;
  return true;
};

export const createOrder = asyncHandler(async (req, res) => {
  const { items, deliveryAddress, notes, paymentMethod = 'COD' } = req.body;
  const productIds = items.map((item) => item.product);
  const products = await Product.find({ _id: { $in: productIds } }).populate('shop');
  const productMap = new Map(products.map((product) => [product._id.toString(), product]));

  if (products.length !== productIds.length) {
    throw new ApiError(400, 'Some products are unavailable');
  }

  const shopId = products[0].shop._id.toString();
  const sellerId = products[0].seller.toString();

  if (products.some((product) => product.shop._id.toString() !== shopId)) {
    throw new ApiError(400, 'Place separate orders for products from different shops');
  }

  const shop = await Shop.findById(shopId);

  if (!shop || shop.status !== 'approved') {
    throw new ApiError(400, 'Shop is not available for orders');
  }

  const openStatus = getOpenStatus(shop);

  if (!openStatus.isOpenNow) {
    throw new ApiError(400, openStatus.message || 'Shop is closed right now');
  }

  // Store manual address for every order and add a map link only when coordinates exist.
  const normalizedDeliveryAddress = {
    fullAddress: deliveryAddress.fullAddress,
    landmark: deliveryAddress.landmark,
    phone: deliveryAddress.phone,
    latitude: deliveryAddress.latitude,
    longitude: deliveryAddress.longitude
  };

  if (normalizedDeliveryAddress.latitude != null && normalizedDeliveryAddress.longitude != null) {
    normalizedDeliveryAddress.mapUrl = `https://www.google.com/maps?q=${normalizedDeliveryAddress.latitude},${normalizedDeliveryAddress.longitude}`;
  }

  const orderItems = items.map((item) => {
    const product = productMap.get(item.product);
    const quantity = Number(item.quantity);

    if (!isOrderable(product)) {
      throw new ApiError(400, `${product.name} is not available right now`);
    }

    if (isStockTracked(product) && product.stock < quantity) {
      throw new ApiError(400, `${product.name} has only ${product.stock} item(s) in stock`);
    }

    return {
      product: product._id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.images[0]?.url
    };
  });

  for (const item of orderItems) {
    const product = productMap.get(item.product.toString());
    if (isStockTracked(product)) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }
  }

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (subtotal < Number(shop.deliverySettings?.minimumOrder || 0)) {
    throw new ApiError(400, `Minimum order amount is Rs.${shop.deliverySettings.minimumOrder}`);
  }

  const deliveryEligibility = getDeliveryEligibility(shop, normalizedDeliveryAddress);

  if (!deliveryEligibility.canDeliver) {
    throw new ApiError(400, 'This shop does not deliver to your location');
  }

  const order = await Order.create({
    customer: req.user._id,
    seller: sellerId,
    shop: shopId,
    items: orderItems,
    deliveryAddress: normalizedDeliveryAddress,
    subtotal,
    paymentMethod,
    paymentStatus: paymentMethod === 'COD' ? 'NOT_REQUIRED' : 'PENDING',
    notes
  });

  await Notification.create({
    user: sellerId,
    title: 'New order received',
    message: `Order ${order._id.toString().slice(-6)} is waiting for your action.`,
    type: 'order',
    link: '/seller/orders'
  });

  const createdOrder = await Order.findById(order._id)
    .populate('shop', 'name phone location logoUrl businessType deliverySettings');

  res.status(201).json(createdOrder);
});

export const listMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customer: req.user._id })
    .populate('shop', 'name phone location logoUrl businessType deliverySettings')
    .sort({ createdAt: -1 });

  res.json(orders);
});

export const listMyActiveOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    customer: req.user._id,
    status: { $nin: ['Delivered', 'Cancelled', 'Rejected'] }
  })
    .populate('shop', 'name phone location logoUrl businessType deliverySettings')
    .sort({ createdAt: -1 });

  res.json(orders);
});

export const getMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, customer: req.user._id })
    .populate('shop', 'name phone location logoUrl businessType deliverySettings');

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  res.json(order);
});

export const cancelMyOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const order = await Order.findOne({ _id: req.params.id, customer: req.user._id });

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (order.status !== 'Pending') {
    throw new ApiError(400, 'Only pending orders can be cancelled by customers');
  }

  order.status = 'Cancelled';
  order.cancellationReason = reason;
  order.statusHistory.push({ status: 'Cancelled', note: reason, updatedBy: req.user._id });
  await order.save();

  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (product && isStockTracked(product)) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }
  }

  await Notification.create({
    user: order.seller,
    title: 'Order cancelled',
    message: `Customer cancelled order ${order._id.toString().slice(-6)}.`,
    type: 'order',
    link: '/seller/orders'
  });

  res.json(order);
});

export const listSellerOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ seller: req.user._id })
    .populate('customer', 'name phone email')
    .populate('shop', 'name deliveryBoys phone')
    .sort({ createdAt: -1 });

  res.json(orders);
});

export const listAllOrders = asyncHandler(async (req, res) => {
  const { status, category, businessType } = req.query;
  const query = {};
  if (status) query.status = status;

  if (category || businessType) {
    const shopQuery = {};
    if (category) shopQuery.category = category;
    if (businessType) shopQuery.businessType = businessType;
    const shops = await Shop.find(shopQuery).select('_id');
    query.shop = { $in: shops.map((shop) => shop._id) };
  }

  const orders = await Order.find(query)
    .populate('customer', 'name email phone')
    .populate('seller', 'name email phone')
    .populate('shop', 'name location businessType category')
    .sort({ createdAt: -1 });

  res.json(orders);
});

export const updateSellerOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  if (!ORDER_STATUSES.includes(status)) {
    throw new ApiError(400, 'Invalid order status');
  }

  const order = await Order.findOne({ _id: req.params.id, seller: req.user._id });

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (!statusFlow[order.status].includes(status)) {
    throw new ApiError(400, `Cannot move order from ${order.status} to ${status}`);
  }

  order.status = status;
  order.statusHistory.push({ status, note, updatedBy: req.user._id });

  if (status === 'Cancelled' || status === 'Rejected') {
    order.cancellationReason = note;
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product && isStockTracked(product)) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
    }
  }

  await order.save();

  await Notification.create({
    user: order.customer,
    title: `Order ${status}`,
    message: `Your order ${order._id.toString().slice(-6)} is now ${status}.`,
    type: 'order',
    link: '/orders'
  });

  res.json(order);
});
