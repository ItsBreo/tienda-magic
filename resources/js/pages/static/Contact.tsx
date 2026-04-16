import React from 'react';
import { Mail, MessageSquare, MapPin } from 'lucide-react';

export default function Contact() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border">
        <Mail className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-serif font-bold text-foreground">Contacto</h1>
      </div>
      
      <div className="text-muted-foreground leading-relaxed font-inter">
        <p className="text-lg text-muted-foreground mb-8">
          ¿Tienes dudas sobre un pedido, intercambio o algún torneo? Estamos aquí para ayudarte. Utiliza cualquiera de los métodos a continuación para ponerte en contacto con el gremio.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-card p-6 rounded-lg border border-border flex flex-col gap-3">
            <div className="flex items-center gap-3 text-primary font-bold text-lg mb-2">
              <Mail className="h-5 w-5" /> Electrónico
            </div>
            <p className="text-sm">Escríbenos directamente a nuestro buzón arcano. Responderemos en menos de 24 horas laborables.</p>
            <a href="mailto:soporte@tiendamagic.com" className="text-primary hover:text-primary/80 font-medium">soporte@tiendamagic.com</a>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border flex flex-col gap-3">
            <div className="flex items-center gap-3 text-primary font-bold text-lg mb-2">
              <MessageSquare className="h-5 w-5" /> Foro
            </div>
            <p className="text-sm">Abre un hilo en la sección general si tu duda puede ser de ayuda para el resto de la comunidad.</p>
            <a href="/forum" className="text-primary hover:text-primary/80 font-medium">Ir al foro</a>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border md:col-span-2 flex flex-col md:flex-row gap-6 items-center justify-between">
            <div>
              <div className="flex items-center gap-3 text-primary font-bold text-lg mb-2">
                <MapPin className="h-5 w-5" /> Taberna Física
              </div>
              <p className="text-sm">Si estás en la zona, ven a visitarnos a nuestro local. Jugamos FNM todos los viernes.</p>
              <address className="not-italic text-muted-foreground mt-2 text-sm">
                Calle de la Magia 123,<br />
                Plano de Dominaria, Multiverso
              </address>
            </div>
            <div className="w-full md:w-1/3 aspect-video bg-accent rounded-md border border-border flex items-center justify-center">
              <span className="text-muted-foreground text-xs text-center px-4">Mapa Místico (Próximamente)</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
