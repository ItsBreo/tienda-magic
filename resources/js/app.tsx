// resources/js/app.tsx
import '../css/app.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importamos la librería de los Toasts 🚀
import { Toaster } from 'sonner';

// Hooks y Contextos
import { initializeTheme } from './hooks/use-appearance';
import { AuthProvider } from './contexts/AuthContext';

// Páginas y Componentes de Layout
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import { ProtectedLayout } from './components/ProtectedRoute';
import Dashboard from './pages/dashboard/dashboard';

// Admin Components & Pages
import { AdminRoute } from './components/AdminRoute';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminCards from './pages/admin/Cards';
import AdminSets from './pages/admin/Sets';

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
                    expand={true}
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
                            <Route path="/shop" element={<div className="p-8"><h1>Tienda de Cartas</h1></div>} />
                            <Route path="/profile" element={<div className="p-8"><h1>Tu Perfil</h1></div>} />

                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Route>

                        {/* RUTAS DE ADMINISTRADOR */}
                        <Route element={<AdminRoute />}>
                            <Route element={<AdminLayout />}>
                                <Route path="/admin" element={<AdminDashboard />} />
                                <Route path="/admin/users" element={<AdminUsers />} />
                                <Route path="/admin/cards" element={<AdminCards />} />
                                <Route path="/admin/sets" element={<AdminSets />} />
                            </Route>
                        </Route>
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </StrictMode>
    );
} else {
    console.error("No se encontró el elemento raíz en el HTML.");
}
