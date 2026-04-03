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

// Asegúrate de importar las otras páginas que uses

initializeTheme();

const el = document.getElementById('root') || document.getElementById('app');

if (el) {
    const root = createRoot(el);

    root.render(
        <StrictMode>
            <AuthProvider>
                <Toaster
                    theme="dark"
                    position="top-right"
                    richColors
                    expand
                    toastOptions={{
                        className: 'bg-zinc-900 border-zinc-800 text-zinc-100 shadow-2xl',
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
