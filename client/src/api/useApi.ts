import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from './client'

interface Estado<T> {
  datos: T | null
  cargando: boolean
  error: string | null
}

/**
 * Hook minimo para llamadas al API. Sin libreria de cache: las pantallas de
 * este ERP consultan poco y no justifican la dependencia.
 *
 * `deps` controla cuando se vuelve a pedir, igual que en useEffect.
 */
export function useApi<T>(fn: () => Promise<T>, deps: unknown[] = []): Estado<T> & {
  recargar: () => void
} {
  const [estado, setEstado] = useState<Estado<T>>({ datos: null, cargando: true, error: null })
  const [tick, setTick] = useState(0)
  // Sin la ref, una respuesta lenta de una peticion vieja pisaria a una nueva.
  const vigente = useRef(0)

  const recargar = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    const idPeticion = ++vigente.current
    let vivo = true
    setEstado((e) => ({ ...e, cargando: true, error: null }))

    fn()
      .then((datos) => {
        if (vivo && idPeticion === vigente.current) {
          setEstado({ datos, cargando: false, error: null })
        }
      })
      .catch((e: unknown) => {
        if (!vivo || idPeticion !== vigente.current) return
        const msg = e instanceof ApiError
          ? e.message
          : 'No se pudo conectar con el API. Revisa que el servidor este corriendo.'
        setEstado({ datos: null, cargando: false, error: msg })
      })

    return () => { vivo = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  return { ...estado, recargar }
}

export const fmtKg = (n: number | null | undefined) =>
  n == null ? '--' : n.toLocaleString('es-BO', { maximumFractionDigits: 1 })

export const fmtBs = (n: number | null | undefined) =>
  n == null ? '--' : n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const fmtFecha = (s: string | null | undefined) =>
  !s ? '--' : new Date(s).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' })
