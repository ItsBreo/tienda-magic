import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="text-zinc-400 text-sm">
              ©
{' '}
{new Date().getFullYear()}
{' '}
Tienda Magic. Todos los derechos reservados.
</p>
            <p className="text-zinc-600 text-xs mt-1">
              Tu base de datos especializada en el Multiverso
            </p>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/terms" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors duration-200">
              Reglas
            </Link>
            <Link to="/privacy" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors duration-200">
              Privacidad
            </Link>
            <Link to="/contact" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors duration-200">
              Contacto
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
