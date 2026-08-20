import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api'
import {
  CertificadoOrigen, Certificacion, Fase, FASES, FaseSellada, Limpieza, Lote, Muestra,
  TipoMuestra, claveCertificado, claveFase, claveLimpieza, claveLote, claveMuestra,
} from './tipos'

/** Tolerancia del balance de masa entre fases (1%). */
const TOLERANCIA_BALANCE = 0.01

@Info({ title: 'TrazabilidadCafe', description: 'Trazabilidad de cafe ASOCAFE Taipiplaya' })
export class TrazabilidadContract extends Contract {

  // ------------------------------------------------------------------
  // Utilidades deterministas
  // ------------------------------------------------------------------

  /**
   * Timestamp de la transaccion, NO del reloj del peer.
   *
   * Cada peer endosante ejecuta este codigo por separado; si se usara
   * Date.now() cada uno produciria un resultado distinto y el endoso fallaria
   * siempre. Lo mismo con Math.random().
   */
  private ahora(ctx: Context): string {
    const ts = ctx.stub.getTxTimestamp()
    const ms = Number(ts.seconds) * 1000 + Math.floor(ts.nanos / 1e6)
    return new Date(ms).toISOString()
  }

  private msp(ctx: Context): string {
    return ctx.clientIdentity.getMSPID()
  }

  private async leer<T>(ctx: Context, clave: string): Promise<T | null> {
    const bytes = await ctx.stub.getState(clave)
    return bytes && bytes.length ? (JSON.parse(bytes.toString()) as T) : null
  }

  private async escribir(ctx: Context, clave: string, valor: unknown): Promise<void> {
    await ctx.stub.putState(clave, Buffer.from(JSON.stringify(valor)))
  }

  /**
   * Recorre un rango de claves y devuelve los valores.
   *
   * Se usa el bucle explicito con next() en vez de for-await porque
   * StateQueryIterator no declara Symbol.asyncIterator en fabric-shim 2.5.
   */
  private async porRango<T>(ctx: Context, desde: string, hasta: string): Promise<T[]> {
    const it = await ctx.stub.getStateByRange(desde, hasta)
    const salida: T[] = []
    try {
      let res = await it.next()
      while (!res.done) {
        if (res.value?.value?.length) {
          salida.push(JSON.parse(res.value.value.toString()) as T)
        }
        res = await it.next()
      }
    } finally {
      await it.close()
    }
    return salida
  }

  // ------------------------------------------------------------------
  // Lotes
  // ------------------------------------------------------------------

  @Transaction()
  async IniciarLote(
    ctx: Context, codigo: string, campania: string, certificacion: string,
  ): Promise<void> {
    if (await this.leer(ctx, claveLote(codigo))) {
      throw new Error(`El lote ${codigo} ya existe`)
    }
    if (certificacion !== 'organico' && certificacion !== 'transicion') {
      throw new Error(`Certificacion invalida: ${certificacion}`)
    }
    if (!/^(OR|TR)-\d{2}-\d{2}$/.test(codigo)) {
      throw new Error(`Codigo de lote invalido: ${codigo}. Formato esperado OR-01-25`)
    }
    // El prefijo tiene que concordar con la certificacion: un OR- de
    // transicion seria una contradiccion imposible de detectar despues.
    const prefijoEsperado = certificacion === 'organico' ? 'OR' : 'TR'
    if (!codigo.startsWith(prefijoEsperado)) {
      throw new Error(
        `El lote ${codigo} dice ser ${certificacion} pero su prefijo no es ${prefijoEsperado}`)
    }

    const ahora = this.ahora(ctx)
    const lote: Lote = {
      docType: 'lote', codigo, campania: Number(campania),
      certificacion: certificacion as Certificacion,
      faseActual: 'acopio', secuencia: 0, hashCabeza: '',
      kgGuindaAcopiada: 0, kgEnMuestras: 0, productores: 0, comunidades: 0,
      creadoEn: ahora, actualizadoEn: ahora,
    }
    await this.escribir(ctx, claveLote(codigo), lote)
    ctx.stub.setEvent('LoteIniciado', Buffer.from(JSON.stringify({ codigo, certificacion })))
  }

