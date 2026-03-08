import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import {
  Card, CardTitle, CardContent,
} from '@/components/ui/card';
import { QUICK_ACTIONS } from '../constants';

export function QuickActionsSection() {
    const navigate = useNavigate();

    return (
        <div className="px-6 py-12 bg-zinc-900">
            <div className="mx-auto max-w-7xl">
                <h2 className="text-2xl font-serif font-bold text-zinc-100 mb-6 border-b border-zinc-800 pb-2">
                    Accesos Rápidos
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {QUICK_ACTIONS.map((action, index) => (
                        <Card
                            key={index}
                            className={`bg-zinc-950 transition-colors duration-200 rounded-sm cursor-pointer group ${
                                action.disabled ? 'opacity-60 cursor-not-allowed border-zinc-800' : 'hover:border-zinc-600 border-zinc-800'
                            }`}
                            onClick={() => !action.disabled && navigate(action.href)}
                        >
                            <CardContent className="p-5">
                                <div className="flex items-center gap-4 mb-3">
                                    {/* AQUI APLICAMOS LA CLASE DEL CSS DIRECTAMENTE */}
                                    <div className={`p-2 rounded-sm ${action.theme}`}>
                                        <action.icon className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-zinc-100 font-medium text-lg">
                                        {action.title}
                                    </CardTitle>
                                </div>
                                <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
                                    {action.description}
                                </p>
                                <div className="flex items-center text-sm font-medium text-zinc-500 group-hover:text-zinc-300 transition-colors">
                                    {action.disabled ? 'No disponible' : 'Entrar'}
                                    {!action.disabled && <ArrowRight className="h-4 w-4 ml-1" />}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
