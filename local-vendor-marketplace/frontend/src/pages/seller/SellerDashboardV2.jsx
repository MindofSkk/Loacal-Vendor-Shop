import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  BarChart3,
  Copy,
  Eye,
  ImagePlus,
  MapPin,
  MessageCircle,
  PackagePlus,
  Pencil,
  Plus,
  Save,
  Search,
  Settings,
  ShoppingBag,
  ToggleLeft,
  ToggleRight,
  Trash2,
  UploadCloud,
  Users
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getApiError } from '../../api/client';
import { categoryApi, orderApi, productApi, shopApi } from '../../api/services';
import StatusBadge from '../../components/StatusBadge';
import { useSellerOrders } from '../../context/SellerOrdersContext';
import { useToast } from '../../context/ToastContext';
import { getShortOrderId, nextSellerStatuses } from '../../utils/orderStatus';
import { getProductImages, getProductThumbnail } from '../../utils/productImages';

const businessTypes = ['Restaurant', 'Grocery / Kirana Store', 'Dairy and Bakery'];
const foodCategories = ['Starter', 'Main Course', 'Snacks', 'Drinks', 'Dessert'];
const groceryCategories = ['Rice', 'Oil', 'Snacks', 'Cold Drinks', 'Household', 'Personal Care', 'Other'];
const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const closureReasons = ['Holiday', 'Out of Stock', 'Personal Reason', 'Maintenance', 'Custom'];
const analyticsFilters = ['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last Month', 'Custom'];
const chartColors = ['#049B4F', '#5B2EEB', '#F59E0B', '#0EA5E9', '#EF4444', '#64748B'];
const includesText = (value, query) => String(value || '').toLowerCase().includes(query);
const buildMapUrl = (latitude, longitude) =>
  latitude !== '' && latitude != null && longitude !== '' && longitude != null
    ? `https://www.google.com/maps?q=${latitude},${longitude}`
    : '';

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const formatDateLabel = (date) =>
  new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short' }).format(new Date(date));
const getOrderTotal = (order) => Number(order?.subtotal ?? order?.totalAmount ?? order?.total ?? 0);
const getProductSku = (product) => product.sku || product.SKU || `SKU-${String(product._id || '').slice(-6).toUpperCase()}`;
const getProductCategory = (product) =>
  product.foodCategory || product.groceryCategory || product.dairyBakeryType || product.category?.name || product.businessType || 'General';
const getProductStockLabel = (product) =>
  product.businessType === 'Grocery / Kirana Store' ? `${Number(product.stock || 0)} in stock` : product.status === 'active' ? 'Available' : 'Unavailable';
const isImageUrl = (value) => /^https?:\/\/.+\.(png|jpe?g|webp|gif|avif)(\?.*)?$/i.test(String(value || '').trim());

const startOfDay = (date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const endOfDay = (date) => {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
};

const getAnalyticsRange = (filter, customRange) => {
  const now = new Date();
  const today = startOfDay(now);

  if (filter === 'Yesterday') {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return { from: yesterday, to: endOfDay(yesterday) };
  }

  if (filter === 'Last 7 Days') {
    const from = new Date(today);
    from.setDate(from.getDate() - 6);
    return { from, to: endOfDay(now) };
  }

  if (filter === 'Last 30 Days') {
    const from = new Date(today);
    from.setDate(from.getDate() - 29);
    return { from, to: endOfDay(now) };
  }

  if (filter === 'This Month') {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: endOfDay(now) };
  }

  if (filter === 'Last Month') {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
    return { from, to };
  }

  if (filter === 'Custom' && customRange.from && customRange.to) {
    return { from: startOfDay(customRange.from), to: endOfDay(customRange.to) };
  }

  return { from: today, to: endOfDay(now) };
};

const groupOrdersByDay = (orders, metric = 'orders') => {
  const grouped = orders.reduce((acc, order) => {
    const key = new Date(order.createdAt).toISOString().slice(0, 10);
    acc[key] = acc[key] || { date: key, label: formatDateLabel(order.createdAt), orders: 0, revenue: 0 };
    acc[key].orders += 1;
    if (order.status === 'Delivered') acc[key].revenue += getOrderTotal(order);
    return acc;
  }, {});

  return Object.values(grouped)
    .sort((first, second) => new Date(first.date) - new Date(second.date))
    .map((item) => ({ ...item, value: item[metric] }));
};

const getOrderItems = (order) => order.items || order.products || [];

const compressImageFile = (file) =>
  new Promise((resolve) => {
    if (!file?.type?.startsWith('image/')) {
      resolve(file);
      return;
    }

    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      const maxSize = 1400;
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) {
            resolve(file);
            return;
          }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
        },
        'image/jpeg',
        0.82
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    image.src = objectUrl;
  });

const emptyProductForm = {
  name: '',
  description: '',
  price: '',
  stock: '',
  status: 'active',
  brand: '',
  packSize: '',
  vegType: 'Veg',
  foodCategory: 'Snacks',
  groceryCategory: 'Other',
  dairyBakeryType: 'Dairy',
  freshStockToday: 'true',
  thumbnailIndex: '0',
  existingImages: [],
  imageUrls: [],
  images: null
};

const defaultSettingsForm = {
  workingHours: weekDays.map((day) => ({ day, openTime: '09:00', closeTime: '21:00', closed: false })),
  deliverySettings: {
    radiusKm: 5,
    minimumOrder: 0,
    deliveryCharge: 0,
    freeDeliveryAbove: 0,
    estimatedDeliveryTime: '30 Minutes'
  },
  temporaryClosure: {
    enabled: false,
    reason: 'Holiday',
    customReason: ''
  }
};

const buildWhatsAppMessage = (order) => {
  const address = order.deliveryAddress || {};
  const deliveryIcon = '\u{1F69A}';
  const multiply = '\u00D7';
  const rupee = '\u20B9';
  const items = order.items.map((item) => `${item.quantity} ${multiply} ${item.name}`).join('\n');

  return `${deliveryIcon} New Delivery Order

Order ID: #${order._id.slice(-6)}

Customer: ${order.customer?.name || 'Customer'}
Phone: ${address.phone || order.customer?.phone || ''}

Address:
${address.fullAddress || ''}
Landmark: ${address.landmark || 'N/A'}

Google Maps:
${address.mapUrl || 'Not shared'}

Items:
${items}

Total: ${rupee}${order.subtotal}

Please deliver as soon as possible.`;
};

const buildWhatsAppUrl = (order, phone) => {
  const encodedMessage = encodeURIComponent(buildWhatsAppMessage(order));
  const cleanPhone = phone?.replace(/\D/g, '');

  // Send directly to a saved delivery boy when selected, otherwise open generic WhatsApp share.
  if (cleanPhone) {
    const phoneWithCountryCode = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    return `https://wa.me/${phoneWithCountryCode}?text=${encodedMessage}`;
  }

  return `https://wa.me/?text=${encodedMessage}`;
};

