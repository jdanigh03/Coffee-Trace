/**
 * Cliente del API de CoffeeTrace.
 *
 * En desarrollo Vite hace proxy de /api al backend. En produccion la variable
 * VITE_API_URL apunta al host del API, porque el frontend puede estar en
 * Vercel y el backend en un contenedor aparte.
 */
const BASE = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
    this.name = 'ApiError'
  }
}

async function pedir<T>(ruta: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${ruta}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  const cuerpo = await res.json().catch(() => ({}))
  if (!res.ok || cuerpo.success === false) {
    throw new ApiError(cuerpo.error ?? `Error ${res.status}`, res.status)
  }
  return (cuerpo.data ?? cuerpo) as T
}

// ---------------------------------------------------------------- tipos

export type Certificacion = 'organico' | 'transicion'
export type Revision = 'ok' | 'observado' | 'corregido'

export interface LoteResumen {
  id: string
  codigo: string
  campania_id: number
  certificacion: Certificacion
  estado: string
  entregas: number
  kg_guinda_real: number
  latas: number
  total_pagado_bs: number
  entregas_observadas: number
  kg_pergamino_calc: number | null
  kg_verde_oro_calc: number | null
}

export interface LoteDetalle extends LoteResumen {
  kg_mote_calc: number | null
  envio: {
    fecha_salida: string
    fecha_llegada: string | null
    kg_pergamino_despachado: number | null
    kg_pergamino_recibido: number | null
    diferencia_kg: number | null
    nota_remision: string | null
    vehiculo: string | null
    conductor: string | null
  } | null
  beneficio: {
    id: string
    kg_pergamino_entrada: number
    kg_trillado_calc: number | null
    kg_verde_calc: number | null
    kg_caracol_calc: number | null
    kg_descarte_calc: number | null
    kg_verde_real: number | null
    rendimiento_pct: number | null
  } | null
  muestras: { tipo: string; kg: number; fecha: string; motivo: string | null }[]
  despachos: {
    fecha_despacho: string; kg_neto: number | null; kg_asignados: number
    numero: string | null; cliente: string | null; pais: string | null
  }[]
  reconciliacion: {
    kg_acopio: number; kg_beneficio: number; diferencia: number; estado: string
  } | null
  sellosBlockchain: {
    tabla_origen: string; hash_sha256: string; tx_id: string | null
    block_number: number | null; sellado_en: string
  }[]
  productores: {
    nombre_excel: string; persona: string | null; fuente: string | null
    kg_guinda: number; kg_verde_export: number; revision: Revision
  }[]
}

export interface Entrega {
  id: number
  fecha: string
  codigo_productor: string
  nombre_excel: string
  comunidad: string | null
  kg_guinda_real: number
  latas: number
  precio_unitario_bs: number
  total_pagado_bs: number
  estatus_declarado: string | null
  revision: Revision
  revision_nota: string | null
}

export interface EntregaLista extends Entrega {
  productor: string | null
  persona_id: string | null
  lote: string | null
}

export interface Envio {
  id: string
  lote: string
  certificacion: Certificacion
  campania_id: number
  fecha_salida: string
  fecha_llegada: string | null
  kg_pergamino_despachado: number | null
  kg_pergamino_recibido: number | null
  diferencia_kg: number | null
  nota_remision: string | null
  vehiculo: string | null
  conductor: string | null
  responsable: string | null
  kg_guinda_real: number | null
  entregas: number | null
}

export interface Despacho {
  id: string
  fecha_despacho: string
  contenedor: string | null
  precintos: string | null
  kg_neto: number | null
  responsable: string | null
  contrato: string | null
  certificacion: Certificacion | null
  sacos: number | null
  kg_por_saco: number | null
  total_kg: number | null
  tipo_empaque: string | null
  incoterm: string | null
  puerto_destino: string | null
  cliente: string | null
  pais: string | null
  fecha_embarque: string | null
  bl_numero: string | null
  naviera: string | null
  lotes: number
  codigos_lote: string | null
}

export interface Productor {
  id: string
  nombre: string
  activo: boolean
  afiliacion: string | null
  parcelas: number
  comunidades: string | null
  codigos: string | null
  estatus: string | null
  kg_guinda: number
  entregas: number
  total_pagado_bs: number
}

