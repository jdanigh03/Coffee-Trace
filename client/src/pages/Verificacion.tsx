import { useState } from 'react'
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react'
import { api } from '../api/client'

/**
 * Verificacion de integridad: recalcula el hash canonico de unos datos y lo
 * compara con el sellado. El calculo lo hace el backend con la misma
 * serializacion que se usa al sellar; hacerlo aqui con otra implementacion
 * daria hashes distintos y falsos negativos.
 */
export default function Verificacion() {
  const [hash, setHash] = useState('')
  const [json, setJson] = useState('{\n  "kg_guinda_real": 47,\n  "fecha": "2025-02-22"\n}')
  const [resultado, setResultado] = useState<
    { valido: boolean; esperado: string; payloadCanonico: string; mensaje: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  const verificar = async () => {
    setError(null); setResultado(null); setCargando(true)
    try {
      const datos = JSON.parse(json)
      setResultado(await api.verificarHash(hash.trim(), datos))
    } catch (e) {
      setError(e instanceof SyntaxError ? 'El JSON no es válido' : (e as Error).message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Verificación de integridad</h1>
        <p className="text-gray-600">
          Recalcula el hash de un registro y lo compara con el que se selló
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
        El hash se calcula sobre una <strong>serialización canónica</strong>: claves ordenadas,
        sin espacios, decimales fijos y texto normalizado NFC. Sin esas reglas, los mismos datos
        escritos en otro orden darían un hash distinto.
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hash sellado (SHA-256)
          </label>
          <input
            value={hash}
            onChange={(e) => setHash(e.target.value)}
            placeholder="64 caracteres hexadecimales"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono
                       focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Datos del registro (JSON)
          </label>
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono
                       focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <button
          onClick={verificar}
          disabled={!hash.trim() || cargando}
          className="px-4 py-2 bg-sky-700 text-white rounded-lg text-sm font-medium
                     hover:bg-sky-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {cargando ? 'Verificando...' : 'Verificar'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-2">
          <AlertTriangle className="text-red-600 shrink-0" size={18} />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {resultado && (
        <div className={`border rounded-lg p-5 ${
          resultado.valido ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2 mb-3">
            {resultado.valido
              ? <ShieldCheck className="text-green-700" size={22} />
              : <ShieldAlert className="text-red-700" size={22} />}
            <h2 className={`font-bold ${resultado.valido ? 'text-green-900' : 'text-red-900'}`}>
              {resultado.valido ? 'Integridad verificada' : 'Los datos no coinciden'}
            </h2>
          </div>
          <p className={`text-sm mb-4 ${resultado.valido ? 'text-green-800' : 'text-red-800'}`}>
            {resultado.mensaje}
          </p>

          <dl className="space-y-2 text-xs">
            <div>
              <dt className="font-semibold text-gray-700 uppercase">Hash esperado</dt>
              <dd className="font-mono break-all text-gray-800">{resultado.esperado}</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-700 uppercase">Payload canónico</dt>
              <dd className="font-mono break-all text-gray-800 bg-white/60 rounded p-2 mt-1">
                {resultado.payloadCanonico}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  )
}
