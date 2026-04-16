import React, { useState, useEffect } from 'react';
import apiService from '@/services/ApiService';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare, Eye, ThumbsUp, Pin } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// --- INTERFACES DE TYPESCRIPT ---
interface UserData {
    id: number;
    name: string;
    username: string;
}

interface ForumData {
    id: number;
    name: string;
    slug: string;
}

interface ThreadData {
    id: number;
    title: string;
    score: number;
    views_count: number;
    comments_count: number;
    is_pinned: boolean;
    created_at: string;
    user: UserData;
    forum: ForumData;
}

// --- COMPONENTE PRINCIPAL ---
export default function ForumSearch() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [results, setResults] = useState<ThreadData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const performSearch = async (query: string) => {
        if (!query || query.trim().length < 3) {
            setResults([]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await apiService.axiosInstance.get(`/api/forum/search`, {
                params: { q: query }
            });
            setResults(response.data.data);
        } catch (err) {
            console.error("Error al realizar la búsqueda:", err);
            setError("Ocurrió un error al buscar. Por favor, inténtalo de nuevo más tarde.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const query = searchParams.get('q');
        if (query) {
            setSearchTerm(query);
            performSearch(query);
        }
    }, [searchParams]);

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSearchParams({ q: searchTerm });
    };

    const renderThreadItem = (thread: ThreadData) => (
        <div key={thread.id} className="flex items-start gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800/50 transition-colors">
            <div className="flex-shrink-0">
                {/* Placeholder for user avatar */}
                <div className="h-10 w-10 rounded-full bg-zinc-700"></div>
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    {thread.is_pinned && <Pin className="h-4 w-4 text-amber-500" title="Fijado" />}
                    <Link to={`/forums/${thread.forum.slug}/${thread.id}`} className="text-lg font-semibold text-zinc-100 hover:text-amber-500 transition-colors">
                        {thread.title}
                    </Link>
                </div>
                <p className="text-sm text-zinc-400 mt-1">
                    Iniciado por <span className="font-medium text-zinc-300">{thread.user?.username || 'Desconocido'}</span> en el foro <Link to={`/forums/${thread.forum?.slug || ''}`} className="font-medium text-amber-500 hover:underline">{thread.forum?.name || 'Foro'}</Link>
                    {' • '}
                    <span title={new Date(thread.created_at).toLocaleString()}>{formatDistanceToNow(new Date(thread.created_at), { addSuffix: true, locale: es })}</span>
                </p>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
                <div className="flex items-center gap-2" title="Puntuación">
                    <ThumbsUp className="h-4 w-4" />
                    <span>{thread.score}</span>
                </div>
                <div className="flex items-center gap-2" title="Comentarios">
                    <MessageSquare className="h-4 w-4" />
                    <span>{thread.comments_count}</span>
                </div>
                <div className="flex items-center gap-2" title="Vistas">
                    <Eye className="h-4 w-4" />
                    <span>{thread.views_count}</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="px-6 py-12">
            <div className="max-w-4xl mx-auto">
                {/* CABECERA Y BUSCADOR */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-serif font-bold text-zinc-100 mb-2">
                        Buscador del Foro
                    </h1>
                    <p className="text-zinc-400">
                        Encuentra hilos, debates y respuestas en toda la comunidad.
                    </p>
                </div>

                <form onSubmit={handleSearch} className="relative mb-8">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                    <Input
                        placeholder="¿Qué estás buscando? (mín. 3 caracteres)"
                        className="pl-12 pr-24 h-12 text-base bg-zinc-900 border-zinc-700 focus-visible:ring-amber-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-amber-600 hover:bg-amber-700 text-zinc-900 font-bold">
                        Buscar
                    </Button>
                </form>

                {/* RESULTADOS */}
                <div className="space-y-4">
                    {loading && <p className="text-center text-zinc-400">Buscando...</p>}
                    {error && <p className="text-center text-red-500">{error}</p>}
                    {!loading && !error && (
                        <>
                            {results.length > 0 ? (
                                results.map(renderThreadItem)
                            ) : (
                                searchParams.get('q') && searchParams.get('q')!.length >= 3 && (
                                    <div className="text-center py-16 bg-zinc-900/50 border border-zinc-800 rounded-lg border-dashed">
                                        <Search className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                                        <h3 className="text-lg font-serif text-zinc-300 mb-2">No se encontraron resultados</h3>
                                        <p className="text-zinc-500">Prueba con otros términos de búsqueda.</p>
                                    </div>
                                )
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
