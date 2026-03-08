import React from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowLeft, ShoppingCart } from 'lucide-react';

const PacksHeader = () => {
  return (
    <div className="relative z-10">
      <div className="text-center px-4 py-8">
        {/* Icono principal */}
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-900/40">
            <Package className="h-8 w-8 text-black" />
          </div>
        </div>

        {/* Título y descripción */}
        <h1 className="text-4xl font-bold bg-gradient-to-r from-zinc-100 via-emerald-400 to-zinc-100 bg-clip-text text-transparent mb-4">
          Catálogo de Packs
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-8">
          Descubre los últimos sets de Magic: The Gathering. Cada pack contiene cartas épicas y la posibilidad de obtener tesoros legendarios.
        </p>

        {/* Botones de navegación */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-emerald-400 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Dashboard
          </Link>
          
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-medium rounded-lg transition-colors duration-200"
          >
            <ShoppingCart className="w-4 h-4" />
            Ir al Carrito
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PacksHeader;
