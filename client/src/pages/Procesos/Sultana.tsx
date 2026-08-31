import { useState } from 'react'
import { Save, AlertTriangle, CheckCircle2, Info, Recycle } from 'lucide-react'
import { api, type DestinoSultana } from '../../api/client'
import { useApi, fmtKg, fmtBs, fmtFecha } from '../../api/useApi'

/**
 * Sultana: la pulpa que sale del despulpado.
 *
 * Tiene pantalla propia y no un bloque dentro de despulpado porque es el unico
 * punto de la Fase II donde el balance de masa se rompe: el 31% de la guinda
 * sale como pulpa y hoy nadie anota a donde va.
 */

const DESTINOS: { valor: DestinoSultana; label: string; nota: string }[] = [
  { valor: 'combustible', label: 'Combustible para hornos', nota: 'Se quema en el secado' },
  { valor: 'venta', label: 'Venta', nota: 'Sale de la planta con comprobante' },
  { valor: 'compost', label: 'Compost / abono', nota: 'Vuelve a las parcelas' },
  { valor: 'entrega_familias', label: 'Entrega a familias socias',
    nota: 'Se reparte a los socios para sus propias parcelas' },
]

export default function Sultana() {
  const [loteId, setLoteId] = useState('')
  const [destino, setDestino] = useState<DestinoSultana | ''>('')
  const [sacos, setSacos] = useState('')
  const [fecha, setFecha] = useState('')
  const [responsable, setResponsable] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  const { datos: resumen, recargar: recargarLotes } = useApi(() => api.sultanaLotes(), [])
  const { datos: registros, recargar } = useApi(() => api.sultana(), [])

  const lotes = resumen?.lotes ?? []
  const factor = resumen?.factor ?? 0.31
  const precios = resumen?.precios
  const lote = lotes.find((l) => l.codigo === loteId)

  // Solo lectura: sale del lote, no del formulario. Asi no se puede declarar
  // menos pulpa de la que realmente salio de la despulpadora.
  const kgSultana = lote ? lote.kg_sin_registrar > 0
    ? lote.kg_sin_registrar
    : lote.kg_sultana_esperada : null
  const valor = kgSultana != null && destino && precios
    ? kgSultana * (precios[destino] ?? 0) : null

  // La tolerancia la fija la base (1 % por defecto): anotar jornada por jornada
  // deja un resto de redondeo que no es pulpa perdida.
  const sinRegistrar = lotes.filter((l) => l.kg_sin_registrar > l.tolerancia_kg)
  const kgPendientes = sinRegistrar.reduce((a, l) => a + Number(l.kg_sin_registrar), 0)

  const guardar = async () => {
    if (!loteId) { setMsg({ tipo: 'error', texto: 'Elige el lote de origen' }); return }
    if (!destino) { setMsg({ tipo: 'error', texto: 'Elige el destino de la sultana' }); return }
    setGuardando(true); setMsg(null)
    try {
      const r = await api.registrarSultana({
        lote: loteId, destino,
        kg_sultana: kgSultana,
        numero_sacos: sacos || null,
        fecha: fecha || null,
        responsable: responsable || null,
        observaciones: observaciones || null,
      })
      setMsg({
        tipo: 'ok',
        texto: `Registrados ${fmtKg(r.kg_sultana)} kg de sultana del lote ${loteId}`,
      })
      setLoteId(''); setDestino(''); setSacos(''); setFecha('')
      setResponsable(''); setObservaciones('')
      recargar(); recargarLotes()
    } catch (e) {
      setMsg({ tipo: 'error', texto: e instanceof Error ? e.message : 'No se pudo guardar' })
    } finally { setGuardando(false) }
  }

  const etiqueta = 'block text-xs font-semibold text-gray-600 uppercase mb-1'
  const input = `w-full px-3 py-2 border border-gray-300 rounded text-sm
                 focus:outline-none focus:ring-2 focus:ring-sky-500`
  const soloLectura = 'w-full px-3 py-2 border border-gray-200 rounded text-sm bg-gray-50 text-gray-700'

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Recycle size={24} className="text-green-700" /> Sultana (pulpa del cafe)
        </h1>
        <p className="text-gray-600">Fase II · Taipiplaya — Jefe de maquinas</p>
      </div>

      <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 flex gap-3">
        <Info className="text-sky-700 shrink-0 mt-0.5" size={18} />
        <p className="text-sm text-sky-900">
          Por cada kilo de cafe guinda que entra al despulpado salen{' '}
          <strong>{(factor * 100).toFixed(0)} kg de sultana por cada 100</strong>. Registrar su
          destino es lo que permite que el balance de masa de la fase cierre: sin este dato,
          casi un tercio de lo que entra a la planta desaparece del sistema.
        </p>
      </div>

      {kgPendientes > 1 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-900">
            <strong>{fmtKg(kgPendientes)} kg de sultana sin destino documentado</strong> en{' '}
            {sinRegistrar.length} {sinRegistrar.length === 1 ? 'lote' : 'lotes'}.
          </p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Registrar destino de la sultana</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className={etiqueta}>
              Lote de origen <span className="text-red-600">*</span>
            </label>
            <select value={loteId} onChange={(e) => { setLoteId(e.target.value); setMsg(null) }}
              className={`${input} bg-white`}>
              <option value="">Seleccionar lote...</option>
              {lotes.map((l) => (
                <option key={l.codigo} value={l.codigo}>
                  {l.codigo} — {l.certificacion} — {fmtKg(l.kg_guinda_real)} kg guinda
                </option>
              ))}
            </select>
            {lote && (
              <p className="text-[11px] text-gray-500 mt-0.5">
                Guinda del lote: {fmtKg(lote.kg_guinda_real)} kg · ya registrado:{' '}
                {fmtKg(lote.kg_sultana_registrada)} kg
              </p>
            )}
          </div>

          <div>
            <label className={etiqueta}>
              Kg de sultana <span className="ml-1 text-gray-400 normal-case">(kg)</span>
            </label>
            <input readOnly value={kgSultana != null ? fmtKg(kgSultana) : ''}
              placeholder="Se calcula del lote" className={soloLectura} />
            <p className="text-[11px] text-gray-400 mt-0.5">
              Calculado: guinda × {factor}. No se escribe a mano.
            </p>
          </div>

          <div>
            <label className={etiqueta}>
              Destino <span className="text-red-600">*</span>
            </label>
            <select value={destino}
              onChange={(e) => setDestino(e.target.value as DestinoSultana | '')}
              className={`${input} bg-white`}>
              <option value="">Seleccionar destino...</option>
              {DESTINOS.map((d) => (
                <option key={d.valor} value={d.valor}>
                  {d.label}
                  {precios && precios[d.valor] > 0 && kgSultana != null
                    ? ` — ${fmtBs(kgSultana * precios[d.valor])} Bs`
                    : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {DESTINOS.find((d) => d.valor === destino)?.nota ?? 'A donde va la pulpa'}
            </p>
          </div>

          <div>
            <label className={etiqueta}>Numero de sacos</label>
            <input type="number" min={1} step={1} value={sacos}
              onChange={(e) => setSacos(e.target.value)} className={input} />
            <p className="text-[11px] text-gray-400 mt-0.5">
              Permite cotejar el conteo fisico con los kilos calculados.
            </p>
          </div>

          <div>
            <label className={etiqueta}>Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
              className={input} />
            <p className="text-[11px] text-gray-400 mt-0.5">Si se deja vacio se usa la de hoy.</p>
          </div>

          <div>
            <label className={etiqueta}>Responsable</label>
            <input type="text" value={responsable} onChange={(e) => setResponsable(e.target.value)}
              className={input} />
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label className={etiqueta}>Observaciones</label>
            <textarea rows={2} value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)} className={input} />
          </div>
        </div>

        {valor != null && valor > 0 && (
          <p className="mt-4 text-sm text-gray-700">
            Valor estimado: <strong>{fmtBs(valor)} Bs</strong>{' '}
            <span className="text-gray-400">
              ({fmtBs(precios?.[destino as DestinoSultana])} Bs/kg, configurable en Configuracion)
            </span>
          </p>
        )}
        {destino && precios && (precios[destino] ?? 0) === 0 && (
          <p className="mt-4 text-sm text-gray-500">
            Sin precio por kg cargado para este destino: el valor queda en 0. Se define en
            Configuracion.
          </p>
        )}

        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={guardar} disabled={guardando}
            className="flex items-center gap-2 px-4 py-2 bg-coffee-700 text-white rounded
                       text-sm font-medium hover:bg-coffee-800 disabled:bg-gray-300 transition">
            <Save size={16} /> {guardando ? 'Guardando...' : 'Guardar y sellar'}
          </button>
          {msg && (
            <span className={`flex items-center gap-1.5 text-sm ${
              msg.tipo === 'ok' ? 'text-green-700' : 'text-red-700'}`}>
              {msg.tipo === 'ok' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
              {msg.texto}
            </span>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <h2 className="font-semibold text-gray-900 px-5 py-4 border-b border-gray-100">
          Balance por lote
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-2 font-semibold">Lote</th>
                <th className="px-5 py-2 font-semibold">Guinda (kg)</th>
                <th className="px-5 py-2 font-semibold">Sultana esperada</th>
                <th className="px-5 py-2 font-semibold">Registrada</th>
                <th className="px-5 py-2 font-semibold">Sin registrar</th>
                <th className="px-5 py-2 font-semibold">Destinos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lotes.map((l) => (
                <tr key={l.lote_id} className="hover:bg-gray-50">
                  <td className="px-5 py-2 font-mono font-medium">{l.codigo}</td>
                  <td className="px-5 py-2">{fmtKg(l.kg_guinda_real)}</td>
                  <td className="px-5 py-2">{fmtKg(l.kg_sultana_esperada)}</td>
                  <td className="px-5 py-2">{fmtKg(l.kg_sultana_registrada)}</td>
                  <td className={`px-5 py-2 font-medium ${
                    Number(l.kg_sin_registrar) > Number(l.tolerancia_kg)
                      ? 'text-amber-700' : 'text-green-700'}`}>
                    {fmtKg(l.kg_sin_registrar)}
                  </td>
                  <td className="px-5 py-2 text-gray-600">{l.destinos ?? '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <h2 className="font-semibold text-gray-900 px-5 py-4 border-b border-gray-100">
          Registros ({registros?.length ?? 0})
        </h2>
        {registros && registros.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-2 font-semibold">Fecha</th>
                  <th className="px-5 py-2 font-semibold">Lote</th>
                  <th className="px-5 py-2 font-semibold">Kg</th>
                  <th className="px-5 py-2 font-semibold">Destino</th>
                  <th className="px-5 py-2 font-semibold">Sacos</th>
                  <th className="px-5 py-2 font-semibold">Valor (Bs)</th>
                  <th className="px-5 py-2 font-semibold">Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {registros.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-5 py-2">{fmtFecha(r.fecha)}</td>
                    <td className="px-5 py-2 font-mono font-medium">{r.lote}</td>
                    <td className="px-5 py-2">{fmtKg(r.kg_sultana)}</td>
                    <td className="px-5 py-2 capitalize">{r.destino}</td>
                    <td className="px-5 py-2">{r.numero_sacos ?? '--'}</td>
                    <td className="px-5 py-2">{fmtBs(r.valor_estimado_bs)}</td>
                    <td className="px-5 py-2 text-gray-600">{r.responsable ?? '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-8 text-center text-gray-500 text-sm">
            Sin registros. Usa el formulario de arriba para crear el primero.
          </p>
        )}
      </div>
    </div>
  )
}
