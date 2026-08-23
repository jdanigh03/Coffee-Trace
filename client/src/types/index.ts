export enum ProcessPhase {
  // Fase I - campo
  PRODUCTOR = 'productor',
  // Fase II - beneficio humedo (Taipiplaya)
  ACOPIO = 'acopio',
  TOLVA = 'tolva',
  DESPULPADO = 'despulpado',
  FERMENTACION = 'fermentacion',
  LAVADO = 'lavado',
  SECADO = 'secado',
  ALMACEN_TEMP = 'almacen_temporal',
  DESPACHO_ALTO = 'despacho_alto',
  // Fase III - beneficio seco (El Alto)
  TRANSPORTE = 'transporte',
  RECEPCION = 'recepcion',
  LIMPIEZA = 'limpieza',
  TRILLADO = 'trillado',
  SELECCION = 'seleccion',
  ALMACEN = 'almacen',
  DESPACHO = 'despacho',
  EXPORTACION = 'exportacion'
}

export enum LotStatus {
  ACTIVO = 'activo',
  EN_PROCESO = 'en_proceso',
  COMPLETADO = 'completado',
  RECHAZADO = 'rechazado'
}

export interface Producer {
  id: string
  name: string
  communityId: string
  community: string
  verified: boolean
  blockchainHash?: string
  txId?: string
}

export interface Lot {
  id: string
  producerId: string
  producer?: Producer
  status: LotStatus
  currentPhase: ProcessPhase
  quantity: number
  weight: number
  humidity: number
  temperature?: number
  plantId?: string
  createdAt: string
  updatedAt: string
  blockchainVerified: boolean
  blockchainHash?: string
  txId?: string
  blockNumber?: number
}

export interface TransportRecord {
  id: string
  lotId: string
  departureDate: string
  estimatedArrival: string
  actualArrival?: string
  quantity: number
  totalWeight: number
  notes?: string
  responsible: string
  vehicle: string
  driver: string
  blockchainHash?: string
  txId?: string
}

export interface ReceptionRecord {
  id: string
  lotId: string
  date: string
  receivedWeight: number
  humidity: number
  temperature: number
  responsible: string
  status: string
  notes?: string
  loss: number
  blockchainHash?: string
  txId?: string
}

export interface CleaningRecord {
  id: string
  equipmentId: string
  date: string
  cleaningType: 'profunda' | 'rapida'
  products: string
  responsible: string
  temperature?: number
  flowSensor?: boolean
  blockchainHash?: string
  txId?: string
}

export interface ThreshingRecord {
  id: string
  lotId: string
  startDate: string
  endDate: string
  parchmentWeight: number
  greenCoffeeWeight: number
  shellWeight: number
  wasteWeight: number
  yield: number
  responsible: string
  blockchainHash?: string
  txId?: string
}

export interface SelectionRecord {
  id: string
  lotId: string
  assignedWeight: number
  selectedWeight: number
  rejectedWeight: number
  finalWeight: number
  defects: string[]
  responsible: string
  efficiency: number
  blockchainHash?: string
  txId?: string
}

export interface StorageRecord {
  id: string
  lotId: string
  entryDate: string
  finalWeight: number
  location: string
  temperature: number
  humidity: number
  responsible: string
  blockchainHash?: string
  txId?: string
}

export interface DespatchRecord {
  id: string
  lotsSelected: string[]
  buyer: string
  destinationCountry: string
  quantity: number
  container: string
  despatchDate: string
  documents: string[]
  responsible: string
  blockchainHash?: string
  txId?: string
}

export interface ExportRecord {
  id: string
  despatchId: string
  shipmentDate: string
  port: string
  container: string
  buyer: string
  country: string
  volume: number
  certifications: string[]
  documents: string[]
  blockchainHash?: string
  txId?: string
}

export interface BlockchainStatus {
  isOnline: boolean
  lastSync?: string
  syncedNodes: number
  totalNodes: number
}

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'operator' | 'viewer'
  plant?: string
  permissions: string[]
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
