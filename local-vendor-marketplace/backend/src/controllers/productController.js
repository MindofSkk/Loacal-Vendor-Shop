import { Readable } from 'node:stream';
import { cloudinary, configureCloudinary } from '../config/cloudinary.js';
import { MAX_PRODUCT_IMAGES, Product } from '../models/Product.js';
import { Shop } from '../models/Shop.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const uploadBufferToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'local-vendor-marketplace/products' },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    Readable.from(file.buffer).pipe(stream);
  });

const getApprovedSellerShop = async (sellerId) => {
  const shop = await Shop.findOne({ owner: sellerId });

  if (!shop) {
    throw new ApiError(400, 'Create a shop profile before adding products');
  }

  if (shop.status !== 'approved') {
    throw new ApiError(403, 'Your shop must be approved before managing products');
  }

  return shop;
};

const toBoolean = (value) => value === true || value === 'true' || value === 'Yes';

const limitProductImages = (images = []) => images.slice(0, MAX_PRODUCT_IMAGES);

const normalizeThumbnailIndex = (value, imageCount) => {
  const parsed = Number.parseInt(value, 10);
  const maxIndex = Math.max(Math.min(imageCount, MAX_PRODUCT_IMAGES) - 1, 0);

  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.min(parsed, maxIndex);
};

const normalizeProductPayload = (body, shop) => {
  const payload = {
    name: body.name,
    description: body.description,
    category: body.category || shop.category,
    price: Number(body.price),
    stock: body.stock === undefined || body.stock === '' ? 0 : Number(body.stock),
    status: body.status || 'active',
    businessType: shop.businessType,
    brand: body.brand,
    packSize: body.packSize,
    vegType: body.vegType,
    foodCategory: body.foodCategory,
    groceryCategory: body.groceryCategory,
    dairyBakeryType: body.dairyBakeryType,
    freshStockToday: toBoolean(body.freshStockToday)
  };

  if (shop.businessType === 'Restaurant') {
    if (!payload.vegType || !payload.foodCategory) {
      throw new ApiError(400, 'Restaurant items need veg type and food category');
    }
  }

  if (shop.businessType === 'Grocery / Kirana Store') {
    if (!payload.brand || !payload.packSize || !payload.groceryCategory) {
      throw new ApiError(400, 'Grocery products need brand, pack size, and grocery category');
    }
    if (payload.stock < 0) {
      throw new ApiError(400, 'Stock quantity is required for grocery products');
    }
  }

  if (shop.businessType === 'Dairy and Bakery') {
    if (!payload.dairyBakeryType || !payload.packSize) {
      throw new ApiError(400, 'Dairy and bakery products need type and pack size');
    }
  }

  return payload;
};

export const listProducts = asyncHandler(async (req, res) => {
  const { q, category, shop, status = 'active' } = req.query;
  const query = { status };

  if (q) query.$text = { $search: q };
  if (category) query.category = category;
  if (shop) query.shop = shop;

  const products = await Product.find(query)
    .populate({
      path: 'shop',
      match: { status: 'approved' },
      select: 'name location isOpen status businessType deliverySettings temporaryClosure workingHours logoUrl'
    })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 });

  res.json(products.filter((product) => product.shop));
});

export const listSellerProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ seller: req.user._id })
    .populate('category', 'name slug')
    .populate('shop', 'name status')
    .sort({ createdAt: -1 });

  res.json(products);
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('shop', 'name location status isOpen businessType deliverySettings temporaryClosure workingHours logoUrl')
    .populate('category', 'name slug');

  if (!product || product.shop?.status !== 'approved') {
    throw new ApiError(404, 'Product not found');
  }

  res.json(product);
});

export const createProduct = asyncHandler(async (req, res) => {
  const shop = await getApprovedSellerShop(req.user._id);
  const images = [];

  if (req.files?.length > MAX_PRODUCT_IMAGES) {
    throw new ApiError(400, `You can upload up to ${MAX_PRODUCT_IMAGES} product images`);
  }

  if (req.files?.length) {
    if (!configureCloudinary()) {
      throw new ApiError(500, 'Cloudinary is not configured');
    }
    images.push(...(await Promise.all(req.files.map(uploadBufferToCloudinary))));
  }

  const product = await Product.create({
    ...normalizeProductPayload(req.body, shop),
    seller: req.user._id,
    shop: shop._id,
    images: limitProductImages(images),
    thumbnailIndex: normalizeThumbnailIndex(req.body.thumbnailIndex, images.length)
  });

  res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  const shop = await Shop.findById(product.shop);
  const update = normalizeProductPayload({ ...product.toObject(), ...req.body }, shop);

  Object.assign(product, update);

  if (req.files?.length > MAX_PRODUCT_IMAGES) {
    throw new ApiError(400, `You can upload up to ${MAX_PRODUCT_IMAGES} product images`);
  }

  if (req.files?.length) {
    if (!configureCloudinary()) {
      throw new ApiError(500, 'Cloudinary is not configured');
    }
    product.images = limitProductImages(await Promise.all(req.files.map(uploadBufferToCloudinary)));
  } else {
    product.images = limitProductImages(product.images);
  }

  product.thumbnailIndex = normalizeThumbnailIndex(req.body.thumbnailIndex ?? product.thumbnailIndex, product.images.length);

  await product.save();
  res.json(product);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndDelete({ _id: req.params.id, seller: req.user._id });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  res.status(204).send();
});
