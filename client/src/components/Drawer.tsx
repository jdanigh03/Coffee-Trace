import { useEffect } from 'react'
import { X } from 'lucide-react'

interface DrawerProps {
  abierto: boolean
  onCerrar: () => void
  titulo: string
  subtitulo?: string
  children: React.ReactNode
  ancho?: 'md' | 'lg'
}

/**
 * Panel lateral para ver el detalle de una fila sin perder la tabla de fondo.
 *
 * Se usa un drawer en vez de navegar a otra pantalla porque las tablas de este
 * ERP se recorren fila por fila comparando: salir y volver perderia el filtro,
 * el scroll y el contexto.
 */
export default function Drawer({
  abierto, onCerrar, titulo, subtitulo, children, ancho = 'lg',
}: DrawerProps) {
  useEffect(() => {
    if (!abierto) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    document.addEventListener('keydown', esc)
    // Evita que la pagina de fondo haga scroll mientras el panel esta abierto.
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', esc)
      document.body.style.overflow = previo
    }
  }, [abierto, onCerrar])

  if (!abierto) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onCerrar} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={`relative bg-white h-full w-full shadow-xl flex flex-col
                    ${ancho === 'lg' ? 'max-w-3xl' : 'max-w-xl'}`}
      >
        <header className="flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-200">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900 truncate">{titulo}</h2>
            {subtitulo && <p className="text-sm text-gray-600 truncate">{subtitulo}</p>}
          </div>
          <button onClick={onCerrar} aria-label="Cerrar"
            className="p-2 -mr-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg shrink-0">
            <X size={20} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </aside>
    </div>
  )
}

/** Fila etiqueta/valor, el patron que repiten todos los detalles. */
export function Dato({ label, children, destacado }: {
  label: string; children: React.ReactNode; destacado?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 border-b border-gray-100 last:border-0">
      <dt className="text-sm text-gray-600 shrink-0">{label}</dt>
      <dd className={`text-sm text-right ${destacado ? 'font-semibold text-gray-900' : 'text-gray-800'}`}>
        {children}
      </dd>
    </div>
  )
}

export function Seccion({ titulo, children, aviso }: {
  titulo: string; children: React.ReactNode; aviso?: string
}) {
  return (
    <section className="mb-6">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{titulo}</h3>
      {aviso && <p className="text-xs text-amber-700 mb-2">{aviso}</p>}
      {children}
    </section>
  )
}
