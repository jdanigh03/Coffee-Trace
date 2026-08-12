import { Shield, Link2, RefreshCw } from 'lucide-react'
import { useAppStore } from '../store'

interface BlockchainPanelProps {
  /** Lote al que pertenece el registro que se va a sellar */
  lotId: string
  /** Hash SHA-256 previsto del registro en edicion (undefined mientras falten datos) */
  previewHash?: string
  /** TxID devuelto por Fabric una vez sellado el registro */
  txId?: string
  blockNumber?: number
}

/**
 * Panel lateral compartido por todas las pantallas de registro de fase.
 * Muestra el hash previsto antes de sellar y la prueba en cadena despues.
 */
export default function BlockchainPanel({ lotId, previewHash, txId, blockNumber }: BlockchainPanelProps) {
  const { blockchainStatus } = useAppStore()
  const sealed = Boolean(txId)

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="text-blue-700" size={20} />
          <h3 className="font-bold text-blue-900">Trazabilidad Garantizada</h3>
        </div>
        <p className="text-sm text-blue-800 mb-4">
          El registro se guarda primero en la base de datos, luego se genera su hash SHA-256 y ese
          hash se envia a Hyperledger Fabric. El lote <span className="font-mono">{lotId}</span>{' '}
          queda encadenado a su fase anterior.
        </p>

        <p className="text-xs font-semibold text-blue-900 uppercase mb-1">Hash previsto (SHA-256)</p>
        <div className="bg-white border border-blue-200 rounded p-3 mb-3">
          <p className="text-xs font-mono text-gray-700 break-all">
            {previewHash ?? 'Generando... Esperando confirmacion de datos.'}
          </p>
        </div>

        {sealed ? (
          <div className="bg-green-100 border border-green-300 rounded p-3 space-y-1">
            <div className="flex items-center gap-2 text-green-800">
              <Link2 size={14} />
              <span className="text-xs font-semibold">Sellado en Hyperledger</span>
            </div>
            <p className="text-xs font-mono text-green-900 break-all">TxID: {txId}</p>
            {blockNumber !== undefined && (
              <p className="text-xs text-green-800">Bloque #{blockNumber}</p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-blue-800">
            <RefreshCw size={14} />
            El sello de tiempo se aplica al guardar.
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Sincronizacion de Red</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Nodos validadores</span>
          <span className={`font-semibold ${blockchainStatus.isOnline ? 'text-green-700' : 'text-red-700'}`}>
            {blockchainStatus.syncedNodes} de {blockchainStatus.totalNodes}
          </span>
        </div>
      </div>
    </div>
  )
}
