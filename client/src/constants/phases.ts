import { ProcessPhase } from '../types'

export interface PhaseDefinition {
  /** Orden dentro de la cadena de trazabilidad (1..N) */
  order: number
  phase: ProcessPhase
  label: string
  /** Ruta de la pantalla que registra esta fase */
  path: string
  /** Actor responsable segun el workflow */
  actor: string
  /** Planta donde ocurre la fase */
  plant: 'Taipiplaya' | 'El Alto' | 'Transito' | 'Puerto'
}

/**
 * Cadena de trazabilidad canonica.
 *
 * El workflow original arrancaba en Transporte, pero se corrigio para iniciar en
 * Acopio: si se empieza en el transporte se pierde la trazabilidad del origen
 * (productor, comunidad, categoria). Toda pantalla que dibuje el stepper debe
 * leer de aqui para que las fases no se desincronicen entre vistas.
 */
export const PHASES: PhaseDefinition[] = [
  { order: 1, phase: ProcessPhase.ACOPIO, label: 'Acopio', path: '/acopio', actor: 'Operador de Acopio', plant: 'Taipiplaya' },
  { order: 2, phase: ProcessPhase.TRANSPORTE, label: 'Transporte', path: '/procesos/transporte', actor: 'Responsable de Planta / Transportista', plant: 'Transito' },
  { order: 3, phase: ProcessPhase.RECEPCION, label: 'Recepcion', path: '/procesos/recepcion', actor: 'Recepcionista', plant: 'El Alto' },
  { order: 4, phase: ProcessPhase.LIMPIEZA, label: 'Limpieza', path: '/procesos/limpieza', actor: 'Encargado de Maquinas', plant: 'El Alto' },
  { order: 5, phase: ProcessPhase.TRILLADO, label: 'Trillado', path: '/procesos/trillado', actor: 'Encargado de Maquinas', plant: 'El Alto' },
  { order: 6, phase: ProcessPhase.SELECCION, label: 'Seleccion', path: '/procesos/clasificacion', actor: 'Encargada de Seleccion', plant: 'El Alto' },
  { order: 7, phase: ProcessPhase.ALMACEN, label: 'Almacen', path: '/procesos/almacenamiento', actor: 'Responsable de Planta', plant: 'El Alto' },
  { order: 8, phase: ProcessPhase.DESPACHO, label: 'Despacho', path: '/procesos/exportacion', actor: 'Comercializacion', plant: 'El Alto' },
  { order: 9, phase: ProcessPhase.EXPORTACION, label: 'Exportacion', path: '/procesos/exportacion', actor: 'Comercializacion', plant: 'Puerto' },
]

export function getPhase(phase: ProcessPhase): PhaseDefinition | undefined {
  return PHASES.find((p) => p.phase === phase)
}

/** Devuelve la fase que sigue en la cadena, o undefined si es la ultima. */
export function nextPhase(phase: ProcessPhase): PhaseDefinition | undefined {
  const current = getPhase(phase)
  if (!current) return undefined
  return PHASES.find((p) => p.order === current.order + 1)
}

/**
 * Una fase solo puede registrarse si la anterior ya quedo sellada en blockchain.
 * Evita que un lote salte etapas y rompa la cadena de hashes.
 */
export function canRegisterPhase(target: ProcessPhase, lotPhase: ProcessPhase): boolean {
  const targetDef = getPhase(target)
  const currentDef = getPhase(lotPhase)
  if (!targetDef || !currentDef) return false
  return targetDef.order === currentDef.order + 1
}
