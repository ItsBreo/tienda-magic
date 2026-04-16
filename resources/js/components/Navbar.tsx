import { Link, useNavigate } from 'react-router-dom';
import {
  Package, LogOut, Settings, Shield, ArrowLeftRight, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { formatEuro } from '@/utils/formatMoney';

export function Navbar() {
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

  // Admin si is_admin=true O si el role_name contiene 'admin'
  const isAdmin = user?.is_admin || user?.role_name?.toLowerCase().includes('admin');

  return (
    <header className="bg-zinc-950 border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="p-2 bg-zinc-800 border border-zinc-700 rounded-sm">
              <Package className="h-5 w-5 text-amber-500" />
            </div>
            <h1 className="text-xl font-serif font-bold text-zinc-100 tracking-tight">Tienda Magic</h1>
          </Link>

          {/* Navegación Principal */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/dashboard" className="text-zinc-400 hover:text-zinc-100 transition-colors duration-200 font-medium">
              Inicio
            </Link>
            <Link to="/shop" className="text-zinc-400 hover:text-zinc-100 transition-colors duration-200 font-medium">
              Catálogo
            </Link>
            <Link to="/cart" className="text-zinc-400 hover:text-zinc-100 transition-colors duration-200 font-medium">
              Carrito
            </Link>

            {user && (
              <>
                <Link to="/inventory" className="text-zinc-400 hover:text-amber-500 transition-colors duration-200 font-medium">
                  Mi Colección
                </Link>
                <Link
                  to="/exchanges"
                  className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors duration-200 font-bold bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1 rounded-sm border border-indigo-500/30"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  Intercambios
                </Link>
                <Link
                  to="/market"
                  className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors duration-200 font-bold bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1 rounded-sm border border-emerald-500/30"
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  Mercado
                </Link>
              </>
            )}

            {/* Menú de Información desplegable */}
            <div className="relative group">
              <button className="text-zinc-400 hover:text-zinc-100 transition-colors duration-200 font-medium pb-1">
                Información ▾
              </button>
              <div className="absolute left-0 mt-2 w-48 bg-zinc-950 border border-zinc-800 rounded-md shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 flex flex-col z-50">
                <Link to="/rules" className="px-4 py-2 text-sm text-zinc-400 hover:text-amber-500 hover:bg-zinc-900 border-b border-zinc-800 transition-colors">
                  Reglas de Juego
                </Link>
                <Link to="/support" className="px-4 py-2 text-sm text-zinc-400 hover:text-amber-500 hover:bg-zinc-900 border-b border-zinc-800 transition-colors">
                  Soporte Técnico
                </Link>
                <Link to="/contact" className="px-4 py-2 text-sm text-zinc-400 hover:text-amber-500 hover:bg-zinc-900 border-b border-zinc-800 transition-colors">
                  Contacto
                </Link>
                <Link to="/privacy" className="px-4 py-2 text-sm text-zinc-400 hover:text-amber-500 hover:bg-zinc-900 transition-colors">
                  Privacidad
                </Link>
              </div>
            </div>

            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-2 text-amber-500 hover:text-amber-400 transition-colors duration-200 font-bold bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-sm border border-amber-500/30"
              >
                <Shield className="h-4 w-4" />
                Bóveda
              </Link>
            )}
          </nav>

          {/* Menú de Usuario */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-zinc-400 hidden sm:inline">
                  {user.name}
                </span>
                <Link
                  to="/wallet"
                  className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-sm border border-zinc-800 hover:border-emerald-600 hover:bg-emerald-600/10 transition-all duration-200 group"
                >
                  <span className="text-sm font-medium text-amber-500 group-hover:text-emerald-400 transition-colors">
                    {formatEuro(user.wallet_balance)}
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-sm h-9 w-9"
                  onClick={() => navigate('/profile')}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-zinc-400 hover:text-red-400 hover:bg-red-950/30 rounded-sm h-9 w-9"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 rounded-sm"
                  onClick={() => navigate('/login')}
                >
                  Identificarse
                </Button>
                <Button
                  size="sm"
                  className="bg-amber-600/10 hover:bg-amber-600/20 text-amber-500 border border-amber-500/30 rounded-sm"
                  onClick={() => navigate('/register')}
                >
                  Registrarse
                </Button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
