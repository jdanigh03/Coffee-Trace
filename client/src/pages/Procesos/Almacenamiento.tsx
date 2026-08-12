import { useState } from 'react'
import { Save, AlertTriangle, CheckCircle, Thermometer, Droplet } from 'lucide-react'
import PhaseStepper from '../../components/PhaseStepper'
import BlockchainPanel from '../../components/BlockchainPanel'
import { ProcessPhase } from '../../types'

/** Condiciones de bodega que preservan el grano hasta el despacho. */
const RANGO_TEMPERATURA = { min: 15, max: 22 }
const RANGO_HUMEDAD = { min: 10, max: 12.5 }

const UBICACIONES = ['Sector A - Rack 1', 'Sector A - Rack 2', 'Sector B - Rack 1', 'Sector C - Piso']

const loteEnProceso = {
  lotId: 'LOT-2024-0512',
  calidad: 'AAA',
  /** Peso final que dejo sellada la fase de Seleccion. */
  pesoFinal: 1021.4,
  hashSeleccion: '0xd7a2f0918c34...8c40',
}

export default function Almacenamiento() {
  const [form, setForm] = useState({
    fechaIngreso: '',
    ubicacion: UBICACIONES[0],
    temperatura: '',
    humedad: '',
    responsable: '',
    observaciones: '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const temperatura = parseFloat(form.temperatura) || 0
  const humedad = parseFloat(form.humedad) || 0

  const tempFueraRango =
    temperatura > 0 && (temperatura < RANGO_TEMPERATURA.min || temperatura > RANGO_TEMPERATURA.max)
  const humedadFueraRango =
    humedad > 0 && (humedad < RANGO_HUMEDAD.min || humedad > RANGO_HUMEDAD.max)

  const datosCompletos =
    form.fechaIngreso !== '' &&
    temperatura > 0 &&
    humedad > 0 &&
    form.responsable.trim() !== '' &&
    !tempFueraRango &&
    !humedadFueraRango

  const previewHash = datosCompletos
    ? 'b0e37c25af914d6208bc31f0a7d5e942cc10583be7f2a64d09183cbe57402fa1'
    : undefined

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Almacenamiento</h1>
        <p className="text-gray-600 mt-1">
          Lote #{loteEnProceso.lotId} &middot; Ingreso a bodega y control de condiciones hasta el despacho.
        </p>
      </div>

      <PhaseStepper currentPhase={ProcessPhase.ALMACEN} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Herencia de la fase anterior */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Lote Recibido de Seleccion</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Peso final</p>
                <p className="text-xl font-bold text-gray-900">{loteEnProceso.pesoFinal.toFixed(2)} kg</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Calidad</p>
                <p className="text-xl font-bold text-gray-900">{loteEnProceso.calidad}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Hash seleccion</p>
                <p className="text-xs font-mono text-sky-700 break-all">{loteEnProceso.hashSeleccion}</p>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Registro de Ingreso a Bodega</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de Ingreso</label>
                <input
                  type="datetime-local"
                  name="fechaIngreso"
                  value={form.fechaIngreso}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ubicacion</label>
                <select
                  name="ubicacion"
                  value={form.ubicacion}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {UBICACIONES.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Temperatura (C)</label>
                <input
                  type="number"
                  name="temperatura"
                  step="0.1"
                  placeholder="0.0"
                  value={form.temperatura}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    tempFueraRango
                      ? 'border-red-400 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-sky-500'
                  }`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Rango: {RANGO_TEMPERATURA.min}C - {RANGO_TEMPERATURA.max}C
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Humedad (%)</label>
                <input
                  type="number"
                  name="humedad"
                  step="0.1"
                  placeholder="0.0"
                  value={form.humedad}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    humedadFueraRango
                      ? 'border-red-400 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-sky-500'
                  }`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Rango: {RANGO_HUMEDAD.min}% - {RANGO_HUMEDAD.max}%
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Responsable</label>
                <input
                  type="text"
                  name="responsable"
                  placeholder="Responsable de planta"
                  value={form.responsable}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Observaciones</label>
                <textarea
                  name="observaciones"
                  rows={3}
                  placeholder="Estado de los sacos, rotacion de inventario..."
                  value={form.observaciones}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {tempFueraRango && (
              <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="text-red-600 flex-shrink-0" size={18} />
                <p className="text-sm text-red-800">
                  Temperatura fuera del rango {RANGO_TEMPERATURA.min}C - {RANGO_TEMPERATURA.max}C.
                  Corrija las condiciones de bodega antes de sellar el ingreso.
                </p>
              </div>
            )}

            {humedadFueraRango && (
              <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="text-red-600 flex-shrink-0" size={18} />
                <p className="text-sm text-red-800">
                  Humedad fuera del rango {RANGO_HUMEDAD.min}% - {RANGO_HUMEDAD.max}%. Riesgo de
                  moho y perdida de calidad exportable.
                </p>
              </div>
            )}

            {datosCompletos && (
              <div className="mt-4 flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="text-green-600 flex-shrink-0" size={18} />
                <p className="text-sm text-green-800">
                  Condiciones conformes. El lote queda disponible para ser seleccionado en un despacho.
                </p>
              </div>
            )}
          </div>

          {/* Condiciones actuales de bodega */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Condiciones Actuales de Bodega</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <Thermometer className="text-orange-600" size={24} />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Temperatura</p>
                  <p className="text-2xl font-bold text-gray-900">18.4 C</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <Droplet className="text-sky-600" size={24} />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Humedad relativa</p>
                  <p className="text-2xl font-bold text-gray-900">11.2 %</p>
                </div>
              </div>
            </div>
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
