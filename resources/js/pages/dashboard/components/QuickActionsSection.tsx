import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import {
  Card, CardTitle, CardContent,
} from '@/components/ui/card';
import { QUICK_ACTIONS } from '../constants';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export function QuickActionsSection() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Filtramos las acciones según el rol del usuario (Role logic parity)
    const filteredActions = QUICK_ACTIONS.filter((action) => {
        if (action.adminOnly) {
            // Asumiendo que el usuario tiene un campo 'role' o similar
             return user?.role === 'admin' || user?.is_admin;
        }
        return true;
    });

    return (
        <div className="px-6 py-12">
            <div className="mx-auto max-w-7xl">
                <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
                    <h2 className="text-3xl font-montserrat font-black text-foreground uppercase tracking-tight">
                        Accesos Rápidos
                    </h2>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest hidden md:block">
                        Panel de Control Directo
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredActions.map((action, index) => (
                        <Card
                            key={index}
                            className={cn(
                                'bg-card/40 backdrop-blur-md border-border hover:border-primary/50 transition-all duration-300 rounded-2xl cursor-pointer group shadow-sm hover:shadow-xl hover:-translate-y-1',
                                action.disabled && 'opacity-60 cursor-not-allowed grayscale',
                            )}
                            onClick={() => !action.disabled && navigate(action.href)}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={cn(
                                        'w-12 h-12 flex items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 shadow-md',
                                        action.theme,
                                    )}>
                                        <action.icon className="h-6 w-6" />
                                    </div>
                                    <CardTitle className="text-foreground font-literata font-bold text-lg tracking-tight">
                                        {action.title}
                                    </CardTitle>
                                </div>
                                <p className="text-muted-foreground text-sm mb-6 leading-relaxed font-medium">
                                    {action.description}
                                </p>
                                <div className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary transition-colors">
                                    {action.disabled ? 'PROXIMAMENTE' : 'ENTRAR AHORA'}
                                    {!action.disabled && <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-2" />}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
