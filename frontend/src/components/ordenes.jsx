import { useState, useEffect } from 'react';
import { obtenerProductos } from '../api/productosApi';
import { useNavigate } from 'react-router-dom';
import { 
  Package, Loader2, Trash2, Plus, Minus, 
  ShoppingCart, Sparkles, Ban
} from 'lucide-react';

const CATEGORIAS_VALIDAS = [
  'Perros', 'Perras', 'Desgranados/Salchipapa', 'Bebidas', 
  'Entradas', 'Postres', 'Domicilios', 'Extras'
];

const INGREDIENTES_REMOVIBLES = [
  'Sin salsas', 'Sin salsa de tomate', 'Sin salsa de piña',
  'Sin salsa mayonesa', 'Sin salsa bbq', 'Sin cebolla',
  'Sin ripio', 'Sin tocineta', 'Sin maduro', 'Sin chicharron', 'Sin huevos'
];

function Ordenes() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState(CATEGORIAS_VALIDAS[0]);
  
  // 1. INICIALIZAMOS LA ORDEN LEYENDO DE SESSION STORAGE
  const [orden, setOrden] = useState(() => {
    const ordenGuardada = sessionStorage.getItem('orden_en_curso');
    return ordenGuardada ? JSON.parse(ordenGuardada) : [];
  });
  
  const [menuModificador, setMenuModificador] = useState({ id: null, tipo: null });

  const navigate = useNavigate();

  // 2. GUARDAMOS LA ORDEN AUTOMÁTICAMENTE EN SESSION STORAGE CADA VEZ QUE CAMBIA
  useEffect(() => {
    sessionStorage.setItem('orden_en_curso', JSON.stringify(orden));
  }, [orden]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const data = await obtenerProductos();
        setProductos(data);
      } catch (err) {
        setError(err.message || 'Error al cargar los productos');
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, []);

  const extrasDisponibles = productos.filter((p) => p.categoria === 'Extras');

  // --- FUNCIONES DEL CARRITO ---
  const agregarProducto = (producto) => {
    setOrden((ordenActual) => {
      const productoExistente = ordenActual.find((item) => item.id === producto.id);
      if (productoExistente) {
        return ordenActual.map((item) =>
          item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      } else {
        return [...ordenActual, { ...producto, cantidad: 1, extras: [], sin: [] }];
      }
    });
  };

  const actualizarCantidad = (id, nuevaCantidad) => {
    const cantidad = parseInt(nuevaCantidad) || 1;
    setOrden((ordenActual) =>
      ordenActual.map((item) =>
        item.id === id ? { ...item, cantidad: cantidad > 0 ? cantidad : 1 } : item
      )
    );
  };

  const eliminarProducto = (id) => {
    setOrden((ordenActual) => ordenActual.filter((item) => item.id !== id));
    if(menuModificador.id === id) setMenuModificador({id: null, tipo: null});
  };

  const agregarExtra = (idProducto, extraObj) => {
    setOrden((ordenActual) => ordenActual.map((item) => {
      if (item.id === idProducto) {
        return { ...item, extras: [...item.extras, extraObj] };
      }
      return item;
    }));
  };

  const quitarExtra = (idProducto, extraObj) => {
    setOrden((ordenActual) => ordenActual.map((item) => {
      if (item.id === idProducto) {
        const extrasIndex = item.extras.findIndex(e => e.id === extraObj.id);
        if (extrasIndex > -1) {
          const nuevosExtras = [...item.extras];
          nuevosExtras.splice(extrasIndex, 1);
          return { ...item, extras: nuevosExtras };
        }
      }
      return item;
    }));
  };

  const toggleSinIngrediente = (idProducto, ingrediente) => {
    setOrden((ordenActual) => ordenActual.map((item) => {
      if (item.id === idProducto) {
        const tieneIngrediente = item.sin.includes(ingrediente);
        const nuevoSin = tieneIngrediente 
          ? item.sin.filter(i => i !== ingrediente)
          : [...item.sin, ingrediente];
        return { ...item, sin: nuevoSin };
      }
      return item;
    }));
  };

  const calcularSubtotal = () => {
    return orden.reduce((total, item) => {
      const precioBase = Number(item.precio);
      const precioExtras = item.extras.reduce((sum, ext) => sum + Number(ext.precio), 0);
      return total + ((precioBase + precioExtras) * item.cantidad);
    }, 0);
  };

  const subtotal = calcularSubtotal();

  const irAPago = () => {
    if (orden.length > 0) {
      navigate('/pago', { state: { orden, subtotal } });
    }
  };

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p className="text-sm font-medium">Cargando sistema...</p>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">{error}</div>;
  }

  const productosFiltrados = productos.filter((p) => p.categoria === categoriaActiva);

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* LADO IZQUIERDO: MENÚ DE PRODUCTOS */}
        <div className="flex-1 w-full space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Tomar Orden</h2>
            <p className="text-sm text-slate-500">Selecciona los productos para agregarlos a la cuenta</p>
          </div>
          <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
            {CATEGORIAS_VALIDAS.map((categoria) => (
              <button
                key={categoria}
                onClick={() => setCategoriaActiva(categoria)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  categoriaActiva === categoria
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {categoria}
              </button>
            ))}
          </div>
          {productosFiltrados.length === 0 ? (
            <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No hay productos en esta categoría.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {productosFiltrados.map((prod) => (
                <div 
                  key={prod.id} 
                  onClick={() => agregarProducto(prod)}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:border-indigo-300 hover:ring-1 hover:ring-indigo-300 transition-all cursor-pointer flex flex-col group"
                >
                  <div className="h-32 bg-slate-100 flex items-center justify-center overflow-hidden">
                    {prod.imagen ? (
                      <img src={prod.imagen} alt={prod.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <Package className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  <div className="p-3 flex flex-col flex-1 text-center">
                    <h3 className="text-sm font-medium text-slate-900 leading-tight mb-1">{prod.nombre}</h3>
                    <div className="mt-auto text-indigo-600 font-bold text-sm">
                      ${Number(prod.precio).toLocaleString('es-CO')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LADO DERECHO: CARRITO */}
        <div className="w-full lg:w-[420px] bg-white border border-slate-200 rounded-2xl flex flex-col h-[calc(100vh-8rem)] sticky top-24 shadow-sm">
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-950 text-white rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Orden Actual</h3>
              <p className="text-xs text-slate-500">{orden.length} ítems seleccionados</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 bg-slate-50/50">
             {orden.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                <ShoppingCart className="w-12 h-12 opacity-20" />
                <p className="text-sm">La orden está vacía</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orden.map((item) => {
                  const precioItemConExtras = Number(item.precio) + item.extras.reduce((sum, ext) => sum + Number(ext.precio), 0);
                  const extrasVisuales = item.extras.reduce((acc, curr) => {
                    const existente = acc.find(e => e.id === curr.id);
                    if (existente) existente.qty += 1;
                    else acc.push({ ...curr, qty: 1 });
                    return acc;
                  }, []);

                  return (
                    <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 pr-2">
                          <span className="text-sm font-bold text-slate-900 block leading-tight">{item.nombre}</span>
                          <span className="text-sm font-medium text-slate-600 block mt-0.5">
                            ${(precioItemConExtras * item.cantidad).toLocaleString('es-CO')}
                          </span>
                        </div>
                        <button onClick={() => eliminarProducto(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {(item.extras.length > 0 || item.sin.length > 0) && (
                        <div className="flex flex-col gap-1 ml-2 my-1 border-l-2 border-slate-100 pl-3">
                          {extrasVisuales.map((ex) => (
                            <div key={ex.id} className="text-[13px] font-medium text-blue-700 flex justify-between items-center">
                              <span>+ {ex.qty > 1 ? `${ex.qty}x ` : ''}{ex.nombre}</span>
                              <span className="text-[11px] text-slate-400">+${(Number(ex.precio) * ex.qty).toLocaleString('es-CO')}</span>
                            </div>
                          ))}
                          {item.sin.map((s) => (
                            <div key={s} className="text-[13px] font-medium text-red-500">- {s}</div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                          <button onClick={() => actualizarCantidad(item.id, item.cantidad - 1)} disabled={item.cantidad <= 1} className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 hover:text-indigo-600 disabled:opacity-50 cursor-pointer"><Minus className="w-4 h-4" /></button>
                          <input type="number" min="1" value={item.cantidad} onChange={(e) => actualizarCantidad(item.id, e.target.value)} className="w-8 text-center text-sm font-bold bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                          <button onClick={() => actualizarCantidad(item.id, item.cantidad + 1)} className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 hover:text-indigo-600 cursor-pointer"><Plus className="w-4 h-4" /></button>
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={() => setMenuModificador(prev => prev.id === item.id && prev.tipo === 'extras' ? {id: null, tipo: null} : {id: item.id, tipo: 'extras'})} className="flex items-center gap-1 text-[11px] font-medium px-2 py-1.5 rounded-lg transition-colors cursor-pointer bg-white border border-slate-200"><Sparkles className="w-3.5 h-3.5 text-blue-600" /> Extra</button>
                          <button onClick={() => setMenuModificador(prev => prev.id === item.id && prev.tipo === 'sin' ? {id: null, tipo: null} : {id: item.id, tipo: 'sin'})} className="flex items-center gap-1 text-[11px] font-medium px-2 py-1.5 rounded-lg transition-colors cursor-pointer bg-white border border-slate-200"><Ban className="w-3.5 h-3.5 text-red-500" /> Sin...</button>
                        </div>
                      </div>

                      {/* MENÚ DE MODIFICADORES */}
                      {menuModificador.id === item.id && (
                        <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200 shadow-inner">
                          {menuModificador.tipo === 'extras' && (
                            <div className="flex flex-wrap gap-2">
                              {extrasDisponibles.map(ext => {
                                const cantidadExtra = item.extras.filter(e => e.id === ext.id).length;
                                const activo = cantidadExtra > 0;
                                return (
                                  <div key={ext.id} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition-colors ${activo ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-700 border-slate-300 hover:border-blue-300'}`}>
                                    {activo && (
                                      <button onClick={() => quitarExtra(item.id, ext)} className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-700 hover:bg-blue-800 text-white font-bold leading-none cursor-pointer pb-0.5">-</button>
                                    )}
                                    <span className="text-[12px] font-medium cursor-pointer select-none" onClick={() => agregarExtra(item.id, ext)}>
                                      {activo ? `${cantidadExtra}x ` : '+ '}{ext.nombre}
                                    </span>
                                    <button onClick={() => agregarExtra(item.id, ext)} className={`w-5 h-5 flex items-center justify-center rounded-full font-bold leading-none cursor-pointer pb-0.5 ${activo ? 'bg-blue-700 hover:bg-blue-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>+</button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {menuModificador.tipo === 'sin' && (
                            <div className="flex flex-wrap gap-2">
                              {INGREDIENTES_REMOVIBLES.map(ing => {
                                const isSelected = item.sin.includes(ing);
                                return (
                                  <button key={ing} onClick={() => toggleSinIngrediente(item.id, ing)} className={`text-[12px] font-medium px-3 py-1.5 rounded-lg border transition-colors cursor-pointer shadow-sm ${isSelected ? 'bg-red-500 text-white border-red-600' : 'bg-white text-slate-700 border-slate-300 hover:border-red-300'}`}>
                                    - {ing}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-5 border-t border-slate-100 bg-white rounded-b-2xl shadow-sm z-10">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-500 font-medium">Subtotal de la orden</span>
              <span className="text-2xl font-bold text-slate-800">
                ${subtotal.toLocaleString('es-CO')}
              </span>
            </div>
            
            <button 
              onClick={irAPago}
              disabled={orden.length === 0}
              className="w-full bg-slate-950 text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-slate-900 focus:ring-4 focus:ring-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Proceder al Pago
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Ordenes;