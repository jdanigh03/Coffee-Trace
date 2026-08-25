import { Link } from 'react-router-dom'
import { ExternalLink, ShieldCheck, ShieldOff, AlertTriangle } from 'lucide-react'
import { api } from '../api/client'
import { useApi, fmtBs, fmtKg, fmtFecha } from '../api/useApi'
import Drawer, { Dato, Seccion } from './Drawer'

export default function DetalleLote({ codigo, onCerrar }: {
  codigo: string | null; onCerrar: () => void
}) {
  const { datos: l, cargando, error } = useApi(
    () => (codigo ? api.lote(codigo) : Promise.resolve(null)), [codigo])

  return (
    <Drawer abierto={Boolean(codigo)} onCerrar={onCerrar}
      titulo={codigo ?? ''}
      subtitulo={l ? `${l.certificacion} · campaña ${l.campania_id} · ${l.estado}` : undefined}>

      {cargando && <p className="text-gray-500">Cargando lote...</p>}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 flex gap-2">
          <AlertTriangle className="text-red-600 shrink-0" size={18} />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {l && (
        <>
          <Seccion titulo="Acopio">
            <dl>
              <Dato label="Entregas" destacado>{l.entregas}</Dato>
              <Dato label="Café guinda" destacado>{fmtKg(l.kg_guinda_real)} kg</Dato>
              <Dato label="Latas">{fmtKg(l.latas)}</Dato>
              <Dato label="Pagado a productores">{fmtBs(l.total_pagado_bs)} Bs</Dato>
              <Dato label="Entregas observadas">
                {l.entregas_observadas > 0
                  ? <span className="text-amber-700 font-medium">{l.entregas_observadas}</span>
                  : <span className="text-gray-400">0</span>}
              </Dato>
            </dl>
          </Seccion>

          <Seccion titulo="Equivalencias calculadas"
            aviso="Estimadas con factores fijos: nadie pesó estos productos.">
            <dl>
              <Dato label="Mote">{fmtKg(l.kg_mote_calc)} kg</Dato>
              <Dato label="Pergamino">{fmtKg(l.kg_pergamino_calc)} kg</Dato>
              <Dato label="Verde oro">{fmtKg(l.kg_verde_oro_calc)} kg</Dato>
            </dl>
          </Seccion>

          <Seccion titulo="Envío a La Paz">
            {l.envio ? (
              <dl>
                <Dato label="Salida">{fmtFecha(l.envio.fecha_salida)}</Dato>
                <Dato label="Llegada">
                  {l.envio.fecha_llegada
                    ? fmtFecha(l.envio.fecha_llegada)
                    : <span className="text-amber-700">sin confirmar</span>}
                </Dato>
                <Dato label="Pergamino despachado" destacado>
                  {fmtKg(l.envio.kg_pergamino_despachado)} kg
                </Dato>
                <Dato label="Pergamino recibido">
                  {l.envio.kg_pergamino_recibido != null
                    ? `${fmtKg(l.envio.kg_pergamino_recibido)} kg`
                    : <span className="text-amber-700">no registrado</span>}
                </Dato>
                {l.envio.diferencia_kg != null && (
                  <Dato label="Diferencia">{fmtKg(l.envio.diferencia_kg)} kg</Dato>
                )}
                <Dato label="Nota de remisión">{l.envio.nota_remision ?? '--'}</Dato>
                <Dato label="Vehículo">{l.envio.vehiculo ?? '--'}</Dato>
              </dl>
            ) : <p className="text-sm text-gray-400">Sin envío registrado</p>}
          </Seccion>

          <Seccion titulo="Beneficio seco">
            {l.beneficio ? (
              <dl>
                <Dato label="Pergamino de entrada" destacado>
                  {fmtKg(l.beneficio.kg_pergamino_entrada)} kg
                </Dato>
                <Dato label="Verde exportable">
                  {l.beneficio.kg_verde_real != null
                    ? `${fmtKg(l.beneficio.kg_verde_real)} kg (medido)`
                    : `${fmtKg(l.beneficio.kg_verde_calc)} kg (estimado)`}
                </Dato>
                <Dato label="Caracol">{fmtKg(l.beneficio.kg_caracol_calc)} kg</Dato>
                <Dato label="Descarte">{fmtKg(l.beneficio.kg_descarte_calc)} kg</Dato>
                <Dato label="Rendimiento">
                  {l.beneficio.rendimiento_pct != null
                    ? `${Number(l.beneficio.rendimiento_pct).toFixed(2)}%` : '--'}
                </Dato>
              </dl>
            ) : <p className="text-sm text-gray-400">Sin beneficio registrado</p>}
          </Seccion>

          {l.muestras.length > 0 && (
            <Seccion titulo={`Muestras (${l.muestras.length})`}>
              <dl>
                {l.muestras.map((m, i) => (
                  <Dato key={i} label={`${m.tipo} · ${fmtFecha(m.fecha)}`}>
                    {fmtKg(m.kg)} kg {m.motivo && <span className="text-gray-500">· {m.motivo}</span>}
                  </Dato>
                ))}
              </dl>
            </Seccion>
          )}

          {l.despachos.length > 0 && (
            <Seccion titulo="Despachos">
              <dl>
                {l.despachos.map((d, i) => (
                  <Dato key={i} label={`${d.cliente ?? 'sin cliente'} · ${fmtFecha(d.fecha_despacho)}`}>
                    {fmtKg(d.kg_asignados)} kg {d.pais && <span className="text-gray-500">→ {d.pais}</span>}
                  </Dato>
                ))}
              </dl>
            </Seccion>
          )}

          {l.reconciliacion && (
            <Seccion titulo="Reconciliación">
              <div className={`rounded p-3 text-sm ${
                l.reconciliacion.estado === 'cuadra'
                  ? 'bg-green-50 border border-green-200 text-green-900'
                  : 'bg-amber-50 border border-amber-200 text-amber-900'}`}>
                <p className="font-medium capitalize">{l.reconciliacion.estado}</p>
                <p className="text-xs mt-1">
                  Acopio {fmtKg(l.reconciliacion.kg_acopio)} kg · beneficio{' '}
                  {fmtKg(l.reconciliacion.kg_beneficio)} kg · diferencia{' '}
                  {fmtKg(l.reconciliacion.diferencia)} kg
                </p>
              </div>
            </Seccion>
          )}

          <Seccion titulo="Blockchain">
            <div className={`rounded p-3 flex items-start gap-2 text-sm ${
              l.sellosBlockchain.length > 0
                ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
              {l.sellosBlockchain.length > 0
                ? <ShieldCheck size={18} className="text-green-700 shrink-0 mt-0.5" />
                : <ShieldOff size={18} className="text-gray-400 shrink-0 mt-0.5" />}
              <p className={l.sellosBlockchain.length > 0 ? 'text-green-900' : 'text-gray-600'}>
                {l.sellosBlockchain.length > 0
                  ? `${l.sellosBlockchain.length} sellos registrados`
                  : 'Sin sellar. Se sellará cuando la red Fabric esté operativa.'}
              </p>
            </div>
          </Seccion>

          <Seccion titulo={`Productores (${l.productores.length})`}>
            <div className="border border-gray-200 rounded overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {l.productores.map((p, i) => (
                    <tr key={i}>
                      <td className="px-3 py-1.5">
                        {p.persona ?? <span className="text-amber-700" title="Nombre sin emparejar en el padrón">
                          {p.nombre_excel}</span>}
                      </td>
                      <td className="px-3 py-1.5 text-right text-gray-600">
                        {fmtKg(p.kg_guinda)} kg
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Seccion>

          <Link to={`/consultas?lote=${encodeURIComponent(l.codigo)}`} onClick={onCerrar}
            className="inline-flex items-center gap-1.5 text-sm text-sky-700 hover:underline">
            Ver trazabilidad completa <ExternalLink size={14} />
          </Link>
        </>
      )}
    </Drawer>
  )
}
