import { Cpu, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'

export default function PlantaElAlto() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Planta El Alto</h1>
        <p className="text-gray-600 mt-1">Trillado, clasificación y almacenamiento final antes de exportación.</p>
      </div>

      {/* Process Flow */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Flujo de Procesamiento</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { name: 'Recepción', icon: '📦', completed: true },
            { name: 'Limpieza de Equipos', icon: '🧹', completed: true },
            { name: 'Trillado', icon: '⚙️', completed: false, active: true },
            { name: 'Clasificación', icon: '📊', completed: false }
          ].map((step, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border-2 ${
                step.completed
                  ? 'bg-green-50 border-green-300'
                  : step.active
                  ? 'bg-amber-50 border-amber-300'
                  : 'bg-gray-50 border-gray-300'
              }`}
            >
              <div className="text-3xl mb-2">{step.icon}</div>
              <p className="font-semibold text-gray-900">{step.name}</p>
              {step.completed && (
                <p className="text-sm text-green-700 mt-2">✓ Completado</p>
              )}
              {step.active && (
                <p className="text-sm text-amber-700 mt-2">● En Proceso</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Active Lots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Lotes en Trillado</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">#ALT-2024-{800 + i * 10}</p>
                    <p className="text-sm text-gray-600">Productor {i} • Taipiplaya</p>
                  </div>
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                    En Proceso
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Rendimiento: 85%</span>
                  <span className="font-medium text-gray-900">1,250 kg</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Estadísticas de Hoy</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="text-blue-600" size={20} />
                <span className="text-gray-600 font-medium">Lotes Procesados</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">12</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Cpu className="text-green-600" size={20} />
                <span className="text-gray-600 font-medium">Eficiencia Planta</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">94%</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-orange-600" size={20} />
                <span className="text-gray-600 font-medium">Alertas Pendientes</span>
              </div>
              <span className="text-2xl font-bold text-orange-600">2</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-600" size={20} />
                <span className="text-gray-600 font-medium">Verificaciones OK</span>
              </div>
              <span className="text-2xl font-bold text-green-600">18</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Lot Information */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Detalles de Lotes</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID LOTE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ETAPA ACTUAL</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">EFICIENCIA</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">BLOCKCHAIN</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ACCIÓN</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-semibold text-sky-600">#ALT-2024-{800 + i * 10}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">Trillado</td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-semibold">{85 + i}%</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      ✓ Verificado
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-sky-600 hover:underline text-sm font-medium">Ver Detalles</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
