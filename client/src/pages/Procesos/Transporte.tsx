import { Truck, Calendar, User, Plus } from 'lucide-react'
import PhaseStepper from '../../components/PhaseStepper'
import { ProcessPhase } from '../../types'

export default function Transporte() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Registro de Transporte</h1>
          <p className="text-gray-600 mt-1">Registre los datos del transporte Taipiplaya → El Alto.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-coffee-700 text-white font-medium rounded-lg hover:bg-coffee-800 transition">
          <Plus size={20} />
          Nuevo Transporte
        </button>
      </div>

      <PhaseStepper currentPhase={ProcessPhase.TRANSPORTE} />

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 font-semibold mb-2 uppercase">Transportes Hoy</p>
          <p className="text-3xl font-bold text-gray-900">8</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 font-semibold mb-2 uppercase">En Tránsito</p>
          <p className="text-3xl font-bold text-amber-600">3</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 font-semibold mb-2 uppercase">Entregados</p>
          <p className="text-3xl font-bold text-green-600">5</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 font-semibold mb-2 uppercase">Total Transportado</p>
          <p className="text-3xl font-bold text-blue-600">42.5Tn</p>
        </div>
      </div>

      {/* Active Transports */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Transportes Activos</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 hover:bg-gray-50 transition">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-gray-900">#TRANS-2024-{100 + i}</p>
                  <p className="text-sm text-gray-600">Lote: #LOT-2024-{500 + i * 10}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  i === 1
                    ? 'bg-amber-100 text-amber-700'
                    : i === 2
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {i === 1 ? 'En Tránsito' : i === 2 ? 'Próximo a Llegar' : 'Entregado'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="flex gap-3">
                  <Calendar className="text-gray-400" size={18} />
                  <div>
                    <p className="text-xs text-gray-600 uppercase">Salida</p>
                    <p className="text-sm font-semibold text-gray-900">08:30 - 2024-08-{i + 6}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Calendar className="text-gray-400" size={18} />
                  <div>
                    <p className="text-xs text-gray-600 uppercase">Llegada Est.</p>
                    <p className="text-sm font-semibold text-gray-900">14:30 - 2024-08-{i + 6}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Truck className="text-gray-400" size={18} />
                  <div>
                    <p className="text-xs text-gray-600 uppercase">Vehículo</p>
                    <p className="text-sm font-semibold text-gray-900">HC-{2000 + i}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <User className="text-gray-400" size={18} />
                  <div>
                    <p className="text-xs text-gray-600 uppercase">Conductor</p>
                    <p className="text-sm font-semibold text-gray-900">Carlos Mamani</p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Progreso del viaje</span>
                  <span className="font-semibold text-gray-900">{i * 30 + 40}%</span>
                </div>
                <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${i * 30 + 40}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Records */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Registros del Mes</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">ID TRANSPORTE</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">LOTE</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">PESO (KG)</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">ESTADO</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">BLOCKCHAIN</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-3 font-semibold text-sky-600">#TRANS-2024-{100 + i}</td>
                  <td className="px-6 py-3 text-gray-600">#LOT-2024-{500 + i * 10}</td>
                  <td className="px-6 py-3 font-semibold text-gray-900">{1200 + i * 50}</td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                      Entregado
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                      ✓ Verificado
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
