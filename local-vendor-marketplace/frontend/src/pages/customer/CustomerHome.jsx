import { MapPin, Search, Store } from 'lucide-react';
import { useEffect, useState } from 'react';
import { categoryApi, productApi, shopApi } from '../../api/services';
import ProductCard from '../../components/ProductCardV2';
import StatusBadge from '../../components/StatusBadge';

export default function CustomerHome() {
  const [categories, setCategories] = useState([]);
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({ q: '', area: '', city: '', category: '' });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [categoryRes, shopRes, productRes] = await Promise.all([
      categoryApi.list(),
      shopApi.list(filters),
      productApi.list({ q: filters.q, category: filters.category })
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
    loadData();
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg bg-market-ink px-5 py-6 text-white">
          <p className="text-sm font-semibold text-market-lime">Hyperlocal marketplace</p>
          <h1 className="mt-2 max-w-2xl text-3xl font-black sm:text-4xl">Shop from trusted vendors near you</h1>
          <form className="mt-5 grid gap-3 sm:grid-cols-4" onSubmit={handleSearch}>
            <input
              className="field sm:col-span-2"
              placeholder="Search shops or products"
              value={filters.q}
              onChange={(event) => setFilters({ ...filters, q: event.target.value })}
            />
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
              className="field sm:col-span-3"
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
            <button className="btn-primary bg-market-lime text-market-ink hover:bg-lime-300" type="submit">
              <Search className="h-4 w-4" />
              Search
            </button>
          </form>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="panel">
            <p className="label">Open shops</p>
            <p className="mt-2 text-3xl font-black">{shops.length}</p>
          </div>
          <div className="panel">
            <p className="label">Products</p>
            <p className="mt-2 text-3xl font-black">{products.length}</p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-black">Nearby Shops</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {shops.map((shop) => (
            <article key={shop._id} className="panel space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-market-leaf" />
                    <h3 className="font-black">{shop.name}</h3>
                  </div>
                  <p className="mt-1 text-sm text-stone-600">{shop.description || 'Local shop'}</p>
                </div>
                <StatusBadge status={shop.isOpen ? 'active' : 'inactive'} />
              </div>
              <p className="flex items-center gap-2 text-sm text-stone-600">
                <MapPin className="h-4 w-4" />
                {shop.location?.area}, {shop.location?.city}
              </p>
            </article>
          ))}
          {!loading && shops.length === 0 && <p className="panel text-stone-600">No shops found.</p>}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-black">Products</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
          {!loading && products.length === 0 && <p className="panel text-stone-600">No products found.</p>}
        </div>
      </section>
    </div>
  );
}
