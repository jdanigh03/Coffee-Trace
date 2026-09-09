import { useState } from 'react'
import {
  Search, Check, Circle, MapPin, Ship, Truck, AlertTriangle, Loader2, Download,
} from 'lucide-react'
import { api, type LotePublico } from '../../api/client'
import { fmtKg, fmtFecha } from '../../api/useApi'

/**
 * Verificacion de un lote por el comprador, sin iniciar sesion.
 *
 * Lo que devuelve el API esta recortado a proposito: cuenta los productores y
 * nombra las comunidades, pero no los nombres de las personas ni lo que se les
 * pago. Eso es dato personal de los socios y no va en una pagina abierta.
 */

const ETIQUETA_II: Record<string, string> = {
  tolva: 'Descarga en tolva', despulpado: 'Despulpado', fermentacion: 'Fermentacion',
  lavado: 'Lavado', secado: 'Secado', almacen_temporal: 'Almacen y lote',
}
const ETIQUETA_III: Record<string, string> = {
  recepcion: 'Recepcion en El Alto', limpieza: 'Limpieza de maquinas',
  trillado: 'Trillado', seleccion: 'Seleccion', empaque: 'Empaque',
  exportacion: 'Exportacion',
}

function Hitos({ titulo, datos, etiquetas }: {
  titulo: string; datos: Record<string, boolean> | null; etiquetas: Record<string, string>
}) {
  if (!datos) return null
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{titulo}</p>
      <ul className="space-y-1">
        {Object.entries(etiquetas).map(([clave, texto]) => (
          <li key={clave} className="flex items-center gap-2 text-sm">
            {datos[clave]
              ? <Check size={14} className="text-verde-600 shrink-0" />
              : <Circle size={14} className="text-gray-300 shrink-0" />}
            <span className={datos[clave] ? 'text-gray-800' : 'text-gray-400'}>{texto}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Ficha en texto plano con lo que la pagina ya muestra. Nada mas. */
function descargarFicha(r: LotePublico) {
  const l = r.lote
  const si = (v: boolean | undefined) => (v ? 'si' : 'no')
  const lineas = [
    `FICHA DE TRAZABILIDAD - LOTE ${l.codigo}`,
    `ASOCAFE Taipiplaya - Bolivia`,
    ``,
    `Certificacion:      cafe ${l.certificacion}`,
    `Campana:            ${l.campania_id}`,
    `Estado:             ${l.estado}`,
    `Cafe guinda:        ${fmtKg(l.kg_guinda_real)} kg en ${l.entregas} entregas`,
    ``,
    `ORIGEN`,
    `Productores:        ${r.origen?.productores ?? '--'}`,
    `Comunidades:        ${r.origen?.comunidades ?? '--'}`,
    `                    ${r.origen?.lista_comunidades ?? ''}`,
    ``,
    `BENEFICIO HUMEDO`,
    ...Object.entries(ETIQUETA_II).map(
      ([k, t]) => `  ${t.padEnd(22)} ${si(r.faseII?.[k])}`),
    ``,
    `BENEFICIO SECO`,
    ...Object.entries(ETIQUETA_III).map(
      ([k, t]) => `  ${t.padEnd(22)} ${si(r.faseIII?.[k])}`),
    ``,
  ]
  if (r.envio) {
    lineas.push(
      `TRASLADO A EL ALTO`,
      `Salida:             ${fmtFecha(r.envio.fecha_salida)}`,
      `Nota de remision:   ${r.envio.nota_remision ?? '--'}`,
      `Despachado:         ${fmtKg(r.envio.kg_pergamino_despachado)} kg de pergamino`,
      `Recibido:           ${fmtKg(r.envio.kg_pergamino_recibido)} kg`,
      ``)
  }
  if (r.exportacion) {
    lineas.push(
      `EXPORTACION`,
      `Embarque:           ${fmtFecha(r.exportacion.fecha_embarque)}`,
      `Destino:            ${r.exportacion.pais ?? '--'}`,
      `Puerto de salida:   ${r.exportacion.puerto_salida ?? '--'}`,
      `Naviera:            ${r.exportacion.naviera ?? '--'}`,
      `Certificaciones:    ${r.exportacion.certificaciones?.join(', ') ?? '--'}`,
      ``)
  }
  lineas.push(
    `Generado el ${new Date().toLocaleString('es-BO')} desde CoffeeTrace.`,
    `Los datos personales de los productores y los importes pagados no se publican.`)

  const url = URL.createObjectURL(
    new Blob([lineas.join('\n')], { type: 'text/plain;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `ficha-${l.codigo}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

export default function ConsultaLote({ codigosSugeridos = [] }: { codigosSugeridos?: string[] }) {
  const [codigo, setCodigo] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<LotePublico | null>(null)

  const consultar = async (valor?: string) => {
    const buscado = (valor ?? codigo).trim()
    if (!buscado) { setError('Escriba el codigo del lote'); return }
    setCodigo(buscado)
    setBuscando(true); setError(null); setResultado(null)
    try {
      setResultado(await api.lotePublico(buscado))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo consultar el lote')
    } finally { setBuscando(false) }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && consultar()}
          placeholder="Ingrese numero de lote, por ejemplo OR-01-25"
          className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-verde-600 focus:border-verde-600"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => consultar()}
          disabled={buscando}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-verde-700
                     text-white rounded-lg text-sm font-medium hover:bg-verde-800
                     disabled:bg-gray-300 transition">
          {buscando ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          Consultar
        </button>
        {/* La ficha se ofrece solo cuando hay algo que descargar. */}
        {resultado && (
          <button
            onClick={() => descargarFicha(resultado)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border
                       border-gray-300 rounded-lg text-sm font-medium text-gray-700
                       hover:bg-gray-50 transition">
            <Download size={16} /> Descargar ficha
          </button>
        )}
      </div>

      {codigosSugeridos.length > 0 && !resultado && (
        <p className="text-xs text-gray-500">
          Lotes de la campana:{' '}
          {codigosSugeridos.map((c, i) => (
            <span key={c}>
              {i > 0 && ', '}
              <button onClick={() => consultar(c)}
                className="font-mono text-verde-800 hover:underline">{c}</button>
            </span>
          ))}
        </p>
      )}

      {error && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200
                        rounded-lg p-3 text-sm text-amber-900">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {resultado && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex flex-wrap
                          items-baseline justify-between gap-2">
            <div>
              <p className="font-mono font-bold text-gray-900">{resultado.lote.codigo}</p>
              <p className="text-xs text-gray-600 capitalize">
                Cafe {resultado.lote.certificacion} · campana {resultado.lote.campania_id} ·{' '}
                {resultado.lote.estado}
              </p>
            </div>
            <p className="text-sm text-gray-700">
              {fmtKg(resultado.lote.kg_guinda_real)} kg de cafe guinda ·{' '}
              {resultado.lote.entregas} entregas
            </p>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Origen</p>
                {resultado.origen && (
                  <>
                    <p className="text-sm text-gray-800 flex items-start gap-1.5">
                      <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
                      {resultado.origen.productores} productores de{' '}
                      {resultado.origen.comunidades} comunidades
                    </p>
                    {resultado.origen.lista_comunidades && (
                      <p className="text-xs text-gray-500 mt-1 leading-snug">
                        {resultado.origen.lista_comunidades}
                      </p>
                    )}
                  </>
                )}
              </div>
              {resultado.envio && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Traslado</p>
                  <p className="text-sm text-gray-800 flex items-start gap-1.5">
                    <Truck size={14} className="text-gray-400 shrink-0 mt-0.5" />
                    Taipiplaya → El Alto, {fmtFecha(resultado.envio.fecha_salida)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {resultado.envio.nota_remision
                      ? `Nota de remision ${resultado.envio.nota_remision}. ` : ''}
                    {resultado.envio.kg_pergamino_recibido != null
                      ? `Recibido ${fmtKg(resultado.envio.kg_pergamino_recibido)} kg de pergamino.`
                      : ''}
                  </p>
                </div>
              )}
            </div>

            <Hitos titulo="Beneficio humedo" datos={resultado.faseII} etiquetas={ETIQUETA_II} />
            <Hitos titulo="Beneficio seco" datos={resultado.faseIII} etiquetas={ETIQUETA_III} />
          </div>

          {resultado.exportacion && (
            <div className="px-4 py-3 border-t border-gray-100 bg-verde-50">
              <p className="text-sm text-gray-800 flex items-start gap-1.5">
                <Ship size={15} className="text-verde-700 shrink-0 mt-0.5" />
                Embarcado el {fmtFecha(resultado.exportacion.fecha_embarque)}
                {resultado.exportacion.pais && ` con destino a ${resultado.exportacion.pais}`}
                {resultado.exportacion.puerto_salida &&
                  `, por el puerto de ${resultado.exportacion.puerto_salida}`}
                {resultado.exportacion.naviera && ` (${resultado.exportacion.naviera})`}.
              </p>
              {resultado.exportacion.certificaciones?.length ? (
                <p className="text-xs text-gray-600 mt-1">
                  Certificaciones: {resultado.exportacion.certificaciones.join(' · ')}
                </p>
              ) : null}
            </div>
          )}

          <p className="px-4 py-2.5 text-xs text-gray-500 border-t border-gray-100">
            Los datos de cada productor y los importes pagados no se publican.
          </p>
        </div>
      )}
    </div>
  )
}
