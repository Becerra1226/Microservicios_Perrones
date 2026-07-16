import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Loader2,
  ArrowLeft,
  CreditCard,
  Banknote,
  Smartphone,
  HeartHandshake,
  Receipt,
  Users,
  X,
} from "lucide-react";
import { crearOrden } from "../api/ordenesApi";
import { crearFactura } from "../api/facturacionApi"; // NUEVA IMPORTACIÓN

function PasarelaPago() {
  const location = useLocation();
  const navigate = useNavigate();

  const orden =
    location.state?.orden ||
    JSON.parse(sessionStorage.getItem("orden_en_curso") || "[]");
  const subtotal =
    location.state?.subtotal ||
    Number(sessionStorage.getItem("subtotal_en_curso") || 0);

  useEffect(() => {
    if (orden.length === 0) {
      navigate("/");
    } else {
      sessionStorage.setItem("orden_en_curso", JSON.stringify(orden));
      sessionStorage.setItem("subtotal_en_curso", subtotal.toString());
    }
  }, [orden, subtotal, navigate]);

  const [confirmando, setConfirmando] = useState(false);
  const [tipoPropina, setTipoPropina] = useState("ninguna");
  const [valorPropinaPersonalizada, setValorPropinaPersonalizada] =
    useState("");

  const calcularPropina = () => {
    if (tipoPropina === "ninguna") return 0;
    if (tipoPropina === "10%") return subtotal * 0.1;
    const valorCustom = Number(valorPropinaPersonalizada) || 0;
    if (tipoPropina === "otro_porcentaje")
      return subtotal * (valorCustom / 100);
    if (tipoPropina === "otro_fijo") return valorCustom;
    return 0;
  };

  const propina = calcularPropina();
  const granTotal = subtotal + propina;
  const factorPropina = subtotal > 0 ? propina / subtotal : 0; // Calculamos la proporción de la propina

  const [pagos, setPagos] = useState({
    efectivo: "",
    tarjeta: "",
    transferencia: "",
  });

  const totalPagado =
    (Number(pagos.efectivo) || 0) +
    (Number(pagos.tarjeta) || 0) +
    (Number(pagos.transferencia) || 0);

  const saldoPendiente = granTotal - totalPagado;
  const pagoCompletado = totalPagado >= granTotal;
  const devuelta = pagoCompletado ? totalPagado - granTotal : 0;

  const handlePagoChange = (metodo, valor) => {
    setPagos((prev) => ({ ...prev, [metodo]: valor }));
  };

  const handleAutoCompletarFaltante = (metodo) => {
    if (Number(pagos[metodo]) > 0) {
      setPagos((prev) => ({ ...prev, [metodo]: "" }));
    } else {
      if (saldoPendiente > 0) {
        setPagos((prev) => ({ ...prev, [metodo]: saldoPendiente.toString() }));
      }
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

    return Array.from(opciones)
      .sort((a, b) => a - b)
      .slice(0, 4);
  };

  const sugerenciasEfectivo = generarSugerenciasEfectivo(granTotal);

  // === LÓGICA AVANZADA DEL ASISTENTE DE CUENTAS SEPARADAS ===
  const [mostrarMultiPago, setMostrarMultiPago] = useState(false);
  const [pagadores, setPagadores] = useState([]);
  const [itemsMesa, setItemsMesa] = useState([]);

  const handleAbrirCalculadora = () => {
    let contador = 0;
    const itemsIndividuales = [];
    let totalPreciosCalculados = 0;

    orden.forEach((item) => {
      for (let i = 0; i < item.cantidad; i++) {
        const extrasPrice =
          item.extras?.reduce(
            (sum, ext) => sum + (Number(ext.precio) || 0),
            0,
          ) || 0;
        const unitPrice = (Number(item.precio) || 0) + extrasPrice;

        itemsIndividuales.push({
          _uid: `prod_${contador++}`,
          nombre: item.nombre,
          precioOriginal: unitPrice,
          asignadoA: null,
        });
        totalPreciosCalculados += unitPrice;
      }
    });

    if (
      totalPreciosCalculados === 0 &&
      subtotal > 0 &&
      itemsIndividuales.length > 0
    ) {
      const precioPromedio = subtotal / itemsIndividuales.length;
      itemsIndividuales.forEach(
        (item) => (item.precioSugerido = precioPromedio),
      );
    } else if (
      totalPreciosCalculados > 0 &&
      totalPreciosCalculados !== subtotal
    ) {
      const factor = subtotal / totalPreciosCalculados;
      itemsIndividuales.forEach(
        (item) => (item.precioSugerido = item.precioOriginal * factor),
      );
    } else {
      itemsIndividuales.forEach(
        (item) => (item.precioSugerido = item.precioOriginal),
      );
    }

    setItemsMesa(itemsIndividuales);
    setPagadores([
      { id: 1, aPagar: "", entregado: "", metodo: "efectivo" },
      { id: 2, aPagar: "", entregado: "", metodo: "efectivo" },
    ]);
    setMostrarMultiPago(true);
  };

  const asignarItemACliente = (uid, nuevoClienteId) => {
    setItemsMesa((prevItems) => {
      const itemAMover = prevItems.find((i) => i._uid === uid);
      const viejoClienteId = itemAMover.asignadoA;

      const nuevosItems = prevItems.map((item) =>
        item._uid === uid ? { ...item, asignadoA: nuevoClienteId } : item,
      );

      setPagadores((prevPagadores) =>
        prevPagadores.map((p) => {
          if (p.id === nuevoClienteId || p.id === viejoClienteId) {
            const itemsDelCliente = nuevosItems.filter(
              (i) => i.asignadoA === p.id,
            );
            if (itemsDelCliente.length === 0 && p.id === viejoClienteId)
              return { ...p, aPagar: "" };

            const subtotalCliente = itemsDelCliente.reduce(
              (sum, item) => sum + item.precioSugerido,
              0,
            );
            const totalConPropina =
              subtotalCliente + subtotalCliente * factorPropina;
            return { ...p, aPagar: Math.round(totalConPropina).toString() };
          }
          return p;
        }),
      );

      return nuevosItems;
    });
  };

  const repartirRestoEnPartesIguales = () => {
    const porcion = Math.round(granTotal / pagadores.length);
    setPagadores((prev) =>
      prev.map((p) => ({ ...p, aPagar: porcion.toString() })),
    );
  };

  const actualizarPagador = (id, campo, valor) => {
    setPagadores((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [campo]: valor } : p)),
    );
  };

  const agregarPagador = () => {
    setPagadores([
      ...pagadores,
      { id: Date.now(), aPagar: "", entregado: "", metodo: "efectivo" },
    ]);
  };

  const removerPagador = (id) => {
    setPagadores(pagadores.filter((p) => p.id !== id));
    setItemsMesa((prev) =>
      prev.map((item) =>
        item.asignadoA === id ? { ...item, asignadoA: null } : item,
      ),
    );
  };

  const totalAsignadoMulti = pagadores.reduce(
    (sum, p) => sum + (Number(p.aPagar) || 0),
    0,
  );
  const faltaPorAsignarMulti = granTotal - totalAsignadoMulti;

  const confirmarMultiPago = () => {
    const totalEfectivo = pagadores
      .filter((p) => p.metodo === "efectivo")
      .reduce(
        (sum, p) =>
          sum + (p.entregado ? Number(p.entregado) : Number(p.aPagar)),
        0,
      );
    const totalTransf = pagadores
      .filter((p) => p.metodo === "transferencia")
      .reduce((sum, p) => sum + (Number(p.aPagar) || 0), 0);
    const totalTarjeta = pagadores
      .filter((p) => p.metodo === "tarjeta")
      .reduce((sum, p) => sum + (Number(p.aPagar) || 0), 0);

    setPagos({
      efectivo: totalEfectivo > 0 ? totalEfectivo.toString() : "",
      transferencia: totalTransf > 0 ? totalTransf.toString() : "",
      tarjeta: totalTarjeta > 0 ? totalTarjeta.toString() : "",
    });
    setMostrarMultiPago(false);
  };

  // === IMPLEMENTACIÓN DE LA NUEVA LÓGICA DE FACTURACIÓN Y ORDENES ===
  const handleProcesarPago = async () => {
    if (!pagoCompletado || confirmando) return;
    setConfirmando(true);

    try {
      // 1. Construir el payload de la orden (sin cambios)
      const productosPayload = [];
      orden.forEach((item) => {
        productosPayload.push({
          producto_id: item.id,
          cantidad: item.cantidad,
        });
        const extrasAgrupados = {};
        item.extras.forEach((ext) => {
          extrasAgrupados[ext.id] = (extrasAgrupados[ext.id] || 0) + 1;
        });
        Object.entries(extrasAgrupados).forEach(([extId, qty]) => {
          productosPayload.push({
            producto_id: extId,
            cantidad: item.cantidad * qty,
          });
        });
      });

      const payloadOrden = { productos: productosPayload };

      // 2. Crear la orden en MS de Órdenes
      const resultadoOrden = await crearOrden(payloadOrden);
      const ordenId = resultadoOrden.orden_id || resultadoOrden.id;

      if (!ordenId) {
        throw new Error("No se obtuvo el ID de la orden creada");
      }

      // 3. Formatear los pagos para MS de Facturación
      const pagosFormateados = [];
      if (Number(pagos.efectivo) > 0) {
        pagosFormateados.push({
          metodo_pago: "EFECTIVO",
          valor: Number(pagos.efectivo) - devuelta,
        });
      }
      if (Number(pagos.tarjeta) > 0) {
        pagosFormateados.push({
          metodo_pago: "TARJETA",
          valor: Number(pagos.tarjeta),
        });
      }
      if (Number(pagos.transferencia) > 0) {
        pagosFormateados.push({
          metodo_pago: "TRANSFERENCIA",
          valor: Number(pagos.transferencia),
        });
      }

      // 4. Crear el payload de la factura
      const payloadFactura = {
        orden_id: ordenId,
        propina: propina,
        pagos: pagosFormateados,
      };

      // 5. Generar Idempotency Key y llamar al MS de Facturación
      const idempotencyKey = crypto.randomUUID();
      const resultadoFactura = await crearFactura(
        payloadFactura,
        idempotencyKey,
      );

      // 6. Preparar mensaje de éxito y finalizar
      let mensajeExito = `¡Venta completada con éxito!\nOrden ID: ${ordenId}\nFactura Código: ${resultadoFactura.codigo}`;

      if (devuelta > 0 && Number(pagos.efectivo) > 0) {
        mensajeExito += `\n\nEntregar devuelta total en efectivo: $${devuelta.toLocaleString("es-CO")}`;
      }

      alert(mensajeExito);

      sessionStorage.removeItem("orden_en_curso");
      sessionStorage.removeItem("subtotal_en_curso");
      navigate("/");
    } catch (err) {
      alert(`Error al procesar la venta: ${err}`);
    } finally {
      setConfirmando(false);
    }
  };

  if (orden.length === 0) return null;

  return (
    <div className="h-full max-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col animate-in fade-in duration-300 overflow-hidden relative">
      {/* MODAL ASISTENTE DE PAGOS MÚLTIPLES */}
      {mostrarMultiPago && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
            {/* HEADER MODAL */}
            <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Cuentas Separadas
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Selecciona debajo de cada cliente los productos que va a pagar
                </p>
              </div>
              <button
                onClick={() => setMostrarMultiPago(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4">
              <div className="flex justify-between items-center p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl text-indigo-900 shadow-sm">
                <div>
                  <span className="font-semibold block">Total a cobrar:</span>
                  <button
                    onClick={repartirRestoEnPartesIguales}
                    className="text-[10px] text-indigo-600 underline font-bold hover:text-indigo-800 cursor-pointer"
                  >
                    O dividir en partes iguales
                  </button>
                </div>
                <span className="text-2xl font-black">
                  ${granTotal.toLocaleString("es-CO")}
                </span>
              </div>

              {/* LISTA DE CLIENTES */}
              <div className="space-y-4">
                {pagadores.map((p, index) => {
                  const itemsAsignados = itemsMesa.filter(
                    (i) => i.asignadoA === p.id,
                  );
                  const subtotalCliente = itemsAsignados.reduce(
                    (sum, item) => sum + item.precioSugerido,
                    0,
                  );
                  const propinaCliente = subtotalCliente * factorPropina;

                  return (
                    <div
                      key={p.id}
                      className="p-4 border-2 border-slate-200 bg-white rounded-xl flex flex-col gap-3 relative shadow-sm"
                    >
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-lg">
                            Cliente {index + 1}
                          </span>
                          {itemsAsignados.length > 0 && (
                            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                              {itemsAsignados.length} items seleccionados
                            </span>
                          )}
                        </div>
                        {pagadores.length > 2 && (
                          <button
                            onClick={() => removerPagador(p.id)}
                            className="text-red-500 hover:bg-red-50 text-xs font-bold px-2 py-1 rounded transition-colors cursor-pointer"
                          >
                            Quitar Cliente
                          </button>
                        )}
                      </div>

                      {/* NUEVA ZONA DE SELECCIÓN DE PRODUCTOS */}
                      <div className="pb-3 border-b border-dashed border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-500 mb-2 block">
                          ¿Qué consumió?
                        </span>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {itemsMesa.map((item) => {
                            const isMine = item.asignadoA === p.id;
                            const isTaken =
                              item.asignadoA !== null &&
                              item.asignadoA !== p.id;

                            return (
                              <button
                                key={item._uid}
                                disabled={isTaken}
                                onClick={() =>
                                  asignarItemACliente(
                                    item._uid,
                                    isMine ? null : p.id,
                                  )
                                }
                                className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all text-left flex flex-col gap-0.5 ${
                                  isMine
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-[1.02]"
                                    : isTaken
                                      ? "bg-slate-50 text-slate-400 border-slate-200 opacity-60 cursor-not-allowed"
                                      : "bg-white text-slate-600 border-slate-300 hover:border-indigo-400 hover:text-indigo-600 cursor-pointer shadow-sm hover:shadow"
                                }`}
                              >
                                <span>{item.nombre}</span>
                                <span
                                  className={`text-[10px] ${isMine ? "text-indigo-200" : isTaken ? "text-slate-400" : "text-slate-500"}`}
                                >
                                  ${item.precioSugerido.toLocaleString("es-CO")}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* DESGLOSE DE PROPINA Y SUBTOTAL */}
                        {itemsAsignados.length > 0 && propina > 0 && (
                          <div className="flex gap-4 mt-2 px-3 py-1.5 bg-indigo-50/50 rounded-md border border-indigo-100 text-[10px] uppercase font-bold text-slate-500 w-fit">
                            <div>
                              Subtotal:{" "}
                              <span className="text-slate-700">
                                $
                                {Math.round(subtotalCliente).toLocaleString(
                                  "es-CO",
                                )}
                              </span>
                            </div>
                            <div>
                              Propina:{" "}
                              <span className="text-indigo-600">
                                +$
                                {Math.round(propinaCliente).toLocaleString(
                                  "es-CO",
                                )}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-500 flex justify-between items-center mb-1">
                            Paga en total
                            {faltaPorAsignarMulti !== 0 && (
                              <button
                                onClick={() =>
                                  actualizarPagador(
                                    p.id,
                                    "aPagar",
                                    (
                                      (Number(p.aPagar) || 0) +
                                      faltaPorAsignarMulti
                                    ).toString(),
                                  )
                                }
                                className="text-indigo-500 hover:text-indigo-700 underline capitalize cursor-pointer"
                              >
                                + sumar resto
                              </button>
                            )}
                          </label>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                              $
                            </span>
                            <input
                              type="number"
                              placeholder="0"
                              value={p.aPagar}
                              onChange={(e) =>
                                actualizarPagador(
                                  p.id,
                                  "aPagar",
                                  e.target.value,
                                )
                              }
                              className="w-full pl-6 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                            Método
                          </label>
                          <select
                            value={p.metodo}
                            onChange={(e) =>
                              actualizarPagador(p.id, "metodo", e.target.value)
                            }
                            className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                          >
                            <option value="efectivo">Efectivo</option>
                            <option value="transferencia">Transferencia</option>
                            <option value="tarjeta">Tarjeta</option>
                          </select>
                        </div>
                        {p.metodo === "efectivo" && (
                          <div className="col-span-2 md:col-span-1">
                            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                              Billete que entrega
                            </label>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                                $
                              </span>
                              <input
                                type="number"
                                placeholder="Monto exacto"
                                value={p.entregado}
                                onChange={(e) =>
                                  actualizarPagador(
                                    p.id,
                                    "entregado",
                                    e.target.value,
                                  )
                                }
                                className="w-full pl-6 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* VUELTAS INDIVIDUALES */}
                      {p.metodo === "efectivo" &&
                        Number(p.entregado) > 0 &&
                        Number(p.aPagar) > 0 && (
                          <div className="mt-1 pt-3 border-t border-slate-100 flex justify-between items-center text-sm bg-emerald-50/50 -mx-4 -mb-4 p-4 rounded-b-xl">
                            <span className="text-emerald-800 font-bold text-xs uppercase flex items-center gap-1.5">
                              <Banknote className="w-4 h-4" /> Darle de
                              devuelta:
                            </span>
                            <span
                              className={`font-black text-xl ${Number(p.entregado) - Number(p.aPagar) < 0 ? "text-red-500" : "text-emerald-600"}`}
                            >
                              $
                              {(
                                Number(p.entregado) - Number(p.aPagar)
                              ).toLocaleString("es-CO")}
                            </span>
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={agregarPagador}
                className="w-full py-3 border-2 border-dashed border-slate-300 text-slate-500 font-bold rounded-xl hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer mt-2"
              >
                + Agregar otro cliente a la cuenta
              </button>
            </div>

            <div className="p-4 border-t border-slate-200 bg-white shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <div className="flex justify-between items-center mb-3 text-sm">
                <span className="font-semibold text-slate-600">
                  Saldo pendiente por asignar:
                </span>
                <span
                  className={`font-black text-lg ${faltaPorAsignarMulti > 0 ? "text-amber-600" : faltaPorAsignarMulti < 0 ? "text-red-600" : "text-emerald-600"}`}
                >
                  ${faltaPorAsignarMulti.toLocaleString("es-CO")}
                </span>
              </div>
              <button
                disabled={Math.abs(faltaPorAsignarMulti) > 50}
                onClick={confirmarMultiPago}
                className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold shadow-md hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all text-lg cursor-pointer"
              >
                {Math.abs(faltaPorAsignarMulti) > 50
                  ? "Asigna el total de la orden para continuar"
                  : "Autocompletar Pagos"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* FIN MODAL */}

      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">
              Finalizar Venta
            </h1>
          </div>
        </div>
        <div className="bg-slate-900 text-white px-4 py-1.5 rounded-lg font-bold text-md shadow-sm">
          Total: ${granTotal.toLocaleString("es-CO")}
        </div>
      </div>

      <main className="flex-1 min-h-0 w-full max-w-7xl mx-auto p-4 md:p-5 grid grid-cols-1 lg:grid-cols-2 gap-5 overflow-hidden">
        {/* COLUMNA IZQUIERDA */}
        <div className="flex flex-col gap-4 min-h-0">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col flex-1 min-h-0">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 shrink-0">
              <Receipt className="w-5 h-5 text-indigo-600" />
              <h2 className="text-md font-bold text-slate-900">
                Resumen de la Orden
              </h2>
            </div>

            <div className="overflow-y-auto pr-2 flex-1 min-h-[80px] space-y-2 mb-3">
              {orden.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-start text-sm"
                >
                  <div>
                    <span className="font-bold text-slate-700">
                      {item.cantidad}x {item.nombre}
                    </span>
                    {item.extras.length > 0 && (
                      <span className="block text-xs text-blue-600 ml-4">
                        + Extras
                      </span>
                    )}
                    {item.sin.length > 0 && (
                      <span className="block text-xs text-red-500 ml-4">
                        Modificado
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 shrink-0">
              <div className="flex justify-between items-center mb-1 text-slate-600">
                <span className="text-xs font-medium">
                  Subtotal (Productos)
                </span>
                <span className="text-sm font-semibold">
                  ${subtotal.toLocaleString("es-CO")}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2 text-indigo-600">
                <span className="text-xs font-medium">Propina</span>
                <span className="text-sm font-semibold">
                  {propina > 0 ? "+" : ""}${propina.toLocaleString("es-CO")}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-900 uppercase">
                  Total a cobrar
                </span>
                <span className="text-xl font-black text-slate-900">
                  ${granTotal.toLocaleString("es-CO")}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 shrink-0">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <HeartHandshake className="w-5 h-5 text-indigo-600" />
              <h2 className="text-md font-bold text-slate-900">
                Propina Voluntaria
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                onClick={() => setTipoPropina("ninguna")}
                className={`py-2 rounded-lg border-2 text-sm font-bold transition-colors cursor-pointer ${tipoPropina === "ninguna" ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200"}`}
              >
                Sin propina
              </button>
              <button
                onClick={() => setTipoPropina("10%")}
                className={`py-2 rounded-lg border-2 text-sm font-bold transition-colors cursor-pointer ${tipoPropina === "10%" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200"}`}
              >
                Sugerida (10%)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div
                className={`relative flex items-center rounded-lg border-2 transition-colors ${tipoPropina === "otro_porcentaje" ? "border-indigo-600 bg-indigo-50" : "border-slate-200 bg-white"}`}
              >
                <span className="absolute left-2 text-xs font-bold text-slate-400">
                  %
                </span>
                <input
                  type="number"
                  placeholder="Otro %"
                  className="w-full pl-6 pr-2 py-1.5 text-sm font-bold bg-transparent outline-none text-slate-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={
                    tipoPropina === "otro_porcentaje"
                      ? valorPropinaPersonalizada
                      : ""
                  }
                  onChange={(e) => {
                    setTipoPropina("otro_porcentaje");
                    setValorPropinaPersonalizada(e.target.value);
                  }}
                />
              </div>
              <div
                className={`relative flex items-center rounded-lg border-2 transition-colors ${tipoPropina === "otro_fijo" ? "border-indigo-600 bg-indigo-50" : "border-slate-200 bg-white"}`}
              >
                <span className="absolute left-2 text-xs font-bold text-slate-400">
                  $
                </span>
                <input
                  type="number"
                  placeholder="Otro valor"
                  className="w-full pl-6 pr-2 py-1.5 text-sm font-bold bg-transparent outline-none text-slate-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={
                    tipoPropina === "otro_fijo" ? valorPropinaPersonalizada : ""
                  }
                  onChange={(e) => {
                    setTipoPropina("otro_fijo");
                    setValorPropinaPersonalizada(e.target.value);
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 shrink-0">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Métodos de Pago
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Haz clic en el ícono para autocompletar o borrar
              </p>
            </div>
            {/* BOTÓN MAGICO DE CUENTAS SEPARADAS */}
            <button
              onClick={handleAbrirCalculadora}
              className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-lg hover:bg-indigo-100 hover:border-indigo-300 transition-all shadow-sm cursor-pointer"
            >
              <Users className="w-4 h-4" />
              Cuentas Separadas
            </button>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto pr-1">
            {/* Efectivo y Sugerencias */}
            <div>
              <div
                className={`flex items-stretch rounded-lg border-2 transition-all h-[60px] overflow-hidden ${pagos.efectivo ? "border-emerald-500 ring-2 ring-emerald-50" : "border-slate-200 bg-white"}`}
              >
                <button
                  onClick={() => handleAutoCompletarFaltante("efectivo")}
                  className={`flex flex-col items-center justify-center w-20 cursor-pointer transition-colors ${pagos.efectivo ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-500 hover:bg-emerald-100"}`}
                >
                  <Banknote className="w-5 h-5 mb-0.5" />
                  <span className="text-[10px] font-bold uppercase">
                    Efectivo
                  </span>
                </button>
                <div className="relative flex-1 bg-white">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                    $
                  </span>
                  <input
                    type="number"
                    placeholder="0"
                    value={pagos.efectivo}
                    onChange={(e) =>
                      handlePagoChange("efectivo", e.target.value)
                    }
                    className="w-full h-full pl-7 pr-3 text-xl font-black text-slate-800 bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {sugerenciasEfectivo.length > 0 && (
                <div className="flex w-full gap-2 mt-2">
                  {sugerenciasEfectivo.map((monto) => (
                    <button
                      key={monto}
                      onClick={() =>
                        handlePagoChange("efectivo", monto.toString())
                      }
                      className="flex-1 py-2.5 bg-white hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700 text-slate-600 text-sm font-bold rounded-lg shadow-sm transition-colors border-2 border-slate-200 cursor-pointer"
                    >
                      ${monto.toLocaleString("es-CO")}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Transferencia */}
            <div
              className={`flex items-stretch rounded-lg border-2 transition-all h-[60px] overflow-hidden ${pagos.transferencia ? "border-indigo-500 ring-2 ring-indigo-50" : "border-slate-200 bg-white"}`}
            >
              <button
                onClick={() => handleAutoCompletarFaltante("transferencia")}
                className={`flex flex-col items-center justify-center w-20 cursor-pointer transition-colors ${pagos.transferencia ? "bg-indigo-500 text-white" : "bg-slate-50 text-slate-500 hover:bg-indigo-100"}`}
              >
                <Smartphone className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-bold uppercase">Transf.</span>
              </button>
              <div className="relative flex-1 bg-white">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                  $
                </span>
                <input
                  type="number"
                  placeholder="0"
                  value={pagos.transferencia}
                  onChange={(e) =>
                    handlePagoChange("transferencia", e.target.value)
                  }
                  className="w-full h-full pl-7 pr-3 text-xl font-black text-slate-800 bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            {/* Tarjeta */}
            <div
              className={`flex items-stretch rounded-lg border-2 transition-all h-[60px] overflow-hidden ${pagos.tarjeta ? "border-indigo-500 ring-2 ring-indigo-50" : "border-slate-200 bg-white"}`}
            >
              <button
                onClick={() => handleAutoCompletarFaltante("tarjeta")}
                className={`flex flex-col items-center justify-center w-20 cursor-pointer transition-colors ${pagos.tarjeta ? "bg-indigo-500 text-white" : "bg-slate-50 text-slate-500 hover:bg-indigo-100"}`}
              >
                <CreditCard className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-bold uppercase">Tarjeta</span>
              </button>
              <div className="relative flex-1 bg-white">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                  $
                </span>
                <input
                  type="number"
                  placeholder="0"
                  value={pagos.tarjeta}
                  onChange={(e) => handlePagoChange("tarjeta", e.target.value)}
                  className="w-full h-full pl-7 pr-3 text-xl font-black text-slate-800 bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-3 shrink-0">
            <div
              className={`mb-3 p-3 rounded-lg border-2 flex justify-between items-center ${
                !pagoCompletado
                  ? "bg-amber-50 border-amber-200 text-amber-800"
                  : devuelta > 0
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                    : "bg-blue-50 border-blue-300 text-blue-800"
              }`}
            >
              <span className="text-xs uppercase font-bold">
                {!pagoCompletado
                  ? "Falta cobrar"
                  : devuelta > 0
                    ? "Devuelta"
                    : "Pago exacto"}
              </span>
              <span className="text-xl font-black">
                $
                {(!pagoCompletado ? saldoPendiente : devuelta).toLocaleString(
                  "es-CO",
                )}
              </span>
            </div>

            <button
              onClick={handleProcesarPago}
              disabled={confirmando || !pagoCompletado}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold shadow-md hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all flex justify-center items-center gap-2 cursor-pointer text-lg"
            >
              {confirmando ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Procesando...
                </>
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
