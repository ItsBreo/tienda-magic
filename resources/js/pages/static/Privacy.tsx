import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-zinc-800">
        <ShieldCheck className="h-8 w-8 text-amber-500" />
        <h1 className="text-3xl font-serif font-bold text-zinc-100">Política de Privacidad</h1>
      </div>
      
      <div className="space-y-6 text-zinc-300 leading-relaxed font-inter">
        <p className="text-lg text-zinc-400 mb-6">
          En Tienda Magic entendemos la importancia de tu privacidad. A continuación te explicamos de manera transparente cómo manejamos tu información.
        </p>

        <section className="bg-zinc-900/40 p-6 rounded-lg border border-zinc-800">
          <h2 className="text-xl font-bold text-amber-500 mb-3">Recopilación de Datos</h2>
          <p>
            Al registrarte en Tienda Magic, recopilamos información básica como tu nombre de usuario, dirección de correo electrónico y una contraseña encriptada. No almacenamos datos de pago, ya que estos son procesados por pasarelas externas seguras.
          </p>
        </section>

        <section className="bg-zinc-900/40 p-6 rounded-lg border border-zinc-800">
          <h2 className="text-xl font-bold text-amber-500 mb-3">Uso de la Información</h2>
          <p>
            Utilizamos tus datos exclusivamente para gestionar tu inventario, tus transacciones y tu perfil en el foro. Bajo ninguna circunstancia vendemos ni compartimos tu dirección de correo electrónico con terceros para fines publicitarios.
          </p>
        </section>

        <section className="bg-zinc-900/40 p-6 rounded-lg border border-zinc-800">
          <h2 className="text-xl font-bold text-amber-500 mb-3">Cookies y Tecnologías Similares</h2>
          <p>
            Esta plataforma utiliza cookies necesarias (JWT en almacenamiento local/sesión) para mantener iniciada tu cuenta de usuario y gestionar tu carrito de compra. No usamos cookies de rastreo de terceros.
          </p>
        </section>

      </div>
    </div>
  );
}