  /**
   * Sella una fase encadenandola a la anterior.
   *
   * `pesosJson` lleva solo lo que el comprador debe poder verificar; el
   * detalle completo vive en Postgres y aqui solo entra su hash.
   */
  @Transaction()
  async SellarFase(
    ctx: Context, codigoLote: string, fase: string, hashPayload: string,
    refSupabase: string, pesosJson: string,
  ): Promise<string> {
    const lote = await this.leer<Lote>(ctx, claveLote(codigoLote))
    if (!lote) throw new Error(`El lote ${codigoLote} no existe`)

    if (!FASES.includes(fase as Fase)) throw new Error(`Fase desconocida: ${fase}`)
    if (!/^[0-9a-f]{64}$/.test(hashPayload)) {
      throw new Error('hashPayload debe ser un SHA-256 en hexadecimal de 64 caracteres')
    }

    // --- Regla 1: las fases no se saltan ni retroceden
    const iActual = FASES.indexOf(lote.faseActual)
    const iNueva = FASES.indexOf(fase as Fase)
    if (iNueva <= iActual && lote.secuencia > 0) {
      throw new Error(
        `El lote ${codigoLote} esta en ${lote.faseActual}; no puede volver a ${fase}`)
    }
    if (iNueva > iActual + 1 && lote.secuencia > 0) {
      throw new Error(
        `No se puede saltar de ${lote.faseActual} a ${fase}. Falta ${FASES[iActual + 1]}`)
    }

    const pesos: Record<string, number> = JSON.parse(pesosJson)

    // --- Regla 4: limpieza obligatoria entre certificaciones distintas
    if (fase === 'trillado') {
      await this.exigirLimpiezaPrevia(ctx, lote)
    }

    // --- Regla 3: balance de masa
    this.validarBalance(lote, fase as Fase, pesos)

    const secuencia = lote.secuencia + 1
    const sellada: FaseSellada = {
      docType: 'fase', lote: codigoLote, secuencia, fase: fase as Fase,
      hashPayload, hashAnterior: lote.hashCabeza, refSupabase, pesos,
      selladoPorMsp: this.msp(ctx), selladoEn: this.ahora(ctx),
    }
    await this.escribir(ctx, claveFase(codigoLote, secuencia), sellada)

    lote.faseActual = fase as Fase
    lote.secuencia = secuencia
    lote.hashCabeza = hashPayload
    lote.actualizadoEn = sellada.selladoEn
    if (pesos.kgGuinda !== undefined) lote.kgGuindaAcopiada = pesos.kgGuinda
    if (pesos.kgPergamino !== undefined) lote.kgPergaminoDespachado = pesos.kgPergamino
    if (pesos.kgVerde !== undefined) lote.kgVerdeExportado = pesos.kgVerde
    if (pesos.productores !== undefined) lote.productores = pesos.productores
    if (pesos.comunidades !== undefined) lote.comunidades = pesos.comunidades
    await this.escribir(ctx, claveLote(codigoLote), lote)

    ctx.stub.setEvent('FaseSellada',
      Buffer.from(JSON.stringify({ lote: codigoLote, fase, secuencia, hashPayload })))
    return ctx.stub.getTxID()
  }

  /**
   * Regla 4: antes de trillar, si el equipo proceso un lote de otra
   * certificacion, tiene que existir un registro de limpieza entre ambos.
   * Es lo que impide contaminar un lote organico con residuos de transicion.
   */
  private async exigirLimpiezaPrevia(ctx: Context, lote: Lote): Promise<void> {
    const limpiezas = await this.porRango<Limpieza>(ctx, 'limpieza~', 'limpieza~￿')
    let encontrada = false
    for (const l of limpiezas) {
      if (l.loteSiguiente !== lote.codigo) continue
      encontrada = true
      if (!l.loteAnterior) break
      const anterior = await this.leer<Lote>(ctx, claveLote(l.loteAnterior))
      if (anterior && anterior.certificacion !== lote.certificacion) {
        // Existe limpieza registrada justo entre los dos: es el caso correcto.
        return
      }
    }
    if (!encontrada) {
      throw new Error(
        `No hay limpieza registrada antes de trillar el lote ${lote.codigo}. ` +
        'Es obligatoria entre lotes de distinta certificacion.')
    }
  }

  /** Regla 3: una fase no puede sacar mas kilos de los que entraron. */
  private validarBalance(lote: Lote, fase: Fase, pesos: Record<string, number>): void {
    const entrada = lote.kgPergaminoDespachado ?? lote.kgGuindaAcopiada
    if (!entrada) return

    const salida = (pesos.kgVerde ?? 0) + (pesos.kgCaracol ?? 0) + (pesos.kgDescarte ?? 0)
    if (salida === 0) return

    const tope = (entrada + lote.kgEnMuestras) * (1 + TOLERANCIA_BALANCE)
    if (salida > tope) {
      throw new Error(
        `Balance de masa incorrecto en ${fase}: salen ${salida.toFixed(3)} kg de ` +
        `${entrada.toFixed(3)} kg que entraron (tope ${tope.toFixed(3)} con tolerancia)`)
    }
  }

  // ------------------------------------------------------------------
  // Limpiezas y muestras
  // ------------------------------------------------------------------

  @Transaction()
  async RegistrarLimpieza(
    ctx: Context, equipo: string, loteAnterior: string, loteSiguiente: string,
    hashPayload: string,
  ): Promise<void> {
    const reg: Limpieza = {
      docType: 'limpieza', equipo,
      loteAnterior: loteAnterior || null, loteSiguiente, hashPayload,
      selladoPorMsp: this.msp(ctx), selladoEn: this.ahora(ctx),
    }
    await this.escribir(ctx, claveLimpieza(equipo, ctx.stub.getTxID()), reg)
    ctx.stub.setEvent('LimpiezaRegistrada', Buffer.from(JSON.stringify(reg)))
  }

