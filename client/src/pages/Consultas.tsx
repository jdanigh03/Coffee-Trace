import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, AlertTriangle, CheckCircle2, Package } from 'lucide-react'
import { api } from '../api/client'
import { useApi, fmtBs, fmtKg, fmtFecha } from '../api/useApi'

function Fase({ titulo, activa, children }: {
  titulo: string; activa: boolean; children: React.ReactNode
}) {
  return (
    <div className={`border rounded-lg p-4 ${activa ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'}`}>
      <p className={`text-xs font-semibold uppercase mb-2 ${activa ? 'text-gray-700' : 'text-gray-400'}`}>
        {titulo}
      </p>
      {activa ? children : <p className="text-sm text-gray-400">Sin registro</p>}
    </div>
  )
}

export default function Consultas() {
  const [params, setParams] = useSearchParams()
  const loteUrl = params.get('lote') ?? ''
  const [entrada, setEntrada] = useState(loteUrl)

  const { datos: lotes } = useApi(() => api.lotes(), [])
  const { datos: lote, cargando, error } = useApi(
    () => (loteUrl ? api.lote(loteUrl) : Promise.resolve(null)), [loteUrl])

  const buscar = (codigo: string) => {
    setEntrada(codigo)
    setParams(codigo ? { lote: codigo } : {})
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Consulta de trazabilidad</h1>
        <p className="text-gray-600">La cadena completa de un lote, del acopio a la exportación</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            value={entrada}
            onChange={(e) => setEntrada(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && buscar(entrada)}
            placeholder="Código de lote, ej. OR-01-25"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm font-mono
                       focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <button onClick={() => buscar(entrada)}
          className="px-4 py-2 bg-sky-700 text-white rounded-lg text-sm font-medium hover:bg-sky-800">
          Consultar
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {lotes?.map((l) => (
          <button key={l.codigo} onClick={() => buscar(l.codigo)}
            className={`px-3 py-1 rounded-full text-xs font-mono border transition ${
              l.codigo === loteUrl
                ? 'bg-sky-700 text-white border-sky-700'
                : 'bg-white text-gray-700 border-gray-300 hover:border-sky-400'}`}>
            {l.codigo}
          </button>
        ))}
      </div>

      {cargando && <p className="text-gray-500">Consultando...</p>}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-2">
          <AlertTriangle className="text-red-600 shrink-0" size={18} />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {lote && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold font-mono text-gray-900">{lote.codigo}</h2>
                <p className="text-sm text-gray-600 capitalize">
                  {lote.certificacion} · campaña {lote.campania_id} · {lote.estado}
                </p>
              </div>
              {lote.reconciliacion && (
                <div className={`px-3 py-2 rounded-lg text-sm border ${
                  lote.reconciliacion.estado === 'cuadra'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                  <div className="flex items-center gap-2 font-medium">
                    {lote.reconciliacion.estado === 'cuadra'
                      ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                    Acopio vs beneficio: {lote.reconciliacion.estado}
                  </div>
                  {lote.reconciliacion.estado !== 'cuadra' && (
                    <p className="text-xs mt-1">
                      Diferencia de {fmtKg(lote.reconciliacion.diferencia)} kg
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Fase titulo="1. Acopio" activa>
              <p className="text-lg font-bold">{fmtKg(lote.kg_guinda_real)} kg</p>
              <p className="text-xs text-gray-600">
                {lote.entregas} entregas · {fmtKg(lote.latas)} latas
              </p>
              <p className="text-xs text-gray-600">{fmtBs(lote.total_pagado_bs)} Bs pagados</p>
              {lote.entregas_observadas > 0 && (
                <p className="text-xs text-amber-700 mt-1">
                  {lote.entregas_observadas} observadas
                </p>
              )}
            </Fase>

            <Fase titulo="2. Envío a La Paz" activa={!!lote.envio}>
              <p className="text-lg font-bold">
                {fmtKg(lote.envio?.kg_pergamino_despachado)} kg
              </p>
              <p className="text-xs text-gray-600">pergamino despachado (medido)</p>
              <p className="text-xs text-gray-600">{fmtFecha(lote.envio?.fecha_salida)}</p>
              {lote.envio?.kg_pergamino_recibido == null && (
                <p className="text-xs text-gray-400 mt-1">Peso recibido sin registrar</p>
              )}
            </Fase>

            <Fase titulo="3. Beneficio seco" activa={!!lote.beneficio}>
              <p className="text-lg font-bold">{fmtKg(lote.beneficio?.kg_verde_calc)} kg</p>
              <p className="text-xs text-gray-600">verde exportable</p>
              <p className="text-xs text-gray-600">
                rendimiento {lote.beneficio?.rendimiento_pct ?? '--'}%
              </p>
              {lote.beneficio && lote.beneficio.kg_verde_real == null && (
                <p className="text-xs text-amber-700 mt-1">Estimado, no pesado</p>
              )}
            </Fase>

            <Fase titulo="4. Despacho" activa={lote.despachos.length > 0}>
              {lote.despachos.map((d, i) => (
                <div key={i}>
                  <p className="text-lg font-bold">{fmtKg(d.kg_asignados)} kg</p>
                  <p className="text-xs text-gray-600">{d.cliente} · {d.pais}</p>
                  <p className="text-xs text-gray-600">{fmtFecha(d.fecha_despacho)}</p>
                </div>
              ))}
            </Fase>
          </div>

          {lote.muestras.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Package size={16} /> Muestras extraídas
              </h3>
              <div className="flex flex-wrap gap-4 text-sm">
                {lote.muestras.map((m, i) => (
                  <div key={i} className="text-gray-700">
                    <span className="capitalize font-medium">{m.tipo}</span>: {m.kg} kg
                    <span className="text-gray-500"> · {m.motivo}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Son kilos que salen del lote para control de calidad. Registrarlos permite
                explicar dónde terminó cada kilo.
              </p>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <h3 className="font-semibold text-gray-900 p-5 pb-3">
              Productores del lote ({lote.productores.length})
            </h3>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 sticky top-0">
                  <tr>
                    <th className="px-5 py-2 font-semibold">Productor</th>
                    <th className="px-5 py-2 font-semibold">Origen del dato</th>
                    <th className="px-5 py-2 font-semibold text-right">Guinda (kg)</th>
                    <th className="px-5 py-2 font-semibold text-right">Verde (kg)</th>
                    <th className="px-5 py-2 font-semibold">Revisión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lote.productores.map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-5 py-2">
                        {p.persona ?? <span className="text-amber-700">{p.nombre_excel}</span>}
                      </td>
                      <td className="px-5 py-2 text-xs text-gray-600">
                        {p.fuente === 'saldo_almacen' ? 'Saldo en almacén' : 'Trazabilidad de venta'}
                      </td>
                      <td className="px-5 py-2 text-right">{fmtKg(p.kg_guinda)}</td>
                      <td className="px-5 py-2 text-right">{fmtKg(p.kg_verde_export)}</td>
                      <td className="px-5 py-2">
                        {p.revision === 'ok'
                          ? <span className="text-green-700 text-xs">ok</span>
                          : <span className="text-amber-700 text-xs">observado</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="font-semibold text-gray-900 mb-2">Sellos en blockchain</h3>
            {lote.sellosBlockchain.length === 0 ? (
              <p className="text-sm text-gray-500">
                Este lote todavía no tiene fases selladas. La red Fabric no está desplegada.
              </p>
            ) : (
              <ul className="space-y-1 text-xs font-mono text-gray-700">
                {lote.sellosBlockchain.map((s, i) => (
                  <li key={i}>{s.tabla_origen}: {s.hash_sha256.slice(0, 24)}...</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
