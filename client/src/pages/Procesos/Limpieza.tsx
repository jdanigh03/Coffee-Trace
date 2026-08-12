import { useState } from 'react'
import { Cpu, Save, AlertTriangle } from 'lucide-react'
import PhaseStepper from '../../components/PhaseStepper'
import BlockchainPanel from '../../components/BlockchainPanel'
import { ProcessPhase } from '../../types'

/** La limpieza CIP debe durar minimo 45 minutos segun el protocolo de planta. */
const DURACION_CIP_MINIMA = 45

const EQUIPOS = [
  'Despulpador A-1',
  'Trilladora T-2',
  'Clasificadora Densimetrica',
  'Banda Transportadora B-1',
  'Silo de Secado S-3',
]

export default function Limpieza() {
  const [form, setForm] = useState({
    fechaHora: '',
    equipo: EQUIPOS[0],
    responsable: '',
    tipoLimpieza: 'profunda',
    duracion: '',
    insumos: '',
    registroAutomaticoPLC: true,
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const duracion = parseFloat(form.duracion) || 0
  const cipMuyCorta = form.tipoLimpieza === 'profunda' && duracion > 0 && duracion < DURACION_CIP_MINIMA

  const datosCompletos =
    form.fechaHora !== '' &&
    form.responsable.trim() !== '' &&
    form.insumos.trim() !== '' &&
    duracion > 0 &&
    !cipMuyCorta

  const previewHash = datosCompletos
    ? '7f83b127ff2a5f10201a30f60c841c02e5d5d64621c13b74045f8e029f63814b'
    : undefined

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Registro de Limpieza de Equipos</h1>
        <p className="text-gray-600 mt-1">
          Lote #LOT-2024-0512 &middot; Fase de preparacion de maquinaria antes del trillado.
        </p>
      </div>

      <PhaseStepper currentPhase={ProcessPhase.LIMPIEZA} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Detalles Operativos</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha y Hora</label>
                <input
                  type="datetime-local"
                  name="fechaHora"
                  value={form.fechaHora}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Equipo / Linea</label>
                <select
                  name="equipo"
                  value={form.equipo}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {EQUIPOS.map((eq) => (
                    <option key={eq} value={eq}>
                      {eq}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Responsable Tecnico</label>
                <input
                  type="text"
                  name="responsable"
                  placeholder="Ej: Ing. Carlos Mamani"
                  value={form.responsable}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Duracion (minutos)</label>
                <input
                  type="number"
                  name="duracion"
                  placeholder="0"
                  value={form.duracion}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    cipMuyCorta ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-sky-500'
                  }`}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Limpieza</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tipoLimpieza"
                      value="profunda"
                      checked={form.tipoLimpieza === 'profunda'}
                      onChange={handleChange}
                    />
                    <span className="text-sm text-gray-700">Profunda (CIP)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tipoLimpieza"
                      value="rapida"
                      checked={form.tipoLimpieza === 'rapida'}
                      onChange={handleChange}
                    />
                    <span className="text-sm text-gray-700">Rapida (entre lotes)</span>
                  </label>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Insumos Utilizados</label>
                <textarea
                  name="insumos"
                  rows={3}
                  placeholder="Ej: Detergente alcalino 2%, Agua a 80C..."
                  value={form.insumos}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {cipMuyCorta && (
              <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="text-red-600 flex-shrink-0" size={18} />
                <p className="text-sm text-red-800">
                  Una limpieza CIP debe durar al menos {DURACION_CIP_MINIMA} minutos. Corrija la
                  duracion o cambie el tipo a limpieza rapida.
                </p>
              </div>
            )}

            {/* Lectura del PLC: valida la temperatura real del agua */}
            <div className="mt-6 flex items-center justify-between gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Cpu className="text-blue-700" size={20} />
                <div>
                  <p className="font-semibold text-blue-900 text-sm">Verificacion de PLC</p>
                  <p className="text-xs font-mono text-blue-800">
                    Sensor de flujo: Activo | Temp: 82.1 C
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 px-3 py-2 bg-white border border-blue-300 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  name="registroAutomaticoPLC"
                  checked={form.registroAutomaticoPLC}
                  onChange={handleChange}
                />
                <span className="text-xs font-semibold text-blue-900">REGISTRO AUTOMATICO</span>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Protocolo de Limpieza</h2>
            <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
              <li>Obligatorio entre lotes de diferentes certificaciones (organico vs convencional).</li>
              <li>La limpieza CIP debe durar minimo {DURACION_CIP_MINIMA} minutos.</li>
              <li>El registro automatico de PLC valida la temperatura del agua.</li>
              <li>Sin limpieza sellada, el lote no puede avanzar a Trillado.</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
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

        <BlockchainPanel lotId="LOT-2024-0512" previewHash={previewHash} />
      </div>
    </div>
  )
}
