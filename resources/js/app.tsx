// resources/js/app.tsx
import '../css/app.css';
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
    BrowserRouter, Routes, Route, Navigate,
} from 'react-router-dom';
import { Toaster } from 'sonner';

// Hooks y Contextos
import { initializeTheme } from './hooks/use-appearance';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import CartDrawer from './components/cart/CartDrawer';

// Páginas y Componentes de Layout
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import { ProtectedLayout } from './components/ProtectedRoute';
import Dashboard from './pages/dashboard/dashboard';
import PacksView from './pages/shop/PacksView';
import Cart from './pages/shop/Cart';
import CheckoutSuccess from './pages/shop/CheckoutSuccess';
import WalletPage from './pages/shop/Wallet';
import Forum from './pages/forum/Forum';

// Admin Components & Pages
import { AdminRoute } from './components/AdminRoute';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminRoles from './pages/admin/Roles';
import AdminCards from './pages/admin/Cards';
import AdminSets from './pages/admin/Sets';
import AdminBoosterPacks from './pages/admin/BoosterPacks';
import Profile from './pages/profile/Profile';
import Inventory from './pages/inventory/Inventory';
import Achievements from './pages/achievement/Achievement';
import Exchanges from './pages/exchange/Exchanges';
import ManageExchanges from './pages/exchange/ManageExchanges';
import TradeRoom from './pages/exchange/TradeRoom';
import Marketplace from './pages/market/Marketplace';
import ProductDetail from './pages/market/ProductDetail';

// Páginas de Información
import Rules from './pages/static/Rules';
import Privacy from './pages/static/Privacy';
import Contact from './pages/static/Contact';
import Support from './pages/static/Support';

initializeTheme();

const el = document.getElementById('root') || document.getElementById('app');

if (el) {
    // FIX 2: Garantizamos que el marco principal ocupe toda la ventana del navegador.
    // Esto evita que componentes con 'height: 100%' como tu Foro colapsen visualmente.
    el.classList.add('min-h-screen', 'flex', 'flex-col');

    const root = createRoot(el);

    root.render(
        <StrictMode>
            <AuthProvider>
                <CartProvider>
                    <BrowserRouter>
                        <Toaster position="top-right" expand={true} richColors closeButton />
                        <Routes>
                            {/* Públicas */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />

                            {/* RUTAS PROTEGIDAS (Requieren Login) */}
                            <Route element={<ProtectedLayout />}>
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/shop" element={<PacksView />} />
                                <Route path="/cart" element={<Cart />} />
                                <Route path="/wallet" element={<WalletPage />} />
                                <Route path="/profile" element={<Profile />} />
                                <Route path="/inventory" element={<Inventory />} />
                                <Route path="/achievements" element={<Achievements />} />
                                <Route path="/exchanges" element={<Exchanges />} />
                                <Route path="/exchanges/manage" element={<ManageExchanges />} />
                                <Route path="/trade/:sessionId" element={<TradeRoom />} />
                                <Route path="/market" element={<Marketplace />} />
                                <Route path="/market/product/:type/:id" element={<ProductDetail />} />
                                <Route path="/forum/*" element={<Forum />} />
                                <Route path="/checkout/success" element={<CheckoutSuccess />} />

                                {/* RUTAS ESTÁTICAS */}
                                <Route path="/rules" element={<Rules />} />
                                <Route path="/privacy" element={<Privacy />} />
                                <Route path="/contact" element={<Contact />} />
                                <Route path="/support" element={<Support />} />

                                {/* RUTAS DE ADMINISTRADOR */}
                                <Route element={<AdminRoute />}>
                                    <Route element={<AdminLayout />}>
                                        <Route path="/admin" element={<AdminDashboard />} />
                                        <Route path="/admin/users" element={<AdminUsers />} />
                                        <Route path="/admin/roles" element={<AdminRoles />} />
                                        <Route path="/admin/cards" element={<AdminCards />} />
                                        <Route path="/admin/sets" element={<AdminSets />} />
                                        <Route path="/admin/booster-packs" element={<AdminBoosterPacks />} />
                                    </Route>
                                </Route>

                                <Route path="*" element={<Navigate to="/dashboard" replace />} />
                            </Route>

                            {/* Fallback */}
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                        <CartDrawer />
                    </BrowserRouter>
                </CartProvider>
            </AuthProvider>
        </StrictMode>
    );
} else {
    // Error silenciado: no se encontró el elemento raíz
}
