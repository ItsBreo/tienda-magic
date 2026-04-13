import { type ReactNode, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';

interface TiendaLayoutProps {
  children: ReactNode;
}

export default function TiendaLayout({ children }: TiendaLayoutProps) {

  useEffect(() => {
    document.title = 'Tienda Magic';
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] font-sans flex flex-col">
      {/* Header Navigation */}
      <Navbar />



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
