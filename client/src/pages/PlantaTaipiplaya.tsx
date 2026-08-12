import { BarChart3, Droplet, Thermometer, Wind, AlertCircle } from 'lucide-react'

const stats = [
  { label: 'Lotes en Planta', value: '24', icon: BarChart3, color: 'blue' },
  { label: 'Humedad Promedio', value: '12.5%', icon: Droplet, color: 'sky' },
  { label: 'Temperatura', value: '18°C', icon: Thermometer, color: 'orange' },
  { label: 'Ventilación', value: 'Activa', icon: Wind, color: 'green' }
]

const operations = [
  {
    id: 1,
    name: 'Despulpado y Lavado',
    lotsProcessed: 45,
    capacity: 100,
    status: 'activo'
  },
  {
    id: 2,
    name: 'Secado por Lotes',
    lotsProcessed: 32,
    capacity: 50,
    status: 'activo'
  },
  {
    id: 3,
    name: 'Almacenamiento Temporal',
    lotsProcessed: 60,
    capacity: 80,
    status: 'almacenado'
  }
]

export default function PlantaTaipiplaya() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Planta Taipiplaya</h1>
        <p className="text-gray-600 mt-1">Despulpado, lavado y secado inicial del café.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div key={idx} className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-sky-100 rounded-lg text-sky-600">
                  <Icon size={20} />
                </div>
                {idx === 0 && <AlertCircle size={18} className="text-amber-600" />}
              </div>
              <p className="text-sm text-gray-600 font-semibold mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          )
        })}
      </div>

      {/* Operations */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Operaciones en Curso</h2>
        </div>

        <div className="p-6 space-y-6">
          {operations.map((op) => (
            <div key={op.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{op.name}</h3>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  op.status === 'activo'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {op.status === 'activo' ? '● Activo' : '○ Almacenado'}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Capacidad: {op.lotsProcessed}/{op.capacity} lotes</span>
                  <span className="font-medium text-gray-900">{Math.round((op.lotsProcessed / op.capacity) * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition ${
                      op.status === 'activo' ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${(op.lotsProcessed / op.capacity) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Lots */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Lotes Recientes</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID LOTE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PRODUCTOR</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PESO (KG)</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ETAPA</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-semibold text-sky-600">#TAI-{2024}-{800 + i}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">Productor {i}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-semibold">1,250</td>
                  <td className="px-6 py-4 text-sm text-gray-600">Secado</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      ✓ Procesando
                    </span>
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
