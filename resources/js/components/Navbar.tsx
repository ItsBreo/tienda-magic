import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Package, LogOut, Shield, User, ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [aboutOpen, setAboutOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const aboutRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.is_admin || user?.role_name?.toLowerCase().includes('admin');

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      // silenced
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (aboutRef.current && !aboutRef.current.contains(e.target as Node)) {
        setAboutOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navLink = (to: string, label: string) => {
    const active = location.pathname === to || location.pathname.startsWith(to + '/');
    return (
      <Link
        to={to}
        className={`text-[15px] font-medium transition-colors duration-200 ${
          active
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {label}
      </Link>
    );
  };

  // Avatar: initials or profile picture
  const avatarContent = user?.avatar ? (
    <img
      src={user.avatar}
      alt={user.name}
      className="w-8 h-8 rounded-full object-cover ring-2 ring-border"
    />
  ) : (
    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center ring-2 ring-border flex-shrink-0">
      <span className="text-[11px] font-bold text-primary-foreground">
        {(user?.name || user?.username || 'U').substring(0, 2).toUpperCase()}
      </span>
    </div>
  );

  // Default avatar for guests
  const defaultAvatar = (
    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center ring-2 ring-border flex-shrink-0">
      <User className="w-4 h-4 text-muted-foreground" />
    </div>
  );

  return (
    <header className="bg-background border-b border-border sticky top-0 z-40 w-full transition-colors duration-300">
      <div className="w-full px-10 py-4">
        <div className="flex items-center justify-between gap-6">

          {/* ── LEFT SIDE: Logo + Nav links ── */}
          <div className="flex items-center gap-10">

            {/* Logo */}
            <Link
              to="/dashboard"
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity flex-shrink-0"
            >
              <div className="p-1.5 bg-card border border-border rounded-sm">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xl font-serif font-bold text-foreground tracking-tight whitespace-nowrap">
                Tienda Magic
              </span>
            </Link>

            {/* Primary nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLink('/dashboard', 'Inicio')}
              {navLink('/shop', 'Catálogo')}
              {user && navLink('/inventory', 'Inventario')}

              {/* About dropdown */}
              <div className="relative" ref={aboutRef}>
                <button
                  onClick={() => { setAboutOpen(o => !o); setUserMenuOpen(false); }}
                  className={`flex items-center gap-1 text-sm font-medium transition-colors duration-200 ${
                    aboutOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  About
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${aboutOpen ? 'rotate-180' : ''}`} />
                </button>

                {aboutOpen && (
                  <div className="absolute left-0 top-full mt-2 w-48 bg-popover border border-border rounded-md shadow-lg z-50 flex flex-col overflow-hidden">
                    <Link
                      to="/rules"
                      onClick={() => setAboutOpen(false)}
                      className="px-4 py-2.5 text-sm text-popover-foreground hover:text-primary hover:bg-accent border-b border-border transition-colors"
                    >
                      Reglas de Juego
                    </Link>
                    <Link
                      to="/contact"
                      onClick={() => setAboutOpen(false)}
                      className="px-4 py-2.5 text-sm text-popover-foreground hover:text-primary hover:bg-accent transition-colors"
                    >
                      Contacto
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* ── RIGHT SIDE: Theme toggler + User ── */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <AnimatedThemeToggler />

            {user ? (
              /* User dropdown */
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => { setUserMenuOpen(o => !o); setAboutOpen(false); }}
                  className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent transition-colors duration-200 group"
                >
                  {avatarContent}
                  <span className="hidden sm:inline text-sm font-medium text-foreground group-hover:text-primary transition-colors max-w-[120px] truncate">
                    {user.username || user.name}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-popover border border-border rounded-md shadow-lg z-50 flex flex-col overflow-hidden">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-xs text-muted-foreground">Conectado como</p>
                      <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-popover-foreground hover:text-primary hover:bg-accent border-b border-border transition-colors"
                    >
                      <User className="h-4 w-4" />
                      Perfil
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-popover-foreground hover:text-primary hover:bg-accent border-b border-border transition-colors"
                      >
                        <Shield className="h-4 w-4" />
                        Panel Admin
                      </Link>
                    )}

                    <button
                      onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left w-full"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Guest buttons */
              <div className="flex items-center gap-2">
                {defaultAvatar}
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate('/login')}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-md hover:bg-accent transition-colors"
                  >
                    Entrar
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-md transition-colors"
                  >
                    Registrarse
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
