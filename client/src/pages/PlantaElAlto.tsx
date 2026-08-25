import { useState } from 'react'
import { Cpu, Package, Scale, Percent, AlertTriangle, Eye, GitBranch, Download } from 'lucide-react'
import { api } from '../api/client'
import { useApi, fmtKg } from '../api/useApi'
import AccionesFila, { descargarCsv } from '../components/AccionesFila'
import DetalleLote from '../components/DetalleLote'
import { FASES } from '../constants/phases'

export default function PlantaElAlto() {
  const { datos: rend, cargando, error } = useApi(() => api.rendimiento(), [])
  const { datos: recon } = useApi(() => api.reconciliacion(), [])
  const [loteAbierto, setLoteAbierto] = useState<string | null>(null)

  const fase = FASES.find((f) => f.id === 'III')!
  const estadoDe = (codigo: string) => recon?.find((r) => r.codigo === codigo)?.estado

  const total = rend?.reduce((a, r) => ({
    lotes: a.lotes + 1,
    pergamino: a.pergamino + Number(r.pergamino_despachado_real ?? r.pergamino_estimado ?? 0),
    verde: a.verde + Number(r.verde_real ?? r.verde_estimado ?? 0),
    medidos: a.medidos + (r.origen_del_dato === 'medido' ? 1 : 0),
  }), { lotes: 0, pergamino: 0, verde: 0, medidos: 0 })

  const rendimiento = total && total.pergamino > 0
    ? (total.verde / total.pergamino) * 100 : null

  const tarjetas = total ? [
    { label: 'Lotes procesados', valor: String(total.lotes), icono: Package },
    { label: 'Pergamino de entrada', valor: `${fmtKg(total.pergamino)} kg`, icono: Scale },
    { label: 'Verde exportable', valor: `${fmtKg(total.verde)} kg`, icono: Cpu },
    { label: 'Rendimiento', valor: rendimiento ? `${rendimiento.toFixed(1)}%` : '--', icono: Percent },
  ] : []

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Planta El Alto</h1>
        <p className="text-gray-600">
          {fase.label} · {fase.subtitulo} — trillado, selección y despacho a exportación
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
                <div className="p-2 rounded-lg border bg-sky-50 text-sky-800 border-sky-200">
                  <Icono size={20} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {total && total.medidos === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-900">
            <strong>Ningún lote tiene el verde oro pesado.</strong> El rendimiento que se ve
            arriba sale de aplicar los factores fijos, no de una balanza. Registrar el peso
            real en esta planta es lo que convertiría este número en una medición.
          </p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            {cargando ? 'Cargando...' : `Rendimiento por lote (${rend?.length ?? 0})`}
          </h2>
          <button onClick={() => rend && descargarCsv('rendimiento-el-alto', rend)}
            disabled={!rend?.length}
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
                <th className="px-5 py-2 font-semibold text-right">Pergamino (kg)</th>
                <th className="px-5 py-2 font-semibold text-right">Verde (kg)</th>
                <th className="px-5 py-2 font-semibold text-right">Rendimiento</th>
                <th className="px-5 py-2 font-semibold">Origen del dato</th>
                <th className="px-5 py-2 font-semibold">Reconciliación</th>
                <th className="px-5 py-2 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rend?.map((r) => {
                const est = estadoDe(r.codigo)
                return (
                  <tr key={r.codigo} className="hover:bg-gray-50">
                    <td className="px-5 py-2 font-mono font-medium">
                      <button onClick={() => setLoteAbierto(r.codigo)}
                        className="text-sky-700 hover:underline">{r.codigo}</button>
                    </td>
                    <td className="px-5 py-2 capitalize">{r.certificacion}</td>
                    <td className="px-5 py-2 text-right">
                      {fmtKg(r.pergamino_despachado_real ?? r.pergamino_estimado)}
                    </td>
                    <td className="px-5 py-2 text-right">
                      {fmtKg(r.verde_real ?? r.verde_estimado)}
                    </td>
                    <td className="px-5 py-2 text-right">
                      {r.rendimiento_pct != null ? `${Number(r.rendimiento_pct).toFixed(1)}%` : '--'}
                    </td>
                    <td className="px-5 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        r.origen_del_dato === 'medido'
                          ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {r.origen_del_dato}
                      </span>
                    </td>
                    <td className="px-5 py-2">
                      {est && (
                        <span className={`text-xs ${
                          est === 'cuadra' ? 'text-green-700' : 'text-amber-700 font-medium'}`}>
                          {est}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-2">
                      <AccionesFila acciones={[
                        { label: 'Ver detalle', icono: <Eye size={15} />,
                          onClick: () => setLoteAbierto(r.codigo) },
                        { label: 'Trazabilidad', icono: <GitBranch size={15} />,
                          to: `/consultas?lote=${r.codigo}` },
                      ]} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <DetalleLote codigo={loteAbierto} onCerrar={() => setLoteAbierto(null)} />
    </div>
  )
}
