import { type ReactNode } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Package, LogOut, Settings } from 'lucide-react';
import { route } from 'ziggy-js';
import { usePage } from '@inertiajs/react';

interface TiendaMagicLayoutProps {
  children: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
}

export default function TiendaMagicLayout({
  children,
  breadcrumbs = [],
  title = 'Tienda Magic'
}: TiendaMagicLayoutProps) {
  const { props } = usePage();
  const { auth } = props as any;

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <Head title={title} />

      {/* Header Navigation */}
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-600 rounded-lg">
                <Package className="h-6 w-6 text-black" />
              </div>
              <h1 className="text-xl font-bold text-zinc-100">Tienda Magic</h1>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link
                href={route('dashboard')}
                className="text-zinc-300 hover:text-emerald-400 transition-colors duration-200 font-medium"
              >
                Inicio
              </Link>
              <Link
                href={route('shop.index')}
                className="text-zinc-300 hover:text-emerald-400 transition-colors duration-200 font-medium"
              >
                Tienda
              </Link>
              <Link
                href={route('cart.index')}
                className="text-zinc-300 hover:text-emerald-400 transition-colors duration-200 font-medium"
              >
                Carrito
              </Link>
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              {auth.user ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-400">
                    {auth.user.name}
                  </span>
                  <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-lg border border-zinc-700">
                    <span className="text-sm font-medium text-emerald-400">
                      {Number(auth.user.wallet_balance ?? 0).toFixed(2)}€
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-zinc-400 hover:text-zinc-200"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-zinc-400 hover:text-zinc-200"
                    onClick={() => router.post(route('logout'))}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    onClick={() => router.visit(route('login'))}
                  >
                    Iniciar Sesión
                  </Button>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500 text-black"
                    onClick={() => router.visit(route('register'))}
                  >
                    Registrarse
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="bg-zinc-900/50 border-b border-zinc-800">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <nav className="flex items-center gap-2 text-sm">
              {breadcrumbs.map((breadcrumb, index) => (
                <div key={breadcrumb.href} className="flex items-center gap-2">
                  {index > 0 && (
                    <span className="text-zinc-600">/</span>
                  )}
                  <Link
                    href={breadcrumb.href}
                    className="text-zinc-400 hover:text-emerald-400 transition-colors duration-200"
                  >
                    {breadcrumb.title}
                  </Link>
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
      <footer className="bg-zinc-900 border-t border-zinc-800 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-zinc-400 text-sm">
                © 2024 Tienda Magic. Todos los derechos reservados.
              </p>
              <p className="text-zinc-500 text-xs mt-1">
                Tu tienda especializada en Magic: The Gathering
              </p>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="text-zinc-500 hover:text-emerald-400 text-sm transition-colors duration-200">
                Términos
              </a>
              <a href="#" className="text-zinc-500 hover:text-emerald-400 text-sm transition-colors duration-200">
                Privacidad
              </a>
              <a href="#" className="text-zinc-500 hover:text-emerald-400 text-sm transition-colors duration-200">
                Contacto
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
