import { useState } from 'react'
import { Search, AlertTriangle } from 'lucide-react'
import { api } from '../api/client'
import { useApi, fmtBs, fmtKg } from '../api/useApi'

export default function Productores() {
  const [buscar, setBuscar] = useState('')
  const [comunidad, setComunidad] = useState('')

  const { datos: comunidades } = useApi(() => api.comunidades(), [])
  const { datos, cargando, error } = useApi(
    () => api.productores({ buscar: buscar || undefined, comunidad: comunidad || undefined }),
    [buscar, comunidad])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Productores</h1>
        <p className="text-gray-600">Padrón de socios y su aporte a la campaña</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Buscar por nombre..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <select
          value={comunidad}
          onChange={(e) => setComunidad(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white
                     focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">Todas las comunidades</option>
          {comunidades?.map((c) => (
            <option key={c.id} value={c.nombre}>{c.nombre} ({c.productores})</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-2">
          <AlertTriangle className="text-red-600 shrink-0" size={18} />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            {cargando ? 'Cargando...' : `${datos?.length ?? 0} productores`}
          </h2>
          <p className="text-xs text-gray-500">Ordenados por kg aportados</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-2 font-semibold">Productor</th>
                <th className="px-5 py-2 font-semibold">Comunidad</th>
                <th className="px-5 py-2 font-semibold">Códigos</th>
                <th className="px-5 py-2 font-semibold">Estatus</th>
                <th className="px-5 py-2 font-semibold">Afiliación</th>
                <th className="px-5 py-2 font-semibold text-right">Entregas</th>
                <th className="px-5 py-2 font-semibold text-right">Guinda (kg)</th>
                <th className="px-5 py-2 font-semibold text-right">Pagado (Bs)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {datos?.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-5 py-2 font-medium text-gray-900">{p.nombre}</td>
                  <td className="px-5 py-2 text-gray-600">{p.comunidades ?? '--'}</td>
                  <td className="px-5 py-2 font-mono text-xs text-gray-600">
                    {p.codigos ?? '--'}
                    {(p.codigos?.split(',').length ?? 0) > 1 && (
                      <span className="ml-1 text-amber-700" title="Varios códigos para la misma persona">
                        ({p.codigos!.split(',').length})
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-2">
                    {p.estatus && (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        p.estatus === 'E'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-sky-100 text-sky-800'}`}>
                        {p.estatus}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-2 capitalize text-gray-600">{p.afiliacion ?? '--'}</td>
                  <td className="px-5 py-2 text-right">{p.entregas}</td>
                  <td className="px-5 py-2 text-right">{fmtKg(p.kg_guinda)}</td>
                  <td className="px-5 py-2 text-right">{fmtBs(p.total_pagado_bs)}</td>
                </tr>
              ))}
              {!cargando && datos?.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-8 text-center text-gray-500">
                  Sin resultados
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        <strong>E</strong> = café orgánico certificado. <strong>T1/T2/T3</strong> = café de transición.
        Un productor puede aparecer con varios códigos: el código identifica la parcela, no la persona.
      </p>
    </div>
  )
}
