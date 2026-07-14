import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { CustomerOrdersProvider } from './context/CustomerOrdersContext.jsx';
import { SellerOrdersProvider } from './context/SellerOrdersContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <CartProvider>
            <CustomerOrdersProvider>
              <SellerOrdersProvider>
                <App />
              </SellerOrdersProvider>
            </CustomerOrdersProvider>
          </CartProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
