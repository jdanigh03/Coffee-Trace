import {
  Sprout, Scale, PackageOpen, Cog, Recycle, Droplets, Waves, Sun, Warehouse,
  Truck, Route, ClipboardCheck, Sparkles, Wind, CheckCheck, Package, Ship,
  Globe, ChevronRight, Check, type LucideIcon,
} from 'lucide-react'
import type { EtapaCobertura } from '../../api/client'

/**
 * Las etapas de la cadena, agrupadas por fase.
 *
 * A partir de xl van en una sola linea, repartiendose el ancho disponible; por
 * debajo se apilan las tres fases. Nada tiene ancho fijo: con 18 etapas, fijar
 * el ancho obligaba a desplazar la cadena en horizontal, y un flujo que hay que
 * arrastrar para leerlo deja de leerse.
 *
 * El estado de cada etapa lo manda el API (`v_cobertura_cadena`): si una deja
 * de registrarse, la portada la muestra apagada.
 */

const ICONO: Record<number, LucideIcon> = {
  1: Sprout, 2: Scale, 3: PackageOpen, 4: Cog, 5: Recycle, 6: Droplets,
  7: Waves, 8: Sun, 9: Warehouse, 10: Truck, 11: Route, 12: ClipboardCheck,
  13: Sparkles, 14: Wind, 15: CheckCheck, 16: Package, 17: Ship, 18: Globe,
}

/** Nombres cortos: en un circulo no entra "Almacen y formacion de lote". */
const CORTO: Record<number, string> = {
  1: 'Parcelas y cosecha', 2: 'Acopio', 3: 'Descarga en tolva', 4: 'Despulpado',
  5: 'Sultana', 6: 'Fermentacion', 7: 'Lavado', 8: 'Secado',
  9: 'Almacen y lote', 10: 'Despacho a El Alto', 11: 'Transporte',
  12: 'Recepcion', 13: 'Limpieza', 14: 'Trillado', 15: 'Seleccion',
  16: 'Empaque', 17: 'Exportacion', 18: 'Mercado internacional',
}

const FASES = [
  { id: 'I' as const, titulo: 'Fase I: Produccion en campo',
    banda: 'bg-verde-50 text-verde-800', circulo: 'bg-verde-600', flecha: 'text-verde-500' },
  { id: 'II' as const, titulo: 'Fase II: Beneficio humedo - Taipiplaya',
    banda: 'bg-orange-50 text-orange-900', circulo: 'bg-orange-700', flecha: 'text-orange-400' },
  { id: 'III' as const, titulo: 'Fase III: Beneficio seco y exportacion',
    banda: 'bg-sky-50 text-sky-900', circulo: 'bg-sky-700', flecha: 'text-sky-400' },
]

/**
 * Cuanto ancho pide cada fase en la linea unica. Es el numero de etapas, pero
 * con un suelo: la Fase I tiene una sola etapa y con su parte proporcional
 * (1 de 18) el rotulo no entraba.
 */
const peso = (n: number) => Math.max(n, 2.6)

export default function FlujoTrazabilidad({ etapas }: { etapas: EtapaCobertura[] }) {
  const grupos = FASES.map((f) => ({ ...f, items: etapas.filter((e) => e.fase === f.id) }))
                      .filter((g) => g.items.length > 0)

  return (
    <div className="flex flex-col xl:flex-row gap-4 xl:gap-3">
      {grupos.map((g) => (
        <div
          key={g.id}
          // El reparto solo aplica en la linea unica: en columna, `flex-grow`
          // estiraria la altura en vez del ancho.
          style={{ '--peso': peso(g.items.length) } as React.CSSProperties}
          className="min-w-0 xl:[flex-grow:var(--peso)] xl:[flex-basis:0]">
          <p className={`text-center text-xs font-semibold rounded-md py-1.5 mb-3
                         leading-tight ${g.banda}`}>
            {g.titulo}
          </p>

          <ol className="flex flex-wrap justify-center gap-y-3 xl:flex-nowrap xl:gap-y-0">
            {g.items.map((e, i) => {
              const Icono = ICONO[e.orden] ?? Check
              return (
                <li key={e.orden}
                  className="flex items-start w-[5.5rem] xl:w-auto xl:flex-1 xl:min-w-0">
                  <div className="flex flex-col items-center text-center flex-1 min-w-0 px-0.5">
                    <span className={`w-11 h-11 xl:w-10 xl:h-10 rounded-full flex items-center
                                      justify-center text-white shrink-0 ${
                      e.cubierta ? g.circulo : 'bg-gray-300'}`}>
                      <Icono size={18} />
                    </span>
                    <span className={`mt-2 text-[10px] leading-[1.2] ${
                      e.cubierta ? 'text-gray-700' : 'text-gray-400'}`}>
                      {CORTO[e.orden] ?? e.etapa}
                    </span>
                  </div>
                  {/* Las flechas solo tienen sentido en la linea continua: al
                      envolverse en varias filas apuntarian al vacio. */}
                  {i < g.items.length - 1 && (
                    <ChevronRight size={14}
                      className={`${g.flecha} shrink-0 mt-3 -mx-0.5 hidden xl:block`} />
                  )}
                </li>
              )
            })}
          </ol>
        </div>
      ))}
    </div>
  )
}
