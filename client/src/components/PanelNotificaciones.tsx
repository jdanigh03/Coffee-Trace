import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, AlertCircle, Info, CheckCircle2, RefreshCw } from 'lucide-react'
import { api, type Severidad } from '../api/client'
import { useApi } from '../api/useApi'

const ESTILO: Record<Severidad, { icono: React.ReactNode; clase: string; etiqueta: string }> = {
  critica: { icono: <AlertCircle size={16} />,   clase: 'text-red-700 bg-red-50 border-red-200',       etiqueta: 'Critica' },
  alta:    { icono: <AlertTriangle size={16} />, clase: 'text-amber-700 bg-amber-50 border-amber-200', etiqueta: 'Alta' },
  media:   { icono: <Info size={16} />,          clase: 'text-sky-700 bg-sky-50 border-sky-200',       etiqueta: 'Media' },
  info:    { icono: <Info size={16} />,          clase: 'text-gray-600 bg-gray-50 border-gray-200',    etiqueta: 'Info' },
}

export default function PanelNotificaciones({ onCerrar }: { onCerrar: () => void }) {
  const { datos, cargando, error, recargar } = useApi(() => api.notificaciones(), [])
  const caja = useRef<HTMLDivElement>(null)

  // Cerrar al hacer clic fuera o con Escape.
  useEffect(() => {
    const fuera = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) onCerrar()
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    document.addEventListener('mousedown', fuera)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', fuera)
      document.removeEventListener('keydown', esc)
    }
  }, [onCerrar])

  return (
    <div ref={caja}
      className="absolute right-0 top-full mt-2 w-[26rem] max-w-[calc(100vw-2rem)] bg-white
                 border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 text-sm">Alertas del sistema</h3>
        <button onClick={recargar} title="Actualizar"
          className="p-1 text-gray-400 hover:text-gray-700 rounded">
          <RefreshCw size={14} className={cargando ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="max-h-[26rem] overflow-y-auto">
        {cargando && !datos && (
          <p className="px-4 py-8 text-sm text-gray-500 text-center">Consultando...</p>
        )}

        {error && <p className="px-4 py-6 text-sm text-red-700">{error}</p>}

        {datos?.alertas.length === 0 && (
          <div className="px-4 py-10 text-center">
            <CheckCircle2 className="mx-auto text-green-600 mb-2" size={28} />
            <p className="text-sm text-gray-700">Sin alertas activas</p>
            <p className="text-xs text-gray-500 mt-1">Todos los indicadores dentro de rango</p>
          </div>
        )}

        <ul className="divide-y divide-gray-100">
          {datos?.alertas.map((a) => {
            const e = ESTILO[a.severidad] ?? ESTILO.info
            return (
              <li key={a.tipo}>
                <Link to={a.ruta} onClick={onCerrar}
                  className="flex gap-3 px-4 py-3 hover:bg-gray-50 transition">
                  <span className={`p-1.5 rounded-lg border h-fit ${e.clase}`}>{e.icono}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.titulo}</p>
                      <span className="text-xs font-semibold text-gray-900 shrink-0">
                        {a.cantidad.toLocaleString('es-BO')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-snug mt-0.5">{a.detalle}</p>
                    <span className={`inline-block mt-1 text-[10px] uppercase tracking-wide
                                      px-1.5 py-0.5 rounded border ${e.clase}`}>
                      {e.etiqueta}
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      {datos && datos.alertas.length > 0 && (
        <p className="px-4 py-2 border-t border-gray-100 text-[11px] text-gray-500">
          Las alertas se calculan de los datos: al corregir el origen desaparecen solas.
        </p>
      )}
    </div>
  )
}
