import React from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowLeft, ShoppingCart } from 'lucide-react';

function PacksHeader() {
  return (
    <div className="relative z-10">
      <div className="text-center px-4 py-8">
        {/* Icono principal */}
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-primary rounded-xl shadow-lg shadow-primary/40">
            <Package className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>

        {/* Título y descripción */}
        <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent mb-4">
          Catálogo de Packs
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
          Descubre los últimos sets de Magic: The Gathering. Cada pack contiene cartas épicas y la posibilidad de obtener tesoros legendarios.
        </p>

        {/* Botones de navegación */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent border border-border text-foreground hover:bg-accent/80 hover:text-primary rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Dashboard
          </Link>

          <Link
            to="/cart"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors duration-200"
          >
            <ShoppingCart className="w-4 h-4" />
            Ir al Carrito
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PacksHeader;
