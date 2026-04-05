import React, { useState, useEffect } from 'react';
import TiendaLayout from '@/layouts/TiendaLayout';
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

    // Obtener token de forma segura
    const token = apiService.getToken();

    // Estado para controlar el chat activo
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

    // Estado para la lista de trades
    const [trades, setTrades] = useState<Trade[]>([]);

    // Cargar trades al montar el componente
    useEffect(() => {
        // Freno de seguridad: no pedir trades si el usuario aún no está cargado en el estado
        if (!user) return;

        const fetchTrades = async () => {
            try {
                const response = await apiService.axiosInstance.get('/api/trades');
                setTrades(response.data);
            } catch (error) {
                console.error('Error cargando trades:', error);
            }
        };

        fetchTrades();
    }, [user]); // <- CRÍTICO: Dependencia en el usuario

    // Función para crear trade de prueba
    const createTestTrade = async () => {
        try {
            const response = await apiService.axiosInstance.post('/api/trades/test');
            setTrades(prev => [response.data, ...prev]);
        } catch (error) {
            console.error('Error al crear trade de prueba:', error);
        }
    };

    // Función para abrir chat de un trade
    const openTradeChat = (trade: Trade) => {
        if (trade.conversation) {
            setActiveConversationId(trade.conversation.id);
        }
    };

    return (
        <TiendaLayout breadcrumbs={[{ title: 'Tienda', href: '/' }]}>
            <div className="min-h-screen bg-black text-zinc-100">

                {/* 1. Bienvenida */}
                <HeroSection />

                {/* 2. Lista de Trades */}
                <div className='p-4'>
                    <div className='flex justify-between items-center mb-4'>
                        <h2 className='text-xl font-bold text-zinc-100'>Mis Intercambios</h2>
                        <button
                            onClick={createTestTrade}
                            className='px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors'
                        >
                            Crear Trade de Prueba
                        </button>
                    </div>

                    {trades.length === 0 ? (
                        <p className='text-zinc-400'>No tienes trades activos</p>
                    ) : (
                        <div className='space-y-2'>
                            {trades.map((trade) => {
                                const otherUser = trade.sender.id === user?.id ? trade.receiver : trade.sender;
                                return (
                                    <div
                                        key={trade.id}
                                        onClick={() => openTradeChat(trade)}
                                        className='p-3 bg-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-700 transition-colors'
                                    >
                                        <div className='flex justify-between items-center'>
                                            <span className='text-zinc-100'>
                                                Intercambio con {otherUser.name}
                                            </span>
                                            <span className={`px-2 py-1 rounded text-xs ${
                                                trade.status === 'pending' ? 'bg-yellow-600 text-white' :
                                                trade.status === 'accepted' ? 'bg-green-600 text-white' :
                                                trade.status === 'rejected' ? 'bg-red-600 text-white' :
                                                'bg-gray-600 text-white'
                                            }`}>
                                                {trade.status}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
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
        </TiendaLayout>
    );
}
