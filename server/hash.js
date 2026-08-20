import crypto from 'node:crypto'

/**
 * Serializacion canonica para el sellado en blockchain.
 *
 * Si el backend y el verificador serializan distinto, los hashes no coinciden
 * y la verificacion falla sin que nadie entienda por que. Las reglas estan
 * fijadas en blockchain/MODELO.md y son:
 *
 *   - claves ordenadas alfabeticamente
 *   - sin espacios
 *   - numeros con decimales fijos (kg 3, Bs 2, resto 6)
 *   - fechas ISO-8601 en UTC con Z
 *   - las claves nulas se omiten, no se escribe null
 *   - texto UTF-8 normalizado NFC
 *
 * La normalizacion NFC no es cosmetica: "ñ" como caracter unico y como
 * n + tilde combinante son bytes distintos y darian hashes distintos. Con
 * apellidos como Ibáñez y Muñoz, y los Excel originales en Latin-1, sin esto
 * la verificacion fallaria solo en esos socios.
 */

const DECIMALES = { kg: 3, bs: 2, pct: 3 }

function decimalesDe(clave) {
  const k = clave.toLowerCase()
  if (k.startsWith('kg') || k.includes('peso')) return DECIMALES.kg
  if (k.includes('_bs') || k.includes('precio') || k.includes('pagado')) return DECIMALES.bs
  if (k.includes('pct') || k.includes('porcentaje')) return DECIMALES.pct
  return 6
}

function normalizar(valor, clave) {
  if (valor === null || valor === undefined) return undefined

  if (typeof valor === 'string') return valor.normalize('NFC')

  if (typeof valor === 'number') {
    if (!Number.isFinite(valor)) throw new Error(`Valor no finito en "${clave}": ${valor}`)
    return Number(valor.toFixed(decimalesDe(clave)))
  }

  if (typeof valor === 'boolean') return valor

  if (valor instanceof Date) return valor.toISOString()

  if (Array.isArray(valor)) {
    return valor.map((v, i) => normalizar(v, `${clave}[${i}]`)).filter((v) => v !== undefined)
  }

  if (typeof valor === 'object') {
    const salida = {}
    for (const k of Object.keys(valor).sort()) {
      const v = normalizar(valor[k], k)
      if (v !== undefined) salida[k] = v
    }
    return salida
  }

  throw new Error(`Tipo no serializable en "${clave}": ${typeof valor}`)
}

/** Devuelve el texto exacto que se hashea. Hay que guardarlo para reverificar. */
export function canonico(objeto) {
  const limpio = normalizar(objeto, 'raiz')
  // JSON.stringify respeta el orden de insercion, y `normalizar` ya inserto
  // las claves ordenadas, asi que la salida es determinista.
  return JSON.stringify(limpio)
}

export function sha256(texto) {
  return crypto.createHash('sha256').update(texto, 'utf8').digest('hex')
}

/** hash(n) = SHA256( payload_canonico(n) || hash(n-1) ) */
export function hashFase(payload, hashAnterior = '') {
  const texto = canonico(payload)
  return { payloadCanonico: texto, hash: sha256(texto + hashAnterior) }
}

/** Recalcula la cadena completa y devuelve donde se rompe, si se rompe. */
export function verificarCadena(fases) {
  let anterior = ''
  for (const f of fases) {
    const esperado = sha256(f.payload_canonico + anterior)
    if (esperado !== f.hash_sha256) {
      return { valida: false, rotaEn: f.secuencia ?? f.id, esperado, encontrado: f.hash_sha256 }
    }
    anterior = f.hash_sha256
  }
  return { valida: true, fases: fases.length }
}
