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
    emerald: 'bg-primary hover:bg-primary/90 text-primary-foreground border-primary/50 text-primary',
    blue: 'bg-secondary hover:bg-secondary/90 text-secondary-foreground border-secondary/50 text-secondary',
    purple: 'bg-accent hover:bg-accent/90 text-accent-foreground border-border text-accent-foreground',
    orange: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground border-destructive/50 text-destructive',
  };
  return colors[color] || 'bg-muted text-foreground text-muted-foreground';
};
