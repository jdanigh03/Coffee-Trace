/**
 * Campos de cada etapa del beneficio humedo, segun el documento de cadena de
 * suministro (Fase II).
 *
 * Se declaran como datos y no como seis formularios distintos: son la misma
 * estructura repetida y mantenerlos aqui evita que la pantalla y la tabla se
 * desincronicen. Las claves coinciden con las columnas de la base.
 */

export type TipoCampo = 'texto' | 'numero' | 'fecha' | 'hora' | 'booleano' | 'select' | 'area'

export interface CampoEtapa {
  clave: string
  label: string
  tipo: TipoCampo
  unidad?: string
  opciones?: { valor: string; label: string }[]
  ayuda?: string
  requerido?: boolean
  /** Se calcula solo, no se escribe */
  calculado?: string
  min?: number
  max?: number
}

export interface EtapaDefinicion {
  slug: string
  titulo: string
  descripcion: string
  actor: string
  campos: CampoEtapa[]
  /** Lecturas de monitoreo repetidas (fermentacion, secado) */
  lecturas?: { titulo: string; ayuda: string; campos: CampoEtapa[] }
}

export const ETAPAS: EtapaDefinicion[] = [
  {
    slug: 'tolva',
    titulo: 'Descarga en tolva',
    actor: 'Operario de tolva',
    descripcion:
      'El lote diario se descarga en tolvas separadas por certificación. La limpieza previa ' +
      'es lo que impide que un lote orgánico se contamine con residuos de uno de transición.',
    campos: [
      { clave: 'kg_entrada', label: 'Peso de entrada', tipo: 'numero', unidad: 'kg', requerido: true,
        ayuda: 'Café guinda acumulado del acopio del día' },
      { clave: 'tolva', label: 'Tolva asignada', tipo: 'texto', ayuda: 'Separada por categoría' },
      { clave: 'limpieza_previa', label: '¿Tolva limpia antes de descargar?', tipo: 'booleano' },
      { clave: 'hora_limpieza', label: 'Hora de limpieza', tipo: 'hora' },
      { clave: 'responsable_limpieza', label: 'Responsable de limpieza', tipo: 'texto' },
      { clave: 'hora_inicio', label: 'Inicio de descarga', tipo: 'hora' },
      { clave: 'hora_fin', label: 'Fin de descarga', tipo: 'hora' },
      { clave: 'operario', label: 'Operario', tipo: 'texto' },
      { clave: 'observaciones', label: 'Observaciones', tipo: 'area' },
    ],
  },
  {
    slug: 'despulpado',
    titulo: 'Despulpado y desmucilaginado',
    actor: 'Jefe de máquinas',
    descripcion:
      'La despulpadora separa la pulpa (sultana) del café. Conversión típica: 69% despulpado ' +
      'y 31% sultana. Hoy no se registra a dónde va la sultana, y sin ese dato el balance de ' +
      'masa de la fase no cierra.',
    campos: [
      { clave: 'kg_entrada', label: 'Peso de entrada', tipo: 'numero', unidad: 'kg', requerido: true },
      { clave: 'maquina', label: 'Máquina asignada', tipo: 'texto', ayuda: 'Una por categoría' },
      { clave: 'hora_inicio', label: 'Hora de inicio', tipo: 'hora' },
      { clave: 'hora_fin', label: 'Hora de fin', tipo: 'hora' },
      { clave: 'operario', label: 'Operario', tipo: 'texto' },
      { clave: 'limpieza_validada', label: '¿Limpieza validada?', tipo: 'booleano' },
      { clave: 'responsable_limpieza', label: 'Responsable de limpieza', tipo: 'texto' },
      { clave: 'temperatura_c', label: 'Temperatura de máquina', tipo: 'numero', unidad: '°C' },
      { clave: 'velocidad_rpm', label: 'Velocidad', tipo: 'numero', unidad: 'RPM' },
      { clave: 'kg_despulpado', label: 'Café despulpado', tipo: 'numero', unidad: 'kg',
        calculado: 'entrada × 0,69' },
      { clave: 'kg_sultana', label: 'Sultana producida', tipo: 'numero', unidad: 'kg',
        calculado: 'entrada × 0,31' },
      { clave: 'destino_sultana', label: 'Destino de la sultana', tipo: 'select', opciones: [
        { valor: 'combustible', label: 'Combustible para hornos' },
        { valor: 'venta', label: 'Venta' },
        { valor: 'consumo_local', label: 'Consumo local' },
        { valor: 'abono', label: 'Abono' },
      ] },
      { clave: 'responsable_sultana', label: 'Responsable de la sultana', tipo: 'texto' },
      { clave: 'incidencias', label: 'Incidencias', tipo: 'area' },
    ],
  },
  {
    slug: 'fermentacion',
    titulo: 'Fermentación',
    actor: 'Jefe de lavado',
    descripcion:
      'Etapa crítica para la calidad y la que no existe hoy en ningún registro. Dura entre ' +
      '20 y 28 horas y la temperatura debe mantenerse entre 22 y 28 °C.',
    campos: [
      { clave: 'kg_entrada', label: 'Peso de entrada', tipo: 'numero', unidad: 'kg', requerido: true },
      { clave: 'tanque', label: 'Tanque asignado', tipo: 'texto',
        ayuda: 'Tanques separados para orgánico y transición' },
      { clave: 'hora_inicio', label: 'Inicio de fermentación', tipo: 'hora' },
      { clave: 'hora_fin', label: 'Fin de fermentación', tipo: 'hora' },
      { clave: 'mucilago_despegado', label: '¿El mucílago se despega?', tipo: 'booleano',
        ayuda: 'Prueba manual que valida el fin de la fermentación' },
      { clave: 'responsable', label: 'Responsable de validación', tipo: 'texto' },
      { clave: 'observaciones', label: 'Observaciones', tipo: 'area' },
    ],
    lecturas: {
      titulo: 'Monitoreo de temperatura',
      ayuda: 'Una lectura cada 2 a 4 horas. El rango óptimo es 22–28 °C.',
      campos: [
        { clave: 'hora', label: 'Hora', tipo: 'hora', requerido: true },
        { clave: 'temperatura_c', label: 'Temperatura', tipo: 'numero', unidad: '°C',
          requerido: true, min: 0, max: 60 },
        { clave: 'observaciones', label: 'Observaciones', tipo: 'texto' },
      ],
    },
  },
  {
    slug: 'lavado',
    titulo: 'Lavado en canal de correteo',
    actor: 'Jefe de lavado',
    descripcion:
      'En el canal el café se mezcla y pierde identificación individual. Mantener la ' +
      'segregación por categoría es lo único que preserva la trazabilidad aquí.',
    campos: [
      { clave: 'hora_inicio', label: 'Inicio del lavado', tipo: 'hora' },
      { clave: 'hora_fin', label: 'Fin del lavado', tipo: 'hora' },
      { clave: 'encargado', label: 'Encargado', tipo: 'texto' },
      { clave: 'operarios', label: 'Operarios', tipo: 'texto', ayuda: 'Puede haber varios' },
      { clave: 'calidad_agua', label: 'Calidad del agua', tipo: 'select', opciones: [
        { valor: 'limpia', label: 'Limpia' }, { valor: 'turbia', label: 'Turbia' },
      ] },
      { clave: 'temperatura_agua_c', label: 'Temperatura del agua', tipo: 'numero', unidad: '°C' },
      { clave: 'carretillas', label: 'Número de carretillas', tipo: 'numero' },
      { clave: 'kg_por_carretilla', label: 'Peso por carretilla', tipo: 'numero', unidad: 'kg' },
      { clave: 'segregacion_ok', label: '¿Se mantuvo la segregación por categoría?', tipo: 'booleano' },
      { clave: 'observaciones', label: 'Observaciones', tipo: 'area' },
    ],
  },
  {
    slug: 'secado',
    titulo: 'Secado',
    actor: 'Jefe de secado',
    descripcion:
      'De 4 a 6 días hasta alcanzar entre 10 y 12,5% de humedad. La humedad final se mide ' +
      'con higrómetro: es de los pocos datos de la cadena que no se estima.',
    campos: [
      { clave: 'kg_entrada', label: 'Peso de entrada', tipo: 'numero', unidad: 'kg', requerido: true },
      { clave: 'tipo_secado', label: 'Tipo de secado', tipo: 'select', opciones: [
        { valor: 'tarima', label: 'Tarima al aire' }, { valor: 'cachi', label: 'Cachi' },
        { valor: 'guardiola', label: 'Guardiola' }, { valor: 'hibrido', label: 'Híbrido' },
      ] },
      { clave: 'fecha_inicio', label: 'Fecha de inicio', tipo: 'fecha' },
      { clave: 'fecha_fin', label: 'Fecha de fin', tipo: 'fecha' },
      { clave: 'temperatura_inicial_c', label: 'Temperatura inicial', tipo: 'numero', unidad: '°C' },
      { clave: 'humedad_inicial_pct', label: 'Humedad relativa inicial', tipo: 'numero', unidad: '%' },
      { clave: 'humedad_final_pct', label: 'Humedad final (higrómetro)', tipo: 'numero', unidad: '%',
        min: 0, max: 100, ayuda: 'Medida real, no estimada. Rango aceptable: 10 a 12,5%' },
      { clave: 'validador_humedad', label: 'Validador de la humedad', tipo: 'texto' },
      { clave: 'kg_pergamino_seco', label: 'Pergamino seco', tipo: 'numero', unidad: 'kg',
        calculado: 'entrada × 0,80' },
      { clave: 'perdida_agua_kg', label: 'Pérdida de agua', tipo: 'numero', unidad: 'kg',
        calculado: 'entrada − pergamino seco' },
      { clave: 'carretillas_traslado', label: 'Carretillas de traslado', tipo: 'numero' },
      { clave: 'fecha_traslado', label: 'Fecha de traslado a almacén', tipo: 'fecha' },
      { clave: 'observaciones', label: 'Observaciones', tipo: 'area' },
    ],
    lecturas: {
      titulo: 'Monitoreo diario',
      ayuda: 'Una fila por día de secado.',
      campos: [
        { clave: 'fecha', label: 'Fecha', tipo: 'fecha', requerido: true },
        { clave: 'temperatura_c', label: 'Temperatura', tipo: 'numero', unidad: '°C' },
        { clave: 'humedad_pct', label: 'Humedad', tipo: 'numero', unidad: '%' },
        { clave: 'estado_visual', label: 'Estado visual', tipo: 'texto' },
        { clave: 'incidencias', label: 'Incidencias', tipo: 'texto' },
      ],
    },
  },
  {
    slug: 'almacen-temporal',
    titulo: 'Almacenamiento temporal y formación de lote',
    actor: 'Responsable de planta',
    descripcion:
      'Se acumulan los lotes diarios hasta formar un lote de exportación. Ese lote reúne ' +
      'el café de decenas de productores de varias comunidades.',
    campos: [
      { clave: 'fecha_ingreso', label: 'Fecha de ingreso', tipo: 'fecha' },
      { clave: 'ubicacion', label: 'Ubicación en almacén', tipo: 'texto',
        ayuda: 'Sector separado por certificación' },
      { clave: 'temperatura_c', label: 'Temperatura de almacén', tipo: 'numero', unidad: '°C' },
      { clave: 'humedad_pct', label: 'Humedad de almacén', tipo: 'numero', unidad: '%' },
      { clave: 'kg_acumulado', label: 'Peso acumulado', tipo: 'numero', unidad: 'kg', requerido: true },
      { clave: 'lotes_diarios', label: 'Lotes diarios acumulados', tipo: 'area',
        ayuda: 'Códigos y pesos de los lotes que forman este lote de exportación' },
      { clave: 'responsable', label: 'Responsable', tipo: 'texto' },
      { clave: 'observaciones', label: 'Observaciones', tipo: 'area' },
    ],
  },
]

