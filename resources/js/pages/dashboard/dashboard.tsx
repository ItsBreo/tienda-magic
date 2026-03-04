import React from 'react';
import TiendaMagicLayout from '@/layouts/tienda-magic-layout';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { HeroSection } from './components/HeroSection';
import { StatsSection } from './components/StatsSection';
import { QuickActionsSection } from './components/QuickActionsSection';
// Si extraes los Featured Packs a un componente, lo importarías aquí:
// import { FeaturedPacksSection } from './dashboard/components/FeaturedPacksSection';

export default function Dashboard() {
    // Solo llamamos al Hook que trae la información
    const { stats, loading } = useDashboardStats();

    return (
        <TiendaMagicLayout breadcrumbs={[{ title: 'Tienda', href: '/' }]}>
            <div className="min-h-screen bg-black text-zinc-100">

                {/* 1. Bienvenida */}
                <HeroSection />

                {/* 2. Packs Destacados (Podemos separarlo igual que el resto si lo deseas) */}
                {/* <FeaturedPacksSection /> */}

                {/* 3. Acciones Rápidas */}
                <QuickActionsSection />

                {/* 4. Estadísticas conectadas a Laravel/Scryfall */}
                <StatsSection stats={stats} loading={loading} />

            </div>
        </TiendaMagicLayout>
    );
}
