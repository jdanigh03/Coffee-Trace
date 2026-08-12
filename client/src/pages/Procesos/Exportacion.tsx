import { Plus, FileText, Shield } from 'lucide-react'
import PhaseStepper from '../../components/PhaseStepper'
import { ProcessPhase } from '../../types'

export default function Exportacion() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Exportación</h1>
          <p className="text-gray-600 mt-1">Preparación de despacho y documentación de exportación.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-coffee-700 text-white font-medium rounded-lg hover:bg-coffee-800 transition">
          <Plus size={20} />
          Nuevo Despacho
        </button>
      </div>

      <PhaseStepper currentPhase={ProcessPhase.DESPACHO} />

      {/* Export Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 font-semibold mb-2 uppercase">Despachos Pendientes</p>
          <p className="text-3xl font-bold text-amber-600">7</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 font-semibold mb-2 uppercase">Contenedores en Puerto</p>
          <p className="text-3xl font-bold text-blue-600">4</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 font-semibold mb-2 uppercase">Exportados este Mes</p>
          <p className="text-3xl font-bold text-green-600">24</p>
        </div>
      </div>

      {/* Export Process */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Proceso de Exportación</h2>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {[
              { step: 1, name: 'Despacho y Carga', icon: '📦', completed: true },
              { step: 2, name: 'Información de Exportación', icon: '📄', completed: false, active: true },
              { step: 3, name: 'Verificación Blockchain', icon: '🔗', completed: false },
              { step: 4, name: 'Embarque', icon: '⛴️', completed: false },
              { step: 5, name: 'Tránsito', icon: '🚢', completed: false },
            ].map((proc) => (
              <div
                key={proc.step}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 ${
                  proc.completed
                    ? 'bg-green-50 border-green-300'
                    : proc.active
                    ? 'bg-amber-50 border-amber-300'
                    : 'bg-gray-50 border-gray-300'
                }`}
              >
                <div className="text-2xl">{proc.icon}</div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {proc.step}. {proc.name}
                  </p>
                </div>
                {proc.completed && (
                  <span className="px-3 py-1 bg-green-200 text-green-700 text-sm font-medium rounded">
                    ✓ Completado
                  </span>
                )}
                {proc.active && (
                  <span className="px-3 py-1 bg-amber-200 text-amber-700 text-sm font-medium rounded">
                    ● En Curso
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Exports */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Exportaciones Activas</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">ID DESPACHO</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">LOTES</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">DESTINO</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">PESO</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">ESTADO</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">DOCUMENTO</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-3 font-semibold text-sky-600">#DESP-2024-{100 + i}</td>
                  <td className="px-6 py-3 text-gray-600">2-3 lotes</td>
                  <td className="px-6 py-3 text-gray-600">Alemania, Hamburgo</td>
                  <td className="px-6 py-3 font-semibold text-gray-900">{19200 + i * 100} kg</td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      En Tránsito
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <button className="flex items-center gap-1 text-sky-600 hover:underline">
                      <FileText size={16} />
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Certificate Box */}
      <div className="bg-gradient-to-r from-coffee-700 to-coffee-900 text-white rounded-lg p-6 border border-coffee-600">
        <div className="flex items-start gap-4">
          <Shield size={24} />
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-2">Certificado de Trazabilidad</h3>
            <p className="text-coffee-100 mb-4">
              Cada exportación genera un certificado digital único con hash blockchain para garantizar autenticidad ante compradores internacionales.
            </p>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-white text-coffee-900 font-medium rounded-lg hover:bg-gray-100 transition">
                Descargar Certificado
              </button>
              <button className="px-4 py-2 bg-coffee-600 text-white font-medium rounded-lg hover:bg-coffee-700 transition">
                Verificar en Blockchain
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
