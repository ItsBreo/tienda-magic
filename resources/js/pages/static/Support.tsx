import React from 'react';
import { LifeBuoy, Wrench, AlertCircle } from 'lucide-react';

export default function Support() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-zinc-800">
        <LifeBuoy className="h-8 w-8 text-amber-500" />
        <h1 className="text-3xl font-serif font-bold text-zinc-100">Soporte Técnico</h1>
      </div>

      <div className="space-y-8 text-zinc-300 leading-relaxed font-inter">
        <p className="text-lg text-zinc-400">
          Encuentra soluciones a los problemas más comunes o solicita asistencia técnica especializada a nuestros artificieros.
        </p>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Wrench className="h-5 w-5 text-zinc-500" />
{' '}
Problemas Frecuentes (FAQ)
</h2>

          <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg divide-y divide-zinc-800">
            <div className="p-4">
              <h3 className="font-bold text-amber-500 mb-1">No puedo acceder a mi bóveda/inventario</h3>
              <p className="text-sm">Asegúrate de haber iniciado sesión. Si el problema persiste, intenta borrar las cookies del navegador (el caché arcano) y vuelve a autenticarte.</p>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-amber-500 mb-1">Mi compra de gemas/sobres no aparece</h3>
              <p className="text-sm">Las transacciones pueden tardar hasta 5 minutos en sincronizarse con la base de datos central. Si pasa más tiempo, contacta usando el formulario inferior aportando tu ID de compra.</p>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-amber-500 mb-1">Un intercambio se ha quedado bloqueado</h3>
              <p className="text-sm">Si la otra parte no responde o el contrato mercantil falló, puedes cancelar unilateralmente la propuesta desde la sección de 'Intercambios'. Las cartas bloqueadas regresarán a tu inventario.</p>
            </div>
          </div>
        </section>

        <section className="bg-red-500/5 p-6 rounded-lg border border-red-500/20">
          <h2 className="text-lg font-bold text-red-400 flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5" />
{' '}
Reportar un Bug o Fraude
</h2>
          <p className="text-sm mb-4">
            ¿Has encontrado una brecha en la matrix o a un jugador haciendo trampas? Abre un ticket de soporte crítico.
          </p>
          <button className="bg-red-500/20 text-red-400 hover:bg-red-500/30 font-bold py-2 px-4 rounded border border-red-500/30 transition-colors">
            Abrir Ticket (Próximamente)
          </button>
        </section>

      </div>
    </div>
  );
}
