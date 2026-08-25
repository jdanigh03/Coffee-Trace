import { AlertTriangle } from 'lucide-react'
import { api } from '../api/client'
import { useApi, fmtBs, fmtKg, fmtFecha } from '../api/useApi'
import Drawer, { Dato, Seccion } from './Drawer'

export default function DetalleProductor({ id, onCerrar, onVerLote }: {
  id: string | null
  onCerrar: () => void
  /** Permite saltar del productor a uno de sus lotes sin cerrar el flujo. */
  onVerLote?: (codigo: string) => void
}) {
  const { datos: p, cargando, error } = useApi(
    () => (id ? api.productor(id) : Promise.resolve(null)), [id])

  const pago = p?.pagos?.[0]

  return (
    <Drawer abierto={Boolean(id)} onCerrar={onCerrar}
      titulo={p?.nombre ?? 'Productor'}
      subtitulo={p ? `${p.parcelas.length} parcela(s) · ${p.entregas.length} entregas` : undefined}>

      {cargando && <p className="text-gray-500">Cargando productor...</p>}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 flex gap-2">
          <AlertTriangle className="text-red-600 shrink-0" size={18} />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {p && (
        <>
          <Seccion titulo="Datos">
            <dl>
              <Dato label="Nombre" destacado>{p.nombre}</Dato>
              <Dato label="Cédula">{p.ci ?? <span className="text-gray-400">no registrada</span>}</Dato>
              <Dato label="Teléfono">{p.telefono ?? <span className="text-gray-400">--</span>}</Dato>
              <Dato label="Estado">{p.activo ? 'Activo' : 'Inactivo'}</Dato>
            </dl>
          </Seccion>

          {pago && (
            <Seccion titulo={`Campaña ${pago.campania_id}`}>
              <dl>
                <Dato label="Entregas" destacado>{pago.entregas}</Dato>
                <Dato label="Café guinda" destacado>{fmtKg(pago.kg_guinda)} kg</Dato>
                <Dato label="Latas">{fmtKg(pago.latas)}</Dato>
                <Dato label="Precio promedio">{fmtBs(pago.precio_promedio_bs)} Bs/lata</Dato>
                <Dato label="Total pagado" destacado>{fmtBs(pago.total_pagado_bs)} Bs</Dato>
              </dl>
            </Seccion>
          )}

          <Seccion titulo={`Parcelas (${p.parcelas.length})`}>
            <div className="space-y-2">
              {p.parcelas.map((pa) => (
                <div key={pa.id} className="border border-gray-200 rounded p-3">
                  <div className="flex items-baseline justify-between">
                    <p className="font-medium text-gray-900">{pa.comunidad}</p>
                    {pa.estatus && (
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        pa.estatus === 'E'
                          ? 'bg-green-100 text-green-800' : 'bg-sky-100 text-sky-800'}`}>
                        {pa.estatus}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">{pa.codigos ?? '--'}</p>
                  {pa.hectareas != null && (
                    <p className="text-xs text-gray-600">{pa.hectareas} ha</p>
                  )}
                </div>
              ))}
            </div>
          </Seccion>

          <Seccion titulo={`Entregas (${p.entregas.length})`}>
            <div className="border border-gray-200 rounded overflow-hidden max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Fecha</th>
                    <th className="px-3 py-2 font-semibold">Lote</th>
                    <th className="px-3 py-2 font-semibold text-right">Kg</th>
                    <th className="px-3 py-2 font-semibold text-right">Bs</th>
                    <th className="px-3 py-2 font-semibold" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {p.entregas.map((e, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-1.5 whitespace-nowrap">{fmtFecha(e.fecha)}</td>
                      <td className="px-3 py-1.5">
                        {e.lote ? (
                          <button onClick={() => onVerLote?.(e.lote!)}
                            className="font-mono text-sky-700 hover:underline">
                            {e.lote}
                          </button>
                        ) : <span className="text-gray-400">sin lote</span>}
                      </td>
                      <td className="px-3 py-1.5 text-right">{fmtKg(e.kg_guinda_real)}</td>
                      <td className="px-3 py-1.5 text-right">{fmtBs(e.total_pagado_bs)}</td>
                      <td className="px-3 py-1.5">
                        {e.revision !== 'ok' && (
                          <span title="Entrega observada" className="text-amber-600">
                            <AlertTriangle size={13} />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Seccion>
        </>
      )}
    </Drawer>
  )
}
