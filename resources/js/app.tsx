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
import Profile from './pages/profile/Profile';
import Inventory from './pages/inventory/Inventory';
import Achievements from './pages/achievement/Achievement';

// Importaciones de Intercambios
import Exchanges from './pages/exchange/Exchanges';
import ManageExchanges from './pages/exchange/ManageExchanges';
import TradeRoom from './pages/exchange/TradeRoom';

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
                {/* FIX 1: Hacemos que las notificaciones respeten el tema claro/oscuro */}
                <Toaster
                    theme="system"
                    position="top-right"
                    richColors
                    expand
                    toastOptions={{
                        className: 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xl',
                    }}
                />

                <BrowserRouter>
                    <Routes>
                        {/* RUTAS PÚBLICAS */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* RUTAS PROTEGIDAS */}
                        <Route element={<ProtectedLayout />}>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/shop" element={<PacksView />} />
                            <Route path="/cart" element={<Cart />} />
                            <Route path="/checkout/success" element={<CheckoutSuccess />} />
                            <Route path="/wallet" element={<WalletPage />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/inventory" element={<Inventory />} />
                            <Route path="/achievements" element={<Achievements />} />
                            <Route path="/forum" element={<Forum />} />

                            {/* RUTAS DE INTERCAMBIO */}
                            <Route path="/exchanges" element={<Exchanges />} />
                            <Route path="/exchanges/manage" element={<ManageExchanges />} />
                            <Route path="/trade/:id" element={<TradeRoom />} />
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Route>

                        {/* RUTAS DE ADMINISTRADOR */}
                        <Route element={<AdminRoute />}>
                            <Route element={<AdminLayout />}>
                                <Route path="/admin" element={<AdminDashboard />} />
                                <Route path="/admin/users" element={<AdminUsers />} />
                                <Route path="/admin/roles" element={<AdminRoles />} />
                                <Route path="/admin/cards" element={<AdminCards />} />
                                <Route path="/admin/sets" element={<AdminSets />} />
                            </Route>
                        </Route>
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </StrictMode>,
    );
} else {
    // Error silenciado: no se encontró el elemento raíz
}
