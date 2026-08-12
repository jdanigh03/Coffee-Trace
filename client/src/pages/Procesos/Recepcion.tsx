import { useState } from 'react'
import { AlertTriangle, CheckCircle, Save } from 'lucide-react'
import PhaseStepper from '../../components/PhaseStepper'
import BlockchainPanel from '../../components/BlockchainPanel'
import { ProcessPhase } from '../../types'

/** Merma tolerada entre planta origen y planta destino antes de levantar alerta. */
const MERMA_TOLERADA_PCT = 2

/** Datos que llegan de la fase anterior (Transporte) y no son editables aqui. */
const transporteRecibido = {
  lotId: 'LOT-2024-0512',
  notaRemision: 'NR-2024-0891',
  pesoEnviado: 1280.0,
  bolsasEnviadas: 32,
  vehiculo: 'HC-2001',
  conductor: 'Carlos Mamani',
  salida: '2024-08-08 08:30',
  hashTransporte: '0x3c4d9a17be2f...8821',
}

export default function Recepcion() {
  const [form, setForm] = useState({
    pesoRecibido: '',
    humedad: '',
    temperatura: '',
    responsable: '',
    estadoLote: 'conforme',
    notaVerificada: false,
    observaciones: '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const pesoRecibido = parseFloat(form.pesoRecibido) || 0
  const humedad = parseFloat(form.humedad) || 0

  // Validaciones del workflow: comparar peso enviado vs recibido y calcular merma.
  const merma = pesoRecibido > 0 ? transporteRecibido.pesoEnviado - pesoRecibido : 0
  const mermaPct = pesoRecibido > 0 ? (merma / transporteRecibido.pesoEnviado) * 100 : 0
  const mermaExcedida = pesoRecibido > 0 && mermaPct > MERMA_TOLERADA_PCT
  const humedadFueraRango = humedad > 0 && (humedad < 8 || humedad > 12.5)

  const datosCompletos =
    pesoRecibido > 0 && humedad > 0 && form.responsable.trim() !== '' && form.notaVerificada

  const previewHash = datosCompletos
    ? '9c1f4a77be0d2318f5a0c47e1b93d206ff8e5471ac33be92d0714f8b6a2ce105'
    : undefined

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Recepcion en Planta El Alto</h1>
        <p className="text-gray-600 mt-1">
          Lote #{transporteRecibido.lotId} &middot; Control de peso, humedad y estado a la llegada.
        </p>
      </div>

      <PhaseStepper currentPhase={ProcessPhase.RECEPCION} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Datos heredados de la fase anterior */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Datos del Transporte (fase anterior)</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Nota de remision</p>
                <p className="font-mono text-gray-900">{transporteRecibido.notaRemision}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Peso enviado</p>
                <p className="font-semibold text-gray-900">{transporteRecibido.pesoEnviado.toFixed(2)} kg</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Bolsas</p>
                <p className="font-semibold text-gray-900">{transporteRecibido.bolsasEnviadas}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Vehiculo</p>
                <p className="text-gray-900">{transporteRecibido.vehiculo}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Conductor</p>
                <p className="text-gray-900">{transporteRecibido.conductor}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Salida</p>
                <p className="text-gray-900">{transporteRecibido.salida}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Hash fase anterior</p>
              <p className="text-xs font-mono text-sky-700 break-all">{transporteRecibido.hashTransporte}</p>
            </div>
          </div>

          {/* Formulario de recepcion */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Registro de Recepcion</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Peso Recibido (kg)</label>
                <input
                  type="number"
                  name="pesoRecibido"
                  step="0.01"
                  placeholder="0.00"
                  value={form.pesoRecibido}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
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
                <p className="text-xs text-gray-500 mt-1">Rango aceptable: 8.0% - 12.5%</p>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Responsable</label>
                <input
                  type="text"
                  name="responsable"
                  placeholder="Nombre del recepcionista"
                  value={form.responsable}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Estado del Lote</label>
                <select
                  name="estadoLote"
                  value={form.estadoLote}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="conforme">Conforme</option>
                  <option value="observado">Observado</option>
                  <option value="rechazado">Rechazado</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Observaciones</label>
                <textarea
                  name="observaciones"
                  rows={3}
                  placeholder="Condiciones del grano al arribo, incidencias en ruta..."
                  value={form.observaciones}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Verificacion de nota de remision: requisito del workflow */}
            <label className="flex items-start gap-3 mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                name="notaVerificada"
                checked={form.notaVerificada}
                onChange={handleChange}
                className="mt-0.5"
              />
              <span className="text-sm text-gray-700">
                Confirmo que la nota de remision{' '}
                <span className="font-mono font-semibold">{transporteRecibido.notaRemision}</span> fue
                presentada y coincide con la carga fisica.
              </span>
            </label>
          </div>

          {/* Balance de masa */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Balance de Masa</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Enviado</p>
                <p className="text-xl font-bold text-gray-900">
                  {transporteRecibido.pesoEnviado.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">kg</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Recibido</p>
                <p className="text-xl font-bold text-gray-900">{pesoRecibido.toFixed(2)}</p>
                <p className="text-xs text-gray-500">kg</p>
              </div>
              <div className={`p-4 rounded-lg ${mermaExcedida ? 'bg-red-50' : 'bg-green-50'}`}>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Merma</p>
                <p className={`text-xl font-bold ${mermaExcedida ? 'text-red-700' : 'text-green-700'}`}>
                  {merma.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">kg ({mermaPct.toFixed(2)}%)</p>
              </div>
            </div>

            {mermaExcedida && (
              <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="text-red-600 flex-shrink-0" size={18} />
                <p className="text-sm text-red-800">
                  La merma supera el {MERMA_TOLERADA_PCT}% tolerado. Registre la causa en
                  observaciones antes de sellar; el lote quedara marcado como observado.
                </p>
              </div>
            )}

            {humedadFueraRango && (
              <div className="mt-4 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="text-amber-600 flex-shrink-0" size={18} />
                <p className="text-sm text-amber-800">
                  Humedad fuera del rango 8.0% - 12.5%. Puede afectar el rendimiento en trillado.
                </p>
              </div>
            )}

            {datosCompletos && !mermaExcedida && !humedadFueraRango && (
              <div className="mt-4 flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="text-green-600 flex-shrink-0" size={18} />
                <p className="text-sm text-green-800">
                  Balance conforme. El lote puede avanzar a la fase de Limpieza de Equipos.
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

        <BlockchainPanel lotId={transporteRecibido.lotId} previewHash={previewHash} />
      </div>
    </div>
  )
}
