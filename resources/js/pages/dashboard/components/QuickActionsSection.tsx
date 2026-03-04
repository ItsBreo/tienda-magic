import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QUICK_ACTIONS, getColorClasses } from '../constants';

export function QuickActionsSection() {
    const navigate = useNavigate();

    return (
        <div className="px-6 py-16 bg-zinc-900/50">
            <div className="mx-auto max-w-7xl">
                <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                    Acciones Rápidas
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {QUICK_ACTIONS.map((action, index) => (
                        <Card
                            key={index}
                            className={`bg-zinc-900 border-zinc-800 hover:border-emerald-500/50 transition-all duration-300 cursor-pointer ${
                                action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                            }`}
                            onClick={() => !action.disabled && navigate(action.href)}
                        >
                            <CardHeader className="pb-4">
                                <div className="p-3 rounded-lg bg-zinc-800 w-fit mb-4">
                                    <action.icon className={`h-6 w-6 ${getColorClasses(action.color).split(' ').pop()}`} />
                                </div>
                                <CardTitle className="text-zinc-100">{action.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-zinc-400 text-sm mb-4">{action.description}</p>
                                <Button
                                    className={`w-full ${getColorClasses(action.color).split(' ').slice(0, 2).join(' ')} ${
                                        action.disabled ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                    disabled={action.disabled}
                                >
                                    {action.disabled ? 'Próximamente' : 'Acceder'}
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
