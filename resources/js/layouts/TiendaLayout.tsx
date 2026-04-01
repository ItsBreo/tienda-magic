import { type ReactNode, useEffect } from 'react';
import { type BreadcrumbItem } from '@/types';
import { Navbar } from '@/components/Navbar';

interface TiendaLayoutProps {
  children: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export default function TiendaLayout({
  children,
  breadcrumbs = [],
}: TiendaLayoutProps) {
  useEffect(() => {
    document.title = 'Tienda Magic';
  }, []);

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      {/* Header Navigation con Navbar dinámico */}
      <Navbar />

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
              <p className="text-zinc-500 text-sm">© {new Date().getFullYear()} Tienda Magic. Todos los derechos reservados.</p>
              <p className="text-zinc-600 text-xs mt-1">
                Tu tienda especializada en cartas Magic: The Gathering
              </p>
            </div>
            <div className="flex items-center gap-6 text-xs text-zinc-600">
              {/* eslint-disable-next-line @typescript-eslint/no-empty-function */}
              <button
                type="button"
                onClick={() => {}}
                className="text-zinc-400 hover:text-emerald-400 transition-colors duration-200"
              >
                Términos
              </button>
              <span className="text-zinc-600">•</span>
              {/* eslint-disable-next-line @typescript-eslint/no-empty-function */}
              <button
                type="button"
                onClick={() => {}}
                className="text-zinc-400 hover:text-emerald-400 transition-colors duration-200"
              >
                Privacidad
              </button>
              <span className="text-zinc-600">•</span>
              {/* eslint-disable-next-line @typescript-eslint/no-empty-function */}
              <button
                type="button"
                onClick={() => {}}
                className="text-zinc-400 hover:text-emerald-400 transition-colors duration-200"
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