  /**
   * Las muestras salen del lote para control de calidad. Registrarlas es lo
   * que permite explicar donde termino cada kilo: sin esto el balance no
   * cierra y parece que falta cafe.
   */
  @Transaction()
  async RegistrarMuestra(
    ctx: Context, codigoLote: string, tipo: string, kg: string, hashPayload: string,
  ): Promise<void> {
    const lote = await this.leer<Lote>(ctx, claveLote(codigoLote))
    if (!lote) throw new Error(`El lote ${codigoLote} no existe`)
    if (tipo !== 'muestra' && tipo !== 'contramuestra') {
      throw new Error(`Tipo de muestra invalido: ${tipo}`)
    }
    const kgNum = Number(kg)
    if (!(kgNum > 0)) throw new Error('Los kg de la muestra deben ser mayores que cero')

    const m: Muestra = {
      docType: 'muestra', lote: codigoLote, tipo: tipo as TipoMuestra,
      kg: kgNum, hashPayload, selladoEn: this.ahora(ctx),
    }
    await this.escribir(ctx, claveMuestra(codigoLote, ctx.stub.getTxID()), m)

    lote.kgEnMuestras += kgNum
    lote.actualizadoEn = m.selladoEn
    await this.escribir(ctx, claveLote(codigoLote), lote)
  }

  // ------------------------------------------------------------------
  // Certificado de origen
  // ------------------------------------------------------------------

  /**
   * Emite el certificado del embarque.
   *
   * Politica de endoso: AND(AsocafeMSP, CertificadoraMSP). ASOCAFE no puede
   * emitirlo sola: ahi esta el valor que un Excel no puede dar.
   */
  @Transaction()
  async EmitirCertificado(
    ctx: Context, id: string, lotesJson: string, contenedor: string,
    kgNeto: string, ico: string,
  ): Promise<void> {
    if (await this.leer(ctx, claveCertificado(id))) {
      throw new Error(`El certificado ${id} ya existe`)
    }
    const codigos: string[] = JSON.parse(lotesJson)
    if (!codigos.length) throw new Error('El certificado necesita al menos un lote')

    const certificacionPorLote: Record<string, Certificacion> = {}
    const hashesCabeza: Record<string, string> = {}

    for (const codigo of codigos) {
      const lote = await this.leer<Lote>(ctx, claveLote(codigo))
      if (!lote) throw new Error(`El lote ${codigo} no existe`)
      // Regla 5: no se certifica lo que no llego a despacho.
      if (FASES.indexOf(lote.faseActual) < FASES.indexOf('despacho')) {
        throw new Error(
          `El lote ${codigo} esta en ${lote.faseActual}, no llego a despacho`)
      }
      certificacionPorLote[codigo] = lote.certificacion
      hashesCabeza[codigo] = lote.hashCabeza
    }

    const cert: CertificadoOrigen = {
      docType: 'certificado', id, lotes: codigos, certificacionPorLote,
      contenedor: contenedor || undefined, ico, kgNeto: Number(kgNeto),
      hashesCabeza, emitidoPorMsp: this.msp(ctx), emitidoEn: this.ahora(ctx),
    }
    await this.escribir(ctx, claveCertificado(id), cert)
    ctx.stub.setEvent('CertificadoEmitido', Buffer.from(JSON.stringify({ id, lotes: codigos })))
  }

  // ------------------------------------------------------------------
  // Consultas
  // ------------------------------------------------------------------

  @Transaction(false)
  @Returns('string')
  async ObtenerLote(ctx: Context, codigo: string): Promise<string> {
    const lote = await this.leer<Lote>(ctx, claveLote(codigo))
    if (!lote) throw new Error(`El lote ${codigo} no existe`)
    return JSON.stringify(lote)
  }

  @Transaction(false)
  @Returns('string')
  async ObtenerCadena(ctx: Context, codigoLote: string): Promise<string> {
    const fases = await this.porRango<FaseSellada>(
      ctx, claveFase(codigoLote, 0), claveFase(codigoLote, 9999))
    fases.sort((a, b) => a.secuencia - b.secuencia)

    // Recalcula el encadenado: cada fase debe apuntar al hash de la anterior.
    let anterior = ''
    let rotaEn: number | null = null
    for (const f of fases) {
      if (f.hashAnterior !== anterior) { rotaEn = f.secuencia; break }
      anterior = f.hashPayload
    }
    return JSON.stringify({ lote: codigoLote, fases, cadenaValida: rotaEn === null, rotaEn })
  }

  @Transaction(false)
  @Returns('boolean')
  async VerificarHash(
    ctx: Context, codigoLote: string, secuencia: string, hashPayload: string,
  ): Promise<boolean> {
    const f = await this.leer<FaseSellada>(ctx, claveFase(codigoLote, Number(secuencia)))
    return f !== null && f.hashPayload === hashPayload
  }

  @Transaction(false)
  @Returns('string')
  async VerificarCertificado(ctx: Context, id: string): Promise<string> {
    const cert = await this.leer<CertificadoOrigen>(ctx, claveCertificado(id))
    if (!cert) throw new Error(`El certificado ${id} no existe`)
    return JSON.stringify(cert)
  }
}
