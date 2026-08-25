import { Link } from 'react-router-dom'

export interface Accion {
  label: string
  icono: React.ReactNode
  /** Accion en la misma pantalla (abrir un panel, copiar, exportar) */
  onClick?: () => void
  /** Accion que navega a otra pantalla */
  to?: string
  /** Deshabilita con motivo, en vez de ocultar: se ve que la accion existe */
  deshabilitadaPor?: string
  peligrosa?: boolean
}

/**
 * Acciones de una fila de tabla.
 *
 * Botones visibles en vez de un menu de tres puntos: son dos o tres por fila y
 * un menu obligaria a un clic extra para descubrirlas. El texto va en `title`
 * y en aria-label para no ensanchar la columna.
 */
export default function AccionesFila({ acciones }: { acciones: Accion[] }) {
  return (
    <div className="flex items-center justify-end gap-1">
      {acciones.map((a) => {
        const clases = `p-1.5 rounded transition ${
          a.deshabilitadaPor
            ? 'text-gray-300 cursor-not-allowed'
            : a.peligrosa
              ? 'text-gray-500 hover:text-red-700 hover:bg-red-50'
              : 'text-gray-500 hover:text-sky-700 hover:bg-sky-50'
        }`
        const titulo = a.deshabilitadaPor ?? a.label

        if (a.deshabilitadaPor) {
          return (
            <span key={a.label} className={clases} title={titulo} aria-label={titulo}>
              {a.icono}
            </span>
          )
        }
        if (a.to) {
          return (
            <Link key={a.label} to={a.to} className={clases} title={titulo} aria-label={titulo}>
              {a.icono}
            </Link>
          )
        }
        return (
          <button key={a.label} onClick={a.onClick} className={clases}
            title={titulo} aria-label={titulo}>
            {a.icono}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Descarga un array de objetos como CSV, sin dependencias.
 *
 * Acepta `object[]` y no `Record<string, unknown>[]` porque las interfaces de
 * TypeScript no llevan indice de string y no encajarian en ese tipo.
 */
export function descargarCsv<T extends object>(nombre: string, filas: T[]) {
  if (!filas.length) return
  const cols = Object.keys(filas[0])
  const valor = (f: T, c: string) => (f as Record<string, unknown>)[c]
  const escapar = (v: unknown) => {
    const s = v == null ? '' : String(v)
    // Comillas y separadores obligan a entrecomillar, o el CSV se rompe.
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [cols.join(','), ...filas.map((f) => cols.map((c) => escapar(valor(f, c))).join(','))]
    .join('\n')
  // BOM para que Excel abra los acentos correctamente.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre.endsWith('.csv') ? nombre : `${nombre}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
