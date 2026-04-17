import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LogOut, Shield, User, ChevronDown, ShoppingCart, Wallet,
} from 'lucide-react';
import { GiLotus } from 'react-icons/gi';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [aboutOpen, setAboutOpen] = useState(false);
  const [comunidadOpen, setComunidadOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const aboutRef = useRef<HTMLDivElement>(null);
  const comunidadRef = useRef<HTMLDivElement>(null);
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
      if (comunidadRef.current && !comunidadRef.current.contains(e.target as Node)) {
        setComunidadOpen(false);
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
        className={`text-base font-bold transition-colors duration-200 ${
          active
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {label}
      </Link>
    );
  };

  // Icon Button Style (Matches AnimatedThemeToggler exactly: h-8 w-8)
  const iconButtonClass = "flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground transition-colors";

  return (
    <header className="bg-background/80 backdrop-blur-xl border-b border-border sticky top-0 z-50 w-full transition-all duration-300">
      <div className="w-full px-6 lg:px-10 py-4 md:py-5">
        <div className="flex items-center justify-between gap-8">

          {/* ── LEFT SIDE ── */}
          <div className="flex items-center gap-12">
            <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-shrink-0 group">
              <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-xl group-hover:bg-primary/20 transition-colors">
                <GiLotus className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xl md:text-2xl font-black text-foreground tracking-tighter uppercase">BLACK LOTUS</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-10">
              {navLink('/dashboard', 'Inicio')}
              {navLink('/shop', 'Catálogo')}
              {user && navLink('/inventory', 'Inventario')}

              <div className="relative" ref={aboutRef}>
                <button
                  onClick={() => { setAboutOpen(o => !o); setComunidadOpen(false); setUserMenuOpen(false); }}
                  className={`flex items-center gap-2 text-base font-bold transition-colors ${aboutOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Nosotros <ChevronDown className={cn("h-4 w-4 transition-transform", aboutOpen && "rotate-180")} />
                </button>
                {aboutOpen && (
                  <div className="absolute left-0 top-full mt-4 w-56 bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <Link to="/rules" onClick={() => setAboutOpen(false)} className="px-5 py-4 text-base font-medium block hover:bg-accent">Reglas</Link>
                    <Link to="/contact" onClick={() => setAboutOpen(false)} className="px-5 py-4 text-base font-medium block hover:bg-accent">Contacto</Link>
                  </div>
                )}
              </div>

              <div className="relative" ref={comunidadRef}>
                <button
                  onClick={() => { setComunidadOpen(o => !o); setAboutOpen(false); setUserMenuOpen(false); }}
                  className={`flex items-center gap-2 text-base font-bold transition-colors ${comunidadOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Comunidad <ChevronDown className={cn("h-4 w-4 transition-transform", comunidadOpen && "rotate-180")} />
                </button>
                {comunidadOpen && (
                  <div className="absolute left-0 top-full mt-4 w-56 bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <Link to="/market" onClick={() => setComunidadOpen(false)} className="px-5 py-4 text-base font-medium block hover:bg-accent">Compra-Venta</Link>
                    <Link to="/exchanges" onClick={() => setComunidadOpen(false)} className="px-5 py-4 text-base font-medium block hover:bg-accent">Intercambios</Link>
                  </div>
                )}
              </div>
            </nav>
            
          </div>

          {/* ── RIGHT SIDE ── */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <AnimatedThemeToggler />

            {user ? (
              <div className="flex items-center gap-3">
                {/* Carrito (Icon Only Square) */}
                <Link to="/cart" className={iconButtonClass} title="Ver Carrito">
                  <ShoppingCart className="h-4 w-4" />
                </Link>

                {/* Wallet (Icon Only Square) */}
                <Link to="/wallet" className={iconButtonClass} title="Mi Wallet">
                  <Wallet className="h-4 w-4" />
                </Link>

                {/* Saldo y Usuario */}
                <div className="flex items-center gap-4 ml-2">
                    {/* Saldo a la IZQ del nombre */}
                    <div className="flex flex-col items-end mr-1">
                        <span className="text-[11px] font-black text-primary uppercase tracking-widest leading-none mb-0.5">Cartera</span>
                        <span className="text-sm md:text-base font-black text-foreground">€{user.wallet_balance?.toFixed(2) || '0.00'}</span>
                    </div>

                    <div className="relative" ref={userMenuRef}>
                        <button
                            onClick={() => { setUserMenuOpen(o => !o); setAboutOpen(false); setComunidadOpen(false); }}
                            className="flex items-center gap-2 hover:opacity-80 transition-opacity group"
                        >
                            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
                                <span className="text-[11px] font-black text-primary">{(user?.name || 'U').substring(0, 1).toUpperCase()}</span>
                            </div>
                            <span className="text-sm font-bold text-foreground truncate max-w-[100px] hidden md:block">{user.username || user.name}</span>
                            <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", userMenuOpen && "rotate-180")} />
                        </button>

                        {userMenuOpen && (
                            <div className="absolute right-0 top-full mt-4 w-60 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                                <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-4 px-6 py-4 text-sm font-bold hover:bg-accent border-b border-border transition-colors"><User className="h-5 w-5 text-primary" /> Mi Perfil</Link>
                                {isAdmin && <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-4 px-6 py-4 text-sm font-bold hover:bg-accent border-b border-border transition-colors"><Shield className="h-5 w-5 text-primary" /> Admin Panel</Link>}
                                <button onClick={() => { setUserMenuOpen(false); handleLogout(); }} className="flex items-center gap-4 px-6 py-4 text-sm font-bold text-destructive hover:bg-destructive/10 w-full text-left"><LogOut className="h-5 w-5" /> Cerrar Sesión</button>
                            </div>
                        )}
                    </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button onClick={() => navigate('/login')} className="text-sm font-black uppercase text-muted-foreground hover:text-foreground px-5 py-3">Entrar</button>
                <button onClick={() => navigate('/register')} className="text-xs font-black uppercase bg-primary text-primary-foreground px-6 py-3.5 rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-all">Registrarse</button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
