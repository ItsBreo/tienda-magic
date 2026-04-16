import React, { useState, useEffect } from 'react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { HeroSection } from './components/HeroSection';

import { QuickActionsSection } from './components/QuickActionsSection';
import ChatWidget from '@/components/chat/ChatWidget';
import ErrorBoundary from '@/components/common/ErrorBoundary';
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
            <div className="flex flex-col gap-6 p-4 md:p-8">

                <ErrorBoundary>
                    {/* 1. Bienvenida */}
                    <HeroSection />

                    {/* 5. Acciones Rápidas */}
                    <QuickActionsSection />


                </ErrorBoundary>

            </div>
    );
}