// Etapa 8 de la Fase II. Se declara aparte del bloque anterior porque no
// escribe en una tabla `etapa_*` sino en `envios`: el despacho y el envio a
// La Paz son el mismo camion.
ETAPAS.push({
  slug: 'despacho-alto',
  titulo: 'Despacho hacia El Alto',
  actor: 'Jefe de planta Taipiplaya',
  descripcion:
    'El lote de exportación se despacha a la Planta de Beneficio Seco en El Alto. ' +
    'Se genera la NOTA DE REMISIÓN oficial con transportista y vehículo. El lote debe ' +
    'quedar identificado en la nota: es lo que conecta el papel del transportista con ' +
    'la trazabilidad del sistema.',
  campos: [
    { clave: 'kg_pergamino_despachado', label: 'Peso de salida', tipo: 'numero', unidad: 'kg',
      requerido: true, ayuda: 'Peso verificado en balanza antes de cargar' },
    { clave: 'numero_bolsas', label: 'Número de bolsas', tipo: 'numero',
      ayuda: 'Permite cotejar el conteo físico al recibir en El Alto' },
    { clave: 'fecha_salida', label: 'Fecha y hora de salida', tipo: 'hora', requerido: true },

    { clave: 'remitente', label: 'Remitente', tipo: 'texto' },
    { clave: 'destinatario', label: 'Destinatario', tipo: 'texto' },
    { clave: 'direccion_destino', label: 'Dirección de destino', tipo: 'texto' },

    { clave: 'responsable_transportista', label: 'Transportista', tipo: 'texto',
      ayuda: 'Empresa o persona responsable del traslado' },
    { clave: 'vehiculo', label: 'Vehículo (placa)', tipo: 'texto' },
    { clave: 'tipo_vehiculo', label: 'Tipo de vehículo', tipo: 'select', opciones: [
      { valor: 'camion', label: 'Camión' },
      { valor: 'camioneta', label: 'Camioneta' },
      { valor: 'furgon', label: 'Furgón' },
    ] },
    { clave: 'conductor', label: 'Conductor', tipo: 'texto' },
    { clave: 'documentos_verificados', label: '¿Documentos del conductor verificados?',
      tipo: 'booleano' },
    { clave: 'temperatura_vehiculo', label: 'Temperatura del vehículo', tipo: 'select',
      opciones: [
        { valor: 'ambiente', label: 'Ambiente (normal)' },
        { valor: 'refrigerado', label: 'Refrigerado' },
      ] },
    { clave: 'responsable', label: 'Responsable de planta', tipo: 'texto' },
    { clave: 'observaciones', label: 'Observaciones', tipo: 'area' },
  ],
})

export const getEtapa = (slug: string) => ETAPAS.find((e) => e.slug === slug)
