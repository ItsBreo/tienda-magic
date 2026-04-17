import React from 'react';
import { 
    ScrollText, Zap, BookOpen, Skull, 
    Flame, Droplets, TreePine, Sun, 
    CircleDashed, Info, Trophy, Swords,
    BookMarked, Wand2, Sparkles, Scroll
} from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";

export default function Rules() {
    return (
        <div className="flex-1 bg-background text-foreground pb-24 font-literata selection:bg-primary/30">
            {/*<Breadcrumbs items={[{ title: 'Reglas de Juego', href: '/rules' }]} />*/}

            <main className="max-w-6xl mx-auto px-4 pt-16">
                 {/* GRIMOIRE HEADER */}
                <div className="text-center mb-24 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="flex justify-center -mb-6">
                        
                    </div>
                    <h1 className="text-6xl md:text-9xl font-forum font-black text-foreground uppercase tracking-tighter leading-none mt-20">
                        El Grimorio del <span className="text-primary italic">Caminante</span>
                    </h1>
                    <div className="flex items-center justify-center gap-6">
                         <div className="h-px w-20 bg-gradient-to-r from-transparent to-border" />
                         <Badge variant="outline" className="text-[11px] font-black uppercase tracking-[0.5em] bg-accent/20 border-border px-8 py-1.5 shadow-sm">
                            Escrituras Ancestrales
                         </Badge>
                         <div className="h-px w-20 bg-gradient-to-l from-transparent to-border" />
                    </div>
                    <p className="max-w-3xl mx-auto text-muted-foreground text-xl italic leading-relaxed opacity-80">
                        Bienvenido a Magic: The Gathering. Atraviesa los planos de la existencia <br /> 
                        y domina el arte del maná para convertirte en una leyenda del Multiverso.
                    </p>
                </div>

                <div className="space-y-24">
                    
                    {/* SECTION 1: THE PLAYER */}
                    <section className="relative p-10 md:p-16 bg-card border border-border/50 rounded-2xl shadow-2xl shadow-black/5 overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-all duration-700 pointer-events-none">
                             <Wand2 size={200} className="rotate-12 group-hover:rotate-45 transition-transform duration-1000" />
                        </div>
                        <div className="relative z-10 max-w-3xl space-y-8">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-primary/10 rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                                    <BookOpen className="h-8 w-8 text-primary" />
                                </div>
                                <h2 className="text-3xl font-montserrat font-black uppercase tracking-tight">1. Eres un Planeswalker</h2>
                            </div>
                            <p className="text-foreground/90 leading-relaxed text-xl italic">
                                Eres un hechicero capaz de viajar por distintos mundos. Empiezas con <span className="text-primary font-black underline decoration-primary/30 underline-offset-8">20 vidas</span> y tu mazo (biblioteca).
                            </p>
                            <div className="grid gap-6 mt-10">
                                <div className="space-y-3 border-l-4 border-primary/20 pl-8 italic text-muted-foreground text-[15px] bg-accent/10 py-6 rounded-r-xl">
                                    <span className="block font-black uppercase text-foreground text-[11px] tracking-[0.3em] mb-2 opacity-60 font-montserrat">Victoria Mítica</span>
                                    <p className="leading-relaxed">Ganas reduciendo la vida del rival a 0, haciendo que se quede sin cartas en su biblioteca, o mediante efectos mágicos especiales de victoria alternativa.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* SECTION 2: THE MANA (WUBRG) */}
                    <section className="space-y-12">
                        <div className="flex items-center gap-6 border-b border-border/50 pb-6">
                            <Zap className="h-8 w-8 text-primary opacity-60" />
                            <h2 className="text-3xl font-montserrat font-black uppercase tracking-tight">El Arte del Maná</h2>
                        </div>
                        <p className="text-muted-foreground leading-relaxed italic text-xl opacity-80 max-w-4xl">
                            Para lanzar hechizos necesitas energía, y esa energía se llama <span className="text-foreground font-black">Maná</span>. Este brota de las Tierras que invocamos en cada turno.
                        </p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                            {[
                                { name: 'Blanco', sub: 'Llanuras', icon: Sun, color: '#f0f2cf', bg: 'hover:shadow-[0_0_30px_-10px_rgba(240,242,207,0.4)]' },
                                { name: 'Azul', sub: 'Islas', icon: Droplets, color: '#0e68ab', bg: 'hover:shadow-[0_0_30px_-10px_rgba(14,104,171,0.4)]' },
                                { name: 'Negro', sub: 'Pantanos', icon: Skull, color: '#4a3f35', bg: 'hover:shadow-[0_0_30px_-10px_rgba(0,0,0,0.4)]' },
                                { name: 'Rojo', sub: 'Montañas', icon: Flame, color: '#d3202e', bg: 'hover:shadow-[0_0_30px_-10px_rgba(211,32,46,0.4)]' },
                                { name: 'Verde', sub: 'Bosques', icon: TreePine, color: '#00733e', bg: 'hover:shadow-[0_0_30px_-10px_rgba(0,115,62,0.4)]' },
                                { name: 'Incoloro', sub: 'Artefactos', icon: CircleDashed, color: '#7b7b7b', bg: 'hover:shadow-[0_0_30px_-10px_rgba(123,123,123,0.4)]' },
                            ].map((c) => (
                                <div key={c.name} className={cn(
                                    "flex flex-col items-center p-8 bg-card border border-border/50 rounded-2xl transition-all duration-500 group shadow-lg shadow-black/[0.02] cursor-default",
                                    c.bg
                                )}>
                                    <div className="p-4 rounded-full bg-accent/20 mb-6 group-hover:scale-125 transition-transform duration-500 border border-border/30">
                                        <c.icon size={28} style={{ color: c.color }} className="group-hover:rotate-12 transition-transform shadow-sm" />
                                    </div>
                                    <span className="text-[12px] font-black uppercase tracking-[0.2em] text-foreground font-montserrat">{c.name}</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-30 mt-1">{c.sub}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* SECTION 3: PHASES */}
                    <section className="bg-card border border-border/50 rounded-2xl p-10 md:p-16 shadow-2xl shadow-black/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:bg-primary/10 transition-colors duration-1000" />
                        <h2 className="text-4xl font-forum font-black text-foreground uppercase tracking-tight mb-12 flex items-center gap-4">
                             <Sparkles className="text-primary h-8 w-8" /> Ciclo de un Turno
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                            {[
                                { t: 'Fase de Inicio', d: 'Enderezas tus tierras gastadas y robas tu carta del destino del mazo ancestral.' },
                                { t: 'Principal 1', d: 'Invocas tierras, criaturas y lanzas hechizos de conjuro antes de la batalla.' },
                                { t: 'Combate', d: 'Enviás a tus huestes a la batalla contra el Planeswalker rival en un duelo de vida.' },
                                { t: 'Principal 2', d: 'Segunda oportunidad para reforzar tus defensas con el maná restante del día.' },
                                { t: 'Final', d: 'Tus heridas se sanan, los efectos temporales mueren y pasas el turno con un firme: "Vas".' },
                            ].map((p, i) => (
                                <div key={p.t} className="flex gap-6 items-start group relative">
                                    <span className="text-5xl font-forum font-black text-primary/10 group-hover:text-primary transition-colors duration-500 tabular-nums leading-none">0{i+1}</span>
                                    <div className="space-y-2">
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground font-montserrat">{p.t}</h3>
                                        <p className="text-muted-foreground text-[14px] font-literata italic leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">{p.d}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* SECTION 4: COMBAT SCROLL */}
                    <section className="p-10 md:p-16 border-2 border-primary/10 rounded-2xl relative overflow-hidden bg-primary/[0.012] group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent pointer-events-none" />
                        <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
                            <div className="flex-1 space-y-8">
                                <div className="flex items-center gap-6">
                                    <div className="p-4 bg-primary/10 rounded-2xl shadow-inner group-hover:rotate-12 transition-transform">
                                        <Swords className="h-8 w-8 text-primary" />
                                    </div>
                                    <h2 className="text-4xl font-forum font-black text-foreground uppercase tracking-tight">El Campo de Batalla</h2>
                                </div>
                                <p className="text-xl text-muted-foreground italic leading-relaxed opacity-90 border-l-4 border-primary/20 pl-8">
                                    "Tú nunca atacas a las criaturas del oponente. Tú vas directo a por el jugador. Es el defensor quien decide si usa sus defensas como escudo."
                                </p>
                                <div className="grid gap-4 mt-8">
                                    <Badge variant="outline" className="justify-start h-12 px-6 bg-background/5 rounded-xl border-border/50 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary/5 transition-colors">Paso Atacante: Declara tus huestes de guerra.</Badge>
                                    <Badge variant="outline" className="justify-start h-12 px-6 bg-background/5 rounded-xl border-border/50 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary/5 transition-colors">Paso Bloqueador: El rival elige su propio destino.</Badge>
                                    <Badge variant="outline" className="justify-start h-12 px-6 bg-background/5 rounded-xl border-border/50 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary/5 transition-colors">Reparto de Daño: Las chispas saltan en el éter.</Badge>
                                </div>
                            </div>
                            <div className="lg:w-1/3 flex items-center justify-center">
                                 <div className="size-64 p-8 bg-card rounded-full border-2 border-primary/10 flex flex-col items-center justify-center text-center shadow-2xl relative group cursor-help transition-all duration-700 hover:border-primary/30">
                                     <div className="absolute inset-0 bg-primary/5 rounded-full animate-pulse group-hover:animate-none scale-105" />
                                     <Trophy size={60} className="text-primary mb-4 transition-transform duration-700 group-hover:scale-110" />
                                     <span className="text-[11px] font-black uppercase tracking-[0.4em] opacity-40 font-montserrat">LIFO Order</span>
                                     <span className="text-[9px] font-black uppercase tracking-widest text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Regla Mayor</span>
                                 </div>
                            </div>
                        </div>
                    </section>

                    {/* GLOSSARY */}
                    <section className="space-y-12">
                         <div className="flex items-center gap-6 border-b border-border/50 pb-6">
                            <BookMarked size={28} className="text-primary/40" />
                            <h2 className="text-3xl font-montserrat font-black uppercase tracking-tight text-foreground/80">Léxico de los Planos</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[
                                { t: 'Tapear', d: 'Girar la carta para indicar que ya ha agotado su energía mental en este ciclo.' },
                                { t: 'Mulligan', d: 'Reiniciar tu mano inicial si los vientos del azar no te han favorecido esta vez.' },
                                { t: 'La Pila', d: 'El orden místico donde los hechizos esperan: el último en lanzarse es el primero en golpear.' },
                                { t: 'Deckearse', d: 'Perder la partida al intentar robar sabiduría de un mazo ya vacío.' },
                                { t: 'GG / Conceder', d: 'Muestra de honor supremo al admitir la derrota antes de que caiga el último punto de vida.' },
                                { t: 'Fizzle', d: 'Cuando un conjuro se desvanece por la ausencia de un objetivo válido en su resolución.' },
                            ].map((g) => (
                                <div key={g.t} className="p-8 bg-card border border-border/50 rounded-2xl space-y-4 group hover:bg-primary/[0.03] hover:border-primary/30 transition-all duration-500 shadow-xl shadow-black/[0.02]">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary underline decoration-primary/20 underline-offset-4 font-montserrat">{g.t}</h3>
                                    <p className="text-[14px] text-muted-foreground font-literata leading-relaxed italic opacity-80 group-hover:opacity-100 transition-opacity">{g.d}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
