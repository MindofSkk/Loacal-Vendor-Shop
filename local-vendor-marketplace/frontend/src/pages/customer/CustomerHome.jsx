import { ArrowRight, Clock, MapPin, Milk, Navigation, Search, ShoppingBasket, Star, Store, Truck, Utensils } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { categoryApi, productApi, shopApi } from '../../api/services';
import ProductCard from '../../components/ProductCardV2';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';

const categoryTiles = [
  {
    name: 'Restaurant',
    description: 'Fresh meals',
    Icon: Utensils,
    tone: 'border-orange-100 bg-orange-50 text-orange-700'
  },
  {
    name: 'Grocery / Kirana Store',
    label: 'Grocery / Kirana',
    description: 'Daily essentials',
    Icon: ShoppingBasket,
    tone: 'border-emerald-100 bg-emerald-50 text-emerald-700'
  },
  {
    name: 'Dairy and Bakery',
    description: 'Fresh stock',
    Icon: Milk,
    tone: 'border-violet-100 bg-violet-50 text-violet-700'
  }
];

export default function CustomerHome() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({ q: '', area: '', city: '', category: '' });
  const [selectedShop, setSelectedShop] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [locationMessage, setLocationMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async (override = {}) => {
    const nextFilters = { ...filters, ...override };
    const locationParams = customerLocation
      ? { latitude: customerLocation.latitude, longitude: customerLocation.longitude }
      : {};
    setLoading(true);
    const [categoryRes, shopRes, productRes] = await Promise.all([
      categoryApi.list(),
      shopApi.list({ ...nextFilters, ...locationParams }),
      productApi.list({ q: nextFilters.q, category: nextFilters.category, shop: nextFilters.shop })
    ]);
    setCategories(categoryRes.data.filter((category) => category.isActive));
    setShops(shopRes.data);
    setProducts(productRes.data);
    setLoading(false);
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      const [categoryRes, shopRes, productRes] = await Promise.all([
        categoryApi.list(),
        shopApi.list({ q: '', area: '', city: '', category: '' }),
        productApi.list({ q: '', category: '' })
      ]);
      setCategories(categoryRes.data.filter((category) => category.isActive));
      setShops(shopRes.data);
      setProducts(productRes.data);
      setLoading(false);
    };

    loadInitialData();
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    setSelectedShop(null);
    loadData();
  };

  const useCustomerLocation = () => {
    setLocationMessage('');

    if (!navigator.geolocation) {
      setLocationMessage('Browser location is not supported.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setCustomerLocation(nextLocation);
        setLocationMessage('Location added. Distances are shown where shop coordinates are available.');
        loadData(nextLocation);
      },
      () => setLocationMessage('Location permission denied. You can still browse shops.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const selectCategory = (categoryName) => {
    const category = categories.find((item) => item.name === categoryName);
    const nextCategory = category?._id || '';
    setSelectedShop(null);
    setFilters({ ...filters, category: nextCategory });
    loadData({ category: nextCategory, shop: undefined });
  };

  const viewShopProducts = (shop) => {
    setSelectedShop(shop);
    loadData({ shop: shop._id });
  };

  const clearShopFilter = () => {
    setSelectedShop(null);
    loadData({ shop: undefined });
  };

  const dashboardLink = user?.role === 'admin' ? '/admin' : user?.role === 'seller' ? '/seller' : '/orders';
  const dashboardText = user?.role === 'admin' ? 'Go to Admin Dashboard' : user?.role === 'seller' ? 'Go to Seller Dashboard' : 'View My Orders';

  return (
    <div className="space-y-6">
      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-2xl border border-violet-100 bg-violet-50 p-5 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-[1fr_260px] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-violet-700">Local delivery marketplace</p>
              <h1 className="mt-3 max-w-xl text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                Order from nearby local shops
              </h1>
              <p className="mt-3 max-w-xl text-sm font-semibold text-slate-600">
                Restaurant, Grocery / Kirana, Dairy and Bakery products delivered by nearby sellers.
              </p>
              {user ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link className="btn-primary" to={dashboardLink}>
                    {dashboardText}
                  </Link>
                  {user.role === 'customer' && (
                    <Link className="btn-secondary" to="/cart">
                      View Cart
                    </Link>
                  )}
                </div>
              ) : (
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link className="btn-primary" to="/login">
                    Customer Login
                  </Link>
                  <Link className="btn-secondary" to="/login">
                    Seller Login
                  </Link>
                  <Link className="btn-secondary" to="/register?role=seller">
                    Seller Registration
                  </Link>
                </div>
              )}
            </div>
            <div className="hidden rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm lg:block">
              <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full bg-violet-100">
                <Truck className="h-20 w-20 text-violet-700" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs font-bold text-slate-600">
                <span className="rounded-lg bg-white px-2 py-2">Fast delivery</span>
                <span className="rounded-lg bg-white px-2 py-2">Local sellers</span>
              </div>
            </div>
          </div>

          {locationMessage && <p className="mt-4 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-700">{locationMessage}</p>}

          <form className="mt-5 grid gap-3 rounded-2xl bg-white p-3 shadow-sm sm:grid-cols-4" onSubmit={handleSearch}>
            <label className="sm:col-span-2">
              <span className="sr-only">Search shops or products</span>
              <input
                className="field"
                placeholder="Search shops or products..."
                value={filters.q}
                onChange={(event) => setFilters({ ...filters, q: event.target.value })}
              />
            </label>
            <input
              className="field"
              placeholder="Area"
              value={filters.area}
              onChange={(event) => setFilters({ ...filters, area: event.target.value })}
            />
            <input
              className="field"
              placeholder="City"
              value={filters.city}
              onChange={(event) => setFilters({ ...filters, city: event.target.value })}
            />
            <select
              className="field sm:col-span-2"
              value={filters.category}
              onChange={(event) => setFilters({ ...filters, category: event.target.value })}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            <button className="btn-primary" type="submit">
              <Search className="h-4 w-4" />
              Search
            </button>
            <button className="btn-secondary" type="button" onClick={useCustomerLocation}>
              <Navigation className="h-4 w-4" />
              Use location
            </button>
          </form>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="panel">
            <p className="label">Marketplace today</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-violet-50 p-3">
                <p className="text-3xl font-black text-violet-700">{shops.length}</p>
                <p className="text-sm font-bold text-slate-600">Nearby shops</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3">
                <p className="text-3xl font-black text-emerald-700">{products.length}</p>
                <p className="text-sm font-bold text-slate-600">Products</p>
              </div>
            </div>
          </div>
          <div className="panel">
            <p className="label">Shop by Category</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {categoryTiles.map(({ name, label, description, Icon, tone }) => (
                <button
                  key={name}
                  type="button"
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${tone}`}
                  onClick={() => selectCategory(name)}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span>
                    <span className="block text-sm font-black text-slate-950">{label || name}</span>
                    <span className="block text-xs font-semibold text-slate-600">{description}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="label">Browse nearby</p>
            <h2 className="text-xl font-black">Nearby Shops</h2>
          </div>
          <button className="text-sm font-black text-violet-700" type="button" onClick={() => loadData({ category: '', shop: undefined })}>
            View all
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shops.map((shop) => (
            <article key={shop._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="relative h-32 bg-slate-100">
                {shop.logoUrl ? (
                  <img src={shop.logoUrl} alt={shop.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-violet-50">
                    <Store className="h-12 w-12 text-violet-700" />
                  </div>
                )}
                <div className="absolute right-3 top-3">
                  <StatusBadge status={shop.openStatus?.isOpenNow ? 'active' : 'inactive'} />
                </div>
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-slate-950">{shop.name}</h3>
                    <p className="text-xs font-bold text-slate-500">{shop.businessType}</p>
                  </div>
                  <p className="flex items-center gap-1 text-xs font-black text-amber-600">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    New
                  </p>
                </div>
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <MapPin className="h-4 w-4 text-violet-700" />
                  {[shop.location?.area, shop.location?.city].filter(Boolean).join(', ') || 'Local area'}
                </p>
                {shop.temporaryClosure?.enabled && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">This shop is temporarily closed.</p>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-600">
                  <span className="rounded-lg bg-slate-50 px-2 py-2">{shop.distanceKm == null ? 'Distance N/A' : `${shop.distanceKm} km away`}</span>
                  <span className="rounded-lg bg-slate-50 px-2 py-2">
                    <Clock className="mr-1 inline h-3.5 w-3.5" />
                    {shop.deliverySettings?.estimatedDeliveryTime || '30 Minutes'}
                  </span>
                  <span className="rounded-lg bg-slate-50 px-2 py-2">Delivery ₹{shop.deliverySettings?.deliveryCharge || 0}</span>
                  <span className="rounded-lg bg-slate-50 px-2 py-2">Min ₹{shop.deliverySettings?.minimumOrder || 0}</span>
                </div>
                <button className="btn-secondary w-full justify-between" type="button" onClick={() => viewShopProducts(shop)}>
                  View products
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
          {!loading && shops.length === 0 && <p className="panel text-slate-600">No shops found.</p>}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="label">{selectedShop ? selectedShop.businessType : 'Fresh listings'}</p>
            <h2 className="text-xl font-black">{selectedShop ? `${selectedShop.name} products` : 'Products'}</h2>
          </div>
          {selectedShop && (
            <button className="text-sm font-black text-violet-700" type="button" onClick={clearShopFilter}>
              Show all products
            </button>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
          {!loading && products.length === 0 && (
            <p className="panel text-slate-600">
              No products found for this selection. Try another category, shop, or search term.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
