import { ArrowRight, FlaskConical, ShieldCheck, Briefcase } from 'lucide-react'
import type { Escenario } from '../api/client'
import { fmtKg } from '../api/useApi'

const pct = (n: number | null | undefined) => (n == null ? '--' : `${n.toFixed(2)}%`)

const delta = (antes: number | null | undefined, despues: number | null | undefined) => {
  if (antes == null || despues == null) return null
  const d = despues - antes
  return { valor: d, texto: `${d >= 0 ? '+' : ''}${d.toFixed(2)} pp`, sube: d >= 0 }
}

const deltaKg = (antes: number, despues: number) => {
  const d = despues - antes
  return `${d >= 0 ? '+' : '−'}${fmtKg(Math.abs(d))} kg`
}

/**
 * Comparativo entre lo que la plataforma mide hoy y dos escenarios.
 *
 * Van separados a proposito. El escenario A depende solo de registrar: el TND
 * es cafe cuya disposicion final no puede acreditarse, y documentar toda
 * salida lo elimina. El B exige que alguien salga a colocar el inventario, y
 * eso la trazabilidad lo habilita pero no lo hace. Presentarlos en una sola
 * columna deja el numero sin defensa.
 */
export default function EscenarioPropuesto({ datos }: { datos: Escenario }) {
  const filas = [
    {
      sigla: 'TEE', nombre: 'Tasa de Eficiencia Exportadora',
      hoy: datos.tee, a: datos.tee_a, b: datos.tee_b,
      kgHoy: datos.voe, kgA: datos.voe_a, kgB: datos.voe_b, unidad: 'exportados',
      principal: true,
    },
    {
      sigla: 'TIN', nombre: 'Tasa de Inmovilizacion de Inventario',
      hoy: datos.tin, a: datos.tin_a, b: datos.tin_b,
      kgHoy: datos.vos, kgA: datos.vos_a, kgB: datos.vos_b, unidad: 'en almacén',
    },
    {
      sigla: 'TND', nombre: 'Tasa de Producto sin Destino Documentado',
      hoy: datos.tnd, a: datos.tnd_a, b: datos.tnd_b,
      kgHoy: datos.vond, kgA: datos.vond_a, kgB: datos.vond_b, unidad: 'sin acreditar',
    },
  ]

  /** En TIN y TND bajar es mejorar; en TEE es al reves. */
  const tono = (f: typeof filas[number], d: ReturnType<typeof delta>) => {
    if (!d || d.valor === 0) return 'text-gray-400'
    const bueno = f.principal ? d.sube : !d.sube
    return bueno ? 'text-emerald-700' : 'text-gray-500'
  }

  return (
    <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-5 pb-4 border-b border-gray-100">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg border border-violet-200 bg-violet-50 text-violet-700">
            <FlaskConical size={18} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900">Escenarios de mejora</h2>
            <p className="text-sm text-gray-600">
              El volumen físico no cambia en ningún escenario: cambia su destino documentado.
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wide text-violet-700
                           bg-violet-50 border border-violet-200 rounded px-2 py-1 shrink-0">
            Proyección
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-gray-500">
            <tr className="bg-gray-50">
              <th className="px-5 py-2 font-semibold uppercase">Indicador</th>
              <th className="px-4 py-2 font-semibold uppercase text-right">
                Situación actual
                <span className="block font-normal normal-case text-[11px] text-gray-400">
                  medido
                </span>
              </th>
              <th className="px-4 py-2 font-semibold uppercase text-right bg-emerald-50/70">
                <span className="flex items-center justify-end gap-1 text-emerald-800">
                  <ShieldCheck size={12} /> Escenario A
                </span>
                <span className="block font-normal normal-case text-[11px] text-emerald-700">
                  atribuible al sistema
                </span>
              </th>
              <th className="px-4 py-2 font-semibold uppercase text-right bg-violet-50/70">
                <span className="flex items-center justify-end gap-1 text-violet-800">
                  <Briefcase size={12} /> Escenario B
                </span>
                <span className="block font-normal normal-case text-[11px] text-violet-700">
                  + decisión comercial
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr className="text-gray-600">
              <td className="px-5 py-2">Café verde oro producido</td>
              <td className="px-4 py-2 text-right tabular-nums">{fmtKg(datos.vop)} kg</td>
              <td className="px-4 py-2 text-right tabular-nums bg-emerald-50/40">
                {fmtKg(datos.vop)} kg
              </td>
              <td className="px-4 py-2 text-right tabular-nums bg-violet-50/40">
                {fmtKg(datos.vop)} kg
              </td>
            </tr>
            {filas.map((f) => {
              const dA = delta(f.hoy, f.a)
              const dB = delta(f.hoy, f.b)
              return (
                <tr key={f.sigla} className={f.principal ? 'bg-gray-50/60' : ''}>
                  <td className="px-5 py-3">
                    <span className="font-semibold text-gray-900">{f.sigla}</span>
                    <span className="text-gray-500"> · {f.nombre}</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {fmtKg(f.kgHoy)} <ArrowRight size={10} className="inline mx-0.5" />{' '}
                      {fmtKg(f.kgA)} <ArrowRight size={10} className="inline mx-0.5" />{' '}
                      {fmtKg(f.kgB)} kg {f.unidad}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-900">
                    {pct(f.hoy)}
                  </td>
                  <td className="px-4 py-3 text-right bg-emerald-50/40">
                    <span className="tabular-nums font-semibold text-gray-900">{pct(f.a)}</span>
                    <span className={`block text-xs tabular-nums ${tono(f, dA)}`}>
                      {dA && dA.valor === 0
                        ? 'sin cambio'
                        : `${dA?.texto ?? '--'} · ${deltaKg(f.kgHoy, f.kgA)}`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right bg-violet-50/40">
                    <span className="tabular-nums font-semibold text-gray-900">{pct(f.b)}</span>
                    <span className={`block text-xs tabular-nums ${tono(f, dB)}`}>
                      {dB && dB.valor === 0
                        ? 'sin cambio'
                        : `${dB?.texto ?? '--'} · ${deltaKg(f.kgHoy, f.kgB)}`}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x
                      divide-gray-100 border-t border-gray-100">
        <div className="p-5 bg-emerald-50/40">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-800
                        flex items-center gap-1.5 mb-2">
            <ShieldCheck size={13} /> Escenario A — lo produce el sistema
          </p>
          <p className="text-sm text-gray-700">
            El TND es, literalmente, café cuya disposición final no puede acreditarse. Al
            registrar toda salida con su destino, esos{' '}
            <strong>{fmtKg(datos.vond)} kg</strong> quedan documentados y el indicador baja a
            cero. <strong>No depende de que nadie tome ninguna decisión</strong>: ocurre por
            registrar.
          </p>
        </div>
        <div className="p-5 bg-violet-50/40">
          <p className="text-xs font-bold uppercase tracking-wide text-violet-800
                        flex items-center gap-1.5 mb-2">
            <Briefcase size={13} /> Escenario B — exige decisión comercial
          </p>
          <ul className="text-sm text-gray-700 space-y-1.5">
            {datos.porCertificacion.map((c) => (
              <li key={c.certificacion}>
                Inventario <span className="capitalize font-medium">{c.certificacion}</span> al{' '}
                <strong>{c.tin_meta_pct}%</strong> del verde oro producido:{' '}
                {fmtKg(c.vos)} → {fmtKg(c.vos_b)} kg.
              </li>
            ))}
          </ul>
          <p className="text-sm text-gray-700 mt-2">
            La composición documentada permite comprometer el lote con el comprador antes de
            cerrar campaña, pero <strong>alguien tiene que salir a colocar ese café</strong>: la
            trazabilidad lo habilita, no lo ejecuta.
          </p>
        </div>
      </div>

      <p className="px-5 py-3 text-xs text-gray-500 bg-gray-50 border-t border-gray-100">
        Las metas de inventario son parámetros editables en Configuración (grupo{' '}
        <span className="font-mono">escenario</span>): si la asociación revisa la meta, esta
        tabla se recalcula sola.
      </p>
    </section>
  )
}
