import React from 'react';
import {
    Mail, MessageSquare, MapPin,
    Send, ExternalLink, Globe,
    Shield, HelpCircle,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function Contact() {
    return (
        <div className="flex-1 text-foreground pb-20 font-literata selection:bg-primary/30">
            {/* <Breadcrumbs items={[{ title: 'Contacto', href: '/contact' }]} /> */}

            <main className="max-w-6xl mx-auto px-4 pt-16">
                 {/* INTRO HERO */}
                <div className="text-center mb-20 space-y-8 animate-in fade-in slide-in-from-top-6 duration-1000 mt-20">

                    <h1 className="text-6xl md:text-8xl font-forum font-black text-foreground uppercase tracking-tighter leading-none">
                        Contacta con el
{' '}
<span className="text-primary italic">Gremio</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-muted-foreground text-xl leading-relaxed italic opacity-80">
                        ¿Tienes dudas sobre un pedido, un intercambio o algún torneo?
{' '}
<br />
                        Nuestros escribas están listos para asistirte en tu viaje por el Multiverso.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
                    {/* EMAIL CARD */}
                    <Card className="bg-card/40 backdrop-blur-md border-border/50 rounded-2xl shadow-2xl shadow-black/5 hover:border-primary/40 transition-all duration-500 group overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-16 translate-x-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="p-10 space-y-8">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-primary/10 rounded-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner">
                                    <Mail className="h-7 w-7 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-montserrat font-black uppercase tracking-tight text-foreground">Correo de Soporte</h2>
                                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mt-1">Respuesta en menos de 24h</p>
                                </div>
                            </div>
                            <p className="text-[15px] text-muted-foreground/80 leading-relaxed italic">Escríbinos directamente para consultas sobre transacciones, errores en el santuario o soporte técnico especializado.</p>
                            <Button variant="outline" asChild className="w-full justify-between h-14 uppercase tracking-[0.2em] text-[10px] font-black border-border/50 bg-accent/20 hover:bg-primary/[0.03] hover:border-primary/30 transition-all rounded-xl">
                                <a href="mailto:soporte@tiendamagic.com">
                                    soporte@tiendamagic.com
                                    <Send size={14} className="ml-2 opacity-40 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </a>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* FORUM CARD */}
                    <Card className="bg-card/40 backdrop-blur-md border-border/50 rounded-2xl shadow-2xl shadow-black/5 hover:border-primary/40 transition-all duration-500 group overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-16 translate-x-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="p-10 space-y-8">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-primary/10 rounded-2xl group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 shadow-inner">
                                    <MessageSquare className="h-7 w-7 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-montserrat font-black uppercase tracking-tight text-foreground">Foro Comunitario</h2>
                                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mt-1">Sabiduría colectiva</p>
                                </div>
                            </div>
                            <p className="text-[15px] text-muted-foreground/80 leading-relaxed italic">Abre un hilo en la sección general si tu duda puede ser de ayuda para que otros Planeswalkers aprendan.</p>
                            <Button asChild className="w-full justify-between h-14 uppercase tracking-[0.2em] text-[10px] font-black shadow-xl shadow-primary/20 rounded-xl bg-primary hover:bg-primary/90">
                                <a href="/forum">
                                    Ir a la sección de ayuda
                                    <ExternalLink size={14} className="ml-2 opacity-40 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </a>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* PHYSICAL LOCATION */}
                    <Card className="bg-card/40 backdrop-blur-md border-border/50 rounded-2xl shadow-2xl shadow-black/5 md:col-span-2 overflow-hidden border-l-8 border-l-primary/30 relative group">
                        <div className="absolute inset-0 bg-primary/[0.01] pointer-events-none" />
                        <CardContent className="p-0 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border/50">
                            <div className="p-12 md:w-1/2 space-y-8">
                                <div className="flex items-center gap-6">
                                    <div className="p-4 bg-primary/10 rounded-2xl shadow-inner group-hover:scale-110 transition-transform duration-500">
                                        <MapPin className="h-7 w-7 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-montserrat font-black uppercase tracking-tight text-foreground">Taberna Física</h2>
                                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mt-1">Visítanos en persona</p>
                                    </div>
                                </div>
                                <p className="text-[16px] text-muted-foreground leading-relaxed italic opacity-90">
                                    ¿Buscas una partida rápida o quieres tasar tus cartas en persona? Ven a nuestro santuario físico. Jugamos FNM todos los viernes y celebramos torneos cada domingo.
                                </p>
                                <address className="not-italic block p-6 bg-accent/20 rounded-2xl border border-border/50 shadow-inner">
                                    <span className="block text-[11px] font-black uppercase tracking-[0.3em] text-primary font-montserrat mb-3 underline decoration-primary/30 underline-offset-4">Localización Registrada</span>
                                    <span className="block text-2xl font-forum font-black text-foreground mb-1">Calle de la Magia 123</span>
                                    <span className="block text-sm text-muted-foreground italic font-literata">Plano de Dominaria, Nivel 4 - El Multiverso</span>
                                </address>
                            </div>
                            <div className="md:w-1/2 relative bg-accent/10 flex items-center justify-center p-12 group overflow-hidden">
                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1547394765-185e1e68f34e?auto=format&fit=crop&q=80&w=800')] bg-cover bg-center opacity-10 blur-sm grayscale group-hover:blur-0 group-hover:opacity-30 group-hover:scale-110 transition-all duration-1000" />
                                <div className="relative text-center space-y-4">
                                     <div className="p-6 bg-background/20 backdrop-blur-md rounded-full border border-border/50 inline-block shadow-2xl group-hover:scale-125 transition-transform duration-700">
                                        <Globe size={40} className="text-primary/40 animate-pulse" />
                                     </div>
                                     <p className="text-[10px] font-black uppercase tracking-[1em] text-muted-foreground/40 mt-4">Mapa Místico Próximamente</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* FAQ FOOTER DAMP */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 py-12 border-t border-border/40">
                    <div className="flex items-center gap-6 p-6 rounded-2xl bg-accent/5 border border-dashed border-border/50 group transition-all">
                        <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                            <Shield size={24} className="text-primary/40" />
                        </div>
                        <div>
                            <span className="block text-[11px] font-black uppercase tracking-[0.2em] text-foreground mb-1 font-montserrat">Protección de Datos Nivel Mítico</span>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-40">Tus datos están sellados con criptografía arcana</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 p-6 rounded-2xl bg-accent/5 border border-dashed border-border/50 group transition-all">
                        <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                            <HelpCircle size={24} className="text-primary/40" />
                        </div>
                        <div>
                            <span className="block text-[11px] font-black uppercase tracking-[0.2em] text-foreground mb-1 font-montserrat">Preguntas Frecuentes</span>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-40">Respuestas rápidas para caminantes ocupados</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
