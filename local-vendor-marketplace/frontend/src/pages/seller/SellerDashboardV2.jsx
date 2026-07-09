import { MapPin, MessageCircle, PackagePlus, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { getApiError } from '../../api/client';
import { categoryApi, orderApi, productApi, shopApi } from '../../api/services';
import StatusBadge from '../../components/StatusBadge';

const orderStatuses = ['Accepted', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled', 'Rejected'];
const businessTypes = ['Restaurant', 'Grocery / Kirana Store', 'Dairy and Bakery'];
const foodCategories = ['Starter', 'Main Course', 'Snacks', 'Drinks', 'Dessert'];
const groceryCategories = ['Rice', 'Oil', 'Snacks', 'Cold Drinks', 'Household', 'Personal Care', 'Other'];
const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const closureReasons = ['Holiday', 'Out of Stock', 'Personal Reason', 'Maintenance', 'Custom'];

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

  if (cleanPhone) {
    const phoneWithCountryCode = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    return `https://wa.me/${phoneWithCountryCode}?text=${encodedMessage}`;
  }

  return `https://wa.me/?text=${encodedMessage}`;
};

export default function SellerDashboardV2() {
  const [categories, setCategories] = useState([]);
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedDeliveryBoys, setSelectedDeliveryBoys] = useState({});
  const [tab, setTab] = useState('shop');
  const [isEditingShop, setIsEditingShop] = useState(false);
  const [editingProductId, setEditingProductId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [shopForm, setShopForm] = useState({
    name: '',
    description: '',
    logoUrl: '',
    category: '',
    businessType: 'Restaurant',
    phone: '',
    deliveryRadiusKm: 5,
    location: { area: '', city: '', pincode: '', landmark: '', latitude: '', longitude: '' },
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
        longitude: nextShop.location?.longitude ?? ''
      },
      deliveryBoys: nextShop.deliveryBoys?.length ? nextShop.deliveryBoys : []
    });
  }, []);

  const loadData = useCallback(async () => {
    const [categoryRes, shopRes, productRes, orderRes] = await Promise.all([
      categoryApi.list(),
      shopApi.myShop(),
      productApi.sellerList(),
      orderApi.sellerOrders()
    ]);
    setCategories(categoryRes.data.filter((category) => category.isActive));
    setShop(shopRes.data);
    hydrateShopForm(shopRes.data);
    setProducts(productRes.data);
    setOrders(orderRes.data);
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

  const updateShopLocation = (key, value) =>
    setShopForm({ ...shopForm, location: { ...shopForm.location, [key]: value } });

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

    try {
      const category = categories.find((item) => item.name === shopForm.businessType)?._id || shopForm.category;
      const location = { ...shopForm.location };
      if (location.latitude === '') delete location.latitude;
      if (location.longitude === '') delete location.longitude;
      const { data } = await shopApi.saveMyShop({ ...shopForm, location, category });
      setShop(data);
      hydrateShopForm(data);
      setIsEditingShop(false);
      setMessage(data.status === 'approved' ? 'Shop profile saved.' : 'Shop profile submitted for admin approval.');
    } catch (err) {
      setError(getApiError(err));
    }
  };

  const createProduct = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      const activeBusinessType = shop?.businessType || shopForm.businessType;

      Object.entries(productForm).forEach(([key, value]) => {
        if (key !== 'images' && value !== '') formData.append(key, value);
      });

      if (activeBusinessType !== 'Grocery / Kirana Store') {
        formData.delete('stock');
      }

      Array.from(productForm.images || []).forEach((file) => formData.append('images', file));
      if (editingProductId) {
        await productApi.update(editingProductId, formData);
      } else {
        await productApi.create(formData);
      }
      setProductForm(emptyProductForm);
      setEditingProductId('');
      setMessage(editingProductId ? 'Product updated.' : 'Product added.');
      loadData();
    } catch (err) {
      setError(getApiError(err));
    }
  };

  const deleteProduct = async (id) => {
    await productApi.remove(id);
    if (editingProductId === id) {
      setEditingProductId('');
      setProductForm(emptyProductForm);
    }
    loadData();
  };

  const editProduct = (product) => {
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
      images: null
    });
  };

  const cancelProductEdit = () => {
    setEditingProductId('');
    setProductForm(emptyProductForm);
  };

  const updateOrderStatus = async (id, status) => {
    await orderApi.updateSellerStatus(id, { status, note: `Seller marked ${status}` });
    loadData();
  };

  const openShare = (order) => {
    window.open(buildWhatsAppUrl(order, selectedDeliveryBoys[order._id]), '_blank', 'noopener,noreferrer');
  };

  const activeBusinessType = shop?.businessType || shopForm.businessType;
  const visibleOrders = [...orders].sort((first, second) => {
    if (first.status === 'Pending' && second.status !== 'Pending') return -1;
    if (first.status !== 'Pending' && second.status === 'Pending') return 1;
    return new Date(second.createdAt) - new Date(first.createdAt);
  });
  const newOrderCount = orders.filter((order) => order.status === 'Pending').length;
  const activeOrderCount = orders.filter((order) => ['Pending', 'Accepted', 'Packed', 'Out for Delivery'].includes(order.status)).length;
  const completedOrderCount = orders.filter((order) => order.status === 'Delivered').length;
  const totalRevenue = orders
    .filter((order) => order.status === 'Delivered')
    .reduce((sum, order) => sum + Number(order.subtotal || 0), 0);

  const updateWorkingHour = (index, key, value) => {
    const workingHours = [...settingsForm.workingHours];
    workingHours[index] = { ...workingHours[index], [key]: value };
    setSettingsForm({ ...settingsForm, workingHours });
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
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
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="label">Seller workspace</p>
          <h1 className="text-2xl font-black">Dashboard</h1>
        </div>
        {shop && <StatusBadge status={shop.status} />}
      </div>

      <div className="flex flex-wrap gap-2">
        {['shop', 'settings', 'products', 'orders'].map((item) => (
          <button key={item} className={tab === item ? 'btn-primary' : 'btn-secondary'} type="button" onClick={() => setTab(item)}>
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="panel">
          <p className="label">New Orders</p>
          <p className="mt-2 text-3xl font-black text-emerald-700">{newOrderCount}</p>
        </div>
        <div className="panel">
          <p className="label">Active Orders</p>
          <p className="mt-2 text-3xl font-black text-amber-600">{activeOrderCount}</p>
        </div>
        <div className="panel">
          <p className="label">Completed Orders</p>
          <p className="mt-2 text-3xl font-black text-blue-700">{completedOrderCount}</p>
        </div>
        <div className="panel">
          <p className="label">Revenue</p>
          <p className="mt-2 text-3xl font-black text-slate-950">₹{totalRevenue}</p>
        </div>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {message && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}

      {tab === 'shop' && shop?.status === 'approved' && !isEditingShop && (
        <section className="panel space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="label">{shop.businessType}</p>
              <h2 className="text-xl font-black">{shop.name}</h2>
              <p className="text-sm text-stone-600">{shop.description || 'No description added.'}</p>
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
          <label className="md:col-span-2">
            <span className="label">Shop logo URL</span>
            <input className="field mt-1" placeholder="https://example.com/logo.png" value={shopForm.logoUrl} onChange={(event) => setShopForm({ ...shopForm, logoUrl: event.target.value })} />
            <span className="mt-1 block text-xs text-stone-500">Optional image URL shown on customer shop cards.</span>
          </label>
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
          <button className="btn-primary md:col-span-2" type="submit">
            <Save className="h-4 w-4" />
            Save shop
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
        <form className="space-y-4" onSubmit={saveSettings}>
          {!shop && <p className="panel text-stone-600">Create a shop profile before editing business settings.</p>}
          {shop && (
            <>
              <section className="panel space-y-3">
                <div>
                  <p className="label">Business Settings</p>
                  <h2 className="text-xl font-black">Working Hours</h2>
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
                  <h2 className="text-xl font-black">Delivery Rules</h2>
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
                  <h2 className="text-xl font-black">Close Shop Temporarily</h2>
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

              <button className="btn-primary w-full" type="submit">
                <Save className="h-4 w-4" />
                Save business settings
              </button>
            </>
          )}
        </form>
      )}

      {tab === 'products' && (
        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
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
            <input className="field" type="file" accept="image/*" multiple onChange={(event) => setProductForm({ ...productForm, images: event.target.files })} />
            <button className="btn-primary w-full" type="submit">
              {editingProductId ? <Save className="h-4 w-4" /> : <PackagePlus className="h-4 w-4" />}
              {editingProductId ? 'Update product' : 'Add product'}
            </button>
            {editingProductId && (
              <button className="btn-secondary w-full" type="button" onClick={cancelProductEdit}>
                Cancel edit
              </button>
            )}
          </form>
          <div className="grid gap-3">
            {products.map((product) => (
              <article key={product._id} className="panel flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black">{product.name}</h3>
                    <StatusBadge status={product.status} />
                  </div>
                  <p className="text-sm text-stone-600">
                    ₹{product.price}
                    {product.businessType === 'Grocery / Kirana Store' ? ` | Stock ${product.stock}` : ''}
                    {product.packSize ? ` | ${product.packSize}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="btn-secondary" type="button" onClick={() => editProduct(product)}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button className="btn-danger" type="button" onClick={() => deleteProduct(product._id)}>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </article>
            ))}
            {products.length === 0 && <p className="panel text-stone-600">No products yet.</p>}
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className="grid gap-3">
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
                  {orderStatuses.map((status) => (
                    <button key={status} className="btn-secondary" type="button" onClick={() => updateOrderStatus(order._id, status)}>
                      {status}
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
          {orders.length === 0 && <p className="panel text-stone-600">No orders yet.</p>}
        </div>
      )}
    </section>
  );
}
