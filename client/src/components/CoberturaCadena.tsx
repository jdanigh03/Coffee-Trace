import { CheckCircle2, Circle, Link2 } from 'lucide-react'
import type { Cobertura } from '../api/client'

/**
 * Cuantos eslabones de la cadena tienen registro.
 *
 * Este bloque es el que mide de verdad lo que aporta la plataforma: sube en
 * cuanto una etapa empieza a registrarse y baja si se deja de registrar. Nada
 * aqui es proyeccion.
 */
export default function CoberturaCadena({ datos }: { datos: Cobertura }) {
  const { etapas, etapas_cubiertas, registros, cobertura_pct } = datos
  const sinCubrir = datos.etapasDetalle.filter((e) => !e.cubierta)

  const colorFase = {
    I: 'bg-lime-100 text-lime-800',
    II: 'bg-sky-100 text-sky-800',
    III: 'bg-violet-100 text-violet-800',
  }

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Link2 size={18} className="text-gray-400" />
            Cobertura de la cadena
          </h2>
          <p className="text-sm text-gray-600">
            Eslabones del recorrido del café que tienen registro en el sistema
          </p>
        </div>
        <p className="text-3xl font-bold text-gray-900">
          {etapas_cubiertas}<span className="text-lg text-gray-400"> / {etapas}</span>
        </p>
      </div>

      <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100">
        <div className="bg-emerald-500" style={{ width: `${cobertura_pct}%` }} />
      </div>

      <p className="text-sm text-gray-700">
        <strong>{registros.toLocaleString('es-BO')} registros</strong> en total ·{' '}
        {cobertura_pct}% de la cadena documentada
        {sinCubrir.length > 0 && (
          <span className="text-amber-700">
            {' '}· sin registro: {sinCubrir.map((e) => e.etapa).join(', ')}
          </span>
        )}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5 pt-2 border-t">
        {datos.etapasDetalle.map((e) => (
          <div key={e.orden} className="flex items-center gap-2 text-sm" title={e.fuente}>
            {e.cubierta
              ? <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              : <Circle size={15} className="text-gray-300 shrink-0" />}
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              colorFase[e.fase]}`}>{e.fase}</span>
            <span className={`flex-1 truncate ${
              e.cubierta ? 'text-gray-800' : 'text-gray-400'}`}>{e.etapa}</span>
            <span className={`tabular-nums text-xs ${
              e.cubierta ? 'text-gray-600' : 'text-gray-300'}`}>
              {e.registros.toLocaleString('es-BO')}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
