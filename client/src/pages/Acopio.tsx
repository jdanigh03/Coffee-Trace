import { useState } from 'react'
import { Plus, Eye, Shield } from 'lucide-react'
import PhaseStepper from '../components/PhaseStepper'
import { ProcessPhase } from '../types'

const mockAcopios = [
  {
    id: '#LOT-A402',
    producer: 'Roberto Quispe',
    producerId: 'PROD-8821',
    community: 'Taipiplaya - Central',
    quantity: 1240.50,
    humidity: '11.8%',
    status: 'verified',
    date: '2024-08-08',
    hash: '0x7a91...91'
  },
  {
    id: '#LOT-A401',
    producer: 'Maria Condori',
    producerId: 'PROD-8755',
    community: 'Yungas',
    quantity: 850.25,
    humidity: '12.1%',
    status: 'verified',
    date: '2024-08-07',
    hash: '0x3c3c...2d'
  },
  {
    id: '#LOT-A400',
    producer: 'Juan Perez',
    producerId: 'PROD-8690',
    community: 'Beni',
    quantity: 2100.00,
    humidity: '14.2%',
    status: 'syncing',
    date: '2024-08-06',
    hash: '↻ Sincronizando'
  }
]

export default function Acopio() {
  const [showNewForm, setShowNewForm] = useState(false)
  const [formData, setFormData] = useState({
    producerId: '',
    community: '',
    quantity: '',
    weight: '',
    observations: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Submitting form:', formData)
    setShowNewForm(false)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Registro de Acopio</h1>
          <p className="text-gray-600 mt-1">Ingrese los datos de entrega para generar el certificado de origen.</p>
        </div>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="flex items-center gap-2 px-4 py-2 bg-coffee-700 text-white font-medium rounded-lg hover:bg-coffee-800 transition"
        >
          <Plus size={20} />
          Nuevo Registro
        </button>
      </div>

      <PhaseStepper currentPhase={ProcessPhase.ACOPIO} />

      {/* New Form */}
      {showNewForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Registro de Acopio</h2>
          <p className="text-sm text-gray-600 mb-6">Ingrese los datos de entrega para generar el certificado de origen.</p>

          <div className="flex justify-end mb-6">
            <div className="px-4 py-2 bg-green-100 text-green-700 text-sm font-medium rounded-lg">
              ✓ EN LÍNEA
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ID Productor</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="producerId"
                    placeholder="Ej: PROD-8821"
                    value={formData.producerId}
                    onChange={handleInputChange}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    className="px-4 py-2 bg-sky-500 text-white font-medium rounded-lg hover:bg-sky-600 transition"
                  >
                    Verificar
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Comunidad</label>
                <select
                  name="community"
                  value={formData.community}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">Seleccionar...</option>
                  <option value="taipiplaya">Taipiplaya - Central</option>
                  <option value="yungas">Yungas</option>
                  <option value="beni">Beni</option>
                  <option value="lapaz">La Paz</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cantidad de Bolsas</label>
                <input
                  type="number"
                  name="quantity"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-xs text-gray-500 mt-1">und</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Peso Bruto</label>
                <input
                  type="number"
                  name="weight"
                  placeholder="0.00"
                  value={formData.weight}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-xs text-gray-500 mt-1">kg</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Observaciones</label>
              <textarea
                name="observations"
                placeholder="Detalles sobre el estado del grano o condiciones de entrega..."
                value={formData.observations}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Trazabilidad Garantizada</h3>
              <p className="text-sm text-blue-800">
                Cada movimiento genera un hash único SHA-256 almacenado en la red, asegurando que la información de origen nunca pueda ser alterada.
              </p>
              <p className="text-xs text-blue-700 mt-3 font-mono">Last Tx: 0x8f2a...f42c1</p>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-coffee-700 text-white font-medium rounded-lg hover:bg-coffee-800 transition"
              >
                <Shield size={18} />
                Registrar y Firmar en Blockchain
              </button>
              <button
                type="button"
                onClick={() => setShowNewForm(false)}
                className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recent Records */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Registros del Día</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID LOTE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PRODUCTOR</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PESO (KG)</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">HUMEDAD</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">BLOCKCHAIN STATUS</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {mockAcopios.map((acopio, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <a href="#" className="text-sky-600 font-semibold hover:underline">{acopio.id}</a>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">{acopio.producer}</p>
                      <p className="text-gray-600">ID: {acopio.producerId} • {acopio.community}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-semibold">{acopio.quantity.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-semibold">{acopio.humidity}</td>
                  <td className="px-6 py-4">
                    {acopio.status === 'verified' ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        ✓ VERIFIED ({acopio.hash})
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        ↻ {acopio.hash}
                      </span>
                    )}
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

      {/* Export Button */}
      <div className="flex gap-4">
        <button className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition">
          ↓ EXPORTAR
        </button>
        <button className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition">
          🖨 IMPRIMIR
        </button>
      </div>
    </div>
  )
}
