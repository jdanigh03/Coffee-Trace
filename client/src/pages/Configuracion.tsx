import { useState } from 'react'
import { Save, Check, AlertTriangle, Building2, SlidersHorizontal, Calendar, Percent } from 'lucide-react'
import { api, type Parametro } from '../api/client'
import { useApi, fmtFecha } from '../api/useApi'

/** Campo de un parametro con guardado individual y validacion del servidor. */
function CampoParametro({ p, onGuardado }: { p: Parametro; onGuardado: () => void }) {
  const [valor, setValor] = useState(p.valor)
  const [estado, setEstado] = useState<'quieto' | 'guardando' | 'ok' | 'error'>('quieto')
  const [error, setError] = useState<string | null>(null)
  const sucio = valor !== p.valor

  const guardar = async () => {
    setEstado('guardando'); setError(null)
    try {
      await api.guardarParametro(p.clave, valor)
      setEstado('ok'); onGuardado()
      setTimeout(() => setEstado('quieto'), 2000)
    } catch (e) {
      setEstado('error')
      setError(e instanceof Error ? e.message : 'No se pudo guardar')
    }
  }

  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900">{p.descripcion ?? p.clave}</p>
          <p className="text-xs text-gray-500 font-mono">{p.clave}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {p.tipo === 'booleano' ? (
            <select value={valor} onChange={(e) => setValor(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-sm bg-white w-28">
              <option value="true">Activado</option>
              <option value="false">Desactivado</option>
            </select>
          ) : (
            <div className="flex items-center gap-1">
              <input
                type={p.tipo === 'numero' ? 'number' : 'text'}
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                min={p.min_valor ?? undefined}
                max={p.max_valor ?? undefined}
                step="any"
                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right
                           focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              {p.unidad && <span className="text-xs text-gray-500 w-4">{p.unidad}</span>}
            </div>
          )}
          <button
            onClick={guardar}
            disabled={!sucio || estado === 'guardando'}
            className={`p-1.5 rounded transition ${
              estado === 'ok' ? 'text-green-600'
              : sucio ? 'text-sky-700 hover:bg-sky-50'
              : 'text-gray-300 cursor-not-allowed'}`}
            title={sucio ? 'Guardar' : 'Sin cambios'}
          >
            {estado === 'ok' ? <Check size={16} /> : <Save size={16} />}
          </button>
        </div>
      </div>
      {p.tipo === 'numero' && (p.min_valor != null || p.max_valor != null) && (
        <p className="text-[11px] text-gray-400 mt-0.5">
          Rango permitido: {p.min_valor ?? '-'} a {p.max_valor ?? '-'} {p.unidad}
        </p>
      )}
      {error && <p className="text-xs text-red-700 mt-1">{error}</p>}
    </div>
  )
}

const TITULO_GRUPO: Record<string, { label: string; icono: React.ReactNode }> = {
  calidad:    { label: 'Rangos de calidad',        icono: <Percent size={16} /> },
  tolerancia: { label: 'Tolerancias',              icono: <SlidersHorizontal size={16} /> },
  blockchain: { label: 'Blockchain',               icono: <Check size={16} /> },
  general:    { label: 'General',                  icono: <SlidersHorizontal size={16} /> },
}

export default function Configuracion() {
  const { datos, cargando, error, recargar } = useApi(() => api.configuracion(), [])
  const [org, setOrg] = useState<Record<string, string> | null>(null)
  const [guardandoOrg, setGuardandoOrg] = useState(false)
  const [msgOrg, setMsgOrg] = useState<string | null>(null)

  if (cargando) return <div className="p-8 text-gray-500">Cargando configuracion...</div>
  if (error || !datos) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-5 flex gap-3">
          <AlertTriangle className="text-red-600 shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    )
  }

  const o = datos.organizacion
  const campo = (k: string) => org?.[k] ?? (o?.[k as keyof typeof o] as string) ?? ''
  const grupos = [...new Set(datos.parametros.map((p) => p.grupo))]

  const guardarOrg = async () => {
    if (!org) return
    setGuardandoOrg(true); setMsgOrg(null)
    try {
      await api.guardarOrganizacion(org)
      setOrg(null); setMsgOrg('Guardado'); recargar()
      setTimeout(() => setMsgOrg(null), 2000)
    } catch (e) {
      setMsgOrg(e instanceof Error ? e.message : 'No se pudo guardar')
    } finally { setGuardandoOrg(false) }
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuracion</h1>
        <p className="text-gray-600">
          Parametros del sistema · entorno <span className="font-mono">{datos.sistema.entorno}</span>
        </p>
      </div>

      {/* ---------- Organizacion ---------- */}
      <section className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={18} className="text-coffee-700" />
          <h2 className="font-semibold text-gray-900">Organizacion</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { k: 'nombre', label: 'Nombre' },
            { k: 'codigo_ico', label: 'Codigo ICO', ayuda: 'Se usa en la documentacion de exportacion' },
            { k: 'nit', label: 'NIT' },
            { k: 'direccion', label: 'Direccion' },
          ].map((f) => (
            <div key={f.k}>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                {f.label}
              </label>
              <input
                value={campo(f.k)}
                onChange={(e) => setOrg({ ...(org ?? {}), [f.k]: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm
                           focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              {f.ayuda && <p className="text-[11px] text-gray-400 mt-0.5">{f.ayuda}</p>}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button onClick={guardarOrg} disabled={!org || guardandoOrg}
            className="px-4 py-2 bg-coffee-700 text-white rounded text-sm font-medium
                       disabled:bg-gray-200 disabled:text-gray-400 hover:bg-coffee-800 transition">
            {guardandoOrg ? 'Guardando...' : 'Guardar'}
          </button>
          {msgOrg && <span className="text-sm text-gray-600">{msgOrg}</span>}
        </div>
      </section>

      {/* ---------- Campanias ---------- */}
      <section className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-1">
          <Calendar size={18} className="text-coffee-700" />
          <h2 className="font-semibold text-gray-900">Campanias</h2>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          La campania activa es la que abre por defecto en el dashboard.
        </p>
        <div className="space-y-2">
          {datos.campanias.map((c) => (
            <div key={c.id}
              className={`flex items-center justify-between px-3 py-2 rounded border ${
                c.activa ? 'border-coffee-300 bg-coffee-50' : 'border-gray-200'}`}>
              <div>
                <p className="font-medium text-gray-900">{c.id}</p>
                <p className="text-xs text-gray-500">
                  {c.entregas.toLocaleString('es-BO')} entregas ·
                  {' '}{fmtFecha(c.fecha_inicio)} a {fmtFecha(c.fecha_fin)}
                </p>
              </div>
              {c.activa ? (
                <span className="text-xs font-semibold text-coffee-800 px-2 py-1">Activa</span>
              ) : (
                <button
                  onClick={() => api.activarCampania(c.id).then(recargar)}
                  className="text-xs text-sky-700 hover:underline px-2 py-1">
                  Activar
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Parametros ---------- */}
      {grupos.map((g) => {
        const t = TITULO_GRUPO[g] ?? { label: g, icono: <SlidersHorizontal size={16} /> }
        return (
          <section key={g} className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-coffee-700">{t.icono}</span>
              <h2 className="font-semibold text-gray-900">{t.label}</h2>
            </div>
            {datos.parametros.filter((p) => p.grupo === g).map((p) => (
              <CampoParametro key={p.clave} p={p} onGuardado={recargar} />
            ))}
          </section>
        )
      })}

      {/* ---------- Factores ---------- */}
      <section className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="font-semibold text-gray-900 mb-1">Factores de conversion</h2>
        <p className="text-xs text-gray-500 mb-4">
          Solo lectura desde aqui. Cambiarlos altera todos los indicadores historicos,
          asi que se versionan por campania y se editan con una migracion.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2 font-semibold">Campania</th>
                <th className="px-3 py-2 font-semibold">Origen</th>
                <th className="px-3 py-2 font-semibold">Destino</th>
                <th className="px-3 py-2 font-semibold text-right">Factor</th>
                <th className="px-3 py-2 font-semibold">Base</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {datos.factores.map((f, i) => (
                <tr key={i}>
                  <td className="px-3 py-1.5">{f.campania_id}</td>
                  <td className="px-3 py-1.5">{f.origen}</td>
                  <td className="px-3 py-1.5">{f.destino}</td>
                  <td className="px-3 py-1.5 text-right font-mono">{Number(f.factor).toFixed(5)}</td>
                  <td className="px-3 py-1.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      f.es_estimado ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                      {f.es_estimado ? 'estimado' : 'medido'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
