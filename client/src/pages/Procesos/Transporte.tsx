import { useState } from 'react'
import { AlertTriangle, Eye, GitBranch, Download } from 'lucide-react'
import { api } from '../../api/client'
import { useApi, fmtKg, fmtFecha } from '../../api/useApi'
import AccionesFila, { descargarCsv } from '../../components/AccionesFila'
import DetalleLote from '../../components/DetalleLote'
import PhaseStepper from '../../components/PhaseStepper'
import { ProcessPhase } from '../../types'

export default function Transporte() {
  const { datos, cargando, error } = useApi(() => api.envios(), [])
  const [loteAbierto, setLoteAbierto] = useState<string | null>(null)

  const sinConfirmar = datos?.filter((e) => e.kg_pergamino_recibido == null).length ?? 0
  const totalKg = datos?.reduce((a, e) => a + Number(e.kg_pergamino_despachado ?? 0), 0) ?? 0

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transporte a La Paz</h1>
        <p className="text-gray-600">
          Fase III · lo que viaja es café pergamino seco
        </p>
      </div>

      <PhaseStepper currentPhase={ProcessPhase.TRANSPORTE} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase">Envíos</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{datos?.length ?? 0}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase">Pergamino despachado</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{fmtKg(totalKg)} kg</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase">Sin confirmar recepción</p>
          <p className={`text-2xl font-bold mt-1 ${
            sinConfirmar > 0 ? 'text-amber-700' : 'text-gray-900'}`}>{sinConfirmar}</p>
        </div>
      </div>

      {sinConfirmar > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
          <AlertTriangle className="text-amber-700 shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-amber-900">
            <strong>{sinConfirmar} envíos salieron sin que se registre el peso recibido.</strong>{' '}
            Sin ese dato no se puede calcular la merma real de transporte: la diferencia entre
            lo despachado y lo recibido queda sin acreditar.
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
            {cargando ? 'Cargando...' : `Envíos (${datos?.length ?? 0})`}
          </h2>
          <button onClick={() => datos && descargarCsv('envios', datos)}
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
                <th className="px-5 py-2 font-semibold">Salida</th>
                <th className="px-5 py-2 font-semibold">Lote</th>
                <th className="px-5 py-2 font-semibold">Certificación</th>
                <th className="px-5 py-2 font-semibold text-right">Despachado (kg)</th>
                <th className="px-5 py-2 font-semibold text-right">Recibido (kg)</th>
                <th className="px-5 py-2 font-semibold text-right">Diferencia</th>
                <th className="px-5 py-2 font-semibold">Nota remisión</th>
                <th className="px-5 py-2 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {datos?.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-5 py-2 whitespace-nowrap">{fmtFecha(e.fecha_salida)}</td>
                  <td className="px-5 py-2 font-mono font-medium">
                    <button onClick={() => setLoteAbierto(e.lote)}
                      className="text-sky-700 hover:underline">{e.lote}</button>
                  </td>
                  <td className="px-5 py-2 capitalize">{e.certificacion}</td>
                  <td className="px-5 py-2 text-right">{fmtKg(e.kg_pergamino_despachado)}</td>
                  <td className="px-5 py-2 text-right">
                    {e.kg_pergamino_recibido != null
                      ? fmtKg(e.kg_pergamino_recibido)
                      : <span className="text-amber-700 text-xs">pendiente</span>}
                  </td>
                  <td className="px-5 py-2 text-right">
                    {e.diferencia_kg != null ? fmtKg(e.diferencia_kg) : '--'}
                  </td>
                  <td className="px-5 py-2 text-gray-500 text-xs">
                    {e.nota_remision ?? <span className="text-gray-400">en papel</span>}
                  </td>
                  <td className="px-5 py-2">
                    <AccionesFila acciones={[
                      { label: 'Ver lote', icono: <Eye size={15} />,
                        onClick: () => setLoteAbierto(e.lote) },
                      { label: 'Trazabilidad', icono: <GitBranch size={15} />,
                        to: `/consultas?lote=${e.lote}` },
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
