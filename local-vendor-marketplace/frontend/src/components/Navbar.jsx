import { Bell, Home, LayoutDashboard, LogOut, ShoppingCart, Store, UserPlus } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const linkClass = ({ isActive }) =>
  `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${
    isActive ? 'bg-market-leaf text-white' : 'text-market-ink hover:bg-stone-100'
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-lg font-black text-market-ink">
          <Store className="h-6 w-6 text-market-leaf" />
          Local Vendor
        </Link>
        <nav className="flex flex-wrap items-center gap-2">
          <NavLink to="/" className={linkClass}>
            <Home className="h-4 w-4" />
            Shops
          </NavLink>
          {user?.role === 'customer' && (
            <>
              <NavLink to="/cart" className={linkClass}>
                <ShoppingCart className="h-4 w-4" />
                Cart {itemCount > 0 ? `(${itemCount})` : ''}
              </NavLink>
              <NavLink to="/orders" className={linkClass}>
                <Bell className="h-4 w-4" />
                Orders
              </NavLink>
            </>
          )}
          {user?.role === 'seller' && (
            <NavLink to="/seller" className={linkClass}>
              <LayoutDashboard className="h-4 w-4" />
              Seller
            </NavLink>
          )}
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={linkClass}>
              <LayoutDashboard className="h-4 w-4" />
              Admin
            </NavLink>
          )}
          {user ? (
            <button type="button" className="btn-secondary" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Login
              </NavLink>
              <NavLink to="/register" className={linkClass}>
                <UserPlus className="h-4 w-4" />
                Register
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
