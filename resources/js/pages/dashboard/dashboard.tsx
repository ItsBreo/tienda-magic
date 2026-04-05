import React, { useState } from 'react';
import TiendaMagicLayout from '@/layouts/tienda-magic-layout';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { HeroSection } from './components/HeroSection';
import { StatsSection } from './components/StatsSection';
import { QuickActionsSection } from './components/QuickActionsSection';
import ChatWidget from '@/components/chat/ChatWidget';
import apiService from '@/services/ApiService';
import { useAuth } from '@/contexts/AuthContext';
// import { FeaturedPacksSection } from './dashboard/components/FeaturedPacksSection';

export default function Dashboard() {
    // Solo llamamos al Hook que trae la información
    const { stats, loading } = useDashboardStats();
    const { user } = useAuth();

    // Obtener token de forma segura
    const token = apiService.getToken();

    // Estado para controlar el chat activo
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

    // Función para simular trade chat
    const simulateTradeChat = async () => {
        try {
            const response = await apiService.axiosInstance.post('/api/trades/999/chat');
            setActiveConversationId(response.data.id);
        } catch (error) {
            console.error('Error al crear chat de trade:', error);
        }
    };

    return (
        <TiendaMagicLayout breadcrumbs={[{ title: 'Tienda', href: '/' }]}>
            <div className='min-h-screen bg-black text-zinc-100'>

                {/* 1. Bienvenida */}
                <HeroSection />

                {/* 2. Botón de simulación */}
                <div className='p-4'>
                    <button
                        onClick={simulateTradeChat}
                        className='px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors'
                    >
                        Simular Trade #999
                    </button>
                </div>

                {/* 3. Chat dinámico */}
                {activeConversationId && user && (
                    <div style={{ height: '600px', margin: '20px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                        <ChatWidget
                            conversationId={activeConversationId}
                            currentUser={user}
                            token={token}
                            onClose={() => setActiveConversationId(null)}
                        />
                    </div>
                )}

                {/* 4. Packs Destacados (Podemos separarlo igual que el resto si lo deseamos) */}
                {/* <FeaturedPacksSection /> */}

                {/* 5. Acciones Rápidas */}
                <QuickActionsSection />

                {/* 6. Estadísticas conectadas a Laravel/Scryfall */}
                <StatsSection stats={stats} loading={loading} />

            </div>
        </TiendaMagicLayout>
    );
}
