import { useState } from 'react'
import { Save, AlertTriangle, CheckCircle } from 'lucide-react'
import PhaseStepper from '../../components/PhaseStepper'
import BlockchainPanel from '../../components/BlockchainPanel'
import { ProcessPhase } from '../../types'

/** Diferencia permitida entre el peso asignado por trillado y el peso contabilizado aqui. */
const TOLERANCIA_ASIGNADO_PCT = 0.5

const DEFECTOS = [
  'Grano partido',
  'Grano negro',
  'Grano fermentado',
  'Grano mohoso',
  'Broca',
  'Materia extrana',
]

const loteEnProceso = {
  lotId: 'LOT-2024-0512',
  responsableTrillado: 'Ing. Marcos Quispe',
  /** Cafe verde que dejo sellada la fase de Trillado. */
  pesoAsignado: 1058.2,
  hashTrillado: '0xc4e91a0b73df...e5f6',
}

export default function Clasificacion() {
  const [form, setForm] = useState({
    pesoClasificado: '',
    pesoRechazado: '',
    responsable: '',
    calidad: 'AAA',
    observaciones: '',
  })
  const [defectosSeleccionados, setDefectosSeleccionados] = useState<string[]>([])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const toggleDefecto = (defecto: string) => {
    setDefectosSeleccionados((prev) =>
      prev.includes(defecto) ? prev.filter((d) => d !== defecto) : [...prev, defecto]
    )
  }

  const clasificado = parseFloat(form.pesoClasificado) || 0
  const rechazado = parseFloat(form.pesoRechazado) || 0

  const asignado = loteEnProceso.pesoAsignado
  const contabilizado = clasificado + rechazado
  // El sistema calcula la diferencia entre asignado y lo efectivamente contabilizado.
  const diferencia = contabilizado > 0 ? asignado - contabilizado : 0
  const diferenciaPct = asignado > 0 ? Math.abs(diferencia / asignado) * 100 : 0
  const balanceCuadra = contabilizado > 0 && diferenciaPct <= TOLERANCIA_ASIGNADO_PCT

  // El peso final del lote es lo que efectivamente pasa a almacenamiento.
  const pesoFinal = clasificado
  const eficiencia = asignado > 0 ? (clasificado / asignado) * 100 : 0

  const datosCompletos =
    clasificado > 0 && form.responsable.trim() !== '' && balanceCuadra

  const previewHash = datosCompletos
    ? 'd7a2f0918c34be61057fa2c8d31940be77f0c5a2e918d3467bb0125fae398c40'
    : undefined

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Clasificacion Fisica</h1>
        <p className="text-gray-600 mt-1">
          Lote #{loteEnProceso.lotId} &middot; Seleccion del cafe verde por calidad y retiro de defectos.
        </p>
      </div>

      <PhaseStepper currentPhase={ProcessPhase.SELECCION} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Herencia de la fase anterior */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Asignacion desde Trillado</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Peso asignado</p>
                <p className="text-xl font-bold text-gray-900">{asignado.toFixed(2)} kg</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Responsable trillado</p>
                <p className="text-gray-900 font-medium">{loteEnProceso.responsableTrillado}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Hash trillado</p>
                <p className="text-xs font-mono text-sky-700 break-all">{loteEnProceso.hashTrillado}</p>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Registro de Seleccion</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Peso Clasificado (kg)
                </label>
                <input
                  type="number"
                  name="pesoClasificado"
                  step="0.01"
                  placeholder="0.00"
                  value={form.pesoClasificado}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-xs text-gray-500 mt-1">Grano que aprueba la seleccion.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Peso Rechazado (kg)
                </label>
                <input
                  type="number"
                  name="pesoRechazado"
                  step="0.01"
                  placeholder="0.00"
                  value={form.pesoRechazado}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-xs text-gray-500 mt-1">Grano retirado por defectos.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Responsable de Seleccion
                </label>
                <input
                  type="text"
                  name="responsable"
                  placeholder="Nombre de la encargada"
                  value={form.responsable}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Calidad Asignada</label>
                <select
                  name="calidad"
                  value={form.calidad}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="AAA">AAA - Export Grade</option>
                  <option value="AA">AA</option>
                  <option value="A">A</option>
                  <option value="comercial">Comercial</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Defectos Encontrados
                </label>
                <div className="flex flex-wrap gap-2">
                  {DEFECTOS.map((d) => {
                    const activo = defectosSeleccionados.includes(d)
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDefecto(d)}
                        className={`px-3 py-1.5 text-sm rounded-full border transition ${
                          activo
                            ? 'bg-red-100 border-red-300 text-red-800 font-medium'
                            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {activo ? '- ' : '+ '}
                        {d}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Observaciones</label>
                <textarea
                  name="observaciones"
                  rows={3}
                  placeholder="Notas sobre la seleccion, uniformidad del grano..."
                  value={form.observaciones}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Balance final */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Balance Final del Lote</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Asignado</p>
                <p className="text-xl font-bold text-gray-900">{asignado.toFixed(2)}</p>
                <p className="text-xs text-gray-500">kg</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Contabilizado</p>
                <p className="text-xl font-bold text-gray-900">{contabilizado.toFixed(2)}</p>
                <p className="text-xs text-gray-500">kg</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Peso final</p>
                <p className="text-xl font-bold text-green-700">{pesoFinal.toFixed(2)}</p>
                <p className="text-xs text-gray-500">kg a almacen</p>
              </div>
              <div className="p-4 bg-sky-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Eficiencia</p>
                <p className="text-xl font-bold text-sky-700">{eficiencia.toFixed(2)}%</p>
                <p className="text-xs text-gray-500">clasificado / asignado</p>
              </div>
            </div>

            {contabilizado > 0 && !balanceCuadra && (
              <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="text-red-600 flex-shrink-0" size={18} />
                <p className="text-sm text-red-800">
                  Diferencia de {Math.abs(diferencia).toFixed(2)} kg ({diferenciaPct.toFixed(2)}%)
                  entre el peso asignado por trillado y lo contabilizado. La tolerancia es{' '}
                  {TOLERANCIA_ASIGNADO_PCT}%.
                </p>
              </div>
            )}

            {balanceCuadra && (
              <div className="mt-4 flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="text-green-600 flex-shrink-0" size={18} />
                <p className="text-sm text-green-800">
                  Balance conforme. {pesoFinal.toFixed(2)} kg calidad {form.calidad} pasaran a
                  Almacenamiento.
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
