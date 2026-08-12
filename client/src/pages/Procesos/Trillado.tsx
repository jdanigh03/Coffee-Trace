import { useState } from 'react'
import { Save, AlertTriangle, CheckCircle } from 'lucide-react'
import PhaseStepper from '../../components/PhaseStepper'
import BlockchainPanel from '../../components/BlockchainPanel'
import { ProcessPhase } from '../../types'

/** Desviacion permitida al cuadrar el balance de masa del trillado. */
const TOLERANCIA_BALANCE_PCT = 1

const loteEnProceso = {
  lotId: 'LOT-2024-0512',
  origen: 'Taipiplaya (Planta 02)',
  operador: 'Ing. Marcos Quispe',
  inicio: '2024-08-09 08:30',
  variedad: 'Arabica Typica',
  /** Peso que dejo sellada la fase de Recepcion; es la entrada del trillado. */
  pesoPergamino: 1254.5,
  hashLimpieza: '0x7f83b127ff2a...814b',
}

export default function Trillado() {
  const [form, setForm] = useState({
    pesoCafeVerde: '',
    pesoCaracol: '',
    pesoCascarilla: '',
    pesoDefectos: '',
    fechaFin: '',
    observaciones: '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const verde = parseFloat(form.pesoCafeVerde) || 0
  const caracol = parseFloat(form.pesoCaracol) || 0
  const cascarilla = parseFloat(form.pesoCascarilla) || 0
  const defectos = parseFloat(form.pesoDefectos) || 0

  const entrada = loteEnProceso.pesoPergamino
  const salidaTotal = verde + caracol + cascarilla + defectos

  // El sistema calcula rendimiento, perdida y balance (requisito del workflow).
  const rendimiento = entrada > 0 ? ((verde + caracol) / entrada) * 100 : 0
  const perdidaPct = entrada > 0 ? ((cascarilla + defectos) / entrada) * 100 : 0
  const descuadre = salidaTotal > 0 ? entrada - salidaTotal : 0
  const descuadrePct = entrada > 0 ? Math.abs(descuadre / entrada) * 100 : 0
  const balanceCuadra = salidaTotal > 0 && descuadrePct <= TOLERANCIA_BALANCE_PCT

  const datosCompletos = verde > 0 && cascarilla > 0 && form.fechaFin !== '' && balanceCuadra

  const previewHash = datosCompletos
    ? 'c4e91a0b73df28516ac0f34b9218de77015fb3a6cc8291e4d70b6a1b2c3d4e5f6'
    : undefined

  const salidas = [
    { label: 'Cafe Verde (exportable)', value: verde, color: 'bg-green-500' },
    { label: 'Caracol', value: caracol, color: 'bg-emerald-400' },
    { label: 'Cascarilla (pisco)', value: cascarilla, color: 'bg-amber-400' },
    { label: 'Defectos (piedra/vanis)', value: defectos, color: 'bg-red-400' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Trillado Mecanico</h1>
        <p className="text-gray-600 mt-1">
          Lote #{loteEnProceso.lotId} &middot; Separacion del pergamino y obtencion de cafe verde.
        </p>
      </div>

      <PhaseStepper currentPhase={ProcessPhase.TRILLADO} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Estado del lote heredado */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Estado del Lote</h2>
              <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                EN PROCESO
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Origen</p>
                <p className="text-gray-900 font-medium">{loteEnProceso.origen}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Operador</p>
                <p className="text-gray-900 font-medium">{loteEnProceso.operador}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Inicio</p>
                <p className="text-gray-900 font-medium">{loteEnProceso.inicio}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Variedad</p>
                <p className="text-gray-900 font-medium">{loteEnProceso.variedad}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Peso pergamino</p>
                <p className="text-gray-900 font-semibold">{entrada.toFixed(2)} kg</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Hash limpieza</p>
                <p className="text-xs font-mono text-sky-700 break-all">{loteEnProceso.hashLimpieza}</p>
              </div>
            </div>
          </div>

          {/* Salidas del proceso */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Parametros Tecnicos del Proceso</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Peso Cafe Verde (kg)</label>
                <input
                  type="number"
                  name="pesoCafeVerde"
                  step="0.01"
                  placeholder="0.00"
                  value={form.pesoCafeVerde}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-xs text-gray-500 mt-1">Grano exportable obtenido.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Peso Caracol (kg)</label>
                <input
                  type="number"
                  name="pesoCaracol"
                  step="0.01"
                  placeholder="0.00"
                  value={form.pesoCaracol}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-xs text-gray-500 mt-1">Grano que se desarrolla solo en una semilla.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Peso Cascarilla / Pisco (kg)
                </label>
                <input
                  type="number"
                  name="pesoCascarilla"
                  step="0.01"
                  placeholder="0.00"
                  value={form.pesoCascarilla}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-xs text-gray-500 mt-1">Residuo de pergamino retirado.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Peso Defectos (kg)
                </label>
                <input
                  type="number"
                  name="pesoDefectos"
                  step="0.01"
                  placeholder="0.00"
                  value={form.pesoDefectos}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-xs text-gray-500 mt-1">Piedra, vanis y material descartado.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fecha de Finalizacion
                </label>
                <input
                  type="datetime-local"
                  name="fechaFin"
                  value={form.fechaFin}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Observaciones Tecnicas
                </label>
                <textarea
                  name="observaciones"
                  rows={3}
                  placeholder="Detalle cualquier anomalia o nota relevante del proceso..."
                  value={form.observaciones}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Balance de masa calculado por el sistema */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Balance de Masa (calculado)</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Entrada</p>
                <p className="text-xl font-bold text-gray-900">{entrada.toFixed(2)}</p>
                <p className="text-xs text-gray-500">kg pergamino</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Salida total</p>
                <p className="text-xl font-bold text-gray-900">{salidaTotal.toFixed(2)}</p>
                <p className="text-xs text-gray-500">kg</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Rendimiento</p>
                <p className="text-xl font-bold text-green-700">{rendimiento.toFixed(2)}%</p>
                <p className="text-xs text-gray-500">verde + caracol</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Perdida</p>
                <p className="text-xl font-bold text-amber-700">{perdidaPct.toFixed(2)}%</p>
                <p className="text-xs text-gray-500">cascarilla + defectos</p>
              </div>
            </div>

            <div className="space-y-3">
              {salidas.map((s) => {
                const pct = entrada > 0 ? (s.value / entrada) * 100 : 0
                return (
                  <div key={s.label}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">{s.label}</span>
                      <span className="font-medium text-gray-900">
                        {s.value.toFixed(2)} kg ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full ${s.color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {salidaTotal > 0 && !balanceCuadra && (
              <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="text-red-600 flex-shrink-0" size={18} />
                <p className="text-sm text-red-800">
                  El balance no cuadra: hay {Math.abs(descuadre).toFixed(2)} kg de diferencia (
                  {descuadrePct.toFixed(2)}%) frente al peso de entrada. La tolerancia es{' '}
                  {TOLERANCIA_BALANCE_PCT}%. Revise los pesos antes de sellar.
                </p>
              </div>
            )}

            {balanceCuadra && (
              <div className="mt-4 flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="text-green-600 flex-shrink-0" size={18} />
                <p className="text-sm text-green-800">
                  Balance conforme. El peso de cafe verde ({verde.toFixed(2)} kg) pasara como peso
                  asignado a la fase de Seleccion.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Guardar Borrador
            </button>
            <button
              type="button"
              disabled={!datosCompletos}
              className="flex items-center gap-2 px-6 py-3 bg-coffee-700 text-white font-medium rounded-lg hover:bg-coffee-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              Sellar y Firmar (Blockchain)
            </button>
          </div>
        </div>

        <BlockchainPanel lotId={loteEnProceso.lotId} previewHash={previewHash} />
      </div>
    </div>
  )
}
