import { Shield, Link2, AlertTriangle, Clock } from 'lucide-react'
import { api } from '../api/client'
import { useApi } from '../api/useApi'

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
 * Panel lateral compartido por las pantallas de registro de fase.
 *
 * Muestra el estado REAL de la cola de sellado. Mientras Fabric no este
 * desplegado lo dice explicitamente, en vez de simular nodos sincronizados:
 * una UI que finge estar en cadena es peor que una que admite que no lo esta.
 */
export default function BlockchainPanel({ lotId, previewHash, txId, blockNumber }: BlockchainPanelProps) {
  const { datos: estado } = useApi(() => api.estadoBlockchain(), [])
  const sellado = Boolean(txId)

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="text-blue-700" size={20} />
          <h3 className="font-bold text-blue-900">Trazabilidad garantizada</h3>
        </div>
        <p className="text-sm text-blue-800 mb-4">
          El registro se guarda primero en la base de datos, luego se genera su hash SHA-256 y ese
          hash se encola para Hyperledger Fabric. El lote{' '}
          <span className="font-mono">{lotId}</span> queda encadenado a su fase anterior.
        </p>

        <p className="text-xs font-semibold text-blue-900 uppercase mb-1">Hash previsto (SHA-256)</p>
        <div className="bg-white border border-blue-200 rounded p-3 mb-3">
          <p className="text-xs font-mono text-gray-700 break-all">
            {previewHash ?? 'Se calcula al completar los datos del formulario.'}
          </p>
        </div>

        {sellado ? (
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
            <Clock size={14} />
            El sello se aplica cuando el worker procese la cola.
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Estado de la red</p>

        {estado?.redDesplegada === false ? (
          <div className="flex gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded p-3">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>
              Red Fabric no desplegada. Los registros se encolan y se sellaran cuando la red
              este operativa.
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Sellos confirmados</span>
            <span className="font-semibold text-green-700">{estado?.sellos ?? 0}</span>
          </div>
        )}

        {estado && (
          <dl className="mt-3 grid grid-cols-2 gap-y-1 text-sm">
            <dt className="text-gray-600">En cola</dt>
            <dd className="text-right font-medium">{estado.cola.pendiente}</dd>
            <dt className="text-gray-600">Confirmados</dt>
            <dd className="text-right font-medium">{estado.cola.confirmado}</dd>
            {estado.cola.error > 0 && (
              <>
                <dt className="text-red-700">Con error</dt>
                <dd className="text-right font-medium text-red-700">{estado.cola.error}</dd>
              </>
            )}
          </dl>
        )}
      </div>
    </div>
  )
}
