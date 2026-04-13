import { type ReactNode, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { type BreadcrumbItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';

interface TiendaLayoutProps {
  children: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export default function TiendaLayout({
  children,
  breadcrumbs = [],
}: TiendaLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      // Error silenciado en logout
    }
  };

  useEffect(() => {
    document.title = 'Tienda Magic';
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] font-sans flex flex-col">
      {/* Header Navigation */}
      <header className="bg-[var(--surface)] border-b border-[var(--border)] sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-3.5">
          <div className="flex items-center justify-between">

            {/* Logo */}
            <div className="flex items-center gap-3">
              {/* Icono de cubo estilo la imagen */}
              <div className="w-8 h-8 flex items-center justify-center text-[var(--accent)]">
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                   <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                   <line x1="12" y1="22.08" x2="12" y2="12" />
                 </svg>
              </div>
              <h1 className="text-[17px] font-bold text-[var(--text-primary)] tracking-tight">Tienda Magic</h1>
            </div>

            {/* Navigation (Ajustada a la imagen) */}
            <nav className="hidden md:flex items-center gap-7 text-[14px]">
              <Link
                to="/dashboard"
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium"
              >
                Inicio
              </Link>
              <Link
                to="/shop"
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium"
              >
                Catálogo
              </Link>
              <Link
                to="/cart"
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium"
              >
                Carrito
              </Link>
              <Link
                to="/collection"
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium"
              >
                Mi Colección
              </Link>
              <Link
                to="/vault"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-md border border-[var(--accent)]/30 text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors font-medium"
              >
                <span className="text-lg leading-none">⬡</span> Bóveda
              </Link>
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-5 text-[14px]">
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-[var(--text-secondary)] font-medium">
                    {user.name}
                  </span>

                  {/* Balance estilo imagen */}
                  <div className="flex items-center px-3 py-1.5 bg-[var(--surface-2)] rounded-md border border-[var(--border)]">
                    <span className="font-semibold text-[var(--accent)]">
                      €{Number(user.wallet_balance ?? 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] rounded-md h-8 w-8 cursor-pointer transition-colors"
                      onClick={() => navigate('/profile')}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] rounded-md h-8 w-8 cursor-pointer transition-colors"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    to="/login"
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    to="/register"
                    className="bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors px-4 py-1.5 rounded-md font-medium"
                  >
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="bg-[var(--surface)]/50 border-b border-[var(--border)]">
          <div className="max-w-[1600px] mx-auto px-6 py-2.5">
            <nav className="flex items-center gap-2 text-[13px]">
              {breadcrumbs.map((breadcrumb, index) => (
                <div key={index} className="flex items-center gap-2">
                  {index > 0 && (
                    <span className="text-[var(--text-muted)]">/</span>
                  )}
                  <a
                    href={breadcrumb.href}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {breadcrumb.title}
                  </a>
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[var(--surface)] border-t border-[var(--border)] mt-auto">
        <div className="max-w-[1600px] mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-[var(--text-muted)] text-[13px]">© {new Date().getFullYear()} Tienda Magic. Todos los derechos reservados.</p>
              <p className="text-[var(--text-muted)] opacity-70 text-[12px] mt-1">
                Tu tienda especializada en cartas Magic: The Gathering
              </p>
            </div>
            <div className="flex items-center gap-6 text-[12px]">
              <button
                type="button"
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Términos
              </button>
              <span className="text-[var(--border)]">•</span>
              <button
                type="button"
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Privacidad
              </button>
              <span className="text-[var(--border)]">•</span>
              <button
                type="button"
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Contacto
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
