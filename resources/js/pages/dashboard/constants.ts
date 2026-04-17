import {
    ShoppingBag, Package, Wallet, Sparkles, MessageSquare, Repeat, Store, ShieldCheck
} from 'lucide-react';

export const QUICK_ACTIONS = [
    {
        title: 'Explorar Tienda', 
        description: 'Descubre booster packs épicos para tu colección.', 
        icon: ShoppingBag, 
        theme: 'mtg-theme-green', 
        href: '/shop'
    },
    {
        title: 'Mi Carrito', 
        description: 'Gestiona tus artículos seleccionados antes de comprar.', 
        icon: Package, 
        theme: 'mtg-theme-blue', 
        href: '/cart'
    },
    {
        title: 'Mi Billetera', 
        description: 'Recarga saldo y gestiona tus fondos de forma segura.', 
        icon: Wallet, 
        theme: 'mtg-theme-emerald', 
        href: '/wallet'
    },
    {
        title: 'Mi Inventario', 
        description: 'Gestiona tus cartas, abre sobres y prepara ventas.', 
        icon: Sparkles, 
        theme: 'mtg-theme-mythic', 
        href: '/inventory'
    },
    {
        title: 'Comunidad Foro', 
        description: 'Participa en debates, estrategias y noticias del mundo Magic.', 
        icon: MessageSquare, 
        theme: 'mtg-theme-default', 
        href: '/forum'
    },
    {
        title: 'Mercado Secundario', 
        description: 'Compra y vende cartas directamente con otros jugadores.', 
        icon: Store, 
        theme: 'mtg-theme-rare', 
        href: '/market'
    },
    {
        title: 'Intercambios', 
        description: 'Propón y gestiona trades directos con la comunidad.', 
        icon: Repeat, 
        theme: 'mtg-theme-uncommon', 
        href: '/exchanges'
    },
    {
        title: 'Panel Admin', 
        description: 'Gestión total de la plataforma (Sólo Administradores).', 
        icon: ShieldCheck, 
        theme: 'bg-red-500/10 text-red-500 border-red-500/30', 
        href: '/admin',
        adminOnly: true
    }
];

export const FEATURED_PACKS = [
    {
        name: 'Dominaria United', 
        set: 'DOM', 
        price: '3.99', 
        color: 'emerald'
    },
    {
        name: 'Modern Horizons 3', 
        set: 'MH3', 
        price: '4.79', 
        color: 'purple'
    }
];
