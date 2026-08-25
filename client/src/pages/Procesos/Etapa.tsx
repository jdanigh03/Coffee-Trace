import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Plus, Trash2, Save, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { api } from '../../api/client'
import { useApi, fmtFecha, fmtKg } from '../../api/useApi'
import { getEtapa, type CampoEtapa } from '../../constants/etapas'
import PhaseStepper from '../../components/PhaseStepper'
import { PHASES } from '../../constants/phases'

type Valores = Record<string, string | boolean>

function Campo({ c, valor, onChange }: {
  c: CampoEtapa; valor: string | boolean | undefined; onChange: (v: string | boolean) => void
}) {
  const base = `w-full px-3 py-2 border border-gray-300 rounded text-sm
                focus:outline-none focus:ring-2 focus:ring-sky-500`
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
        {c.label}
        {c.requerido && <span className="text-red-600 ml-0.5">*</span>}
        {c.unidad && <span className="ml-1 text-gray-400 normal-case">({c.unidad})</span>}
      </label>

      {c.tipo === 'booleano' ? (
        <label className="flex items-center gap-2 py-2">
          <input type="checkbox" checked={valor === true}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-coffee-700 focus:ring-sky-500" />
          <span className="text-sm text-gray-700">Sí</span>
        </label>
      ) : c.tipo === 'select' ? (
        <select value={String(valor ?? '')} onChange={(e) => onChange(e.target.value)}
          className={`${base} bg-white`}>
          <option value="">Seleccionar...</option>
          {c.opciones?.map((o) => <option key={o.valor} value={o.valor}>{o.label}</option>)}
        </select>
      ) : c.tipo === 'area' ? (
        <textarea value={String(valor ?? '')} onChange={(e) => onChange(e.target.value)}
          rows={2} className={base} />
      ) : (
        <input
          type={c.tipo === 'numero' ? 'number' : c.tipo === 'fecha' ? 'date'
              : c.tipo === 'hora' ? 'datetime-local' : 'text'}
          value={String(valor ?? '')} onChange={(e) => onChange(e.target.value)}
          min={c.min} max={c.max} step="any" className={base} />
      )}

      {(c.ayuda || c.calculado) && (
        <p className="text-[11px] text-gray-400 mt-0.5">
          {c.calculado ? `Referencia: ${c.calculado}` : c.ayuda}
        </p>
      )}
    </div>
  )
}

