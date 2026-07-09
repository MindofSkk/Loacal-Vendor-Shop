import {
  Bell,
  ClipboardList,
  Home,
  LayoutDashboard,
  LogOut , 
  Package,
  Search,
  Settings,
  ShoppingCart,
  Store,
  User,
  UserPlus
} from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

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
  const navigate = useNavigate();
  const location = useLocation();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const role = user?.role || (location.pathname.startsWith('/admin') ? 'admin' : location.pathname.startsWith('/seller') ? 'seller' : 'customer');
  const theme = roleTheme[role] || roleTheme.customer;
  const isAdmin = role === 'admin';
  const adminSection = location.pathname.startsWith('/admin/') ? location.pathname.split('/')[2] : 'dashboard';
  const searchParams = new URLSearchParams(location.search);
  const adminSearch = searchParams.get('q') || '';
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

  const navItems = [
    { to: '/', label: 'Home', icon: Home, show: !user || user?.role === 'customer' },
    { to: '/', label: 'Nearby Shops', icon: Store, show: role === 'customer', passive: true },
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

  const navClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition ${
      isActive ? theme.active : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
    }`;

  const passiveNavClass = 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-500';

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-slate-200 bg-white/95 px-4 py-5 shadow-sm backdrop-blur lg:block">
        <Link to="/" className="mb-8 flex items-center gap-2 text-xl font-black text-slate-950">
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${theme.accent}`}>
            <Store className="h-5 w-5 text-white" />
          </span>
          LocalShop
        </Link>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return item.passive ? (
              <span key={`${item.to}-${item.label}`} className={passiveNavClass}>
                <Icon className={`h-4 w-4 ${theme.icon}`} />
                {item.label}
              </span>
            ) : (
              <NavLink key={`${item.to}-${item.label}`} to={item.to} className={navClass}>
                <Icon className={`h-4 w-4 ${theme.icon}`} />
                {item.label}
              </NavLink>
            );
          })}
          {role === 'customer' && (
          <div className="pt-2">
            <span className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-500">
              <User className="h-4 w-4" />
              Wishlist
            </span>
            <span className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-500">
              <Store className="h-4 w-4" />
              Addresses
            </span>
          </div>
          )}
          {user ? (
            <button type="button" className="mt-4 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          ) : null}
        </nav>
      </aside>

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur lg:pl-60">
        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-6">
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
              <div className="hidden min-w-80 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm md:flex">
                <Search className="h-4 w-4" />
                <span>Search for shops or products...</span>
              </div>
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
                return item.passive ? (
                  <span key={`${item.to}-${item.label}-mobile`} className={passiveNavClass}>
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                ) : (
                  <NavLink key={`${item.to}-${item.label}-mobile`} to={item.to} className={navClass}>
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
            <div className="flex items-center gap-3">
              {isAdmin ? null : <Bell className="h-5 w-5 text-slate-500" />}
              {role === 'customer' ? <ShoppingCart className="h-5 w-5 text-slate-500" /> : null}
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-sm">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black text-white ${theme.accent}`}>
                  {(loading ? 'C' : user?.name || 'G').slice(0, 1).toUpperCase()}
                </div>
                <span className="hidden text-sm font-bold text-slate-700 sm:inline">{loading ? 'Checking...' : user?.name || 'Guest'}</span>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
