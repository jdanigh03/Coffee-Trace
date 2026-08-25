import { useState } from 'react'
import { AlertTriangle, Eye, Download, FileText } from 'lucide-react'
import { api } from '../../api/client'
import { useApi, fmtKg, fmtFecha } from '../../api/useApi'
import AccionesFila, { descargarCsv } from '../../components/AccionesFila'
import DetalleLote from '../../components/DetalleLote'
import PhaseStepper from '../../components/PhaseStepper'
import { ProcessPhase } from '../../types'

export default function Exportacion() {
  const { datos, cargando, error } = useApi(() => api.despachos(), [])
  const { datos: config } = useApi(() => api.configuracion(), [])
  const [loteAbierto, setLoteAbierto] = useState<string | null>(null)

  const totalKg = datos?.reduce((a, d) => a + Number(d.kg_neto ?? d.total_kg ?? 0), 0) ?? 0
  const conBl = datos?.filter((d) => d.bl_numero).length ?? 0

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Despacho y exportación</h1>
        <p className="text-gray-600">
          Fase III · contratos, contenedores y documentación de embarque
        </p>
      </div>

      <PhaseStepper currentPhase={ProcessPhase.EXPORTACION} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase">Despachos</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{datos?.length ?? 0}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase">Volumen despachado</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{fmtKg(totalKg)} kg</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase">Código ICO</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 font-mono">
            {config?.organizacion?.codigo_ico ?? '--'}
          </p>
        </div>
      </div>

      {datos && conBl < datos.length && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
          <AlertTriangle className="text-amber-700 shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-amber-900">
            <strong>{datos.length - conBl} de {datos.length} despachos sin número de BL.</strong>{' '}
            Sin documentación de embarque verificable no cuentan como exportado en la TEE:
            pasan a computar como producto sin destino documentado.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-2">
          <AlertTriangle className="text-red-600 shrink-0" size={18} />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            {cargando ? 'Cargando...' : `Despachos (${datos?.length ?? 0})`}
          </h2>
          <button onClick={() => datos && descargarCsv('despachos', datos)}
            disabled={!datos?.length}
            className="flex items-center gap-1.5 text-sm text-sky-700 hover:underline
                       disabled:text-gray-300 disabled:no-underline">
            <Download size={15} /> Exportar CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-2 font-semibold">Fecha</th>
                <th className="px-5 py-2 font-semibold">Cliente</th>
                <th className="px-5 py-2 font-semibold">Contrato</th>
                <th className="px-5 py-2 font-semibold">Lotes</th>
                <th className="px-5 py-2 font-semibold text-right">Kg</th>
                <th className="px-5 py-2 font-semibold">Empaque</th>
                <th className="px-5 py-2 font-semibold">BL</th>
                <th className="px-5 py-2 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {datos?.map((d) => {
                const codigos = (d.codigos_lote ?? '').split(',').map((s) => s.trim()).filter(Boolean)
                return (
                  <tr key={d.id} className="hover:bg-gray-50 align-top">
                    <td className="px-5 py-2 whitespace-nowrap">{fmtFecha(d.fecha_despacho)}</td>
                    <td className="px-5 py-2">
                      <p className="font-medium text-gray-900">{d.cliente ?? '--'}</p>
                      <p className="text-xs text-gray-500">{d.pais}</p>
                    </td>
                    <td className="px-5 py-2 font-mono text-xs">{d.contrato ?? '--'}</td>
                    <td className="px-5 py-2">
                      <div className="flex flex-wrap gap-1 max-w-[16rem]">
                        {codigos.map((c) => (
                          <button key={c} onClick={() => setLoteAbierto(c)}
                            className="font-mono text-xs px-1.5 py-0.5 rounded bg-sky-50
                                       text-sky-700 hover:bg-sky-100 border border-sky-200">
                            {c}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-2 text-right">{fmtKg(d.kg_neto ?? d.total_kg)}</td>
                    <td className="px-5 py-2 capitalize text-gray-600">{d.tipo_empaque ?? '--'}</td>
                    <td className="px-5 py-2">
                      {d.bl_numero
                        ? <span className="font-mono text-xs">{d.bl_numero}</span>
                        : <span className="text-amber-700 text-xs">sin BL</span>}
                    </td>
                    <td className="px-5 py-2">
                      <AccionesFila acciones={[
                        { label: codigos.length ? `Ver lote ${codigos[0]}` : 'Sin lotes',
                          icono: <Eye size={15} />,
                          onClick: () => setLoteAbierto(codigos[0]),
                          deshabilitadaPor: codigos.length ? undefined : 'Despacho sin lotes' },
                        { label: d.bl_numero
                            ? `BL ${d.bl_numero} · ${d.naviera ?? 'sin naviera'}`
                            : 'Sin documentación de embarque',
                          icono: <FileText size={15} />,
                          deshabilitadaPor: d.bl_numero ? undefined : 'Sin documentación de embarque' },
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
