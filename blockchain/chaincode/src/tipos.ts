/** Tipos del ledger. Espejan blockchain/MODELO.md. */

export const FASES = [
  'acopio', 'transporte', 'recepcion', 'limpieza', 'trillado',
  'seleccion', 'almacenamiento', 'despacho', 'exportacion',
] as const

export type Fase = (typeof FASES)[number]

export type Certificacion = 'organico' | 'transicion'
export type TipoMuestra = 'muestra' | 'contramuestra'

/** Clave: lote~{codigo}  ej. lote~OR-01-25 */
export interface Lote {
  docType: 'lote'
  codigo: string
  campania: number
  certificacion: Certificacion
  faseActual: Fase
  secuencia: number
  hashCabeza: string
  kgGuindaAcopiada: number
  kgPergaminoDespachado?: number
  kgVerdeExportado?: number
  kgEnMuestras: number
  /** Agregados, nunca nombres: los datos personales no van al ledger. */
  productores: number
  comunidades: number
  creadoEn: string
  actualizadoEn: string
}

/** Clave: fase~{codigoLote}~{secuencia con ceros}  ej. fase~OR-01-25~0003 */
export interface FaseSellada {
  docType: 'fase'
  lote: string
  secuencia: number
  fase: Fase
  hashPayload: string
  hashAnterior: string
  /** "envios:uuid" para recuperar el detalle en Postgres. */
  refSupabase: string
  pesos: Record<string, number>
  selladoPorMsp: string
  selladoEn: string
}

/** Clave: limpieza~{equipo}~{txId} */
export interface Limpieza {
  docType: 'limpieza'
  equipo: string
  loteAnterior: string | null
  loteSiguiente: string
  hashPayload: string
  selladoPorMsp: string
  selladoEn: string
}

/** Clave: muestra~{codigoLote}~{txId} */
export interface Muestra {
  docType: 'muestra'
  lote: string
  tipo: TipoMuestra
  kg: number
  hashPayload: string
  selladoEn: string
}

/** Clave: certificado~{id} */
export interface CertificadoOrigen {
  docType: 'certificado'
  id: string
  lotes: string[]
  /** Un embarque puede mezclar tipos: se lee por lote y NUNCA se promedia. */
  certificacionPorLote: Record<string, Certificacion>
  contenedor?: string
  ico: string
  kgNeto: number
  hashesCabeza: Record<string, string>
  emitidoPorMsp: string
  emitidoEn: string
}

export const claveLote = (codigo: string) => `lote~${codigo}`
export const claveFase = (lote: string, seq: number) =>
  `fase~${lote}~${String(seq).padStart(4, '0')}`
export const claveLimpieza = (equipo: string, txId: string) => `limpieza~${equipo}~${txId}`
export const claveMuestra = (lote: string, txId: string) => `muestra~${lote}~${txId}`
export const claveCertificado = (id: string) => `certificado~${id}`
