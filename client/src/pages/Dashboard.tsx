import { CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react'
import PhaseStepper from '../components/PhaseStepper'
import { ProcessPhase } from '../types'

const mockLots = [
  {
    id: '#TAI-2023-882',
    phase: 'Selección Física',
    plant: 'Taipiplaya',
    weight: 12450.00,
    hash: '0x8a2f...1e39',
    status: 'verified'
  },
  {
    id: '#ALT-2023-814',
    phase: 'Trillado',
    plant: 'El Alto',
    weight: 8900.25,
    hash: 'Sincronizando',
    status: 'syncing'
  },
  {
    id: '#TAI-2023-879',
    phase: 'Almacenamiento',
    plant: 'Taipiplaya',
    weight: 15000.00,
    hash: '0x7c6e...d821',
    status: 'verified'
  },
  {
    id: '#ALT-2023-811',
    phase: 'Despacho',
    plant: 'El Alto',
    weight: 24000.00,
    hash: '0x5b1a...f982',
    status: 'verified'
  }
]

const stats = [
  { label: 'Humedad Promedio', value: '11.8', unit: '%' },
  { label: 'Total Recibido (Hoy)', value: '42.5', unit: 'Tn' },
  { label: 'Tasa de Rendimiento', value: '78.2', unit: '%' },
  { label: 'Contenedores en Puerto', value: '04', unit: 'Und' }
]

const features = [
  {
    icon: CheckCircle,
    title: 'Trazabilidad Garantizada',
    description: 'Cada movimiento genera un hash único inmutable en blockchain.'
  },
  {
    icon: TrendingUp,
    title: 'Consultas y Reportes',
    description: 'Filtros dinámicos por lote, productor o período de cosecha.'
  },
  {
    icon: AlertCircle,
    title: 'Verificación de Integridad',
    description: 'Comprobación en tiempo real de hashes locales vs blockchain.'
  },
  {
    icon: Clock,
    title: 'Roles Involucrados',
    description: 'Gestión de accesos para recepción, selección y comercialización.'
  }
]

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Trazabilidad en Tiempo Real</h1>
            <p className="text-gray-600 mt-1">Monitoreo integral desde transporte hasta exportación final.</p>
          </div>
          <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-medium text-green-700">
            ● Blockchain Status: Online
          </div>
        </div>
      </div>

      {/* Process Flow */}
      <PhaseStepper currentPhase={ProcessPhase.LIMPIEZA} />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Lots */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Lotes Activos en Proceso</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID LOTE</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ETAPA ACTUAL</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PLANTA</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PESO (KG)</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ESTADO BLOCKCHAIN</th>
                  </tr>
                </thead>
                <tbody>
                  {mockLots.map((lot, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <a href="#" className="text-sky-600 font-semibold hover:underline">{lot.id}</a>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">● {lot.phase}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{lot.plant}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-semibold">{lot.weight.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        {lot.status === 'verified' ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            ∞ {lot.hash}
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            ↻ {lot.hash}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Security Info */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-coffee-700 to-coffee-900 text-white rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle size={24} />
              <h3 className="text-lg font-bold">Seguridad de Datos</h3>
            </div>
            <p className="text-sm text-coffee-100 mb-4">
              Cada transacción en CoffeeTrace genera un Hash SHA-256 único inmutable. Los datos son replicados en el registro público para garantizar la transparencia ante compradores internacionales.
            </p>
            <div className="bg-coffee-600 rounded px-3 py-2 text-xs font-mono text-coffee-100 mb-3">
              Last Tx: 0x8f2a...f42c1
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-600 font-semibold uppercase mb-2">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
              <span className="text-sm text-gray-600">{stat.unit}</span>
            </div>
            <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-coffee-600 rounded-full" style={{ width: `${Number(stat.value)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, idx) => {
          const Icon = feature.icon
          return (
            <div key={idx} className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-sky-100 rounded-lg text-sky-600">
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Verify Button */}
      <div className="flex gap-4">
        <button className="px-6 py-3 bg-coffee-700 text-white font-medium rounded-lg hover:bg-coffee-800 transition">
          ✓ Verificar Lote
        </button>
      </div>
    </div>
  )
}
