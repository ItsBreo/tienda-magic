import { type ReactNode, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Link } from 'react-router-dom';

interface TiendaLayoutProps {
  children: ReactNode;
}

export default function TiendaLayout({ children }: TiendaLayoutProps) {

  useEffect(() => {
    document.title = 'Tienda Magic';
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col transition-colors duration-300">
      {/* Header Navigation */}
      <Navbar />



      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-auto transition-colors duration-300">
        <div className="max-w-[1600px] mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-muted-foreground text-[13px]">© {new Date().getFullYear()} Tienda Magic. Todos los derechos reservados.</p>
              <p className="text-muted-foreground opacity-70 text-[12px] mt-1">
                Tu tienda especializada en cartas Magic: The Gathering
              </p>
            </div>
            <div className="flex items-center gap-6 text-[12px]">
              <Link
                to="/rules"
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Reglas
              </Link>
              <span className="text-border">•</span>
              <Link
                to="/privacy"
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Privacidad
              </Link>
              <span className="text-border">•</span>
              <Link
                to="/contact"
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Contacto
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
