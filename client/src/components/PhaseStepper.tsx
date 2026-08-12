import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { PHASES, getPhase } from '../constants/phases'
import type { ProcessPhase } from '../types'

interface PhaseStepperProps {
  /** Fase en la que se encuentra el lote actualmente */
  currentPhase: ProcessPhase
  /** Si se pasa, los pasos ya completados son navegables */
  linkable?: boolean
}

/**
 * Stepper unico de la cadena de trazabilidad. Todas las pantallas de proceso lo
 * usan para que la numeracion y el orden de fases sea identico en el sistema.
 */
export default function PhaseStepper({ currentPhase, linkable = true }: PhaseStepperProps) {
  const current = getPhase(currentPhase)
  const currentOrder = current?.order ?? 0

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Flujo de Trazabilidad del Sistema
      </p>
      <div className="flex items-center overflow-x-auto pb-2">
        {PHASES.map((step, idx) => {
          const completed = step.order < currentOrder
          const active = step.order === currentOrder

          const circle = (
            <div
              className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm ${
                completed
                  ? 'bg-green-500 text-white'
                  : active
                  ? 'bg-coffee-700 text-white ring-4 ring-coffee-200'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {completed ? <Check size={16} /> : step.order}
            </div>
          )

          return (
            <div key={step.phase} className="flex items-center flex-shrink-0">
              <div className="flex flex-col items-center gap-2 w-24">
                {linkable && (completed || active) ? (
                  <Link to={step.path} title={`Registrado por: ${step.actor}`}>
                    {circle}
                  </Link>
                ) : (
                  circle
                )}
                <span
                  className={`text-xs text-center ${
                    completed
                      ? 'text-green-700 font-medium'
                      : active
                      ? 'text-coffee-900 font-bold'
                      : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < PHASES.length - 1 && (
                <div className={`w-8 h-0.5 mb-5 ${completed ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
