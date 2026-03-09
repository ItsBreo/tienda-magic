import React from 'react';
import { Head } from '@inertiajs/react';
import {
 Wand2, ShoppingCart, Package, Wallet, Users, TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
 Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DashboardProtected() {
    const { user, logout } = useAuth();

    return (
        <ProtectedRoute>
            <Head title="Dashboard" />

            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white shadow-sm border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <div className="flex items-center">
                                <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg mr-3">
                                    <Wand2 className="h-6 w-6 text-white" />
                                </div>
                                <h1 className="text-xl font-semibold text-gray-900">Tienda Magic</h1>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className="text-sm text-gray-600">
                                    Bienvenido,
{' '}
{user?.name}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => logout()}
                                >
                                    Cerrar Sesión
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Welcome Section */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            ¡Hola,
{' '}
{user?.name}
! 👋
</h2>
                        <p className="text-gray-600">
                            Bienvenido a tu dashboard de Tienda Magic. Gestiona tu colección y explora el mundo de Magic.
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Saldo Wallet</CardTitle>
                                <Wallet className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    $
{user?.wallet_balance?.toFixed(2) || '0.00'}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Disponible para compras
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Carrito</CardTitle>
                                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">0</div>
                                <p className="text-xs text-muted-foreground">
                                    Items en el carrito
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Inventario</CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">0</div>
                                <p className="text-xs text-muted-foreground">
                                    Cartas en posesión
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Mazos</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">0</div>
                                <p className="text-xs text-muted-foreground">
                                    Mazos creados
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <ShoppingCart className="h-5 w-5 mr-2" />
                                    Tienda
                                </CardTitle>
                                <CardDescription>
                                    Explora nuestras cartas y productos disponibles
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button className="w-full" asChild>
                                    <a href="/shop">Ir a la Tienda</a>
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Package className="h-5 w-5 mr-2" />
                                    Mi Inventario
                                </CardTitle>
                                <CardDescription>
                                    Gestiona tu colección de cartas
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button className="w-full" variant="outline" asChild>
                                    <a href="/inventory">Ver Inventario</a>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Activity */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <TrendingUp className="h-5 w-5 mr-2" />
                                Actividad Reciente
                            </CardTitle>
                            <CardDescription>
                                Tus últimas transacciones y actividades
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-gray-500">
                                <p>No hay actividad reciente</p>
                                <p className="text-sm">Comienza explorando la tienda o gestionando tu inventario</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </ProtectedRoute>
    );
}