export interface ProductorDetalle {
  id: string
  nombre: string
  ci: string | null
  telefono: string | null
  activo: boolean
  parcelas: {
    id: string; comunidad: string; hectareas: number | null
    estatus: string | null; tipo: string | null; campania_id: number | null
    codigos: string | null
  }[]
  entregas: {
    fecha: string; lote: string | null; kg_guinda_real: number; latas: number
    precio_unitario_bs: number; total_pagado_bs: number
    estatus_declarado: string | null; revision: Revision
  }[]
  pagos: {
    campania_id: number; entregas: number; kg_guinda: number; latas: number
    precio_promedio_bs: number; total_pagado_bs: number
  }[]
}

export interface Dashboard {
  campania: number
  resumen: {
    entregas: number; productores: number; kg_guinda: number
    total_pagado_bs: number; observadas: number
  }
  porCertificacion: { certificacion: Certificacion; lotes: number; kg_guinda: number }[]
  porMes: { mes: string; kg_guinda: number; entregas: number; precio_promedio: number }[]
  lotes: LoteResumen[]
  inconsistencias: number
}

export interface EstadoBlockchain {
  redDesplegada: boolean
  cola: { pendiente: number; enviado: number; confirmado: number; error: number }
  sellos: number
  ultimoBloque: number | null
  ultimoSello: string | null
}

export interface IndicadorFila {
  campania_id: number
  certificacion?: Certificacion
  lotes: number
  lotes_estimados: number
  /** Verde oro producido de la cosecha */
  vop: number
  /** Verde oro exportado con documentacion de embarque verificable */
  voe: number
  /** Saldo inmovilizado en almacen */
  vos: number
  /** Producto sin destino documentado: vop - voe - vos */
  vond: number
  /** Tasa de Eficiencia Exportadora */
  tee: number | null
  /** Tasa de Inmovilizacion de Inventario */
  tin: number | null
  /** Tasa de producto sin destino documentado */
  tnd: number | null
  inconsistente?: boolean
}

export interface Indicadores {
  campania: number
  total: IndicadorFila | null
  porCertificacion: IndicadorFila[]
  serie: IndicadorFila[]
  /** true = ningun lote tiene el verde oro pesado; todo sale de factores */
  baseEstimada: boolean | null
}

export type Severidad = 'critica' | 'alta' | 'media' | 'info'

export interface Alerta {
  tipo: string
  severidad: Severidad
  titulo: string
  cantidad: number
  detalle: string
  ruta: string
}

export interface Notificaciones {
  alertas: Alerta[]
  /** Numero de ALERTAS, no de registros afectados */
  total: number
  porSeveridad: Partial<Record<Severidad, number>>
  requiereAtencion: boolean
}

export interface Parametro {
  clave: string
  valor: string
  tipo: 'texto' | 'numero' | 'booleano'
  grupo: string
  descripcion: string | null
  unidad: string | null
  min_valor: number | null
  max_valor: number | null
  actualizado_en: string
}

export interface Configuracion {
  organizacion: {
    id: number; nombre: string; codigo_ico: string | null
    nit: string | null; direccion: string | null
  } | null
  parametros: Parametro[]
  campanias: { id: number; fecha_inicio: string | null; fecha_fin: string | null
               activa: boolean; entregas: number }[]
  factores: { campania_id: number; origen: string; destino: string
              factor: number; es_estimado: boolean; nota: string | null }[]
  almacenes: { id: number; nombre: string; ubicacion: string | null; capacidad_kg: number | null }[]
  clientes: { id: number; nombre: string; pais: string | null; activo: boolean }[]
  sistema: { entorno: string; nodeVersion: string; redFabricDesplegada: boolean }
}

export interface Reconciliacion {
  codigo: string; certificacion: Certificacion
  kg_acopio: number; kg_beneficio: number; diferencia: number; estado: string
}

export interface Rendimiento {
  codigo: string; certificacion: Certificacion
  pergamino_estimado: number | null
  pergamino_despachado_real: number | null
  verde_estimado: number | null
  verde_real: number | null
  rendimiento_pct: number | null
  origen_del_dato: 'estimado' | 'medido'
}

