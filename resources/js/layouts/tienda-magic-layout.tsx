import { type ReactNode } from 'react';
import { type BreadcrumbItem } from '@/types';
import { Navbar } from '../components/Navbar'; // Ajusta estas rutas
import { Footer } from '../components/Footer'; // según donde los guardes
import { Breadcrumbs } from '../components/Breadcrumbs';

interface TiendaMagicLayoutProps {
  children: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  title?: string; // Todavía lo puedes usar para pasar props al Helmet si usas SEO
}

export default function TiendaMagicLayout({
  children,
  breadcrumbs = [],
}: TiendaMagicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans">

      {/* 1. Cabecera principal (Navegación y Autenticación) */}
      <Navbar />

      {/* 2. Migas de pan (Rastro de navegación) */}
      <Breadcrumbs items={breadcrumbs} />

      {/* 3. Contenido de la página (El Dashboard, Tienda, etc.) */}
      <main className="flex-1">
        {children}
      </main>

      {/* 4. Pie de página */}
      <Footer />

    </div>
  );
}
