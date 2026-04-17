import React from 'react';
import { ShieldCheck, Lock, Eye, Cookie, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Privacy() {
    const navigate = useNavigate();

    return (
        <div className="flex-1 text-foreground pb-20 relative min-h-screen">
            {/* Ambient background glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] -z-10 pointer-events-none opacity-50" />

            <div className="max-w-4xl mx-auto px-6 pt-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                            <ShieldCheck className="w-3 h-3" />
                            Canitdad de Datos Asegurada
                        </div>
                        <h1 className="text-5xl md:text-6xl font-forum font-bold text-foreground tracking-tight leading-none">
                            Política de <span className="text-primary italic">Privacidad</span>
                        </h1>
                        <p className="text-muted-foreground font-literata text-lg italic opacity-80">
                            Tu alma y tus cartas están protegidas por los antiguos sellos de seguridad.
                        </p>
                    </div>
                    
                    <Button 
                        variant="ghost" 
                        onClick={() => navigate(-1)}
                        className="group flex items-center gap-2 text-muted-foreground hover:text-primary font-bold uppercase tracking-widest text-[10px] h-10 px-4 rounded-xl border border-border/50 hover:border-primary/30 transition-all"
                    >
                        <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
                        Regresar
                    </Button>
                </div>

                {/* Main Content Card */}
                <div className="bg-card/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-1000">
                    {/* Decorative element */}
                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />

                    <div className="space-y-12">
                        {/* Section 1: Intro */}
                        <section className="relative group">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 text-primary">
                                    <Lock size={24} />
                                </div>
                                <h2 className="text-2xl font-forum font-bold text-foreground tracking-wide">
                                    Compromiso de Seguridad
                                </h2>
                            </div>
                            <div className="pl-4 border-l border-primary/20 space-y-4 font-literata text-muted-foreground leading-relaxed text-lg">
                                <p>
                                    En <span className="text-foreground font-bold">Black Lotus</span> entendemos que tu privacidad es tan valiosa como un Mox Emerald. No nos limitamos a cumplir la ley; aplicamos principios de cifrado arcano para que tu información sea ilegible para fuerzas externas.
                                </p>
                            </div>
                        </section>

                        {/* Section 2: Data Collection */}
                        <section className="relative group">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 text-primary">
                                    <Eye size={24} />
                                </div>
                                <h2 className="text-2xl font-forum font-bold text-foreground tracking-wide">
                                    Recopilación de Esencia (Datos)
                                </h2>
                            </div>
                            <div className="pl-4 border-l border-primary/20 font-literata text-muted-foreground leading-relaxed text-lg">
                                <p className="mb-4">
                                    Solo pedimos lo necesario para invocar tu presencia en el Multiverso:
                                </p>
                                <ul className="space-y-3 list-none">
                                    <li className="flex items-start gap-3">
                                        <div className="mt-2 w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                                        <span><strong className="text-foreground/80 font-bold">Identidad:</strong> Nombre de usuario y correo para reconocer tu rango.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="mt-2 w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                                        <span><strong className="text-foreground/80 font-bold">Seguridad:</strong> Contraseñas procesadas mediante *Bcrypt hashing* (nosotros tampoco podemos verlas).</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="mt-2 w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                                        <span><strong className="text-foreground/80 font-bold">Sin Datos de Pago:</strong> Las transacciones de oro son gestionadas por Stripe. Nosotros nunca tocamos tus monedas reales.</span>
                                    </li>
                                </ul>
                            </div>
                        </section>

                        {/* Section 3: Cookies */}
                        <section className="relative group">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 text-primary">
                                    <Cookie size={24} />
                                </div>
                                <h2 className="text-2xl font-forum font-bold text-foreground tracking-wide">
                                    Hechizos de Recordación (Cookies)
                                </h2>
                            </div>
                            <div className="pl-4 border-l border-primary/20 font-literata text-muted-foreground leading-relaxed text-lg italic opacity-90">
                                <p>
                                    Nuestras "cookies" son pequeños fragmentos de magia local (JWT) que sirven para que no tengas que loguearte cada vez que cambias de plano (página). No usamos rastreadores de terceros ni permitimos que nadie espíe tus hábitos de compra.
                                </p>
                            </div>
                        </section>

                        {/* Footer Note */}
                        <div className="pt-12 mt-12 border-t border-white/5 text-center">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 mb-2">Sello Oficial de Protección</p>
                            <p className="text-xs font-literata text-muted-foreground font-medium italic">
                                Última actualización del pergamino: 17 de Abril, 2026.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
