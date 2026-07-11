import { useState, useEffect } from 'react';
import { obtenerProductos } from '../api/productosApi';
import { Package, Loader2, DollarSign } from 'lucide-react';

const CATEGORIAS_VALIDAS = [
  'Perros',
  'Perras',
  'Desgranados/Salchipapa',
  'Bebidas',
  'Entradas',
  'Postres',
  'Domicilios',
  'Extras'
];

function Productos() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  
  // Nuevo estado para controlar qué categoría estamos viendo. 
  // Por defecto arranca en 'Perros' (la primera de tu lista)
  const [categoriaActiva, setCategoriaActiva] = useState(CATEGORIAS_VALIDAS[0]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const data = await obtenerProductos();
        setProductos(data);
      } catch (err) {
        setError(err);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p className="text-sm font-medium">Cargando catálogo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
        {error}
      </div>
    );
  }

  // Filtramos solo los productos de la categoría seleccionada
  const productosFiltrados = productos.filter((p) => p.categoria === categoriaActiva);

  return (
    <div className="space-y-8">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Catálogo de Productos</h2>
          <p className="text-sm text-slate-500">Gestiona los ítems disponibles en el menú</p>
        </div>
        <button className="bg-slate-950 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-900 transition-all cursor-pointer whitespace-nowrap">
          + Nuevo Producto
        </button>
      </div>

      {/* Selector de Categorías (Pestañas) */}
      <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
        {CATEGORIAS_VALIDAS.map((categoria) => (
          <button
            key={categoria}
            onClick={() => setCategoriaActiva(categoria)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              categoriaActiva === categoria
                ? 'bg-indigo-600 text-white shadow-sm' // Estilo para la activa
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900' // Estilo inactiva
            }`}
          >
            {categoria}
            {/* Opcional: Contador pequeñito en la pestaña activa */}
            {categoriaActiva === categoria && (
              <span className="ml-2 bg-indigo-500 text-white px-2 py-0.5 rounded-full text-xs">
                {productosFiltrados.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid de productos o Mensaje de vacío */}
      {productosFiltrados.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">Categoría vacía</h3>
          <p className="text-slate-500">No tienes productos registrados en <b>{categoriaActiva}</b>.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {productosFiltrados.map((prod) => (
            <div key={prod.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col">
              <div className="h-48 bg-slate-100 flex items-center justify-center overflow-hidden">
                {prod.imagen ? (
                  <img src={prod.imagen} alt={prod.nombre} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-10 h-10 text-slate-300" />
                )}
              </div>
              
              <div className="p-5 flex flex-col flex-1">
                <h3 className="text-lg font-medium text-slate-900 leading-tight mb-1">{prod.nombre}</h3>
                
                {prod.descripcion && (
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">{prod.descripcion}</p>
                )}
                
                <div className="mt-auto flex items-center text-slate-900 font-bold text-lg pt-4 border-t border-slate-50">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  {Number(prod.precio).toLocaleString('es-CO')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Productos;