export interface Inconsistencia {
  id: number; fecha: string; codigo_excel: string; nombre_excel: string
  kg_guinda_real: number; estatus_declarado: string | null
  lote: string | null; lote_certificacion: Certificacion | null
  revision: Revision; revision_nota: string | null
}

// ---------------------------------------------------------------- llamadas

export const api = {
  salud: () => pedir<{ status: string; base: { conectada: boolean; entregas?: number } }>('/health'),

  lotes: (f: { certificacion?: string; campania?: number; estado?: string } = {}) => {
    const p = new URLSearchParams(
      Object.entries(f).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])
    )
    return pedir<LoteResumen[]>(`/lots${p.toString() ? `?${p}` : ''}`)
  },
  entregas: (f: { campania?: number; revision?: string; comunidad?: string
                  buscar?: string; limit?: number } = {}) => {
    const p = new URLSearchParams(
      Object.entries(f).filter(([, v]) => v != null && v !== '').map(([k, v]) => [k, String(v)])
    )
    return pedir<EntregaLista[]>(`/lots/entregas${p.toString() ? `?${p}` : ''}`)
  },
  envios: () => pedir<Envio[]>('/lots/envios'),
  despachos: () => pedir<Despacho[]>('/lots/despachos'),

  lote: (codigo: string) => pedir<LoteDetalle>(`/lots/${encodeURIComponent(codigo)}`),
  entregasDeLote: (codigo: string) =>
    pedir<Entrega[]>(`/lots/${encodeURIComponent(codigo)}/entregas`),
  trazabilidad: (codigo: string) =>
    pedir<Record<string, unknown>>(`/lots/${encodeURIComponent(codigo)}/trazabilidad`),

  productores: (f: { campania?: number; comunidad?: string; buscar?: string } = {}) => {
    const p = new URLSearchParams(
      Object.entries(f).filter(([, v]) => v).map(([k, v]) => [k, String(v)])
    )
    return pedir<Productor[]>(`/producers${p.toString() ? `?${p}` : ''}`)
  },
  productor: (id: string) => pedir<ProductorDetalle>(`/producers/${id}`),
  comunidades: () => pedir<{
    id: number; nombre: string; prefijo_codigo: string
    parcelas: number; productores: number; kg_guinda: number
  }[]>('/producers/comunidades'),

  dashboard: (campania = 2025) => pedir<Dashboard>(`/analytics/dashboard?campania=${campania}`),
  indicadores: (campania = 2025) => pedir<Indicadores>(`/analytics/indicadores?campania=${campania}`),
  rendimiento: () => pedir<Rendimiento[]>('/analytics/rendimiento'),
  reconciliacion: () => pedir<Reconciliacion[]>('/analytics/reconciliacion'),
  inconsistencias: (limit = 100) => pedir<Inconsistencia[]>(`/analytics/inconsistencias?limit=${limit}`),

  notificaciones: () => pedir<Notificaciones>('/notificaciones'),

  configuracion: () => pedir<Configuracion>('/configuracion'),
  guardarParametro: (clave: string, valor: string) =>
    pedir<Parametro>(`/configuracion/parametros/${encodeURIComponent(clave)}`,
      { method: 'PATCH', body: JSON.stringify({ valor }) }),
  guardarOrganizacion: (datos: Record<string, string>) =>
    pedir<Configuracion['organizacion']>('/configuracion/organizacion',
      { method: 'PATCH', body: JSON.stringify(datos) }),
  activarCampania: (campania: number) =>
    pedir<{ id: number; activa: boolean }[]>('/configuracion/campania-activa',
      { method: 'PATCH', body: JSON.stringify({ campania }) }),

  estadoBlockchain: () => pedir<EstadoBlockchain>('/blockchain/status'),
  cadenaDeLote: (codigo: string) =>
    pedir<{ lote: string; sellos: unknown[]; verificacion: unknown }>(
      `/blockchain/cadena/${encodeURIComponent(codigo)}`),
  verificarHash: (hash: string, data: unknown, hashAnterior = '') =>
    pedir<{ valido: boolean; hash: string; esperado: string; payloadCanonico: string; mensaje: string }>(
      '/blockchain/verify',
      { method: 'POST', body: JSON.stringify({ hash, data, hashAnterior }) }),
}
