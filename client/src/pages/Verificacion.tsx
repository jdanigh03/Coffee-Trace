import { Shield, CheckCircle, AlertTriangle, Search } from 'lucide-react'
import { useState } from 'react'

export default function Verificacion() {
  const [verificationResult, setVerificationResult] = useState<any>(null)

  const handleVerify = () => {
    setVerificationResult({
      status: 'verified',
      lotId: '#LOT-2024-001',
      hash: '0x7f3d127f2a5f10281a3d01f6d8321a3b7d4569f28c96e85b8d',
      txId: '0x8f2a...f42c1',
      blockNumber: 12451,
      timestamp: '2024-08-08T10:30:00Z',
      phases: [
        { name: 'Acopio', verified: true, hash: '0x1a2b...' },
        { name: 'Transporte', verified: true, hash: '0x3c4d...' },
        { name: 'Recepción', verified: true, hash: '0x5e6f...' },
        { name: 'Limpieza', verified: true, hash: '0x7g8h...' },
        { name: 'Trillado', verified: true, hash: '0x9i0j...' },
        { name: 'Clasificación', verified: true, hash: '0xk1l2...' },
        { name: 'Almacenamiento', verified: true, hash: '0xm3n4...' }
      ]
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Verificación de Integridad Blockchain</h1>
        <p className="text-gray-600 mt-1">Compare el registro físico con la huella digital en blockchain.</p>
      </div>

      {/* Verification Form */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <label className="block text-sm font-semibold text-gray-700 mb-3">Ingrese Hash, Lote o TX ID</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="0x7f3d127f2a5f... o #LOT-2024-001 o 0x8f2a...f42c1"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button
            onClick={handleVerify}
            className="flex items-center gap-2 px-6 py-3 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 transition"
          >
            <Search size={18} />
            Verificar
          </button>
        </div>
      </div>

      {verificationResult && (
        <>
          {/* Result Header */}
          <div className={`rounded-lg p-6 border-2 ${
            verificationResult.status === 'verified'
              ? 'bg-green-50 border-green-300'
              : 'bg-red-50 border-red-300'
          }`}>
            <div className="flex items-start gap-4">
              {verificationResult.status === 'verified' ? (
                <CheckCircle className="text-green-600 flex-shrink-0" size={28} />
              ) : (
                <AlertTriangle className="text-red-600 flex-shrink-0" size={28} />
              )}
              <div className="flex-1">
                <h2 className={`text-2xl font-bold ${
                  verificationResult.status === 'verified'
                    ? 'text-green-900'
                    : 'text-red-900'
                }`}>
                  {verificationResult.status === 'verified'
                    ? '✓ Registro Verificado en Blockchain'
                    : '⚠ Verificación Fallida'}
                </h2>
                <p className={`text-sm mt-2 ${
                  verificationResult.status === 'verified'
                    ? 'text-green-800'
                    : 'text-red-800'
                }`}>
                  Los datos en la base de datos central coinciden perfectamente con el registro en blockchain.
                </p>
              </div>
            </div>
          </div>

          {/* Verification Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Datos de la Transacción</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-semibold">ID de Lote</p>
                    <p className="text-sm font-mono text-sky-600">{verificationResult.lotId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-semibold">Transaction ID</p>
                    <p className="text-sm font-mono text-gray-900">{verificationResult.txId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-semibold">Bloque</p>
                    <p className="text-sm font-semibold text-gray-900">#{verificationResult.blockNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-semibold">Timestamp</p>
                    <p className="text-sm text-gray-900">{new Date(verificationResult.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Hash Info */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">SHA-256 Hash</h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-xs font-mono text-gray-600 break-all">
                    {verificationResult.hash}
                  </p>
                </div>
                <p className="text-xs text-gray-600 mt-3">
                  Este hash representa la firma única e inmutable del lote en blockchain.
                </p>
              </div>
            </div>

            {/* Right Column - Phase Verification */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">Verificación por Fase</h3>
              <div className="space-y-2">
                {verificationResult.phases.map((phase: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="text-green-600" size={18} />
                      <div>
                        <p className="font-medium text-gray-900">{phase.name}</p>
                        <p className="text-xs font-mono text-gray-600">{phase.hash}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-green-600">✓</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <h3 className="font-bold text-blue-900 mb-4">Acciones Disponibles</h3>
            <div className="flex gap-3 flex-wrap">
              <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition">
                📥 Descargar Certificado
              </button>
              <button className="px-4 py-2 bg-white text-blue-600 border border-blue-300 font-medium rounded-lg hover:bg-blue-50 transition">
                🔗 Ver en Blockchain
              </button>
              <button className="px-4 py-2 bg-white text-blue-600 border border-blue-300 font-medium rounded-lg hover:bg-blue-50 transition">
                📋 Exportar Reporte
              </button>
            </div>
          </div>
        </>
      )}

      {!verificationResult && (
        <div className="bg-white rounded-lg p-12 border border-gray-200 text-center">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Ingrese un hash o ID de lote para verificar su integridad en blockchain.</p>
        </div>
      )}
    </div>
  )
}
