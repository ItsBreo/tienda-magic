import { type ReactNode } from 'react';
import { Head } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';

interface TiendaLayoutProps {
  children: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export default function TiendaLayout({
  children,
  breadcrumbs = [],
}: TiendaLayoutProps) {
  const { props } = usePage();
  const auth = props.auth as any;

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <Head title="Tienda Magic" />

      {/* Header Navigation */}
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-600 rounded-lg">
                <div className="p-2 bg-black rounded-lg">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <div className="text-2xl font-bold text-black">TM</div>
                  </div>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white">Tienda Magic</h1>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a
                href={route('dashboard')}
                className="text-zinc-300 hover:text-emerald-400 transition-colors duration-200 px-3 py-2 rounded-lg font-medium"
              >
                Inicio
              </a>
              <a
                href={route('shop.index')}
                className="text-zinc-300 hover:text-emerald-400 transition-colors duration-200 px-3 py-2 rounded-lg font-medium"
              >
                Tienda
              </a>
              <a
                href={route('cart.index')}
                className="text-zinc-300 hover:text-emerald-400 transition-colors duration-200 px-3 py-2 rounded-lg font-medium"
              >
                Carrito
              </a>
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              {auth.user ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-lg border border-zinc-700">
                  <span className="text-zinc-300">{auth.user.name}</span>
                  <span className="text-emerald-400">€{Number(auth.user.wallet_balance ?? 0).toFixed(2)}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-lg border border-zinc-700">
                  <a
                    href={route('login')}
                    className="text-zinc-300 hover:text-emerald-400 transition-colors duration-200 px-3 py-2 rounded-lg font-medium"
                  >
                    Iniciar Sesión
                  </a>
                  <a
                    href={route('register')}
                    className="text-zinc-300 hover:text-emerald-400 transition-colors duration-200 px-3 py-2 rounded-lg font-medium"
                  >
                    Registrarse
                  </a>
                </div>
              )}
            </div>
          </div>
        </header>

      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="bg-zinc-900/50 border-b border-zinc-800">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <nav className="flex items-center gap-2 text-sm">
              {breadcrumbs.map((breadcrumb, index) => (
                <div key={index} className="flex items-center gap-2">
                  {index > 0 && (
                    <span className="text-zinc-600">/</span>
                  )}
                  <a
                    href={breadcrumb.href}
                    className="text-zinc-400 hover:text-emerald-400 transition-colors duration-200"
                  >
                    {breadcrumb.title}
                  </a>
                </div>
              ))}
            </nav>
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
            <div className="text-center">
              <p className="text-zinc-500 text-sm">© 2024 Tienda Magic. Todos los derechos reservados.</p>
              <p className="text-zinc-600 text-xs mt-1">
                Tu tienda especializada en cartas Magic: The Gathering
              </p>
            </div>
            <div className="flex items-center gap-6 text-xs text-zinc-600">
              <a
                href="#"
                className="text-zinc-400 hover:text-emerald-400 transition-colors duration-200"
              >
                Términos
              </a>
              <span className="text-zinc-600">•</span>
              <a
                href="#"
                className="text-zinc-400 hover:text-emerald-400 transition-colors duration-200"
              >
                Privacidad
              </a>
              <span className="text-zinc-600">•</span>
              <a
                href="#"
                className="text-zinc-400 hover:text-emerald-400 transition-colors duration-200"
              >
                Contacto
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
