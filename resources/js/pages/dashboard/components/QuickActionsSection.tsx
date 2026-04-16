import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import {
  Card, CardTitle, CardContent,
} from '@/components/ui/card';
import { QUICK_ACTIONS } from '../constants';

export function QuickActionsSection() {
    const navigate = useNavigate();

    return (
        <div className="px-6 py-12 bg-background">
            <div className="mx-auto max-w-7xl">
                <h2 className="text-2xl font-serif font-bold text-foreground mb-6 border-b border-border pb-2">
                    Accesos Rápidos
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {QUICK_ACTIONS.map((action, index) => (
                        <Card
                            key={index}
                            className={`bg-card transition-colors duration-200 rounded-sm cursor-pointer group ${
                                action.disabled ? 'opacity-60 cursor-not-allowed border-border' : 'hover:border-primary border-border'
                            }`}
                            onClick={() => !action.disabled && navigate(action.href)}
                        >
                            <CardContent className="p-5">
                                <div className="flex items-center gap-4 mb-3">
                                    {/* AQUI APLICAMOS LA CLASE DEL CSS DIRECTAMENTE */}
                                    <div className={`p-2 rounded-sm ${action.theme}`}>
                                        <action.icon className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-card-foreground font-medium text-lg">
                                        {action.title}
                                    </CardTitle>
                                </div>
                                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                                    {action.description}
                                </p>
                                <div className="flex items-center text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
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
