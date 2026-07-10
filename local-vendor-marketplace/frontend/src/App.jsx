import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Cart from './pages/customer/CartV2';
import CustomerHome from './pages/customer/CustomerHome';
import Orders from './pages/customer/OrdersV2';
import OrderConfirmation from './pages/customer/OrderConfirmation';
import ProductDetails from './pages/customer/ProductDetailsV2';
import SellerDashboard from './pages/seller/SellerDashboardV2';
import { useAuth } from './context/AuthContext';

const DashboardRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="panel">Checking authentication...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'seller') return <Navigate to="/seller" replace />;
  return <Navigate to="/" replace />;
};

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-[1440px] px-4 py-4 sm:px-5 lg:ml-56 lg:max-w-none lg:px-5">
        <Routes>
          <Route path="/" element={<CustomerHome />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route
            path="/cart"
            element={
              <ProtectedRoute roles={['customer']}>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute roles={['customer']}>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-confirmation"
            element={
              <ProtectedRoute roles={['customer']}>
                <OrderConfirmation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller"
            element={
              <ProtectedRoute roles={['seller']}>
                <SellerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/:section"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
