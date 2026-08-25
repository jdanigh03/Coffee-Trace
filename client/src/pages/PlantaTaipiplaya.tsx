import { useState } from 'react'
import { Droplet, Package, Scale, Truck, AlertTriangle, Eye, GitBranch, Download } from 'lucide-react'
import { api } from '../api/client'
import { useApi, fmtKg } from '../api/useApi'
import AccionesFila, { descargarCsv } from '../components/AccionesFila'
import DetalleLote from '../components/DetalleLote'
import { FASES } from '../constants/phases'

const CAMPANIA = 2025

export default function PlantaTaipiplaya() {
  const { datos: lotes, cargando, error } = useApi(() => api.lotes({ campania: CAMPANIA }), [])
  const [loteAbierto, setLoteAbierto] = useState<string | null>(null)

  const fase = FASES.find((f) => f.id === 'II')!

  const total = lotes?.reduce(
    (a, l) => ({
      lotes: a.lotes + 1,
      guinda: a.guinda + Number(l.kg_guinda_real ?? 0),
      pergamino: a.pergamino + Number(l.kg_pergamino_calc ?? 0),
      entregas: a.entregas + Number(l.entregas ?? 0),
      observadas: a.observadas + Number(l.entregas_observadas ?? 0),
    }),
    { lotes: 0, guinda: 0, pergamino: 0, entregas: 0, observadas: 0 })

  const tarjetas = total ? [
    { label: 'Lotes de la campaña', valor: String(total.lotes), icono: Package },
    { label: 'Café guinda acopiado', valor: `${fmtKg(total.guinda)} kg`, icono: Scale },
    { label: 'Pergamino estimado', valor: `${fmtKg(total.pergamino)} kg`, icono: Droplet },
    { label: 'Entregas registradas', valor: total.entregas.toLocaleString('es-BO'), icono: Truck },
  ] : []

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Planta Taipiplaya</h1>
        <p className="text-gray-600">
          {fase.label} · {fase.subtitulo} — del acopio al despacho hacia El Alto
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-2">
          <AlertTriangle className="text-red-600 shrink-0" size={18} />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {tarjetas.map((t) => {
          const Icono = t.icono
          return (
            <div key={t.label} className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">{t.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{t.valor}</p>
                </div>
                <div className="p-2 rounded-lg border bg-amber-50 text-amber-800 border-amber-200">
                  <Icono size={20} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Las seis etapas intermedias del beneficio humedo todavia no se
          registran: se dice explicitamente en vez de mostrar datos inventados. */}
      <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
        <p className="text-sm text-sky-900">
          <strong>Las etapas intermedias aún no se registran.</strong> Descarga en tolva,
          despulpado, fermentación, lavado y secado están especificadas en el documento de
          cadena de suministro pero no existen en ningún registro. Lo que se ve aquí es el
          acopio y el despacho, que sí tienen datos.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            {cargando ? 'Cargando...' : `Lotes (${lotes?.length ?? 0})`}
          </h2>
          <button onClick={() => lotes && descargarCsv('lotes-taipiplaya', lotes)}
            disabled={!lotes?.length}
            className="flex items-center gap-1.5 text-sm text-sky-700 hover:underline
                       disabled:text-gray-300 disabled:no-underline">
            <Download size={15} /> Exportar CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-2 font-semibold">Lote</th>
                <th className="px-5 py-2 font-semibold">Certificación</th>
                <th className="px-5 py-2 font-semibold text-right">Entregas</th>
                <th className="px-5 py-2 font-semibold text-right">Guinda (kg)</th>
                <th className="px-5 py-2 font-semibold text-right">Pergamino est. (kg)</th>
                <th className="px-5 py-2 font-semibold">Estado</th>
                <th className="px-5 py-2 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lotes?.map((l) => (
                <tr key={l.codigo} className="hover:bg-gray-50">
                  <td className="px-5 py-2 font-mono font-medium">
                    <button onClick={() => setLoteAbierto(l.codigo)}
                      className="text-sky-700 hover:underline">{l.codigo}</button>
                  </td>
                  <td className="px-5 py-2 capitalize">{l.certificacion}</td>
                  <td className="px-5 py-2 text-right">{l.entregas}</td>
                  <td className="px-5 py-2 text-right">{fmtKg(l.kg_guinda_real)}</td>
                  <td className="px-5 py-2 text-right text-gray-600">
                    {fmtKg(l.kg_pergamino_calc)}
                  </td>
                  <td className="px-5 py-2 capitalize text-gray-600">{l.estado}</td>
                  <td className="px-5 py-2">
                    <AccionesFila acciones={[
                      { label: 'Ver detalle', icono: <Eye size={15} />,
                        onClick: () => setLoteAbierto(l.codigo) },
                      { label: 'Trazabilidad', icono: <GitBranch size={15} />,
                        to: `/consultas?lote=${l.codigo}` },
                    ]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DetalleLote codigo={loteAbierto} onCerrar={() => setLoteAbierto(null)} />
    </div>
  )
}
