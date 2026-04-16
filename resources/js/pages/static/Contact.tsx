import React from 'react';
import { Mail, MessageSquare, MapPin } from 'lucide-react';

export default function Contact() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-zinc-800">
        <Mail className="h-8 w-8 text-amber-500" />
        <h1 className="text-3xl font-serif font-bold text-zinc-100">Contacto</h1>
      </div>
      
      <div className="text-zinc-300 leading-relaxed font-inter">
        <p className="text-lg text-zinc-400 mb-8">
          ¿Tienes dudas sobre un pedido, intercambio o algún torneo? Estamos aquí para ayudarte. Utiliza cualquiera de los métodos a continuación para ponerte en contacto con el gremio.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-zinc-900/40 p-6 rounded-lg border border-zinc-800 flex flex-col gap-3">
            <div className="flex items-center gap-3 text-amber-500 font-bold text-lg mb-2">
              <Mail className="h-5 w-5" /> Electrónico
            </div>
            <p className="text-sm">Escríbenos directamente a nuestro buzón arcano. Responderemos en menos de 24 horas laborables.</p>
            <a href="mailto:soporte@tiendamagic.com" className="text-indigo-400 hover:text-indigo-300 font-medium">soporte@tiendamagic.com</a>
          </div>

          <div className="bg-zinc-900/40 p-6 rounded-lg border border-zinc-800 flex flex-col gap-3">
            <div className="flex items-center gap-3 text-amber-500 font-bold text-lg mb-2">
              <MessageSquare className="h-5 w-5" /> Foro
            </div>
            <p className="text-sm">Abre un hilo en la sección general si tu duda puede ser de ayuda para el resto de la comunidad.</p>
            <a href="/forum" className="text-indigo-400 hover:text-indigo-300 font-medium">Ir al foro</a>
          </div>

          <div className="bg-zinc-900/40 p-6 rounded-lg border border-zinc-800 md:col-span-2 flex flex-col md:flex-row gap-6 items-center justify-between">
            <div>
              <div className="flex items-center gap-3 text-amber-500 font-bold text-lg mb-2">
                <MapPin className="h-5 w-5" /> Taberna Física
              </div>
              <p className="text-sm">Si estás en la zona, ven a visitarnos a nuestro local. Jugamos FNM todos los viernes.</p>
              <address className="not-italic text-zinc-400 mt-2 text-sm">
                Calle de la Magia 123,<br />
                Plano de Dominaria, Multiverso
              </address>
            </div>
            <div className="w-full md:w-1/3 aspect-video bg-zinc-800 rounded-md border border-zinc-700 flex items-center justify-center">
              <span className="text-zinc-500 text-xs text-center px-4">Mapa Místico (Próximamente)</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
