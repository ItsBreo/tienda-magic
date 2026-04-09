import {
 ShoppingBag, Package, Gift, Sparkles, Wallet,
} from 'lucide-react';

export const FEATURED_PACKS = [
  {
 name: 'Dominaria United', set: 'Dominaria United', price: '€3.99', type: 'standard', badge: 'Popular', color: 'emerald',
},
  {
 name: 'Modern Horizons 3', set: 'Modern Horizons 3', price: '€4.79', type: 'master', badge: 'Nuevo', color: 'purple',
},
  {
 name: 'Throne of Eldraine Collector', set: 'Throne of Eldraine', price: '€19.99', type: 'collector', badge: 'Exclusivo', color: 'orange',
},
];

export const QUICK_ACTIONS = [
    {
        title: 'Explorar Tienda', description: 'Descubre booster packs', icon: ShoppingBag, theme: 'mtg-theme-green', href: '/shop',
    },
    {
        title: 'Mi Carrito', description: 'Gestiona tus compras', icon: Package, theme: 'mtg-theme-blue', href: '/cart',
    },
    {
        title: 'Mi Billetera', description: 'Recarga saldo y gestiona fondos', icon: Wallet, theme: 'mtg-theme-emerald', href: '/wallet',
    },
    {
        title: 'Abrir Packs', description: 'Descubre cartas épicas', icon: Gift, theme: 'mtg-theme-mythic', href: '#', disabled: true,
    },
    {
        title: 'Mi Colección', description: 'Explora tu inventario', icon: Sparkles, theme: 'mtg-theme-rare', href: '#', disabled: true,
    },
];

export const getColorClasses = (color: string) => {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-600 hover:bg-emerald-500 text-black border-emerald-500/50 text-emerald-400',
    blue: 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500/50 text-blue-400',
    purple: 'bg-purple-600 hover:bg-purple-500 text-white border-purple-500/50 text-purple-400',
    orange: 'bg-orange-600 hover:bg-orange-500 text-white border-orange-500/50 text-orange-400',
  };
  return colors[color] || 'bg-zinc-600 text-white text-zinc-400';
};
