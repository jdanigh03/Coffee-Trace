import { Search, Filter, MapPin, Calendar, TrendingUp } from 'lucide-react'
import { useState } from 'react'

export default function Consultas() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLot, setSelectedLot] = useState<string | null>(null)

  const mockResults = [
    {
      id: '#LOT-2024-001',
      producer: 'Roberto Quispe',
      origin: 'Taipiplaya - Central',
      status: 'Exportado',
      date: '2024-08-08'
    },
    {
      id: '#LOT-2024-002',
      producer: 'Maria Condori',
      origin: 'Yungas',
      status: 'En Almacén',
      date: '2024-08-07'
    },
    {
      id: '#LOT-2024-003',
      producer: 'Juan Perez',
      origin: 'Beni',
      status: 'En Trillado',
      date: '2024-08-06'
    }
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Consultas y Búsqueda</h1>
        <p className="text-gray-600 mt-1">Busque lotes, productores o transacciones blockchain en el historial completo.</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Ingrese ID de lote, productor, hash o transacción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-lg"
          />
        </div>

        <div className="mt-4 flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white font-medium rounded-lg hover:bg-sky-600 transition">
            <Filter size={18} />
            Filtros Avanzados
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition">
            Búsqueda Reciente
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {mockResults.map((result) => (
          <div
            key={result.id}
            onClick={() => setSelectedLot(result.id)}
            className={`bg-white rounded-lg p-6 border-2 cursor-pointer transition ${
              selectedLot === result.id
                ? 'border-sky-500 bg-sky-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{result.id}</h3>
                <p className="text-sm text-gray-600 mt-1">{result.producer}</p>
              </div>
              <span className={`px-4 py-2 text-sm font-medium rounded-full ${
                result.status === 'Exportado'
                  ? 'bg-green-100 text-green-700'
                  : result.status === 'En Almacén'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {result.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex gap-3">
                <MapPin className="text-gray-400 flex-shrink-0" size={18} />
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Origen</p>
                  <p className="text-sm text-gray-900 font-medium">{result.origin}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Calendar className="text-gray-400 flex-shrink-0" size={18} />
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Fecha</p>
                  <p className="text-sm text-gray-900 font-medium">{result.date}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <TrendingUp className="text-gray-400 flex-shrink-0" size={18} />
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Progreso</p>
                  <p className="text-sm text-gray-900 font-medium">7/9 fases completadas</p>
                </div>
              </div>
            </div>

            {selectedLot === result.id && (
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                <h4 className="font-semibold text-gray-900 mb-4">Historial Completo de Trazabilidad</h4>
                <div className="space-y-2">
                  {[
                    { phase: 'Acopio', date: '2024-08-01', hash: '0x1a2b...' },
                    { phase: 'Transporte', date: '2024-08-02', hash: '0x3c4d...' },
                    { phase: 'Recepción', date: '2024-08-02', hash: '0x5e6f...' },
                    { phase: 'Limpieza', date: '2024-08-03', hash: '0x7g8h...' },
                    { phase: 'Trillado', date: '2024-08-04', hash: '0x9i0j...' },
                    { phase: 'Clasificación', date: '2024-08-05', hash: '0xk1l2...' },
                    { phase: 'Almacenamiento', date: '2024-08-06', hash: '0xm3n4...' }
                  ].map((record, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{record.phase}</p>
                        <p className="text-xs text-gray-600">{record.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono text-sky-600">{record.hash}</p>
                        <p className="text-xs text-green-600">✓ Verificado</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
