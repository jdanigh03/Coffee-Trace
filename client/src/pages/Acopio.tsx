import { useState } from 'react'
import { Search, AlertTriangle, User, Download, Package } from 'lucide-react'
import { api } from '../api/client'
import { useApi, fmtBs, fmtKg, fmtFecha } from '../api/useApi'
import AccionesFila, { descargarCsv } from '../components/AccionesFila'
import DetalleLote from '../components/DetalleLote'
import DetalleProductor from '../components/DetalleProductor'
import PhaseStepper from '../components/PhaseStepper'
import FormularioAcopio from '../components/FormularioAcopio'
import { ProcessPhase } from '../types'

const CAMPANIA = 2025

export default function Acopio() {
  const [buscar, setBuscar] = useState('')
  const [revision, setRevision] = useState('')
  const [comunidad, setComunidad] = useState('')
  const [productorAbierto, setProductorAbierto] = useState<string | null>(null)
  const [loteAbierto, setLoteAbierto] = useState<string | null>(null)

  const { datos: comunidades } = useApi(() => api.comunidades(), [])
  const { datos, cargando, error, recargar } = useApi(
    () => api.entregas({ campania: CAMPANIA, buscar, revision, comunidad, limit: 500 }),
    [buscar, revision, comunidad])

  const total = datos?.reduce((a, e) => ({
    kg: a.kg + Number(e.kg_guinda_real ?? 0),
    bs: a.bs + Number(e.total_pagado_bs ?? 0),
  }), { kg: 0, bs: 0 })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Acopio de café guinda</h1>
        <p className="text-gray-600">Fase II · Taipiplaya — recepción del café del productor</p>
      </div>

      <PhaseStepper currentPhase={ProcessPhase.ACOPIO} />

      <FormularioAcopio onRegistrado={recargar} />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input value={buscar} onChange={(e) => setBuscar(e.target.value)}
            placeholder="Buscar por productor o código..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-sky-500" />
        </div>
        <select value={comunidad} onChange={(e) => setComunidad(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
          <option value="">Todas las comunidades</option>
          {comunidades?.map((c) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
        </select>
        <select value={revision} onChange={(e) => setRevision(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
          <option value="">Toda revisión</option>
          <option value="ok">Solo correctas</option>
          <option value="observado">Solo observadas</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-2">
          <AlertTriangle className="text-red-600 shrink-0" size={18} />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">
              {cargando ? 'Cargando...' : `${datos?.length ?? 0} entregas`}
            </h2>
            {total && (
              <p className="text-xs text-gray-500">
                {fmtKg(total.kg)} kg · {fmtBs(total.bs)} Bs
              </p>
            )}
          </div>
          <button onClick={() => datos && descargarCsv('entregas-acopio', datos)}
            disabled={!datos?.length}
            className="flex items-center gap-1.5 text-sm text-sky-700 hover:underline
                       disabled:text-gray-300 disabled:no-underline">
            <Download size={15} /> Exportar CSV
          </button>
        </div>
        <div className="overflow-x-auto max-h-[32rem] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 sticky top-0">
              <tr>
                <th className="px-5 py-2 font-semibold">Fecha</th>
                <th className="px-5 py-2 font-semibold">Código</th>
                <th className="px-5 py-2 font-semibold">Productor</th>
                <th className="px-5 py-2 font-semibold">Comunidad</th>
                <th className="px-5 py-2 font-semibold">Lote</th>
                <th className="px-5 py-2 font-semibold text-right">Kg</th>
                <th className="px-5 py-2 font-semibold text-right">Bs</th>
                <th className="px-5 py-2 font-semibold">Estatus</th>
                <th className="px-5 py-2 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {datos?.map((e) => (
                <tr key={e.id} className={`hover:bg-gray-50 ${
                  e.revision !== 'ok' ? 'bg-amber-50/40' : ''}`}>
                  <td className="px-5 py-2 whitespace-nowrap">{fmtFecha(e.fecha)}</td>
                  <td className="px-5 py-2 font-mono text-xs">{e.codigo_productor}</td>
                  <td className="px-5 py-2">
                    {e.persona_id ? (
                      <button onClick={() => setProductorAbierto(e.persona_id!)}
                        className="text-sky-700 hover:underline text-left">
                        {e.productor ?? e.nombre_excel}
                      </button>
                    ) : (
                      <span className="text-amber-700" title="Nombre sin emparejar en el padrón">
                        {e.nombre_excel}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-2 text-gray-600">{e.comunidad ?? '--'}</td>
                  <td className="px-5 py-2">
                    {e.lote ? (
                      <button onClick={() => setLoteAbierto(e.lote!)}
                        className="font-mono text-sky-700 hover:underline">{e.lote}</button>
                    ) : <span className="text-gray-400 text-xs">sin lote</span>}
                  </td>
                  <td className="px-5 py-2 text-right">{fmtKg(e.kg_guinda_real)}</td>
                  <td className="px-5 py-2 text-right">{fmtBs(e.total_pagado_bs)}</td>
                  <td className="px-5 py-2">
                    {e.estatus_declarado ? (
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        e.estatus_declarado === 'E'
                          ? 'bg-green-100 text-green-800' : 'bg-sky-100 text-sky-800'}`}>
                        {e.estatus_declarado}
                      </span>
                    ) : <span className="text-amber-700 text-xs">vacío</span>}
                  </td>
                  <td className="px-5 py-2">
                    <AccionesFila acciones={[
                      { label: e.revision !== 'ok' ? (e.revision_nota ?? 'Observada') : 'Sin observaciones',
                        icono: <AlertTriangle size={15} />,
                        deshabilitadaPor: e.revision === 'ok' ? 'Sin observaciones' : undefined },
                      { label: 'Ver productor', icono: <User size={15} />,
                        onClick: () => setProductorAbierto(e.persona_id!),
                        deshabilitadaPor: e.persona_id ? undefined : 'Productor sin emparejar' },
                      { label: 'Ver lote', icono: <Package size={15} />,
                        onClick: () => setLoteAbierto(e.lote!),
                        deshabilitadaPor: e.lote ? undefined : 'Entrega sin lote asignado' },
                    ]} />
                  </td>
                </tr>
              ))}
              {!cargando && datos?.length === 0 && (
                <tr><td colSpan={9} className="px-5 py-8 text-center text-gray-500">
                  Sin entregas con esos filtros
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DetalleProductor id={productorAbierto} onCerrar={() => setProductorAbierto(null)}
        onVerLote={(c) => { setProductorAbierto(null); setLoteAbierto(c) }} />
      <DetalleLote codigo={loteAbierto} onCerrar={() => setLoteAbierto(null)} />
    </div>
  )
}