export default function SellerDashboardV2() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { orders, refreshSellerOrders, updateSellerOrderLocal } = useSellerOrders();
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedDeliveryBoys, setSelectedDeliveryBoys] = useState({});
  const [tab, setTab] = useState(searchParams.get('tab') || 'shop');
  const [isEditingShop, setIsEditingShop] = useState(false);
  const [editingProductId, setEditingProductId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [debouncedGlobalSearch, setDebouncedGlobalSearch] = useState('');
  const [analyticsFilter, setAnalyticsFilter] = useState('Last 7 Days');
  const [customRange, setCustomRange] = useState({ from: '', to: '' });
  const [productStatusFilter, setProductStatusFilter] = useState('all');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [productSort, setProductSort] = useState('newest');
  const [pastedImageUrl, setPastedImageUrl] = useState('');
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [isDraggingImages, setIsDraggingImages] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');
  const [shopForm, setShopForm] = useState({
    name: '',
    description: '',
    logoUrl: '',
    category: '',
    businessType: 'Restaurant',
    phone: '',
    deliveryRadiusKm: 5,
    location: { area: '', city: '', pincode: '', landmark: '', latitude: '', longitude: '', mapUrl: '' },
    deliveryBoys: []
  });
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [settingsForm, setSettingsForm] = useState(defaultSettingsForm);

  const hydrateShopForm = useCallback((nextShop) => {
    if (!nextShop) return;
    setShopForm({
      name: nextShop.name || '',
      description: nextShop.description || '',
      logoUrl: nextShop.logoUrl || '',
      category: nextShop.category?._id || nextShop.category || '',
      businessType: nextShop.businessType || 'Restaurant',
      phone: nextShop.phone || '',
      deliveryRadiusKm: nextShop.deliveryRadiusKm || 5,
      location: {
        area: nextShop.location?.area || '',
        city: nextShop.location?.city || '',
        pincode: nextShop.location?.pincode || '',
        landmark: nextShop.location?.landmark || '',
        latitude: nextShop.location?.latitude ?? '',
        longitude: nextShop.location?.longitude ?? '',
        mapUrl: nextShop.location?.mapUrl || buildMapUrl(nextShop.location?.latitude, nextShop.location?.longitude)
      },
      deliveryBoys: nextShop.deliveryBoys?.length ? nextShop.deliveryBoys : []
    });
  }, []);

  const loadData = useCallback(async () => {
    const [categoryRes, shopRes, productRes] = await Promise.all([
      categoryApi.list(),
      shopApi.myShop(),
      productApi.sellerList()
    ]);
    setCategories(categoryRes.data.filter((category) => category.isActive));
    setShop(shopRes.data);
    hydrateShopForm(shopRes.data);
    setProducts(productRes.data);
  }, [hydrateShopForm]);

  const loadSettings = useCallback(async () => {
    try {
      const { data } = await shopApi.getSettings();
      setSettingsForm({
        workingHours: data.workingHours?.length ? data.workingHours : defaultSettingsForm.workingHours,
        deliverySettings: { ...defaultSettingsForm.deliverySettings, ...data.deliverySettings },
        temporaryClosure: { ...defaultSettingsForm.temporaryClosure, ...data.temporaryClosure }
      });
    } catch (err) {
      if (err.response?.status !== 404) {
        setError(getApiError(err));
      }
    }
  }, []);

  useEffect(() => {
    loadData().catch((err) => setError(getApiError(err)));
    loadSettings();
  }, [loadData, loadSettings]);

  useEffect(() => {
    const nextTab = searchParams.get('tab') || 'shop';
    const safeTab = ['shop', 'settings', 'products', 'orders'].includes(nextTab) ? nextTab : 'shop';
    setTab(safeTab);

    const query = searchParams.get('q') || '';
    if (safeTab === 'products') setProductSearch(query);
    if (safeTab === 'orders') setOrderSearch(query);
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedGlobalSearch(globalSearch.trim().toLowerCase()), 300);
    return () => window.clearTimeout(timer);
  }, [globalSearch]);

  useEffect(
    () => () => {
      imagePreviews.forEach((preview) => {
        if (preview.startsWith('blob:')) URL.revokeObjectURL(preview);
      });
    },
    [imagePreviews]
  );

  const selectTab = (nextTab) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', nextTab);
    if (!['products', 'orders'].includes(nextTab)) nextParams.delete('q');
    setSearchParams(nextParams, { replace: true });
    setTab(nextTab);
  };

  const updateShopLocation = (key, value) =>
    setShopForm((current) => {
      const location = { ...current.location, [key]: value };
      if (key === 'latitude' || key === 'longitude') {
        location.mapUrl = buildMapUrl(location.latitude, location.longitude);
      }
      return { ...current, location };
    });

  const captureShopLocation = () => {
    setError('');
    setMessage('');

    if (!navigator.geolocation) {
      setError('Location is not supported in this browser. You can still enter address manually.');
      return;
    }

    setActionLoading('shop-location');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = Number(position.coords.latitude.toFixed(6));
        const longitude = Number(position.coords.longitude.toFixed(6));
        setShopForm((current) => ({
          ...current,
          location: {
            ...current.location,
            latitude,
            longitude,
            mapUrl: buildMapUrl(latitude, longitude)
          }
        }));
        setMessage('Location added. Save shop to persist it.');
        setActionLoading('');
      },
      () => {
        setError('Location permission denied. You can still enter address manually.');
        setActionLoading('');
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const uploadShopLogo = async (file) => {
    if (!file) return;
    setError('');
    setMessage('');
    setActionLoading('upload-logo');

    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);

    try {
      const formData = new FormData();
      formData.append('logo', file);
      const { data } = await shopApi.uploadLogo(formData);
      setShopForm((current) => ({ ...current, logoUrl: data.logoUrl }));
      setMessage('Shop image uploaded. Save shop to persist it.');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setActionLoading('');
    }
  };

  const updateDeliveryBoy = (index, key, value) => {
    const deliveryBoys = [...shopForm.deliveryBoys];
    deliveryBoys[index] = { ...deliveryBoys[index], [key]: value };
    setShopForm({ ...shopForm, deliveryBoys });
  };

  const addDeliveryBoy = () =>
    setShopForm({ ...shopForm, deliveryBoys: [...shopForm.deliveryBoys, { name: '', phone: '' }] });

  const removeDeliveryBoy = (index) =>
    setShopForm({ ...shopForm, deliveryBoys: shopForm.deliveryBoys.filter((_contact, currentIndex) => currentIndex !== index) });

  const saveShop = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setActionLoading('save-shop');

    try {
      const category = categories.find((item) => item.name === shopForm.businessType)?._id || shopForm.category;
      const location = { ...shopForm.location };
      if (location.latitude === '') delete location.latitude;
      if (location.longitude === '') delete location.longitude;
      if (location.latitude != null && location.longitude != null) {
        location.mapUrl = buildMapUrl(location.latitude, location.longitude);
      } else {
        delete location.mapUrl;
      }
      const { data } = await shopApi.saveMyShop({ ...shopForm, location, category });
      setShop(data);
      hydrateShopForm(data);
      setLogoPreview('');
      setIsEditingShop(false);
      setMessage(data.status === 'approved' ? 'Shop profile saved.' : 'Shop profile submitted for admin approval.');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setActionLoading('');
    }
  };

  const updateProductImages = (files, urls = productForm.imageUrls || []) => {
    const previews = [
      ...Array.from(files || []).map((file) => URL.createObjectURL(file)),
      ...urls
    ].slice(0, 3);
    setImagePreviews(previews);
    setProductForm((current) => ({
      ...current,
      images: Array.from(files || []).slice(0, 3),
      imageUrls: urls.slice(0, Math.max(0, 3 - Array.from(files || []).length)),
      existingImages: urls.map((url) => ({ url })),
      thumbnailIndex: String(Math.min(Number(current.thumbnailIndex || 0), Math.max(previews.length - 1, 0)))
    }));
  };

  const handleProductImageFiles = async (files) => {
    const pickedFiles = Array.from(files || []).filter((file) => file.type?.startsWith('image/')).slice(0, 3);

    if (pickedFiles.length === 0) return;
    if (Array.from(files || []).length > 3) {
      setError('You can upload a maximum of 3 product images.');
      return;
    }

    setError('');
    setImageUploadProgress(18);
    const compressedFiles = await Promise.all(pickedFiles.map(compressImageFile));
    setImageUploadProgress(100);
    updateProductImages(compressedFiles, productForm.imageUrls || []);
    window.setTimeout(() => setImageUploadProgress(0), 700);
  };

  const addPastedImageUrl = () => {
    const url = pastedImageUrl.trim();
    const selectedImages = Array.from(productForm.images || []);

    if (!isImageUrl(url)) {
      setError('Paste a valid image URL ending with jpg, png, webp, gif, or avif.');
      return;
    }

    if (selectedImages.length + (productForm.imageUrls || []).length >= 3) {
      setError('You can keep a maximum of 3 product images.');
      return;
    }

    const nextUrls = [...(productForm.imageUrls || []), url];
    setPastedImageUrl('');
    setError('');
    updateProductImages(selectedImages, nextUrls);
  };

  const removeProductImage = (index) => {
    const selectedImages = Array.from(productForm.images || []);
    const currentUrls = productForm.imageUrls || [];
    const combined = [
      ...selectedImages.map((file) => ({ type: 'file', value: file })),
      ...currentUrls.map((url) => ({ type: 'url', value: url }))
    ].filter((_item, currentIndex) => currentIndex !== index);
    const nextFiles = combined.filter((item) => item.type === 'file').map((item) => item.value);
    const nextUrls = combined.filter((item) => item.type === 'url').map((item) => item.value);
    updateProductImages(nextFiles, nextUrls);
  };

  const moveProductImage = (index, direction) => {
    const selectedImages = Array.from(productForm.images || []);
    const currentUrls = productForm.imageUrls || [];
    const combined = [
      ...selectedImages.map((file) => ({ type: 'file', value: file })),
      ...currentUrls.map((url) => ({ type: 'url', value: url }))
    ];
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= combined.length) return;
    [combined[index], combined[nextIndex]] = [combined[nextIndex], combined[index]];
    const nextFiles = combined.filter((item) => item.type === 'file').map((item) => item.value);
    const nextUrls = combined.filter((item) => item.type === 'url').map((item) => item.value);
    updateProductImages(nextFiles, nextUrls);
    setProductForm((current) => ({ ...current, thumbnailIndex: String(nextIndex) }));
  };

  const appendProductFormFields = (formData, source) => {
    Object.entries(source).forEach(([key, value]) => {
      if (['images', 'existingImages', 'imageUrls'].includes(key)) return;
      if (value !== '' && value != null) formData.append(key, value);
    });
  };

  const buildProductFormData = (source = productForm) => {
    const formData = new FormData();
    const selectedImages = Array.from(source.images || []);
    const urlImages = source.imageUrls || [];
    const activeBusinessType = shop?.businessType || shopForm.businessType;

    appendProductFormFields(formData, source);
    formData.append('imageUrls', JSON.stringify(urlImages.slice(0, Math.max(0, 3 - selectedImages.length))));

    if (activeBusinessType !== 'Grocery / Kirana Store') {
      formData.delete('stock');
    }

    selectedImages.slice(0, 3).forEach((file) => formData.append('images', file));
    return formData;
  };

  const createProduct = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setActionLoading('save-product');

    try {
      const selectedImages = Array.from(productForm.images || []);
      if (selectedImages.length + (productForm.imageUrls || []).length > 3) {
        throw new Error('You can upload a maximum of 3 product images.');
      }

      const formData = buildProductFormData();
      const uploadConfig = {
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;
          setImageUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        }
      };

      if (editingProductId) {
        await productApi.update(editingProductId, formData, uploadConfig);
      } else {
        await productApi.create(formData, uploadConfig);
      }
      setProductForm(emptyProductForm);
      setImagePreviews([]);
      setPastedImageUrl('');
      setEditingProductId('');
      setMessage(editingProductId ? 'Product updated.' : 'Product added.');
      await loadData();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setActionLoading('');
      setImageUploadProgress(0);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;

    setError('');
    setMessage('');
    setActionLoading(`delete-${id}`);

    try {
      await productApi.remove(id);
      setProducts((current) => current.filter((product) => product._id !== id));
      if (editingProductId === id) {
        setEditingProductId('');
        setProductForm(emptyProductForm);
        setImagePreviews([]);
      }
      setMessage('Product deleted.');
      toast.success({ title: 'Product deleted', message: 'The product was removed from your shop.' });
    } catch (err) {
      setError(getApiError(err));
      toast.error({ title: 'Delete failed', message: getApiError(err) });
    } finally {
      setActionLoading('');
    }
  };

  const editProduct = (product) => {
    const urls = getProductImages(product).slice(0, 3);
    setEditingProductId(product._id);
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      stock: product.stock ?? '',
      status: product.status || 'active',
      brand: product.brand || '',
      packSize: product.packSize || '',
      vegType: product.vegType || 'Veg',
      foodCategory: product.foodCategory || 'Snacks',
      groceryCategory: product.groceryCategory || 'Other',
      dairyBakeryType: product.dairyBakeryType || 'Dairy',
      freshStockToday: product.freshStockToday ? 'true' : 'false',
      thumbnailIndex: String(Math.min(Number(product.thumbnailIndex || 0), 2)),
      existingImages: product.images || [],
      imageUrls: urls,
      images: null
    });
    setImagePreviews(urls);
    setPastedImageUrl('');
    selectTab('products');
  };

  const cancelProductEdit = () => {
    setEditingProductId('');
    setProductForm(emptyProductForm);
    setImagePreviews([]);
    setPastedImageUrl('');
  };

  const duplicateProduct = (product) => {
    const urls = getProductImages(product).slice(0, 3);
    setEditingProductId('');
    setProductForm({
      name: `${product.name || 'Product'} Copy`,
      description: product.description || '',
      price: product.price || '',
      stock: product.stock ?? '',
      status: product.status || 'active',
      brand: product.brand || '',
      packSize: product.packSize || '',
      vegType: product.vegType || 'Veg',
      foodCategory: product.foodCategory || 'Snacks',
      groceryCategory: product.groceryCategory || 'Other',
      dairyBakeryType: product.dairyBakeryType || 'Dairy',
      freshStockToday: product.freshStockToday ? 'true' : 'false',
      thumbnailIndex: String(Math.min(Number(product.thumbnailIndex || 0), Math.max(urls.length - 1, 0))),
      existingImages: product.images || [],
      imageUrls: urls,
      images: null
    });
    setImagePreviews(urls);
    setPastedImageUrl('');
    selectTab('products');
    toast.info({ title: 'Product duplicated', message: 'Review details and save it as a new product.' });
  };

  const toggleProductAvailability = async (product) => {
    setError('');
    setMessage('');
    setActionLoading(`toggle-${product._id}`);

    try {
      const urls = getProductImages(product).slice(0, 3);
      const formData = buildProductFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        stock: product.stock ?? '',
        status: product.status === 'active' ? 'inactive' : 'active',
        brand: product.brand || '',
        packSize: product.packSize || '',
        vegType: product.vegType || 'Veg',
        foodCategory: product.foodCategory || 'Snacks',
        groceryCategory: product.groceryCategory || 'Other',
        dairyBakeryType: product.dairyBakeryType || 'Dairy',
        freshStockToday: product.freshStockToday ? 'true' : 'false',
        thumbnailIndex: String(product.thumbnailIndex || 0),
        existingImages: product.images || [],
        imageUrls: urls,
        images: []
      });
      const { data } = await productApi.update(product._id, formData);
      setProducts((current) => current.map((item) => (item._id === data._id ? data : item)));
      toast.success({ title: 'Availability updated', message: `${product.name} is now ${data.status === 'active' ? 'available' : 'not available'}.` });
    } catch (err) {
      setError(getApiError(err));
      toast.error({ title: 'Update failed', message: getApiError(err) });
    } finally {
      setActionLoading('');
    }
  };

  const updateOrderStatus = async (id, status) => {
    setError('');
    setMessage('');
    setActionLoading(`order-${id}-${status}`);

    try {
      const { data } = await orderApi.updateSellerStatus(id, { status, note: `Seller marked ${status}` });
      updateSellerOrderLocal(data);
      await refreshSellerOrders({ silent: true });
      setMessage(`Order marked ${status}.`);
      toast.success({ title: 'Order updated', message: `Order #${getShortOrderId(data)} marked ${status}.` });
    } catch (err) {
      setError(getApiError(err));
      toast.error({ title: 'Status update failed', message: getApiError(err) });
    } finally {
      setActionLoading('');
    }
  };

  const openShare = (order) => {
    window.open(buildWhatsAppUrl(order, selectedDeliveryBoys[order._id]), '_blank', 'noopener,noreferrer');
  };

  const activeBusinessType = shop?.businessType || shopForm.businessType;
  const selectedProductImages = Array.from(productForm.images || []);
  const thumbnailOptions = imagePreviews.map((url, index) => ({
    index,
    label: selectedProductImages[index]?.name || `Image ${index + 1}`,
    url
  }));
  const visibleProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return products
      .filter(
        (product) =>
          (productStatusFilter === 'all' || product.status === productStatusFilter) &&
          (productCategoryFilter === 'all' ||
            product.foodCategory === productCategoryFilter ||
            product.groceryCategory === productCategoryFilter ||
            product.dairyBakeryType === productCategoryFilter ||
            product.category?.name === productCategoryFilter) &&
          (!q ||
            includesText(product.name, q) ||
            includesText(product.brand, q) ||
            includesText(getProductSku(product), q) ||
            includesText(product.groceryCategory, q) ||
            includesText(product.foodCategory, q) ||
            includesText(product.dairyBakeryType, q) ||
            includesText(product.category?.name, q) ||
            includesText(product.packSize, q))
      )
      .sort((first, second) => {
        if (productSort === 'price-low') return Number(first.price || 0) - Number(second.price || 0);
        if (productSort === 'price-high') return Number(second.price || 0) - Number(first.price || 0);
        if (productSort === 'stock-low') return Number(first.stock || 0) - Number(second.stock || 0);
        return new Date(second.updatedAt || second.createdAt) - new Date(first.updatedAt || first.createdAt);
      });
  }, [productCategoryFilter, productSearch, productSort, productStatusFilter, products]);
  const visibleOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return [...orders]
      .filter(
        (order) =>
          (orderStatusFilter === 'all' || order.status === orderStatusFilter) &&
          (!q ||
            includesText(order._id, q) ||
            includesText(order.customer?.name, q) ||
            includesText(order.customer?.email, q) ||
            includesText(order.customer?.phone, q) ||
            includesText(order.deliveryAddress?.phone, q) ||
            includesText(order.status, q))
      )
      .sort((first, second) => {
        if (first.status === 'Pending' && second.status !== 'Pending') return -1;
        if (first.status !== 'Pending' && second.status === 'Pending') return 1;
        return new Date(second.createdAt) - new Date(first.createdAt);
      });
  }, [orderSearch, orderStatusFilter, orders]);
  const newOrderCount = orders.filter((order) => order.status === 'Pending').length;
  const acceptedOrderCount = orders.filter((order) => order.status === 'Accepted').length;
  const preparingOrderCount = orders.filter((order) => order.status === 'Packed').length;
  const outForDeliveryCount = orders.filter((order) => order.status === 'Out for Delivery').length;
  const activeOrderCount = orders.filter((order) => ['Pending', 'Accepted', 'Packed', 'Out for Delivery'].includes(order.status)).length;
  const completedOrderCount = orders.filter((order) => order.status === 'Delivered').length;
  const today = new Date().toDateString();
  const todayOrders = orders.filter((order) => new Date(order.createdAt).toDateString() === today);
  const totalRevenue = orders
    .filter((order) => order.status === 'Delivered')
    .reduce((sum, order) => sum + Number(order.subtotal || 0), 0);
  const revenueToday = todayOrders
    .filter((order) => order.status === 'Delivered')
    .reduce((sum, order) => sum + Number(order.subtotal || 0), 0);
  const productFilterOptions = useMemo(() => {
    const values = products.flatMap((product) => [
      product.foodCategory,
      product.groceryCategory,
      product.dairyBakeryType,
      product.category?.name
    ]);
    return [...new Set(values.filter(Boolean))];
  }, [products]);
  const analyticsRange = useMemo(() => getAnalyticsRange(analyticsFilter, customRange), [analyticsFilter, customRange]);
  const analyticsOrders = useMemo(
    () =>
      orders.filter((order) => {
        const createdAt = new Date(order.createdAt);
        return createdAt >= analyticsRange.from && createdAt <= analyticsRange.to;
      }),
    [analyticsRange, orders]
  );
  const analyticsRevenue = analyticsOrders
    .filter((order) => order.status === 'Delivered')
    .reduce((sum, order) => sum + getOrderTotal(order), 0);
  const monthlyRevenue = orders
    .filter((order) => {
      const createdAt = new Date(order.createdAt);
      const now = new Date();
      return order.status === 'Delivered' && createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
    })
    .reduce((sum, order) => sum + getOrderTotal(order), 0);
  const averageOrderValue = analyticsOrders.length ? Math.round(analyticsOrders.reduce((sum, order) => sum + getOrderTotal(order), 0) / analyticsOrders.length) : 0;
  const uniqueCustomers = new Set(analyticsOrders.map((order) => order.customer?._id || order.customer?.email || order.deliveryAddress?.phone).filter(Boolean));
  const orderLineData = groupOrdersByDay(analyticsOrders, 'orders');
  const revenueAreaData = groupOrdersByDay(analyticsOrders, 'revenue');
  const statusChartData = ['Pending', 'Accepted', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled', 'Rejected']
    .map((status) => ({ name: status, value: analyticsOrders.filter((order) => order.status === status).length }))
    .filter((item) => item.value > 0);
  const productSalesData = useMemo(() => {
    const grouped = analyticsOrders.reduce((acc, order) => {
      getOrderItems(order).forEach((item) => {
        const key = item.product || item._id || item.name;
        acc[key] = acc[key] || { name: item.name || 'Product', quantity: 0, revenue: 0 };
        acc[key].quantity += Number(item.quantity || 0);
        acc[key].revenue += Number(item.price || 0) * Number(item.quantity || 0);
      });
      return acc;
    }, {});

    return Object.values(grouped)
      .sort((first, second) => second.quantity - first.quantity)
      .slice(0, 5);
  }, [analyticsOrders]);
  const productsByName = useMemo(
    () =>
      products.reduce((acc, product) => {
        acc[product.name] = product;
        return acc;
      }, {}),
    [products]
  );
  const categorySalesData = useMemo(() => {
    const grouped = analyticsOrders.reduce((acc, order) => {
      getOrderItems(order).forEach((item) => {
        const product = productsByName[item.name];
        const category = product ? getProductCategory(product) : activeBusinessType;
        acc[category] = (acc[category] || 0) + Number(item.price || 0) * Number(item.quantity || 0);
      });
      return acc;
    }, {});

    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [activeBusinessType, analyticsOrders, productsByName]);
  const lowStockProducts = products
    .filter((product) => product.businessType === 'Grocery / Kirana Store' && Number(product.stock || 0) <= 5)
    .sort((first, second) => Number(first.stock || 0) - Number(second.stock || 0))
    .slice(0, 6);
  const recentOrders = [...orders].sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt)).slice(0, 5);
  const globalResults = useMemo(() => {
    if (!debouncedGlobalSearch) return { products: [], orders: [], customers: [] };
    const q = debouncedGlobalSearch;
    return {
      products: products
        .filter(
          (product) =>
            includesText(product.name, q) ||
            includesText(product.brand, q) ||
            includesText(getProductSku(product), q) ||
            includesText(getProductCategory(product), q)
        )
        .slice(0, 5),
      orders: orders
        .filter(
          (order) =>
            includesText(order._id, q) ||
            includesText(order.status, q) ||
            includesText(order.customer?.name, q) ||
            includesText(order.deliveryAddress?.phone, q)
        )
        .slice(0, 5),
      customers: [
        ...new Map(
          orders
            .filter((order) => includesText(order.customer?.name, q) || includesText(order.customer?.email, q) || includesText(order.deliveryAddress?.phone, q))
            .map((order) => [order.customer?._id || order.deliveryAddress?.phone, order.customer || { name: 'Customer', phone: order.deliveryAddress?.phone }])
        ).values()
      ].slice(0, 5)
    };
  }, [debouncedGlobalSearch, orders, products]);

  const updateWorkingHour = (index, key, value) => {
    const workingHours = [...settingsForm.workingHours];
    workingHours[index] = { ...workingHours[index], [key]: value };
    setSettingsForm({ ...settingsForm, workingHours });
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setActionLoading('save-settings');

    try {
      const deliverySettings = settingsForm.deliverySettings;
      if (Number(deliverySettings.radiusKm) <= 0) throw new Error('Delivery radius must be greater than 0.');
      if (Number(deliverySettings.minimumOrder) < 0) throw new Error('Minimum order must be zero or more.');
      if (Number(deliverySettings.deliveryCharge) < 0) throw new Error('Delivery charge must be zero or more.');
      if (!String(deliverySettings.estimatedDeliveryTime || '').trim()) throw new Error('Estimated delivery time is required.');
      const { data } = await shopApi.updateSettings(settingsForm);
      setSettingsForm({
        workingHours: data.workingHours,
        deliverySettings: data.deliverySettings,
        temporaryClosure: data.temporaryClosure
      });
      await loadData();
      setMessage('Business settings saved.');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setActionLoading('');
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="label">Seller workspace</p>
          <h1 className="text-xl font-black">Dashboard</h1>
        </div>
        {shop && <StatusBadge status={shop.status} />}
      </div>

      <div className="panel relative grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="field pl-9"
            placeholder="Search products, orders, customers, categories, SKU, or brand"
            value={globalSearch}
            onChange={(event) => setGlobalSearch(event.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" type="button" onClick={() => selectTab('products')}>
            <PackagePlus className="h-4 w-4" />
            Add Product
          </button>
          <button className="btn-secondary" type="button" onClick={() => selectTab('orders')}>
            <ShoppingBag className="h-4 w-4" />
            View Orders
          </button>
          <button className="btn-secondary" type="button" onClick={() => selectTab('settings')}>
            <Settings className="h-4 w-4" />
            Business Settings
          </button>
        </div>
        {debouncedGlobalSearch && (
          <div className="absolute left-3 right-3 top-[calc(100%-6px)] z-20 grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl lg:grid-cols-3">
            <div>
              <p className="label">Products</p>
              {globalResults.products.map((product) => (
                <button key={product._id} className="mt-2 flex w-full items-center justify-between rounded-xl bg-slate-50 p-2 text-left text-sm hover:bg-emerald-50" type="button" onClick={() => editProduct(product)}>
                  <span className="font-bold">{product.name}</span>
                  <span className="text-xs text-slate-500">{getProductSku(product)}</span>
                </button>
              ))}
              {globalResults.products.length === 0 && <p className="mt-2 text-xs text-slate-500">No products</p>}
            </div>
            <div>
              <p className="label">Orders</p>
              {globalResults.orders.map((order) => (
                <button key={order._id} className="mt-2 flex w-full items-center justify-between rounded-xl bg-slate-50 p-2 text-left text-sm hover:bg-emerald-50" type="button" onClick={() => selectTab('orders')}>
                  <span className="font-bold">#{order._id.slice(-6)}</span>
                  <StatusBadge status={order.status} />
                </button>
              ))}
              {globalResults.orders.length === 0 && <p className="mt-2 text-xs text-slate-500">No orders</p>}
            </div>
            <div>
              <p className="label">Customers</p>
              {globalResults.customers.map((customer) => (
                <div key={customer._id || customer.phone || customer.email} className="mt-2 rounded-xl bg-slate-50 p-2 text-sm">
                  <p className="font-bold">{customer.name || 'Customer'}</p>
                  <p className="text-xs text-slate-500">{customer.phone || customer.email}</p>
                </div>
              ))}
              {globalResults.customers.length === 0 && <p className="mt-2 text-xs text-slate-500">No customers</p>}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {['shop', 'settings', 'products', 'orders'].map((item) => (
          <button key={item} className={tab === item ? 'btn-primary' : 'btn-secondary'} type="button" onClick={() => selectTab(item)}>
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="panel">
          <p className="label">New Orders</p>
          <p className="mt-1.5 text-2xl font-black text-emerald-700">{newOrderCount}</p>
        </div>
        <div className="panel">
          <p className="label">Active Orders</p>
          <p className="mt-1.5 text-2xl font-black text-amber-600">{activeOrderCount}</p>
        </div>
        <div className="panel">
          <p className="label">Completed Orders</p>
          <p className="mt-1.5 text-2xl font-black text-blue-700">{completedOrderCount}</p>
        </div>
        <div className="panel">
          <p className="label">Revenue</p>
          <p className="mt-1.5 text-2xl font-black text-slate-950">₹{totalRevenue}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {[
          ['Today Orders', todayOrders.length, 'text-emerald-700'],
          ['Accepted', acceptedOrderCount, 'text-blue-700'],
          ['Preparing', preparingOrderCount, 'text-indigo-700'],
          ['Out for Delivery', outForDeliveryCount, 'text-sky-700'],
          ['Revenue Today', `₹${revenueToday}`, 'text-slate-950'],
          ['Products', products.length, 'text-violet-700']
        ].map(([label, value, color]) => (
          <div key={label} className="panel">
            <p className="label">{label}</p>
            <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {message && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}

      <section className="panel space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="label">Sales analytics</p>
            <h2 className="text-lg font-black">Performance overview</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {analyticsFilters.map((filter) => (
              <button key={filter} className={analyticsFilter === filter ? 'btn-primary px-3 py-1.5' : 'btn-secondary px-3 py-1.5'} type="button" onClick={() => setAnalyticsFilter(filter)}>
                {filter}
              </button>
            ))}
          </div>
        </div>
        {analyticsFilter === 'Custom' && (
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="field" type="date" value={customRange.from} onChange={(event) => setCustomRange({ ...customRange, from: event.target.value })} />
            <input className="field" type="date" value={customRange.to} onChange={(event) => setCustomRange({ ...customRange, to: event.target.value })} />
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Revenue Month', formatCurrency(monthlyRevenue), BarChart3],
            ['Average Order Value', formatCurrency(averageOrderValue), ShoppingBag],
            ['Customers', uniqueCustomers.size, Users],
            ['Range Revenue', formatCurrency(analyticsRevenue), BarChart3]
          ].map(([label, value, Icon]) => (
            <div key={label} className="rounded-2xl bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="label">{label}</p>
                <Icon className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="label">Category sales</p>
              <p className="text-sm font-semibold text-slate-600">Revenue by product category in selected range</p>
            </div>
            <button className="btn-secondary px-3 py-1.5" type="button" onClick={() => selectTab('products')}>
              Reports
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {categorySalesData.slice(0, 8).map((item) => (
              <span key={item.name} className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm">
                {item.name}: {formatCurrency(item.value)}
              </span>
            ))}
            {categorySalesData.length === 0 && <span className="text-sm text-slate-500">No category sales yet.</span>}
          </div>
        </div>
        <div className="grid gap-3 xl:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="mb-3 text-sm font-black text-slate-800">Orders by day</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={orderLineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="orders" stroke="#049B4F" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="mb-3 text-sm font-black text-slate-800">Revenue by day</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueAreaData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Area type="monotone" dataKey="revenue" stroke="#5B2EEB" fill="#DDD6FE" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="mb-3 text-sm font-black text-slate-800">Orders by status</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusChartData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={4}>
                    {statusChartData.map((entry, index) => (
                      <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="mb-3 text-sm font-black text-slate-800">Top selling products</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productSalesData} layout="vertical" margin={{ left: 16, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={110} />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="#049B4F" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-3 xl:grid-cols-3">
        <section className="panel space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="label">Recent orders</p>
              <h3 className="font-black">Quick actions</h3>
            </div>
            <button className="btn-secondary px-3 py-1.5" type="button" onClick={() => selectTab('orders')}>View all</button>
          </div>
          {recentOrders.map((order) => (
            <div key={order._id} className="rounded-xl bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-black">#{order._id.slice(-6)}</p>
                  <p className="text-xs text-slate-500">{order.customer?.name || 'Customer'} · {formatCurrency(getOrderTotal(order))}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {nextSellerStatuses(order.status).slice(0, 2).map((status) => (
                  <button key={status} className="btn-secondary px-3 py-1.5 text-xs" type="button" disabled={actionLoading === `order-${order._id}-${status}`} onClick={() => updateOrderStatus(order._id, status)}>
                    {status}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {recentOrders.length === 0 && <p className="text-sm text-slate-500">No orders yet.</p>}
        </section>
        <section className="panel space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="label">Inventory</p>
              <h3 className="font-black">Low stock</h3>
            </div>
            <button className="btn-secondary px-3 py-1.5" type="button" onClick={() => selectTab('products')}>Manage</button>
          </div>
          {lowStockProducts.map((product) => (
            <button key={product._id} className="flex w-full items-center justify-between rounded-xl bg-amber-50 p-3 text-left" type="button" onClick={() => editProduct(product)}>
              <span>
                <span className="block font-bold text-slate-900">{product.name}</span>
                <span className="text-xs text-amber-700">{getProductStockLabel(product)}</span>
              </span>
              <Pencil className="h-4 w-4 text-amber-700" />
            </button>
          ))}
          {lowStockProducts.length === 0 && <p className="text-sm text-slate-500">No low stock products.</p>}
        </section>
        <section className="panel space-y-3">
          <div>
            <p className="label">Best sellers</p>
            <h3 className="font-black">Top products</h3>
          </div>
          {productSalesData.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <div>
                <p className="font-bold">{index + 1}. {item.name}</p>
                <p className="text-xs text-slate-500">{item.quantity} sold · {formatCurrency(item.revenue)}</p>
              </div>
              <BarChart3 className="h-4 w-4 text-emerald-600" />
            </div>
          ))}
          {productSalesData.length === 0 && <p className="text-sm text-slate-500">No sales data yet.</p>}
        </section>
      </div>

      {tab === 'shop' && shop?.status === 'approved' && !isEditingShop && (
        <section className="panel space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-start gap-3">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl bg-emerald-50 text-xl font-black text-emerald-700">
                {shop.logoUrl ? <img className="h-full w-full object-cover" src={shop.logoUrl} alt={shop.name} /> : shop.name?.slice(0, 1)}
              </div>
              <div>
                <p className="label">{shop.businessType}</p>
                <h2 className="text-lg font-black">{shop.name}</h2>
                <p className="text-sm text-stone-600">{shop.description || 'No description added.'}</p>
              </div>
            </div>
            <StatusBadge status={shop.status} />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-md bg-stone-50 p-3">
              <p className="label">Phone</p>
              <p className="font-bold">{shop.phone}</p>
            </div>
            <div className="rounded-md bg-stone-50 p-3">
              <p className="label">Area</p>
              <p className="font-bold">{shop.location?.area}, {shop.location?.city}</p>
              {shop.location?.mapUrl && (
                <a className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-market-leaf" href={shop.location.mapUrl} target="_blank" rel="noreferrer">
                  <MapPin className="h-3.5 w-3.5" />
                  Map
                </a>
              )}
            </div>
            <div className="rounded-md bg-stone-50 p-3">
              <p className="label">Delivery boys</p>
              <p className="font-bold">{shop.deliveryBoys?.length || 0}</p>
            </div>
          </div>
          {shop.deliveryBoys?.length > 0 && (
            <div className="grid gap-2 md:grid-cols-2">
              {shop.deliveryBoys.map((contact) => (
                <div key={`${contact.name}-${contact.phone}`} className="rounded-md bg-stone-50 p-3 text-sm">
                  <p className="font-bold">{contact.name}</p>
                  <p className="text-stone-600">{contact.phone}</p>
                </div>
              ))}
            </div>
          )}
          <button className="btn-secondary" type="button" onClick={() => setIsEditingShop(true)}>
            Edit profile
          </button>
        </section>
      )}

      {tab === 'shop' && (!shop || shop.status !== 'approved' || isEditingShop) && (
        <form className="panel grid gap-3 md:grid-cols-2" onSubmit={saveShop}>
          <div className="md:col-span-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Fill these basic details to create a shop profile in under 2 minutes.
          </div>
          {shop?.status === 'approved' && (
            <div className="md:col-span-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Editing core shop details may require admin approval again. Delivery boy changes can be saved without losing approval.
            </div>
          )}
          <label>
            <span className="label">Shop name</span>
            <input className="field mt-1" placeholder="Example: Spice Junction" value={shopForm.name} onChange={(event) => setShopForm({ ...shopForm, name: event.target.value })} required />
            <span className="mt-1 block text-xs text-stone-500">Customers will see this name on the home page.</span>
          </label>
          <label>
            <span className="label">Shop phone</span>
            <input className="field mt-1" placeholder="10 digit mobile number" value={shopForm.phone} onChange={(event) => setShopForm({ ...shopForm, phone: event.target.value })} required />
            <span className="mt-1 block text-xs text-stone-500">Used by customers and delivery staff for order coordination.</span>
          </label>
          <label>
            <span className="label">Business type</span>
            <select className="field mt-1" value={shopForm.businessType} onChange={(event) => setShopForm({ ...shopForm, businessType: event.target.value })} required>
              {businessTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-stone-500">This controls which product fields appear.</span>
          </label>
          <label>
            <span className="label">Delivery radius</span>
            <input className="field mt-1" type="number" min="1" max="25" placeholder="5" value={shopForm.deliveryRadiusKm} onChange={(event) => setShopForm({ ...shopForm, deliveryRadiusKm: event.target.value })} />
            <span className="mt-1 block text-xs text-stone-500">Keep 3-8 km for a focused local delivery area.</span>
          </label>
          <label className="md:col-span-2">
            <span className="label">Description</span>
            <input className="field mt-1" placeholder="Short shop description" value={shopForm.description} onChange={(event) => setShopForm({ ...shopForm, description: event.target.value })} />
            <span className="mt-1 block text-xs text-stone-500">One line about what the shop sells.</span>
          </label>
          <div className="md:col-span-2 grid gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3 md:grid-cols-[96px_1fr] md:items-center">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl bg-white text-xl font-black text-emerald-700">
              {logoPreview || shopForm.logoUrl ? <img className="h-full w-full object-cover" src={logoPreview || shopForm.logoUrl} alt="Shop logo preview" /> : 'Logo'}
            </div>
            <div className="space-y-2">
              <label>
                <span className="label">Shop image / logo</span>
                <input className="field mt-1" type="file" accept="image/*" onChange={(event) => uploadShopLogo(event.target.files?.[0])} />
              </label>
              <input className="field" placeholder="Or paste image URL" value={shopForm.logoUrl} onChange={(event) => setShopForm({ ...shopForm, logoUrl: event.target.value })} />
              <span className="block text-xs text-stone-500">
                {actionLoading === 'upload-logo' ? 'Uploading image...' : 'Shown on seller dashboard and customer shop cards.'}
              </span>
            </div>
          </div>
          {['area', 'city', 'pincode', 'landmark'].map((field) => (
            <label key={field}>
              <span className="label">{field}</span>
              <input className="field mt-1" placeholder={field} value={shopForm.location[field]} onChange={(event) => updateShopLocation(field, event.target.value)} required={field !== 'landmark'} />
              <span className="mt-1 block text-xs text-stone-500">
                {field === 'landmark' ? 'Optional but useful for local delivery.' : 'Required for nearby shop discovery.'}
              </span>
            </label>
          ))}
          <label>
            <span className="label">Latitude</span>
            <input className="field mt-1" placeholder="Optional, e.g. 28.6139" value={shopForm.location.latitude} onChange={(event) => updateShopLocation('latitude', event.target.value)} />
            <span className="mt-1 block text-xs text-stone-500">Needed for automatic delivery radius checks.</span>
          </label>
          <label>
            <span className="label">Longitude</span>
            <input className="field mt-1" placeholder="Optional, e.g. 77.2090" value={shopForm.location.longitude} onChange={(event) => updateShopLocation('longitude', event.target.value)} />
            <span className="mt-1 block text-xs text-stone-500">Needed for distance and delivery radius checks.</span>
          </label>
          <div className="md:col-span-2 flex flex-wrap items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 p-3">
            <button className="btn-secondary" type="button" onClick={captureShopLocation} disabled={actionLoading === 'shop-location'}>
              <MapPin className="h-4 w-4" />
              {actionLoading === 'shop-location' ? 'Getting location...' : 'Use Current Location'}
            </button>
            {shopForm.location.mapUrl && (
              <a className="btn-secondary" href={shopForm.location.mapUrl} target="_blank" rel="noreferrer">
                Open map
              </a>
            )}
            <span className="text-xs text-stone-500">Browser permission captures fixed shop latitude and longitude.</span>
          </div>
          <div className="md:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-black">Delivery boys</h2>
              <button className="btn-secondary" type="button" onClick={addDeliveryBoy}>
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
            <div className="grid gap-2">
              {shopForm.deliveryBoys.map((contact, index) => (
                <div key={`${contact.name}-${index}`} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <input className="field" placeholder="Name" value={contact.name} onChange={(event) => updateDeliveryBoy(index, 'name', event.target.value)} />
                  <input className="field" placeholder="Phone" value={contact.phone} onChange={(event) => updateDeliveryBoy(index, 'phone', event.target.value)} />
                  <button className="btn-danger" type="button" onClick={() => removeDeliveryBoy(index)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <button className="btn-primary md:col-span-2" type="submit" disabled={actionLoading === 'save-shop'}>
            <Save className="h-4 w-4" />
            {actionLoading === 'save-shop' ? 'Saving...' : 'Save shop'}
          </button>
          {shop?.status === 'approved' && (
            <button className="btn-secondary md:col-span-2" type="button" onClick={() => {
              hydrateShopForm(shop);
              setIsEditingShop(false);
            }}>
              Cancel edit
            </button>
          )}
        </form>
      )}

      {tab === 'settings' && (
        <form className="space-y-3" onSubmit={saveSettings}>
          {!shop && <p className="panel text-stone-600">Create a shop profile before editing business settings.</p>}
          {shop && (
            <>
              <section className="panel space-y-3">
                <div>
                  <p className="label">Business Settings</p>
                  <h2 className="text-lg font-black">Working Hours</h2>
                </div>
                <div className="grid gap-3">
                  {settingsForm.workingHours.map((entry, index) => (
                    <div key={entry.day} className="grid gap-2 rounded-md bg-stone-50 p-3 md:grid-cols-[140px_1fr_1fr_auto] md:items-center">
                      <p className="font-bold">{entry.day}</p>
                      <input className="field" type="time" value={entry.openTime} disabled={entry.closed} onChange={(event) => updateWorkingHour(index, 'openTime', event.target.value)} />
                      <input className="field" type="time" value={entry.closeTime} disabled={entry.closed} onChange={(event) => updateWorkingHour(index, 'closeTime', event.target.value)} />
                      <label className="flex items-center gap-2 text-sm font-bold">
                        <input type="checkbox" checked={entry.closed} onChange={(event) => updateWorkingHour(index, 'closed', event.target.checked)} />
                        Closed
                      </label>
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <p className="label">Delivery Settings</p>
                  <h2 className="text-lg font-black">Delivery Rules</h2>
                </div>
                <label>
                  <span className="label">Delivery Radius (KM)</span>
                  <input className="field mt-1" type="number" min="0.1" step="0.1" value={settingsForm.deliverySettings.radiusKm} onChange={(event) => setSettingsForm({ ...settingsForm, deliverySettings: { ...settingsForm.deliverySettings, radiusKm: event.target.value } })} required />
                </label>
                <label>
                  <span className="label">Minimum Order</span>
                  <input className="field mt-1" type="number" min="0" value={settingsForm.deliverySettings.minimumOrder} onChange={(event) => setSettingsForm({ ...settingsForm, deliverySettings: { ...settingsForm.deliverySettings, minimumOrder: event.target.value } })} required />
                </label>
                <label>
                  <span className="label">Delivery Charge</span>
                  <input className="field mt-1" type="number" min="0" value={settingsForm.deliverySettings.deliveryCharge} onChange={(event) => setSettingsForm({ ...settingsForm, deliverySettings: { ...settingsForm.deliverySettings, deliveryCharge: event.target.value } })} required />
                </label>
                <label>
                  <span className="label">Free Delivery Above</span>
                  <input className="field mt-1" type="number" min="0" value={settingsForm.deliverySettings.freeDeliveryAbove} onChange={(event) => setSettingsForm({ ...settingsForm, deliverySettings: { ...settingsForm.deliverySettings, freeDeliveryAbove: event.target.value } })} required />
                </label>
                <label className="md:col-span-2">
                  <span className="label">Estimated Delivery Time</span>
                  <input className="field mt-1" placeholder="25 Minutes" value={settingsForm.deliverySettings.estimatedDeliveryTime} onChange={(event) => setSettingsForm({ ...settingsForm, deliverySettings: { ...settingsForm.deliverySettings, estimatedDeliveryTime: event.target.value } })} required />
                </label>
              </section>

              <section className="panel grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <p className="label">Temporary Closure</p>
                  <h2 className="text-lg font-black">Close Shop Temporarily</h2>
                </div>
                <label className="flex items-center gap-2 font-bold">
                  <input type="checkbox" checked={settingsForm.temporaryClosure.enabled} onChange={(event) => setSettingsForm({ ...settingsForm, temporaryClosure: { ...settingsForm.temporaryClosure, enabled: event.target.checked } })} />
                  Temporarily Closed
                </label>
                <select className="field" value={settingsForm.temporaryClosure.reason} onChange={(event) => setSettingsForm({ ...settingsForm, temporaryClosure: { ...settingsForm.temporaryClosure, reason: event.target.value } })}>
                  {closureReasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
                {settingsForm.temporaryClosure.reason === 'Custom' && (
                  <input className="field md:col-span-2" placeholder="Custom reason" value={settingsForm.temporaryClosure.customReason || ''} onChange={(event) => setSettingsForm({ ...settingsForm, temporaryClosure: { ...settingsForm.temporaryClosure, customReason: event.target.value } })} />
                )}
              </section>

              <button className="btn-primary w-full" type="submit" disabled={actionLoading === 'save-settings'}>
                <Save className="h-4 w-4" />
                {actionLoading === 'save-settings' ? 'Saving...' : 'Save business settings'}
              </button>
            </>
          )}
        </form>
      )}

      {tab === 'products' && (
        <div className="grid gap-3 lg:grid-cols-[320px_1fr]">
          <form className="panel h-fit space-y-3" onSubmit={createProduct}>
            <div>
              <p className="label">{activeBusinessType}</p>
              <h2 className="text-lg font-black">{editingProductId ? 'Edit product' : 'Add product'}</h2>
            </div>
            <input className="field" placeholder={activeBusinessType === 'Restaurant' ? 'Item name' : 'Product name'} value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} required />
            <textarea className="field" placeholder="Description" value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} />
            {activeBusinessType === 'Restaurant' && (
              <>
                <select className="field" value={productForm.vegType} onChange={(event) => setProductForm({ ...productForm, vegType: event.target.value })}>
                  <option value="Veg">Veg</option>
                  <option value="Non-Veg">Non-Veg</option>
                </select>
                <select className="field" value={productForm.foodCategory} onChange={(event) => setProductForm({ ...productForm, foodCategory: event.target.value })}>
                  {foodCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </>
            )}
            {activeBusinessType === 'Grocery / Kirana Store' && (
              <>
                <input className="field" placeholder="Brand" value={productForm.brand} onChange={(event) => setProductForm({ ...productForm, brand: event.target.value })} required />
                <input className="field" placeholder="Quantity / Pack size" value={productForm.packSize} onChange={(event) => setProductForm({ ...productForm, packSize: event.target.value })} required />
                <input className="field" type="number" min="0" placeholder="Stock quantity" value={productForm.stock} onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })} required />
                <select className="field" value={productForm.groceryCategory} onChange={(event) => setProductForm({ ...productForm, groceryCategory: event.target.value })}>
                  {groceryCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </>
            )}
            {activeBusinessType === 'Dairy and Bakery' && (
              <>
                <select className="field" value={productForm.dairyBakeryType} onChange={(event) => setProductForm({ ...productForm, dairyBakeryType: event.target.value })}>
                  <option value="Dairy">Dairy</option>
                  <option value="Bakery">Bakery</option>
                </select>
                <input className="field" placeholder="Quantity / Pack size" value={productForm.packSize} onChange={(event) => setProductForm({ ...productForm, packSize: event.target.value })} required />
                <select className="field" value={productForm.freshStockToday} onChange={(event) => setProductForm({ ...productForm, freshStockToday: event.target.value })}>
                  <option value="true">Fresh stock available today</option>
                  <option value="false">No fresh stock today</option>
                </select>
              </>
            )}
            <input className="field" type="number" min="0" placeholder="Price" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} required />
            <select className="field" value={productForm.status} onChange={(event) => setProductForm({ ...productForm, status: event.target.value })}>
              <option value="active">Available</option>
              <option value="inactive">Not Available</option>
            </select>
            <div className="space-y-3 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/50 p-3">
              <div>
                <p className="label">Product images</p>
                <p className="text-xs font-semibold text-slate-500">Upload or paste up to 3 Cloudinary/image URLs. First selected thumbnail appears in listings.</p>
              </div>
              <label
                className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-4 text-center transition ${isDraggingImages ? 'border-emerald-600 bg-white' : 'border-emerald-300 bg-white/70 hover:bg-white'}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDraggingImages(true);
                }}
                onDragLeave={() => setIsDraggingImages(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDraggingImages(false);
                  handleProductImageFiles(event.dataTransfer.files);
                }}
              >
                <UploadCloud className="h-8 w-8 text-emerald-600" />
                <span className="mt-2 text-sm font-black text-slate-900">Drag images here or click to upload</span>
                <span className="text-xs text-slate-500">Auto-compressed before upload. Max 3 images.</span>
                <input className="hidden" type="file" accept="image/*" multiple onChange={(event) => handleProductImageFiles(event.target.files)} />
              </label>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input className="field" placeholder="Paste image URL" value={pastedImageUrl} onChange={(event) => setPastedImageUrl(event.target.value)} />
                <button className="btn-secondary" type="button" onClick={addPastedImageUrl}>
                  <ImagePlus className="h-4 w-4" />
                  Add URL
                </button>
              </div>
              {imageUploadProgress > 0 && (
                <div className="h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${imageUploadProgress}%` }} />
                </div>
              )}
              {thumbnailOptions.length > 0 && (
                <div className="grid gap-2">
                  <p className="text-xs font-bold text-slate-600">Preview and thumbnail</p>
                  {thumbnailOptions.slice(0, 3).map((image, index) => (
                    <div key={`${image.label}-${index}`} className="flex items-center gap-2 rounded-xl bg-white p-2 text-sm font-semibold text-slate-700 shadow-sm">
                      <input
                        type="radio"
                        name="thumbnailIndex"
                        value={index}
                        checked={String(productForm.thumbnailIndex) === String(index)}
                        onChange={(event) => setProductForm({ ...productForm, thumbnailIndex: event.target.value })}
                      />
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-violet-50 text-violet-700">
                        {image.url ? <img className="h-full w-full object-cover" src={image.url} alt={image.label} /> : <ImagePlus className="h-5 w-5" />}
                      </div>
                      <span className="min-w-0 flex-1 truncate">{image.label}</span>
                      <button className="rounded-lg px-2 py-1 text-xs font-black text-slate-500 hover:bg-slate-100" type="button" disabled={index === 0} onClick={() => moveProductImage(index, -1)}>
                        Up
                      </button>
                      <button className="rounded-lg px-2 py-1 text-xs font-black text-slate-500 hover:bg-slate-100" type="button" disabled={index === thumbnailOptions.length - 1} onClick={() => moveProductImage(index, 1)}>
                        Down
                      </button>
                      <button className="rounded-lg px-2 py-1 text-xs font-black text-rose-600 hover:bg-rose-50" type="button" onClick={() => removeProductImage(index)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button className="btn-primary w-full" type="submit" disabled={actionLoading === 'save-product'}>
              {editingProductId ? <Save className="h-4 w-4" /> : <PackagePlus className="h-4 w-4" />}
              {actionLoading === 'save-product' ? 'Saving...' : editingProductId ? 'Update product' : 'Add product'}
            </button>
            {editingProductId && (
              <button className="btn-secondary w-full" type="button" onClick={cancelProductEdit}>
                Cancel edit
              </button>
            )}
          </form>
          <div className="grid gap-3">
            <div className="panel sticky top-3 z-10 grid gap-3 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
              <input
                className="field"
                placeholder="Search products by name, SKU, brand, or category"
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
              />
              <select className="field md:w-44" value={productStatusFilter} onChange={(event) => setProductStatusFilter(event.target.value)}>
                <option value="all">All statuses</option>
                <option value="active">Available</option>
                <option value="inactive">Not Available</option>
              </select>
              <select className="field md:w-48" value={productCategoryFilter} onChange={(event) => setProductCategoryFilter(event.target.value)}>
                <option value="all">All categories</option>
                {productFilterOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              <select className="field md:w-44" value={productSort} onChange={(event) => setProductSort(event.target.value)}>
                <option value="newest">Newest</option>
                <option value="price-low">Price low to high</option>
                <option value="price-high">Price high to low</option>
                <option value="stock-low">Low stock first</option>
              </select>
            </div>
            {visibleProducts.map((product) => {
              const thumbnail = getProductThumbnail(product);
              const productImages = getProductImages(product);

              return (
                <article key={product._id} className="panel grid gap-3 transition hover:-translate-y-0.5 hover:shadow-md xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                  <div className="grid gap-3 sm:grid-cols-[84px_1fr]">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-violet-50 text-xs font-bold text-violet-600">
                      {thumbnail ? <img className="h-full w-full object-cover" src={thumbnail} alt={product.name} /> : <ImagePlus className="h-7 w-7" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-black">{product.name}</h3>
                        <StatusBadge status={product.status} />
                        {product.vegType && (
                          <span className={`rounded-full px-2 py-1 text-xs font-black ${product.vegType === 'Veg' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                            {product.vegType}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">{getProductSku(product)}</p>
                      <div className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
                        <span><strong className="text-slate-950">{formatCurrency(product.price)}</strong></span>
                        <span>{getProductCategory(product)}</span>
                        <span>{getProductStockLabel(product)}</span>
                        <span>{product.packSize || product.brand || 'No pack size'}</span>
                      </div>
                      {productImages.length > 1 && (
                        <div className="mt-2 flex gap-1.5">
                          {productImages.slice(0, 3).map((url) => (
                            <img key={url} className="h-8 w-8 rounded-md border border-stone-200 object-cover" src={url} alt={product.name} />
                          ))}
                        </div>
                      )}
                      <p className="mt-2 text-xs text-slate-400">
                        Last updated {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString('en-IN') : 'recently'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                    <button className="btn-secondary" type="button" disabled={actionLoading === `toggle-${product._id}`} onClick={() => toggleProductAvailability(product)}>
                      {product.status === 'active' ? <ToggleRight className="h-4 w-4 text-emerald-600" /> : <ToggleLeft className="h-4 w-4 text-slate-500" />}
                      {product.status === 'active' ? 'Available' : 'Hidden'}
                    </button>
                    <a className="btn-secondary" href={`/products/${product._id}`} target="_blank" rel="noreferrer">
                      <Eye className="h-4 w-4" />
                      Preview
                    </a>
                    <button className="btn-secondary" type="button" onClick={() => duplicateProduct(product)}>
                      <Copy className="h-4 w-4" />
                      Duplicate
                    </button>
                    <button className="btn-secondary" type="button" onClick={() => editProduct(product)}>
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                    <button className="btn-danger" type="button" disabled={actionLoading === `delete-${product._id}`} onClick={() => deleteProduct(product._id)}>
                      <Trash2 className="h-4 w-4" />
                      {actionLoading === `delete-${product._id}` ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </article>
              );
            })}
            {visibleProducts.length === 0 && <p className="panel text-stone-600">No products found.</p>}
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className="grid gap-3">
          <div className="panel grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <input
              className="field"
              placeholder="Search orders by id, customer, phone, or status"
              value={orderSearch}
              onChange={(event) => setOrderSearch(event.target.value)}
            />
            <select className="field md:w-52" value={orderStatusFilter} onChange={(event) => setOrderStatusFilter(event.target.value)}>
              <option value="all">All order statuses</option>
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
              <option value="Packed">Preparing / Packed</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          {visibleOrders.map((order) => (
            <article key={order._id} className={`panel space-y-3 ${order.status === 'Pending' ? 'border-market-leaf ring-2 ring-market-leaf/20' : ''}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="label">{order.status === 'Pending' ? 'New order' : order.customer?.name}</p>
                  <h3 className="font-black">Order #{order._id.slice(-6)}</h3>
                  {order.status === 'Pending' && <p className="text-sm font-bold text-market-leaf">{order.customer?.name}</p>}
                  <p className="text-sm text-stone-600">{order.deliveryAddress?.phone || order.customer?.phone}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div className="rounded-md bg-stone-50 p-3 text-sm text-stone-700">
                <p className="font-bold text-market-ink">Delivery details</p>
                <p>{order.deliveryAddress?.fullAddress}</p>
                <p>Landmark: {order.deliveryAddress?.landmark || 'N/A'}</p>
                {order.deliveryAddress?.mapUrl && (
                  <a className="mt-2 inline-flex items-center gap-2 font-bold text-market-leaf" href={order.deliveryAddress.mapUrl} target="_blank" rel="noreferrer">
                    <MapPin className="h-4 w-4" />
                    Google Maps
                  </a>
                )}
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {order.items.map((item) => (
                  <p key={item.product} className="rounded-md bg-stone-50 p-2 text-sm">
                    {item.name} x {item.quantity}
                  </p>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-lg font-black">₹{order.subtotal}</p>
                <div className="flex flex-wrap gap-2">
                  {nextSellerStatuses(order.status).map((status) => (
                    <button key={status} className="btn-secondary" type="button" disabled={actionLoading === `order-${order._id}-${status}`} onClick={() => updateOrderStatus(order._id, status)}>
                      {actionLoading === `order-${order._id}-${status}` ? 'Updating...' : status}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-stone-200 pt-3">
                {order.shop?.deliveryBoys?.length > 0 && (
                  <select
                    className="field max-w-xs"
                    value={selectedDeliveryBoys[order._id] || ''}
                    onChange={(event) => setSelectedDeliveryBoys({ ...selectedDeliveryBoys, [order._id]: event.target.value })}
                  >
                    <option value="">No delivery boy selected</option>
                    {order.shop.deliveryBoys.map((contact) => (
                      <option key={`${contact.name}-${contact.phone}`} value={contact.phone}>
                        {contact.name} - {contact.phone}
                      </option>
                    ))}
                  </select>
                )}
                {order.deliveryAddress?.mapUrl && (
                  <a className="btn-secondary" href={order.deliveryAddress.mapUrl} target="_blank" rel="noreferrer">
                    <MapPin className="h-4 w-4" />
                    Open in Google Maps
                  </a>
                )}
                <button className="btn-primary" type="button" onClick={() => openShare(order)}>
                  <MessageCircle className="h-4 w-4" />
                  Share with Delivery Boy
                </button>
              </div>
            </article>
          ))}
          {visibleOrders.length === 0 && <p className="panel text-stone-600">No orders found.</p>}
        </div>
      )}
    </section>
  );
}
