import { MapPin, MessageCircle, PackagePlus, Plus, Save, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { getApiError } from '../../api/client';
import { categoryApi, orderApi, productApi, shopApi } from '../../api/services';
import StatusBadge from '../../components/StatusBadge';

const orderStatuses = ['Accepted', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled', 'Rejected'];
const businessTypes = ['Restaurant', 'Grocery / Kirana Store', 'Dairy and Bakery'];
const foodCategories = ['Starter', 'Main Course', 'Snacks', 'Drinks', 'Dessert'];
const groceryCategories = ['Rice', 'Oil', 'Snacks', 'Cold Drinks', 'Household', 'Personal Care', 'Other'];

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

const buildWhatsAppMessage = (order) => {
  const address = order.deliveryAddress || {};
  const items = order.items.map((item) => `${item.quantity} × ${item.name}`).join('\n');

  return `🚚 New Delivery Order

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

Total: ₹${order.subtotal}

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
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [shopForm, setShopForm] = useState({
    name: '',
    description: '',
    category: '',
    businessType: 'Restaurant',
    phone: '',
    deliveryRadiusKm: 5,
    location: { area: '', city: '', pincode: '', landmark: '' },
    deliveryBoys: []
  });
  const [productForm, setProductForm] = useState(emptyProductForm);

  const hydrateShopForm = useCallback((nextShop) => {
    if (!nextShop) return;
    setShopForm({
      name: nextShop.name || '',
      description: nextShop.description || '',
      category: nextShop.category?._id || nextShop.category || '',
      businessType: nextShop.businessType || 'Restaurant',
      phone: nextShop.phone || '',
      deliveryRadiusKm: nextShop.deliveryRadiusKm || 5,
      location: {
        area: nextShop.location?.area || '',
        city: nextShop.location?.city || '',
        pincode: nextShop.location?.pincode || '',
        landmark: nextShop.location?.landmark || ''
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

  useEffect(() => {
    loadData().catch((err) => setError(getApiError(err)));
  }, [loadData]);

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
      const { data } = await shopApi.saveMyShop({ ...shopForm, category });
      setShop(data);
      hydrateShopForm(data);
      setMessage('Shop profile submitted for admin approval.');
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
      await productApi.create(formData);
      setProductForm(emptyProductForm);
      setMessage('Product added.');
      loadData();
    } catch (err) {
      setError(getApiError(err));
    }
  };

  const deleteProduct = async (id) => {
    await productApi.remove(id);
    loadData();
  };

  const updateOrderStatus = async (id, status) => {
    await orderApi.updateSellerStatus(id, { status, note: `Seller marked ${status}` });
    loadData();
  };

  const openShare = (order) => {
    window.open(buildWhatsAppUrl(order, selectedDeliveryBoys[order._id]), '_blank', 'noopener,noreferrer');
  };

  const activeBusinessType = shop?.businessType || shopForm.businessType;

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
        {['shop', 'products', 'orders'].map((item) => (
          <button key={item} className={tab === item ? 'btn-primary' : 'btn-secondary'} type="button" onClick={() => setTab(item)}>
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {message && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}

      {tab === 'shop' && (
        <form className="panel grid gap-3 md:grid-cols-2" onSubmit={saveShop}>
          <input className="field" placeholder="Shop name" value={shopForm.name} onChange={(event) => setShopForm({ ...shopForm, name: event.target.value })} required />
          <input className="field" placeholder="Phone" value={shopForm.phone} onChange={(event) => setShopForm({ ...shopForm, phone: event.target.value })} required />
          <select className="field" value={shopForm.businessType} onChange={(event) => setShopForm({ ...shopForm, businessType: event.target.value })} required>
            {businessTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <input className="field" type="number" min="1" max="25" placeholder="Delivery radius" value={shopForm.deliveryRadiusKm} onChange={(event) => setShopForm({ ...shopForm, deliveryRadiusKm: event.target.value })} />
          <input className="field md:col-span-2" placeholder="Description" value={shopForm.description} onChange={(event) => setShopForm({ ...shopForm, description: event.target.value })} />
          {['area', 'city', 'pincode', 'landmark'].map((field) => (
            <input key={field} className="field" placeholder={field} value={shopForm.location[field]} onChange={(event) => updateShopLocation(field, event.target.value)} required={field !== 'landmark'} />
          ))}
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
        </form>
      )}

      {tab === 'products' && (
        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <form className="panel h-fit space-y-3" onSubmit={createProduct}>
            <div>
              <p className="label">{activeBusinessType}</p>
              <h2 className="text-lg font-black">Add product</h2>
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
              <PackagePlus className="h-4 w-4" />
              Add product
            </button>
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
                <button className="btn-danger" type="button" onClick={() => deleteProduct(product._id)}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </article>
            ))}
            {products.length === 0 && <p className="panel text-stone-600">No products yet.</p>}
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className="grid gap-3">
          {orders.map((order) => (
            <article key={order._id} className="panel space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="label">{order.customer?.name}</p>
                  <h3 className="font-black">Order #{order._id.slice(-6)}</h3>
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
