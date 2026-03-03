import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TiendaMagicLayout from '@/layouts/tienda-magic-layout';

// 1. Definimos las interfaces
interface CardSet {
  code: string;
  name: string;
  released_at: string;
  icon_svg_uri: string;
  card_count: number;
}

// Ya no usamos PageProps de Inertia, las props son opcionales o vacías
export default function Marketplace() {
  // 2. Estados para los datos, carga y errores
  const [sets, setSets] = useState<CardSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 3. Petición a la API al cargar el componente
  useEffect(() => {
    const fetchSets = async () => {
      try {
        setLoading(true);
        // Asegúrate de que esta ruta existe en tu api.php
        const response = await axios.get('/api/sets');

        // Ajustamos según cómo devuelva los datos tu controlador
        // Si tu API devuelve { data: [...] }, usamos response.data.data
        setSets(response.data.data || response.data);
      } catch (err: any) {
        console.error("Error cargando sobres:", err);
        setError("No se pudieron cargar los sobres.");
      } finally {
        setLoading(false);
      }
    };

    fetchSets();
  }, []);

  return (
    <TiendaMagicLayout>
      {/* Ya no usamos <Head />, React Router no lo necesita así */}

      <div className="p-8 bg-gray-100 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-black">Comprar Sobres</h2>

          {/* Estado de carga */}
          {loading ? (
            <div className="text-center py-20">
              <p className="text-gray-500 animate-pulse">Cargando la tienda de magia...</p>
            </div>
          ) : error ? (
            /* Estado de error */
            <div className="bg-white p-10 rounded shadow text-center">
              <p className="text-red-500 font-bold">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 text-indigo-600 underline"
              >
                Reintentar
              </button>
            </div>
          ) : sets.length > 0 ? (
            /* Renderizado de los datos */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {sets.map((set) => (
                <div key={set.code} className="bg-white p-6 rounded-lg shadow border flex flex-col items-center hover:shadow-lg transition-shadow">
                  <div className="h-20 mb-4 flex items-center justify-center">
                    <img
                      src={set.icon_svg_uri}
                      alt={set.name}
                      className="max-h-full"
                      onError={(e) => (e.currentTarget.src = 'https://www.svgrepo.com/show/354041/magic-the-gathering.svg')}
                    />
                  </div>
                  <h3 className="text-center font-bold text-gray-900">{set.name}</h3>
                  <p className="text-sm text-gray-500">{set.released_at}</p>
                  <button className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold transition-colors">
                    3.99€
                  </button>
                </div>
              ))}
            </div>
          ) : (
            /* Estado vacío */
            <div className="bg-white p-10 rounded shadow text-center">
              <p className="text-gray-500">No hay sobres disponibles en este momento.</p>
            </div>
          )}
        </div>
      </div>
    </TiendaMagicLayout>
  );
}
