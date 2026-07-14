import {
  ClipboardList,
  Home,
  LayoutDashboard,
  LocateFixed,
  LogOut , 
  MapPin,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Store,
  User,
  UserPlus
} from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';

const roleTheme = {
  customer: {
    badge: 'CUSTOMER WEB APP',
    accent: 'bg-violet-700',
    active: 'bg-violet-100 text-violet-800',
    icon: 'text-violet-700'
  },
  seller: {
    badge: 'SELLER WEB APP',
    accent: 'bg-emerald-600',
    active: 'bg-emerald-100 text-emerald-800',
    icon: 'text-emerald-700'
  },
  admin: {
    badge: 'ADMIN WEB APP',
    accent: 'bg-blue-700',
    active: 'bg-blue-100 text-blue-800',
    icon: 'text-blue-700'
  }
};

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const { items } = useCart();
  const [locationOpen, setLocationOpen] = useState(false);
  const [manualLocation, setManualLocation] = useState({ area: '', city: '' });
  const [locationMessage, setLocationMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const role = user?.role || (location.pathname.startsWith('/admin') ? 'admin' : location.pathname.startsWith('/seller') ? 'seller' : 'customer');
  const theme = roleTheme[role] || roleTheme.customer;
  const isAdmin = role === 'admin';
  const adminSection = location.pathname.startsWith('/admin/') ? location.pathname.split('/')[2] : 'dashboard';
  const searchParams = new URLSearchParams(location.search);
  const adminSearch = searchParams.get('q') || '';
  const customerSearch = role === 'customer' ? searchParams.get('q') || '' : '';
  const customerArea = role === 'customer' ? searchParams.get('area') || '' : '';
  const customerCity = role === 'customer' ? searchParams.get('city') || '' : '';
  const customerLatitude = role === 'customer' ? searchParams.get('latitude') || '' : '';
  const customerLongitude = role === 'customer' ? searchParams.get('longitude') || '' : '';
  const storedLocation = (() => {
    try {
      return JSON.parse(localStorage.getItem('lvm_customer_location') || '{}');
    } catch {
      return {};
    }
  })();
  const locationLabel =
    customerCity ||
    customerArea ||
    storedLocation.city ||
    storedLocation.area ||
    (customerLatitude && customerLongitude ? 'Current location' : 'Select location');
  const sellerTab = role === 'seller' ? searchParams.get('tab') || 'shop' : '';
  const sellerSearch = role === 'seller' ? searchParams.get('q') || '' : '';
  const sellerSearchEnabled = ['products', 'orders'].includes(sellerTab);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleAdminSearch = (event) => {
    const params = new URLSearchParams(location.search);
    const value = event.target.value;
    if (value) params.set('q', value);
    else params.delete('q');
    navigate(`/admin/${adminSection}${params.toString() ? `?${params.toString()}` : ''}`, { replace: true });
  };

  const handleSellerSearch = (event) => {
    const params = new URLSearchParams(location.search);
    const value = event.target.value;
    params.set('tab', sellerTab);
    if (value) params.set('q', value);
    else params.delete('q');
    navigate(`/seller${params.toString() ? `?${params.toString()}` : ''}`, { replace: true });
  };

  const handleCustomerSearch = (event) => {
    const params = new URLSearchParams(location.search);
    const value = event.target.value;
    if (value) params.set('q', value);
    else params.delete('q');
    navigate(`/${params.toString() ? `?${params.toString()}` : ''}`, { replace: true });
  };

  const updateCustomerLocationParams = (nextLocation) => {
    const params = new URLSearchParams(location.search);
    if (nextLocation.latitude && nextLocation.longitude) {
      params.set('latitude', nextLocation.latitude);
      params.set('longitude', nextLocation.longitude);
      params.delete('area');
      params.delete('city');
    } else {
      params.delete('latitude');
      params.delete('longitude');
      if (nextLocation.area) params.set('area', nextLocation.area);
      else params.delete('area');
      if (nextLocation.city) params.set('city', nextLocation.city);
      else params.delete('city');
    }
    localStorage.setItem('lvm_customer_location', JSON.stringify(nextLocation));
    navigate(`/${params.toString() ? `?${params.toString()}` : ''}`, { replace: true });
  };

  const useCurrentLocation = () => {
    setLocationMessage('');

    if (!navigator.geolocation) {
      setLocationMessage('Browser location is not supported. Enter location manually.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateCustomerLocationParams({
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
          label: 'Current location'
        });
        setLocationMessage('Location added.');
        setLocationOpen(false);
      },
      () => setLocationMessage('Location permission denied. Enter location manually.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const applyManualLocation = (event) => {
    event.preventDefault();
    updateCustomerLocationParams({
      area: manualLocation.area.trim(),
      city: manualLocation.city.trim()
    });
    setLocationMessage('');
    setLocationOpen(false);
  };

  const navItems = [
    { to: '/', label: 'Home', icon: Home, show: !user || user?.role === 'customer' },
    { to: '/cart', label: `Cart${itemCount > 0 ? ` (${itemCount})` : ''}`, icon: ShoppingCart, show: user?.role === 'customer' },
    { to: '/orders', label: 'Orders', icon: ClipboardList, show: user?.role === 'customer' },
    { to: '/seller?tab=shop', label: 'Dashboard', icon: LayoutDashboard, show: user?.role === 'seller' },
    { to: '/seller?tab=products', label: 'Products', icon: Package, show: user?.role === 'seller' },
    { to: '/seller?tab=settings', label: 'Business Settings', icon: Settings, show: user?.role === 'seller' },
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, show: user?.role === 'admin' },
    { to: '/admin/users', label: 'Users', icon: User, show: user?.role === 'admin' },
    { to: '/admin/shops', label: 'Shops', icon: Store, show: user?.role === 'admin' },
    { to: '/admin/orders', label: 'Orders', icon: ClipboardList, show: user?.role === 'admin' },
    { to: '/admin/categories', label: 'Categories', icon: Package, show: user?.role === 'admin' },
    { to: '/admin/settings', label: 'Settings', icon: Settings, show: user?.role === 'admin' },
    { to: '/login', label: 'Login', icon: User, show: !user && !loading },
    { to: '/register', label: 'Register', icon: UserPlus, show: !user && !loading }
  ].filter((item) => item.show);

  const isNavItemActive = (item, isActive) => {
    if (role === 'seller' && item.to.startsWith('/seller')) {
      const itemParams = new URLSearchParams(item.to.split('?')[1] || '');
      return location.pathname === '/seller' && (itemParams.get('tab') || 'shop') === sellerTab;
    }

    if (role === 'admin' && item.to.startsWith('/admin')) {
      return location.pathname === item.to;
    }

    return isActive;
  };

  const navClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition ${
      isActive ? theme.active : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
    }`;

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 border-r border-slate-200 bg-white/95 px-3 py-4 shadow-sm backdrop-blur lg:block">
        <Link to="/" className="mb-6 flex items-center gap-2 text-lg font-black text-slate-950">
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${theme.accent}`}>
            <Store className="h-5 w-5 text-white" />
          </span>
          LocalShop
        </Link>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={`${item.to}-${item.label}`} to={item.to} className={({ isActive }) => navClass({ isActive: isNavItemActive(item, isActive) })}>
                <Icon className={`h-4 w-4 ${theme.icon}`} />
                {item.label}
              </NavLink>
            );
          })}
          {user ? (
            <button type="button" className="mt-4 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          ) : null}
        </nav>
      </aside>

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur lg:pl-56">
        <div className="flex flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 text-lg font-black text-slate-950 lg:hidden">
              <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${theme.accent}`}>
                <Store className="h-4 w-4 text-white" />
              </span>
              LocalShop
            </Link>
            {isAdmin ? (
              <label className="hidden min-w-80 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm md:flex">
                <Search className="h-4 w-4" />
                <input
                  className="w-full bg-transparent font-semibold outline-none"
                  placeholder="Search admin data..."
                  value={adminSearch}
                  onChange={handleAdminSearch}
                />
              </label>
            ) : role === 'seller' ? (
              <label className={`hidden min-w-80 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm md:flex ${sellerSearchEnabled ? '' : 'opacity-60'}`}>
                <Search className="h-4 w-4" />
                <input
                  className="w-full bg-transparent font-semibold outline-none"
                  placeholder={sellerSearchEnabled ? `Search ${sellerTab}...` : 'Open Products or Orders to search'}
                  value={sellerSearch}
                  onChange={handleSellerSearch}
                  disabled={!sellerSearchEnabled}
                />
              </label>
            ) : (
              <>
                <label className="hidden min-w-80 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm md:flex">
                  <Search className="h-4 w-4" />
                  <input
                    className="w-full bg-transparent font-semibold outline-none"
                    placeholder="Search shops or products..."
                    value={customerSearch}
                    onChange={handleCustomerSearch}
                  />
                </label>
                <div className="relative hidden md:block">
                  <button
                    type="button"
                    className="flex max-w-52 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
                    onClick={() => {
                      setManualLocation({ area: customerArea || storedLocation.area || '', city: customerCity || storedLocation.city || '' });
                      setLocationOpen((current) => !current);
                    }}
                  >
                    <MapPin className="h-4 w-4 text-violet-700" />
                    <span className="truncate">{locationLabel}</span>
                  </button>
                  {locationOpen && (
                    <div className="absolute left-0 top-12 z-50 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                      <button className="btn-secondary w-full justify-start" type="button" onClick={useCurrentLocation}>
                        <LocateFixed className="h-4 w-4" />
                        Use current location
                      </button>
                      <form className="mt-3 space-y-2" onSubmit={applyManualLocation}>
                        <p className="label">Enter manually</p>
                        <input
                          className="field"
                          placeholder="Area"
                          value={manualLocation.area}
                          onChange={(event) => setManualLocation({ ...manualLocation, area: event.target.value })}
                        />
                        <input
                          className="field"
                          placeholder="City"
                          value={manualLocation.city}
                          onChange={(event) => setManualLocation({ ...manualLocation, city: event.target.value })}
                        />
                        <button className="btn-primary w-full" type="submit">
                          Apply location
                        </button>
                      </form>
                      {locationMessage && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">{locationMessage}</p>}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="order-first flex justify-center sm:order-none">
            <span className={`rounded-b-2xl rounded-t-sm px-8 py-2 text-sm font-black tracking-wide text-white shadow-md ${theme.accent}`}>
              {theme.badge}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <nav className="flex flex-wrap items-center gap-2 lg:hidden">
              {navItems.slice(0, 4).map((item) => {
                const Icon = item.icon;
                return (
                <NavLink key={`${item.to}-${item.label}-mobile`} to={item.to} className={({ isActive }) => navClass({ isActive: isNavItemActive(item, isActive) })}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
                );
              })}
            </nav>
            <div className="flex items-center gap-3">
              {role === 'customer' ? <ShoppingCart className="h-5 w-5 text-slate-500" /> : null}
              <NotificationCenter />
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-sm">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black text-white ${theme.accent}`}>
                  {(loading ? 'C' : user?.name || 'G').slice(0, 1).toUpperCase()}
                </div>
                <span className="hidden text-sm font-bold text-slate-700 sm:inline">{loading ? 'Checking...' : user?.name || 'Guest'}</span>
              </div>
            </div>
          </div>
          {role === 'customer' && (
            <div className="grid w-full gap-2 md:hidden">
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">
                <Search className="h-4 w-4" />
                <input
                  className="w-full bg-transparent font-semibold outline-none"
                  placeholder="Search shops or products..."
                  value={customerSearch}
                  onChange={handleCustomerSearch}
                />
              </label>
              <button
                type="button"
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm"
                onClick={() => {
                  setManualLocation({ area: customerArea || storedLocation.area || '', city: customerCity || storedLocation.city || '' });
                  setLocationOpen((current) => !current);
                }}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-violet-700" />
                  <span className="truncate">{locationLabel}</span>
                </span>
                <span className="text-xs text-violet-700">Change</span>
              </button>
              {locationOpen && (
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                  <button className="btn-secondary w-full justify-start" type="button" onClick={useCurrentLocation}>
                    <LocateFixed className="h-4 w-4" />
                    Use current location
                  </button>
                  <form className="mt-3 space-y-2" onSubmit={applyManualLocation}>
                    <p className="label">Enter manually</p>
                    <input
                      className="field"
                      placeholder="Area"
                      value={manualLocation.area}
                      onChange={(event) => setManualLocation({ ...manualLocation, area: event.target.value })}
                    />
                    <input
                      className="field"
                      placeholder="City"
                      value={manualLocation.city}
                      onChange={(event) => setManualLocation({ ...manualLocation, city: event.target.value })}
                    />
                    <button className="btn-primary w-full" type="submit">
                      Apply location
                    </button>
                  </form>
                  {locationMessage && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">{locationMessage}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </header>
    </>
  );
}
