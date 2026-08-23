import { ProcessPhase } from '../types'

/** Bloque de la cadena. Agrupa las etapas por lugar y por proceso. */
export type FaseId = 'I' | 'II' | 'III'

export interface FaseDefinition {
  id: FaseId
  label: string
  subtitulo: string
  plant: 'Campo' | 'Taipiplaya' | 'El Alto'
}

export const FASES: FaseDefinition[] = [
  { id: 'I',   label: 'Fase I',   subtitulo: 'Produccion en campo',  plant: 'Campo' },
  { id: 'II',  label: 'Fase II',  subtitulo: 'Beneficio humedo',     plant: 'Taipiplaya' },
  { id: 'III', label: 'Fase III', subtitulo: 'Beneficio seco',       plant: 'El Alto' },
]

export interface PhaseDefinition {
  /** Orden dentro de la cadena completa (1..N) */
  order: number
  /** Orden dentro de su fase, para numerar el stepper de cada bloque */
  ordenEnFase: number
  fase: FaseId
  phase: ProcessPhase
  label: string
  /** Ruta de la pantalla que registra esta etapa */
  path: string
  /** Actor responsable segun el workflow */
  actor: string
  plant: 'Campo' | 'Taipiplaya' | 'El Alto' | 'Transito' | 'Puerto'
  /**
   * true = la etapa esta especificada pero todavia no tiene pantalla ni datos.
   * El documento de cadena de suministro las marca como "algo que se debe
   * agregar": hoy no existen en ningun registro de ASOCAFE.
   */
  pendiente?: boolean
}

/**
 * Cadena de trazabilidad canonica, agrupada en tres fases.
 *
 * Fase II y Fase III siguen la especificacion del documento de cadena de
 * suministro. Fase I cubre el origen en parcela: sin ella la trazabilidad no
 * llega hasta el productor, que es lo que exige el certificado de origen.
 *
 * Toda pantalla que dibuje el stepper debe leer de aqui para que las etapas no
 * se desincronicen entre vistas.
 */
export const PHASES: PhaseDefinition[] = [
  // ---------- Fase I: produccion en campo ----------
  { order: 1, ordenEnFase: 1, fase: 'I', phase: ProcessPhase.PRODUCTOR, label: 'Parcelas y cosecha', path: '/productores', actor: 'Productor', plant: 'Campo' },

  // ---------- Fase II: beneficio humedo (Taipiplaya) ----------
  { order: 2,  ordenEnFase: 1, fase: 'II', phase: ProcessPhase.ACOPIO,        label: 'Acopio',              path: '/acopio',                   actor: 'Operador de Acopio', plant: 'Taipiplaya' },
  { order: 3,  ordenEnFase: 2, fase: 'II', phase: ProcessPhase.TOLVA,         label: 'Descarga en tolva',   path: '/procesos/tolva',           actor: 'Operario de Tolva',  plant: 'Taipiplaya', pendiente: true },
  { order: 4,  ordenEnFase: 3, fase: 'II', phase: ProcessPhase.DESPULPADO,    label: 'Despulpado',          path: '/procesos/despulpado',      actor: 'Jefe de Maquinas',   plant: 'Taipiplaya', pendiente: true },
  { order: 5,  ordenEnFase: 4, fase: 'II', phase: ProcessPhase.FERMENTACION,  label: 'Fermentacion',        path: '/procesos/fermentacion',    actor: 'Jefe de Lavado',     plant: 'Taipiplaya', pendiente: true },
  { order: 6,  ordenEnFase: 5, fase: 'II', phase: ProcessPhase.LAVADO,        label: 'Lavado',              path: '/procesos/lavado',          actor: 'Jefe de Lavado',     plant: 'Taipiplaya', pendiente: true },
  { order: 7,  ordenEnFase: 6, fase: 'II', phase: ProcessPhase.SECADO,        label: 'Secado',              path: '/procesos/secado',          actor: 'Jefe de Secado',     plant: 'Taipiplaya', pendiente: true },
  { order: 8,  ordenEnFase: 7, fase: 'II', phase: ProcessPhase.ALMACEN_TEMP,  label: 'Almacen y lote',      path: '/procesos/almacen-temporal',actor: 'Responsable de Planta', plant: 'Taipiplaya', pendiente: true },
  { order: 9,  ordenEnFase: 8, fase: 'II', phase: ProcessPhase.DESPACHO_ALTO, label: 'Despacho a El Alto',  path: '/procesos/transporte',      actor: 'Responsable de Planta', plant: 'Taipiplaya' },

  // ---------- Fase III: beneficio seco (El Alto) ----------
  { order: 10, ordenEnFase: 1, fase: 'III', phase: ProcessPhase.TRANSPORTE,  label: 'Transporte',        path: '/procesos/transporte',     actor: 'Transportista',        plant: 'Transito' },
  { order: 11, ordenEnFase: 2, fase: 'III', phase: ProcessPhase.RECEPCION,   label: 'Recepcion',         path: '/procesos/recepcion',      actor: 'Recepcionista',        plant: 'El Alto' },
  { order: 12, ordenEnFase: 3, fase: 'III', phase: ProcessPhase.LIMPIEZA,    label: 'Limpieza de maquinas', path: '/procesos/limpieza',    actor: 'Encargado de Maquinas', plant: 'El Alto' },
  { order: 13, ordenEnFase: 4, fase: 'III', phase: ProcessPhase.TRILLADO,    label: 'Trillado',          path: '/procesos/trillado',       actor: 'Encargado de Maquinas', plant: 'El Alto' },
  { order: 14, ordenEnFase: 5, fase: 'III', phase: ProcessPhase.SELECCION,   label: 'Seleccion',         path: '/procesos/clasificacion',  actor: 'Encargada de Seleccion', plant: 'El Alto' },
  { order: 15, ordenEnFase: 6, fase: 'III', phase: ProcessPhase.ALMACEN,     label: 'Empaque y almacen', path: '/procesos/almacenamiento', actor: 'Responsable de Planta', plant: 'El Alto' },
  { order: 16, ordenEnFase: 7, fase: 'III', phase: ProcessPhase.EXPORTACION, label: 'Despacho a exportacion', path: '/procesos/exportacion', actor: 'Comercializacion', plant: 'Puerto' },
]

export const fasesConEtapas = () =>
  FASES.map((f) => ({ ...f, etapas: PHASES.filter((p) => p.fase === f.id) }))

export function getPhase(phase: ProcessPhase): PhaseDefinition | undefined {
  return PHASES.find((p) => p.phase === phase)
}

/** Devuelve la etapa que sigue en la cadena, o undefined si es la ultima. */
export function nextPhase(phase: ProcessPhase): PhaseDefinition | undefined {
  const current = getPhase(phase)
  if (!current) return undefined
  return PHASES.find((p) => p.order === current.order + 1)
}

/**
 * Una etapa solo puede registrarse si la anterior ya quedo sellada.
 * Evita que un lote salte etapas y rompa la cadena de hashes.
 */
export function canRegisterPhase(target: ProcessPhase, lotPhase: ProcessPhase): boolean {
  const targetDef = getPhase(target)
  const currentDef = getPhase(lotPhase)
  if (!targetDef || !currentDef) return false
  return targetDef.order === currentDef.order + 1
}
