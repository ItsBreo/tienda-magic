import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import {
  ShoppingBag,
  Package,
  TrendingUp,
  Users,
  Sparkles,
  ArrowRight,
  Gift,
  Star,
  Shield,
  Crown,
  Flame
} from 'lucide-react';
import { route } from 'ziggy-js';
import { usePage } from '@inertiajs/react';
import TiendaMagicLayout from '@/layouts/tienda-magic-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const breadcrumbs = [
  {
    title: 'Tienda',
    href: '/',
  },
];

export default function Dashboard() {
  const { props } = usePage();
  const { auth } = props as any;
  const [stats] = useState({
    totalPacks: 234,
    totalCards: 112598,
    activeUsers: 1247,
    todaySales: 89,
  });

  const featuredPacks = [
    {
      name: 'Dominaria United',
      set: 'Dominaria United',
      price: '€3.99',
      type: 'standard',
      badge: 'Popular',
      color: 'emerald',
    },
    {
      name: 'Modern Horizons 3',
      set: 'Modern Horizons 3',
      price: '€4.79',
      type: 'master',
      badge: 'Nuevo',
      color: 'purple',
    },
    {
      name: 'Throne of Eldraine Collector',
      set: 'Throne of Eldraine',
      price: '€19.99',
      type: 'collector',
      badge: 'Exclusivo',
      color: 'orange',
    },
  ];

  const quickActions = [
    {
      title: 'Explorar Tienda',
      description: 'Descubre todos los booster packs disponibles',
      icon: ShoppingBag,
      color: 'emerald',
      href: route('shop.index'),
    },
    {
      title: 'Mi Carrito',
      description: 'Gestiona tus compras pendientes',
      icon: Package,
      color: 'blue',
      href: route('cart.index'),
    },
    {
      title: 'Abrir Packs',
      description: 'Abre tus packs y descubre cartas épicas',
      icon: Gift,
      color: 'purple',
      href: '#',
      disabled: true,
    },
    {
      title: 'Mi Colección',
      description: 'Explora tu inventario de cartas',
      icon: Sparkles,
      color: 'orange',
      href: '#',
      disabled: true,
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      emerald: 'bg-emerald-600 hover:bg-emerald-500 text-black',
      blue: 'bg-blue-600 hover:bg-blue-500 text-white',
      purple: 'bg-purple-600 hover:bg-purple-500 text-white',
      orange: 'bg-orange-600 hover:bg-orange-500 text-white',
    };
    return colors[color as keyof typeof colors] || 'bg-zinc-600 hover:bg-zinc-500 text-white';
  };

  return (
    <TiendaMagicLayout breadcrumbs={breadcrumbs}>
      <Head title="Tienda Magic - Tu Portal de Colección" />

      <div className="min-h-screen bg-black text-zinc-100">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-black">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />
          <div className="relative px-6 py-24 text-center">
            <div className="mx-auto max-w-4xl">
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="p-3 bg-emerald-500/10 rounded-full">
                  <Flame className="h-8 w-8 text-emerald-400 animate-pulse" />
                </div>
                <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-zinc-100 via-emerald-400 to-zinc-100 bg-clip-text text-transparent">
                  Tienda Magic
                </h1>
                <div className="p-3 bg-emerald-500/10 rounded-full">
                  <Crown className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
              <p className="text-xl md:text-2xl text-zinc-400 mb-8 max-w-2xl mx-auto">
                La tienda definitiva para coleccionistas de Magic: The Gathering.
                Descubre packs exclusivos, abre cartas legendarias y construye la colección de tus sueños.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  className="bg-emerald-600 hover:bg-emerald-500 text-black font-semibold shadow-lg shadow-emerald-900/20 border border-emerald-500/50 transition-all duration-200 hover:scale-105"
                  onClick={() => router.visit(route('shop.index'))}
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Explorar Packs
                </Button>
                <Button
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-200"
                  onClick={() => router.visit(route('cart.index'))}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Mi Carrito
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Packs */}
        <div className="px-6 py-16">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-zinc-900/80 backdrop-blur-sm border border-zinc-700 rounded-full mb-6">
                <Star className="h-6 w-6 text-emerald-400 animate-pulse" />
                <h2 className="text-2xl font-bold text-zinc-100">
                  Packs Destacados
                </h2>
              </div>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                Las expansiones más populares y exclusivas del momento. ¡No te las pierdas!
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredPacks.map((pack, index) => (
                <Card
                  key={index}
                  className="bg-zinc-900 border-zinc-800 hover:border-emerald-500/50 transition-all duration-300 hover:scale-105 cursor-pointer group"
                  onClick={() => router.visit(route('shop.index'))}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getColorClasses(pack.color)}`}>
                        {pack.badge}
                      </div>
                      <div className="flex items-center gap-1">
                        <Shield className="h-4 w-4 text-zinc-500" />
                        <span className="text-xs text-zinc-500">{pack.type}</span>
                      </div>
                    </div>
                    <CardTitle className="text-zinc-100 text-lg">{pack.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-zinc-400 text-sm">{pack.set}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-emerald-400">{pack.price}</span>
                        <Button
                          className={`px-4 py-2 text-sm ${getColorClasses(pack.color)}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.visit(route('shop.index'));
                          }}
                        >
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-6 py-16 bg-zinc-900/50">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Acciones Rápidas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => (
                <Card
                  key={index}
                  className={`bg-zinc-900 border-zinc-800 hover:border-emerald-500/50 transition-all duration-300 cursor-pointer ${
                    action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                  }`}
                  onClick={() => !action.disabled && router.visit(action.href)}
                >
                  <CardHeader className="pb-4">
                    <div className={`p-3 rounded-lg bg-${action.color}-500/10 w-fit mb-4`}>
                      <action.icon className={`h-6 w-6 text-${action.color}-400`} />
                    </div>
                    <CardTitle className="text-zinc-100">{action.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-zinc-400 text-sm mb-4">{action.description}</p>
                    <Button
                      className={`w-full ${getColorClasses(action.color)} ${
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

        {/* Stats Section */}
        <div className="px-6 py-16">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Estadísticas de la Tienda
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Packs Disponibles', value: stats.totalPacks, icon: Package, color: 'emerald' },
                { label: 'Cartas en BD', value: stats.totalCards.toLocaleString(), icon: Sparkles, color: 'blue' },
                { label: 'Coleccionistas', value: stats.activeUsers.toLocaleString(), icon: Users, color: 'purple' },
                { label: 'Ventas Hoy', value: stats.todaySales, icon: TrendingUp, color: 'orange' },
              ].map((stat, index) => (
                <Card key={index} className="bg-zinc-900 border-zinc-800 hover:border-emerald-500/50 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-zinc-500 mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold text-zinc-100">{stat.value}</p>
                      </div>
                      <div className={`p-3 rounded-lg bg-${stat.color}-500/10`}>
                        <stat.icon className={`h-6 w-6 text-${stat.color}-400`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="px-6 py-24 bg-gradient-to-r from-emerald-900/20 to-blue-900/20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-zinc-900/80 backdrop-blur-sm border border-zinc-700 rounded-full mb-6">
              <Sparkles className="h-6 w-6 text-emerald-400 animate-pulse" />
              <h2 className="text-2xl font-bold text-zinc-100">
                ¿Listo para empezar tu colección?
              </h2>
            </div>
            <p className="text-zinc-400 mb-8 max-w-2xl mx-auto">
              Explora nuestra colección de más de 200 booster packs de todas las expansiones de Magic.
              Desde los clásicos hasta los más recientes, ¡todo lo que necesitas para construir la colección perfecta!
            </p>
            <Button
              className="bg-emerald-600 hover:bg-emerald-500 text-black font-semibold shadow-lg shadow-emerald-900/20 border border-emerald-500/50 transition-all duration-200 hover:scale-105 text-lg px-8 py-3"
              onClick={() => router.visit(route('shop.index'))}
            >
              <ShoppingBag className="h-5 w-5 mr-2" />
              Comenzar a Coleccionar
            </Button>
          </div>
        </div>
      </div>
    </TiendaMagicLayout>
  );
}
