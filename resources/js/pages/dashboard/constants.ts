import {
    ShoppingBag, Package, Wallet, Sparkles, MessageSquare, Repeat, Store, ShieldCheck,
} from 'lucide-react';

export const QUICK_ACTIONS = [
    {
        title: 'Explorar Tienda',
        description: 'Descubre booster packs épicos para tu colección.',
        icon: ShoppingBag,
        theme: 'mtg-theme-default-purple',
        href: '/shop',
    },
    {
        title: 'Mi Carrito',
        description: 'Gestiona tus artículos seleccionados antes de comprar.',
        icon: Package,
        theme: 'mtg-theme-default-purple',
        href: '/cart',
    },
    {
        title: 'Mi Billetera',
        description: 'Recarga saldo y gestiona tus fondos de forma segura.',
        icon: Wallet,
        theme: 'mtg-theme-default-purple',
        href: '/wallet',
    },
    {
        title: 'Mi Inventario',
        description: 'Gestiona tus cartas, abre sobres y prepara ventas.',
        icon: Sparkles,
        theme: 'mtg-theme-default-purple',
        href: '/inventory',
    },
    {
        title: 'Comunidad Foro',
        description: 'Participa en debates, estrategias y noticias del mundo Magic.',
        icon: MessageSquare,
        theme: 'mtg-theme-default-purple',
        href: '/forum',
    },
    {
        title: 'Mercado Secundario',
        description: 'Compra y vende cartas directamente con otros jugadores.',
        icon: Store,
        theme: 'mtg-theme-default-purple',
        href: '/market',
    },
    {
        title: 'Intercambios',
        description: 'Propón y gestiona trades directos con la comunidad.',
        icon: Repeat,
        theme: 'mtg-theme-default-purple',
        href: '/exchanges',
    },
    {
        title: 'Panel Admin',
        description: 'Gestión total de la plataforma (Sólo Administradores).',
        icon: ShieldCheck,
        theme: 'mtg-theme-default-purple',
        href: '/admin',
        adminOnly: true,
    },
];

export const FEATURED_PACKS = [
    {
        name: 'Dominaria United',
        set: 'DOM',
        price: '3.99',
        color: 'emerald',
    },
    {
        name: 'Modern Horizons 3',
        set: 'MH3',
        price: '4.79',
        color: 'purple',
    },
];
