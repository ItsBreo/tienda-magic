// resources/js/app.tsx
import '../css/app.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Hooks y Contextos
import { initializeTheme } from './hooks/use-appearance';
import { AuthProvider } from './contexts/AuthContext';

// Páginas y Componentes de Layout
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import { ProtectedLayout } from './components/ProtectedRoute';
import Dashboard from './pages/dashboard';

// 1. Inicializar el tema (Modo claro/oscuro) basado en la preferencia del sistema o guardada
initializeTheme();

// 2. Buscar el contenedor principal definido en resources/views/app.blade.php
const el = document.getElementById('root') || document.getElementById('app');

if (el) {
    const root = createRoot(el);

    root.render(
        <StrictMode>
            {/* AuthProvider envuelve toda la app para saber siempre quién está logueado */}
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        {/* =========================================
                            RUTAS PÚBLICAS (No protegidas)
                            ========================================= */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* =========================================
                            RUTAS PROTEGIDAS (Requieren inicio de sesión)
                            ========================================= */}
                        <Route element={<ProtectedLayout />}>
                            {/* Cualquier ruta dentro de este bloque exigirá estar logueado automáticamente */}
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/shop" element={<h1 className="p-8 text-center">Tienda</h1>} />
                            <Route path="/profile" element={<div className="p-8"><h1>Tu Perfil</h1></div>} />

                            {/* Redirección por defecto: si alguien logueado pone una URL que no existe, va al dashboard */}
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Route>

                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </StrictMode>
    );
} else {
    console.error("No se encontró el elemento raíz ('root' o 'app') en el HTML.");
}
