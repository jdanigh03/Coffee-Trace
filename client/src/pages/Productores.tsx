import { useState } from 'react'
import { Search, Plus, CheckCircle, AlertCircle, Eye } from 'lucide-react'

const mockProducers = [
  {
    id: 'PROD-8821',
    name: 'Roberto Quispe',
    community: 'Taipiplaya - Central',
    verified: true,
    lastHarvest: '2024-08-06',
    activeLotsCount: 3,
    blockchainStatus: 'verified'
  },
  {
    id: 'PROD-8755',
    name: 'Maria Condori',
    community: 'Yungas',
    verified: true,
    lastHarvest: '2024-08-05',
    activeLotsCount: 2,
    blockchainStatus: 'verified'
  },
  {
    id: 'PROD-8690',
    name: 'Juan Perez',
    community: 'Beni',
    verified: false,
    lastHarvest: '2024-08-04',
    activeLotsCount: 1,
    blockchainStatus: 'pending'
  },
  {
    id: 'PROD-8647',
    name: 'Carlos Mamani',
    community: 'La Paz',
    verified: true,
    lastHarvest: '2024-08-03',
    activeLotsCount: 4,
    blockchainStatus: 'verified'
  }
]

export default function Productores() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all')

  const filtered = mockProducers.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       p.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchFilter = filterVerified === 'all' ||
                       (filterVerified === 'verified' && p.verified) ||
                       (filterVerified === 'unverified' && !p.verified)
    return matchSearch && matchFilter
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Productores</h1>
          <p className="text-gray-600 mt-1">Registro y verificación de productores de café.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-coffee-700 text-white font-medium rounded-lg hover:bg-coffee-800 transition">
          <Plus size={20} />
          Nuevo Productor
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilterVerified('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterVerified === 'all'
                ? 'bg-sky-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos ({mockProducers.length})
          </button>
          <button
            onClick={() => setFilterVerified('verified')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterVerified === 'verified'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Verificados ({mockProducers.filter(p => p.verified).length})
          </button>
          <button
            onClick={() => setFilterVerified('unverified')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterVerified === 'unverified'
                ? 'bg-amber-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Sin Verificar ({mockProducers.filter(p => !p.verified).length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID PRODUCTOR</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">NOMBRE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">COMUNIDAD</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ESTADO</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">LOTES ACTIVOS</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">BLOCKCHAIN</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((producer, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <a href="#" className="text-sky-600 font-semibold hover:underline">{producer.id}</a>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{producer.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{producer.community}</td>
                  <td className="px-6 py-4">
                    {producer.verified ? (
                      <div className="flex items-center gap-1 text-green-700">
                        <CheckCircle size={16} />
                        <span className="text-sm font-medium">Verificado</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-amber-700">
                        <AlertCircle size={16} />
                        <span className="text-sm font-medium">Pendiente</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-medium">{producer.activeLotsCount}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      producer.blockchainStatus === 'verified'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {producer.blockchainStatus === 'verified' ? '✓ Verificado' : '↻ Pendiente'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 font-semibold uppercase mb-2">Total Productores</p>
          <p className="text-3xl font-bold text-gray-900">{mockProducers.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 font-semibold uppercase mb-2">Verificados</p>
          <p className="text-3xl font-bold text-green-600">{mockProducers.filter(p => p.verified).length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 font-semibold uppercase mb-2">Lotes Totales</p>
          <p className="text-3xl font-bold text-blue-600">{mockProducers.reduce((sum, p) => sum + p.activeLotsCount, 0)}</p>
        </div>
      </div>
    </div>
  )
}
