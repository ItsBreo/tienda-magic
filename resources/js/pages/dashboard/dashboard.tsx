import React from 'react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { HeroSection } from './components/HeroSection';
import { StatsSection } from './components/StatsSection';
import { QuickActionsSection } from './components/QuickActionsSection';
// import { FeaturedPacksSection } from './dashboard/components/FeaturedPacksSection';

export default function Dashboard() {
    // Solo llamamos al Hook que trae la información
    const { stats, loading } = useDashboardStats();

    return (
        <div className="px-6 py-12">
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
        </div>
    );
}
