import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

interface CardSet {
  code: string;
  name: string;
  released_at: string;
  icon_svg_uri: string;
  card_count: number;
}

interface PageProps {
  auth: any;
  sets: {
    data: CardSet[];
    links: any[];
  };
}

export default function Marketplace({ auth, sets }: PageProps) {
  // 1. Chivato en consola: F12 -> Console para ver si llegan los datos
  console.log('Datos de sets:', sets);

  return (
    <AppLayout>
      <Head title="Tienda de Sobres" />

      {/* Añadimos un fondo llamativo temporal para ver si se renderiza algo */}
      <div className="p-8 bg-gray-100 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-black">Comprar Sobres</h2>

          {/* Verificamos si hay datos antes de mapear */}
          {sets.data && sets.data.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {sets.data.map((set) => (
                <div key={set.code} className="bg-white p-6 rounded-lg shadow border flex flex-col items-center">
                  <div className="h-20 mb-4 flex items-center justify-center">
                    <img src={set.icon_svg_uri} alt={set.name} className="max-h-full" />
                  </div>
                  <h3 className="text-center font-bold text-gray-900">{set.name}</h3>
                  <p className="text-sm text-gray-500">{set.released_at}</p>
                  <button className="mt-4 w-full py-2 bg-indigo-600 text-white rounded font-bold">
                    3.99€
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-10 rounded shadow text-center">
              <p className="text-red-500 font-bold">No se han cargado sobres en la variable 'sets'.</p>
              <p className="text-gray-500 text-sm">Revisa la base de datos o el controlador.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