export default function Etapa() {
  // Las rutas son literales (/procesos/tolva, /procesos/secado...) y no
  // /procesos/:slug, para no tapar a transporte, recepcion ni las demas.
  const slug = useLocation().pathname.split('/').pop() ?? ''
  const def = getEtapa(slug)

  const [lote, setLote] = useState('')
  const [valores, setValores] = useState<Valores>({})
  const [lecturas, setLecturas] = useState<Valores[]>([])
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  const { datos: lotes } = useApi(() => api.lotes(), [])
  const { datos: registros, recargar } = useApi(
    () => (def ? api.etapaRegistros(slug) : Promise.resolve([])), [slug])

  if (!def) {
    return <div className="p-8 text-gray-500">Etapa desconocida: {slug}</div>
  }

  const faseDef = PHASES.find((p) => p.path.endsWith(`/${slug}`))
  const faltan = def.campos.filter((c) => c.requerido && !valores[c.clave])

  const guardar = async () => {
    if (!lote) { setMsg({ tipo: 'error', texto: 'Elige un lote' }); return }
    if (faltan.length) {
      setMsg({ tipo: 'error', texto: `Falta: ${faltan.map((f) => f.label).join(', ')}` })
      return
    }
    setGuardando(true); setMsg(null)
    try {
      await api.registrarEtapa(slug, { lote, ...valores, lecturas })
      setMsg({ tipo: 'ok', texto: `Registro guardado para el lote ${lote}` })
      setValores({}); setLecturas([]); setLote('')
      recargar()
    } catch (e) {
      setMsg({ tipo: 'error', texto: e instanceof Error ? e.message : 'No se pudo guardar' })
    } finally { setGuardando(false) }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{def.titulo}</h1>
        <p className="text-gray-600">Fase II · Taipiplaya — {def.actor}</p>
      </div>

      {faseDef && <PhaseStepper currentPhase={faseDef.phase} />}

      <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 flex gap-3">
        <Info className="text-sky-700 shrink-0 mt-0.5" size={18} />
        <p className="text-sm text-sky-900">{def.descripcion}</p>
      </div>

      {registros?.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-900">
            <strong>Esta etapa no tiene ningún registro todavía.</strong> No existe en los
            archivos históricos de ASOCAFE: la captura empieza desde cero con este formulario.
          </p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Registrar {def.titulo.toLowerCase()}</h2>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
            Lote <span className="text-red-600">*</span>
          </label>
          <select value={lote} onChange={(e) => setLote(e.target.value)}
            className="w-full sm:w-72 px-3 py-2 border border-gray-300 rounded text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-sky-500">
            <option value="">Seleccionar lote...</option>
            {lotes?.map((l) => (
              <option key={l.codigo} value={l.codigo}>
                {l.codigo} — {l.certificacion} — {fmtKg(l.kg_guinda_real)} kg
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {def.campos.map((c) => (
            <Campo key={c.clave} c={c} valor={valores[c.clave]}
              onChange={(v) => setValores({ ...valores, [c.clave]: v })} />
          ))}
        </div>

        {def.lecturas && (
          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="flex items-baseline justify-between mb-1">
              <h3 className="font-semibold text-gray-900">{def.lecturas.titulo}</h3>
              <button
                onClick={() => setLecturas([...lecturas, {}])}
                className="flex items-center gap-1 text-sm text-sky-700 hover:underline">
                <Plus size={14} /> Añadir lectura
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">{def.lecturas.ayuda}</p>

            {lecturas.length === 0 && (
              <p className="text-sm text-gray-400 py-2">Sin lecturas todavía.</p>
            )}

            <div className="space-y-3">
              {lecturas.map((lec, i) => (
                <div key={i} className="flex gap-3 items-end bg-gray-50 rounded p-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 flex-1">
                    {def.lecturas!.campos.map((c) => (
                      <Campo key={c.clave} c={c} valor={lec[c.clave]}
                        onChange={(v) => {
                          const copia = [...lecturas]
                          copia[i] = { ...copia[i], [c.clave]: v }
                          setLecturas(copia)
                        }} />
                    ))}
                  </div>
                  <button onClick={() => setLecturas(lecturas.filter((_, j) => j !== i))}
                    title="Quitar lectura"
                    className="p-2 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
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
          Registros ({registros?.length ?? 0})
        </h2>
        {registros && registros.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-2 font-semibold">Lote</th>
                  <th className="px-5 py-2 font-semibold">Certificación</th>
                  {def.campos.slice(0, 4).map((c) => (
                    <th key={c.clave} className="px-5 py-2 font-semibold">{c.label}</th>
                  ))}
                  <th className="px-5 py-2 font-semibold">Registrado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {registros.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-5 py-2 font-mono font-medium">{r.lote}</td>
                    <td className="px-5 py-2 capitalize">{r.certificacion}</td>
                    {def.campos.slice(0, 4).map((c) => (
                      <td key={c.clave} className="px-5 py-2 text-gray-700">
                        {r[c.clave] === true ? 'Sí' : r[c.clave] === false ? 'No'
                          : c.tipo === 'fecha' || c.tipo === 'hora'
                            ? fmtFecha(r[c.clave] as string)
                            : String(r[c.clave] ?? '--')}
                      </td>
                    ))}
                    <td className="px-5 py-2 text-gray-500 text-xs">{fmtFecha(r.creado_en)}</td>
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
