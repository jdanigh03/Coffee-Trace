import { Link } from 'react-router-dom'
import { Package, Users, Scale, AlertTriangle, ArrowRight } from 'lucide-react'
import { api } from '../api/client'
import { useApi, fmtBs, fmtKg } from '../api/useApi'
import Indicadores from '../components/Indicadores'

const CAMPANIA = 2025

function Tarjeta({ icono, titulo, valor, pie, tono = 'coffee' }: {
  icono: React.ReactNode; titulo: string; valor: string; pie?: string
  tono?: 'coffee' | 'sky' | 'amber'
}) {
  const tonos = {
    coffee: 'bg-amber-50 text-amber-800 border-amber-200',
    sky: 'bg-sky-50 text-sky-800 border-sky-200',
    amber: 'bg-orange-50 text-orange-800 border-orange-200',
  }
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase">{titulo}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{valor}</p>
          {pie && <p className="text-xs text-gray-500 mt-1">{pie}</p>}
        </div>
        <div className={`p-2 rounded-lg border ${tonos[tono]}`}>{icono}</div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { datos, cargando, error } = useApi(() => api.dashboard(CAMPANIA), [])
  const { datos: indicadores } = useApi(() => api.indicadores(CAMPANIA), [])

  if (cargando) {
    return <div className="p-8 text-gray-500">Cargando datos de la campaña {CAMPANIA}...</div>
  }
  if (error || !datos) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-5 flex gap-3">
          <AlertTriangle className="text-red-600 shrink-0" />
          <div>
            <p className="font-semibold text-red-900">No se pudieron cargar los datos</p>
            <p className="text-sm text-red-800 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  const { resumen, porCertificacion, porMes, lotes, inconsistencias } = datos
  const maxMes = Math.max(...porMes.map((m) => m.kg_guinda), 1)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Campaña {datos.campania}</h1>
        <p className="text-gray-600">Trazabilidad de café · ASOCAFE Taipiplaya</p>
      </div>

      {/* Los indicadores van primero: son la variable dependiente del proyecto. */}
      {indicadores && <Indicadores datos={indicadores} />}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Tarjeta icono={<Scale size={20} />} titulo="Café guinda acopiado"
          valor={`${fmtKg(resumen.kg_guinda)} kg`}
          pie={`${resumen.entregas.toLocaleString('es-BO')} entregas`} />
        <Tarjeta icono={<Users size={20} />} titulo="Productores" tono="sky"
          valor={String(resumen.productores)} pie="con entregas en la campaña" />
        <Tarjeta icono={<Package size={20} />} titulo="Pagado a productores"
          valor={`${fmtBs(resumen.total_pagado_bs)} Bs`} tono="sky" />
        <Tarjeta icono={<AlertTriangle size={20} />} titulo="Entregas observadas"
          valor={String(resumen.observadas)} tono="amber"
          pie={`${((resumen.observadas / resumen.entregas) * 100).toFixed(1)}% del total`} />
      </div>

      {inconsistencias > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="text-amber-700 shrink-0 mt-0.5" size={18} />
          <div className="flex-1">
            <p className="font-semibold text-amber-900">
              {inconsistencias} registros necesitan revisión antes de sellarse en blockchain
            </p>
            <p className="text-sm text-amber-800 mt-1">
              Sellar un dato que sabemos que está mal lo vuelve inmutablemente mal. La cola de
              blockchain los rechaza hasta que se corrijan.
            </p>
          </div>
          <Link to="/consultas"
            className="text-sm font-medium text-amber-900 hover:underline flex items-center gap-1 shrink-0">
            Ver lista <ArrowRight size={14} />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Acopio por mes</h2>
          <div className="space-y-2">
            {porMes.map((m) => (
              <div key={m.mes} className="flex items-center gap-3 text-sm">
                <span className="w-16 text-gray-600 shrink-0">{m.mes}</span>
                <div className="flex-1 bg-gray-100 rounded h-5 relative overflow-hidden">
                  <div className="bg-amber-600 h-full rounded"
                    style={{ width: `${(m.kg_guinda / maxMes) * 100}%` }} />
                </div>
                <span className="w-24 text-right text-gray-700 shrink-0">{fmtKg(m.kg_guinda)} kg</span>
                <span className="w-20 text-right text-gray-500 shrink-0">{m.precio_promedio} Bs/lata</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            El precio por lata subió de 44 a 143 Bs a lo largo de la campaña.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Por certificación</h2>
          <div className="space-y-3">
            {porCertificacion.map((c) => (
              <div key={c.certificacion} className="flex items-center justify-between">
                <div>
                  <p className="font-medium capitalize text-gray-900">{c.certificacion}</p>
                  <p className="text-xs text-gray-500">{c.lotes} lotes</p>
                </div>
                <p className="font-semibold text-gray-900">{fmtKg(c.kg_guinda)} kg</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4 pt-3 border-t">
            Orgánico y transición se manejan en lotes separados físicamente, con señalización.
            Un lote nunca mezcla ambos.
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <h2 className="font-semibold text-gray-900 p-5 pb-3">Lotes de la campaña</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-2 font-semibold">Lote</th>
                <th className="px-5 py-2 font-semibold">Certificación</th>
                <th className="px-5 py-2 font-semibold">Estado</th>
                <th className="px-5 py-2 font-semibold text-right">Entregas</th>
                <th className="px-5 py-2 font-semibold text-right">Guinda (kg)</th>
                <th className="px-5 py-2 font-semibold text-right">Observadas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lotes.map((l) => (
                <tr key={l.codigo} className="hover:bg-gray-50">
                  <td className="px-5 py-2 font-mono font-medium">
                    <Link to={`/consultas?lote=${l.codigo}`} className="text-sky-700 hover:underline">
                      {l.codigo}
                    </Link>
                  </td>
                  <td className="px-5 py-2 capitalize">{l.certificacion}</td>
                  <td className="px-5 py-2 capitalize text-gray-600">{l.estado}</td>
                  <td className="px-5 py-2 text-right">{l.entregas}</td>
                  <td className="px-5 py-2 text-right">{fmtKg(l.kg_guinda_real)}</td>
                  <td className="px-5 py-2 text-right">
                    {l.entregas_observadas > 0
                      ? <span className="text-amber-700 font-medium">{l.entregas_observadas}</span>
                      : <span className="text-gray-400">0</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
