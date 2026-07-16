import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, CreditCard, Banknote, Smartphone, HeartHandshake, Receipt } from 'lucide-react';
import { crearOrden } from '../api/ordenesApi';

function PasarelaPago() {
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Priorizamos location.state, si está vacío buscamos en sessionStorage usando LAS MISMAS CLAVES que en Ordenes.jsx
  const orden = location.state?.orden || JSON.parse(sessionStorage.getItem('orden_en_curso') || '[]');
  const subtotal = location.state?.subtotal || Number(sessionStorage.getItem('subtotal_en_curso') || 0);

  // 2. Redirigir si no hay orden, de lo contrario asegurar que esté en sessionStorage
  useEffect(() => {
    if (orden.length === 0) {
      navigate('/'); 
    } else {
      sessionStorage.setItem('orden_en_curso', JSON.stringify(orden));
      sessionStorage.setItem('subtotal_en_curso', subtotal.toString());
    }
  }, [orden, subtotal, navigate]);

  const [confirmando, setConfirmando] = useState(false);

  // --- ESTADOS PARA PROPINA ---
  const [tipoPropina, setTipoPropina] = useState('10%');
  const [valorPropinaPersonalizada, setValorPropinaPersonalizada] = useState('');

  // Cálculos iniciales
  const calcularPropina = () => {
    if (tipoPropina === 'ninguna') return 0;
    if (tipoPropina === '10%') return subtotal * 0.10;
    const valorCustom = Number(valorPropinaPersonalizada) || 0;
    if (tipoPropina === 'otro_porcentaje') return subtotal * (valorCustom / 100);
    if (tipoPropina === 'otro_fijo') return valorCustom;
    return 0;
  };

  const propina = calcularPropina();
  const granTotal = subtotal + propina;

  // --- ESTADOS PARA PAGOS DIVIDIDOS ---
  const [pagos, setPagos] = useState({
    efectivo: (subtotal + (subtotal * 0.10)).toString(),
    tarjeta: '',
    transferencia: ''
  });

  const totalPagado = 
    (Number(pagos.efectivo) || 0) + 
    (Number(pagos.tarjeta) || 0) + 
    (Number(pagos.transferencia) || 0);

  const saldoPendiente = granTotal - totalPagado;
  const pagoCompletado = totalPagado >= granTotal;
  const devuelta = pagoCompletado ? totalPagado - granTotal : 0;

  const handlePagoChange = (metodo, valor) => {
    setPagos(prev => ({ ...prev, [metodo]: valor }));
  };

  const handleAutoCompletarFaltante = (metodo) => {
    if (saldoPendiente > 0) {
      const nuevoValorMetodo = (Number(pagos[metodo]) || 0) + saldoPendiente;
      setPagos(prev => ({ ...prev, [metodo]: nuevoValorMetodo.toString() }));
    } else if (pagos[metodo] === '') {
      setPagos(prev => ({ ...prev, [metodo]: '0' }));
    }
  };

  const generarSugerenciasEfectivo = (total) => {
    if (total <= 0) return [];
    const opciones = new Set([total]);
    const next10k = Math.ceil(total / 10000) * 10000;
    if (next10k > total) opciones.add(next10k);
    
    const next20k = Math.ceil(total / 20000) * 20000;
    if (next20k > total && next20k !== next10k) opciones.add(next20k);

    const next50k = Math.ceil(total / 50000) * 50000;
    if (next50k > total) opciones.add(next50k);
    
    return Array.from(opciones).sort((a,b) => a - b).slice(0, 4);
  };

  const sugerenciasEfectivo = generarSugerenciasEfectivo(granTotal);

  const handleProcesarPago = async () => {
    if (!pagoCompletado || confirmando) return;
    setConfirmando(true);

    try {
      const productosPayload = [];
      orden.forEach((item) => {
        productosPayload.push({ producto_id: item.id, cantidad: item.cantidad });
        const extrasAgrupados = {};
        item.extras.forEach(ext => {
           extrasAgrupados[ext.id] = (extrasAgrupados[ext.id] || 0) + 1;
        });
        Object.entries(extrasAgrupados).forEach(([extId, qty]) => {
           productosPayload.push({ producto_id: extId, cantidad: item.cantidad * qty });
        });
      });

      const payloadFinal = { productos: productosPayload };
      const resultado = await crearOrden(payloadFinal);

      let mensajeExito = `¡Orden creada con éxito!\nCódigo: ${resultado.orden_id || 'N/A'}`;
      
      if (devuelta > 0 && Number(pagos.efectivo) > 0) {
        mensajeExito += `\n\nEntregar devuelta en efectivo: $${devuelta.toLocaleString('es-CO')}`;
      }

      alert(mensajeExito);
      
      // 3. LIMPIEZA CLAVE: Usamos exactamente el mismo nombre que en Ordenes.jsx
      sessionStorage.removeItem('orden_en_curso');
      sessionStorage.removeItem('subtotal_en_curso');
      
      // Regresar al menú, que ahora leerá un sessionStorage limpio
      navigate('/'); 

    } catch (err) {
      alert(`Error al guardar la orden: ${err}`);
    } finally {
      setConfirmando(false);
    }
  };

  if (orden.length === 0) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-in fade-in duration-300">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Finalizar Venta</h1>
            <p className="text-sm text-slate-500">Configura la propina y los métodos de pago</p>
          </div>
        </div>
        <div className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-lg shadow-md">
          Total: ${granTotal.toLocaleString('es-CO')}
        </div>
      </header>

      {/* CONTENIDO A DOS COLUMNAS */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* COLUMNA IZQUIERDA: Resumen y Propina */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
              <Receipt className="w-6 h-6 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Resumen de la Orden</h2>
            </div>
            
            <div className="max-h-60 overflow-y-auto pr-2 space-y-3 mb-4">
              {orden.map(item => (
                <div key={item.id} className="flex justify-between items-start text-sm">
                  <div>
                    <span className="font-bold text-slate-700">{item.cantidad}x {item.nombre}</span>
                    {item.extras.length > 0 && <span className="block text-xs text-blue-600 ml-4">+ Extras añadidos</span>}
                    {item.sin.length > 0 && <span className="block text-xs text-red-500 ml-4">Modificado</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="flex justify-between items-center mb-2 text-slate-600">
                <span className="text-sm font-medium">Subtotal (Productos)</span>
                <span className="font-semibold">${subtotal.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between items-center mb-3 text-indigo-600">
                <span className="text-sm font-medium">Propina</span>
                <span className="font-semibold">{propina > 0 ? '+' : ''}${propina.toLocaleString('es-CO')}</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-900 uppercase">Total a cobrar</span>
                <span className="text-3xl font-black text-slate-900">${granTotal.toLocaleString('es-CO')}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
              <HeartHandshake className="w-6 h-6 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Propina Voluntaria</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button onClick={() => setTipoPropina('ninguna')} className={`py-3 rounded-xl border-2 font-bold cursor-pointer transition-colors ${tipoPropina === 'ninguna' ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                Sin propina
              </button>
              <button onClick={() => setTipoPropina('10%')} className={`py-3 rounded-xl border-2 font-bold cursor-pointer transition-colors ${tipoPropina === '10%' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                Sugerida (10%)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={`relative flex items-center rounded-xl border-2 transition-colors overflow-hidden ${tipoPropina === 'otro_porcentaje' ? 'border-indigo-600 ring-2 ring-indigo-100 bg-indigo-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                <span className="absolute left-3 text-sm font-bold text-slate-400">%</span>
                <input type="number" placeholder="Otro %" className="w-full h-full pl-8 pr-3 py-3 font-bold bg-transparent outline-none text-slate-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" value={tipoPropina === 'otro_porcentaje' ? valorPropinaPersonalizada : ''} onChange={(e) => { setTipoPropina('otro_porcentaje'); setValorPropinaPersonalizada(e.target.value); }} />
              </div>
              <div className={`relative flex items-center rounded-xl border-2 transition-colors overflow-hidden ${tipoPropina === 'otro_fijo' ? 'border-indigo-600 ring-2 ring-indigo-100 bg-indigo-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                <span className="absolute left-3 text-sm font-bold text-slate-400">$</span>
                <input type="number" placeholder="Otro valor" className="w-full h-full pl-8 pr-3 py-3 font-bold bg-transparent outline-none text-slate-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" value={tipoPropina === 'otro_fijo' ? valorPropinaPersonalizada : ''} onChange={(e) => { setTipoPropina('otro_fijo'); setValorPropinaPersonalizada(e.target.value); }} />
              </div>
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA: Métodos de Pago */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
          <div className="flex justify-between items-end mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Métodos de Pago</h2>
              <p className="text-sm text-slate-500 mt-1">Haz clic en el ícono para autocompletar el saldo</p>
            </div>
          </div>

          <div className="space-y-5 flex-1">
            {/* Efectivo */}
            <div>
              <div className={`flex items-stretch rounded-xl border-2 transition-all overflow-hidden ${pagos.efectivo ? 'border-emerald-500 ring-4 ring-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-200'}`}>
                <button onClick={() => handleAutoCompletarFaltante('efectivo')} className={`flex flex-col items-center justify-center w-24 cursor-pointer transition-colors ${pagos.efectivo ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-500 hover:bg-emerald-100 hover:text-emerald-700'}`}>
                  <Banknote className="w-7 h-7 mb-1" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Efectivo</span>
                </button>
                <div className="relative flex-1 bg-white">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">$</span>
                  <input 
                    type="number" placeholder="0" 
                    value={pagos.efectivo} onChange={(e) => handlePagoChange('efectivo', e.target.value)}
                    className="w-full h-full pl-9 pr-4 py-4 text-2xl font-black text-slate-800 bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 ml-28">
                {sugerenciasEfectivo.map((monto, idx) => (
                  <button key={monto} onClick={() => handlePagoChange('efectivo', monto.toString())} className="px-3 py-1.5 bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 text-slate-600 text-xs font-bold rounded-lg shadow-sm transition-colors border border-slate-200 cursor-pointer">
                    {idx === 0 ? 'Exacto ' : ''}${monto.toLocaleString('es-CO')}
                  </button>
                ))}
              </div>
            </div>

            {/* Transferencia */}
            <div className={`flex items-stretch rounded-xl border-2 transition-all overflow-hidden h-20 ${pagos.transferencia ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-200'}`}>
              <button onClick={() => handleAutoCompletarFaltante('transferencia')} className={`flex flex-col items-center justify-center w-24 cursor-pointer transition-colors ${pagos.transferencia ? 'bg-indigo-500 text-white' : 'bg-slate-50 text-slate-500 hover:bg-indigo-100 hover:text-indigo-700'}`}>
                <Smartphone className="w-7 h-7 mb-1" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Transf.</span>
              </button>
              <div className="relative flex-1 bg-white">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">$</span>
                <input 
                  type="number" placeholder="0" 
                  value={pagos.transferencia} onChange={(e) => handlePagoChange('transferencia', e.target.value)}
                  className="w-full h-full pl-9 pr-4 py-4 text-2xl font-black text-slate-800 bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            {/* Tarjeta */}
            <div className={`flex items-stretch rounded-xl border-2 transition-all overflow-hidden h-20 ${pagos.tarjeta ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-200'}`}>
              <button onClick={() => handleAutoCompletarFaltante('tarjeta')} className={`flex flex-col items-center justify-center w-24 cursor-pointer transition-colors ${pagos.tarjeta ? 'bg-indigo-500 text-white' : 'bg-slate-50 text-slate-500 hover:bg-indigo-100 hover:text-indigo-700'}`}>
                <CreditCard className="w-7 h-7 mb-1" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Tarjeta</span>
              </button>
              <div className="relative flex-1 bg-white">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">$</span>
                <input 
                  type="number" placeholder="0" 
                  value={pagos.tarjeta} onChange={(e) => handlePagoChange('tarjeta', e.target.value)}
                  className="w-full h-full pl-9 pr-4 py-4 text-2xl font-black text-slate-800 bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            {/* PANEL DE ESTADO */}
            <div className={`mb-4 p-5 rounded-xl border-2 flex justify-between items-center shadow-sm ${
              !pagoCompletado ? 'bg-amber-50 border-amber-200 text-amber-800' :
              devuelta > 0 ? 'bg-emerald-50 border-emerald-300 text-emerald-800' :
              'bg-blue-50 border-blue-300 text-blue-800'
            }`}>
              <span className="text-sm uppercase tracking-wider font-bold">
                {!pagoCompletado ? 'Falta por cobrar' : devuelta > 0 ? 'Devuelta al cliente' : 'Pago exacto'}
              </span>
              <span className="text-3xl font-black">
                ${(!pagoCompletado ? saldoPendiente : devuelta).toLocaleString('es-CO')}
              </span>
            </div>

            {/* BOTÓN CONFIRMAR */}
            <button 
              onClick={handleProcesarPago}
              disabled={confirmando || !pagoCompletado}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-xl hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0 focus:ring-4 focus:ring-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3 cursor-pointer text-xl"
            >
              {confirmando ? (
                <><Loader2 className="w-6 h-6 animate-spin" /> Procesando pago...</>
              ) : (
                `Confirmar Venta`
              )}
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}

export default PasarelaPago;