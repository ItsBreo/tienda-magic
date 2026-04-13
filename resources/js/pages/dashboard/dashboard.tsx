import React, { useState, useEffect } from 'react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { HeroSection } from './components/HeroSection';
import { StatsSection } from './components/StatsSection';
import { QuickActionsSection } from './components/QuickActionsSection';
import ChatWidget from '@/components/chat/ChatWidget';
import apiService from '@/services/ApiService';
import { useAuth } from '@/contexts/AuthContext';

interface Trade {
    id: number;
    sender_id: number;
    receiver_id: number;
    status: string;
    sender: {
        id: number;
        name: string;
    };
    receiver: {
        id: number;
        name: string;
    };
    conversation?: {
        id: string;
        title: string;
    };
}

export default function Dashboard() {
    // Solo llamamos al Hook que trae la información
    const { stats, loading } = useDashboardStats();
    const { user } = useAuth();

    return (
            <div className="min-h-screen bg-black text-zinc-100">

                {/* 1. Bienvenida */}
                <HeroSection />

                {/* 4. Packs Destacados (Podemos separarlo igual que el resto si lo deseamos) */}
                {/* <FeaturedPacksSection /> */}

                {/* 5. Acciones Rápidas */}
                <QuickActionsSection />

                {/* 6. Estadísticas conectadas a Laravel/Scryfall */}
                <StatsSection stats={stats} loading={loading} />

            </div>
    );
}
