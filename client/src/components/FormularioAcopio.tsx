import { useState } from 'react'
import { Plus, Save, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { api } from '../api/client'
import { useApi, fmtBs, fmtKg } from '../api/useApi'

const KG_POR_LATA = 14

/**
 * Registro de una entrega de acopio.
 *
 * Las latas y el total a pagar se muestran calculados en vivo, pero NO se
 * envian: son columnas generadas en Postgres. Si el navegador los mandara, un
 * error de redondeo aqui quedaria guardado como si fuera el dato real.
 */
export default function FormularioAcopio({ onRegistrado }: { onRegistrado: () => void }) {
  const [abierto, setAbierto] = useState(false)
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [codigo, setCodigo] = useState('')
  const [kg, setKg] = useState('')
  const [precio, setPrecio] = useState('')
  const [lote, setLote] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  const { datos: lotes } = useApi(() => api.lotes(), [])

  const nKg = Number(kg)
  const nPrecio = Number(precio)
  const latas = nKg > 0 ? nKg / KG_POR_LATA : 0
  const total = latas * (nPrecio > 0 ? nPrecio : 0)

  const limpiar = () => {
    setCodigo(''); setKg(''); setPrecio(''); setLote(''); setObservaciones('')
  }

  const guardar = async () => {
    if (!codigo.trim()) { setMsg({ tipo: 'error', texto: 'Falta el código de productor' }); return }
    if (!(nKg > 0)) { setMsg({ tipo: 'error', texto: 'El peso debe ser mayor que 0' }); return }
    if (!(nPrecio > 0)) { setMsg({ tipo: 'error', texto: 'Falta el precio por lata' }); return }

    setGuardando(true); setMsg(null)
    try {
      const r = await api.crearEntrega({
        fecha,
        codigo_productor: codigo.trim().toUpperCase(),
        kg_guinda_real: nKg,
        precio_unitario_bs: nPrecio,
        lote: lote || undefined,
        observaciones: observaciones || undefined,
      })
      setMsg({
        tipo: 'ok',
        texto: r.revision === 'ok'
          ? `Registrado: ${fmtKg(r.kg_guinda_real)} kg de ${r.productor}, ${fmtBs(r.total_pagado_bs)} Bs`
          : `Registrado pero OBSERVADO: ${r.revision_nota ?? 'revisar'}`,
      })
      limpiar()
      onRegistrado()
    } catch (e) {
      setMsg({ tipo: 'error', texto: e instanceof Error ? e.message : 'No se pudo registrar' })
    } finally { setGuardando(false) }
  }

  const campo = `w-full px-3 py-2 border border-gray-300 rounded text-sm
                 focus:outline-none focus:ring-2 focus:ring-sky-500`
  const etiqueta = 'block text-xs font-semibold text-gray-600 uppercase mb-1'

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <button onClick={() => setAbierto(!abierto)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition">
        <span className="flex items-center gap-2 font-semibold text-gray-900">
          <Plus size={18} className="text-coffee-700" /> Registrar entrega de acopio
        </span>
        {abierto ? <ChevronUp size={18} className="text-gray-400" />
                 : <ChevronDown size={18} className="text-gray-400" />}
      </button>

      {abierto && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={etiqueta}>Fecha <span className="text-red-600">*</span></label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
                className={campo} />
            </div>
            <div>
              <label className={etiqueta}>
                Código de productor <span className="text-red-600">*</span>
              </label>
              <input value={codigo} onChange={(e) => setCodigo(e.target.value)}
                placeholder="CBH-022" className={`${campo} font-mono uppercase`} />
              <p className="text-[11px] text-gray-400 mt-0.5">
                El nombre y la comunidad salen del padrón
              </p>
            </div>
            <div>
              <label className={etiqueta}>
                Peso neto <span className="text-red-600">*</span>
                <span className="ml-1 text-gray-400 normal-case">(kg de guinda)</span>
              </label>
              <input type="number" value={kg} onChange={(e) => setKg(e.target.value)}
                min="0" step="any" className={campo} />
            </div>
            <div>
              <label className={etiqueta}>
                Precio por lata <span className="text-red-600">*</span>
                <span className="ml-1 text-gray-400 normal-case">(Bs)</span>
              </label>
              <input type="number" value={precio} onChange={(e) => setPrecio(e.target.value)}
                min="0" step="any" className={campo} />
            </div>
            <div>
              <label className={etiqueta}>Lote</label>
              <select value={lote} onChange={(e) => setLote(e.target.value)}
                className={`${campo} bg-white`}>
                <option value="">Sin asignar todavía</option>
                {lotes?.map((l) => (
                  <option key={l.codigo} value={l.codigo}>{l.codigo} — {l.certificacion}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className={etiqueta}>Observaciones</label>
              <input value={observaciones} onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Grano de buena calidad, sin plagas" className={campo} />
            </div>
          </div>

          {/* Calculado en vivo para que el operador lo verifique antes de guardar. */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 rounded p-4">
            <div>
              <p className="text-xs text-gray-500 uppercase">Latas equivalentes</p>
              <p className="text-lg font-bold text-gray-900">
                {latas > 0 ? latas.toFixed(4) : '--'}
              </p>
              <p className="text-[11px] text-gray-400">peso ÷ 14</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Total a pagar</p>
              <p className="text-lg font-bold text-gray-900">
                {total > 0 ? `${fmtBs(total)} Bs` : '--'}
              </p>
              <p className="text-[11px] text-gray-400">latas × precio</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-500 uppercase">Certificación</p>
              <p className="text-sm text-gray-700 mt-1">
                Se toma del padrón según la parcela del código.
              </p>
              <p className="text-[11px] text-gray-400">
                No se elige a mano: así no se puede declarar orgánico un café de transición.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button onClick={guardar} disabled={guardando}
              className="flex items-center gap-2 px-4 py-2 bg-coffee-700 text-white rounded
                         text-sm font-medium hover:bg-coffee-800 disabled:bg-gray-300 transition">
              <Save size={16} /> {guardando ? 'Guardando...' : 'Registrar entrega'}
            </button>
            {msg && (
              <span className={`flex items-start gap-1.5 text-sm ${
                msg.tipo === 'ok' ? 'text-green-700' : 'text-red-700'}`}>
                {msg.tipo === 'ok' ? <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                                   : <AlertTriangle size={15} className="mt-0.5 shrink-0" />}
                {msg.texto}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
