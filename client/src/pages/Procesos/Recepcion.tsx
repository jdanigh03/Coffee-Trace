import { useState } from 'react'
import {
  AlertTriangle, CheckCircle2, Save, Shield, Link2, Clock, Loader2, Copy, Check,
} from 'lucide-react'
import { api, type Recepcion as RecepcionFila } from '../../api/client'
import { useApi, fmtKg, fmtFecha } from '../../api/useApi'
import PhaseStepper from '../../components/PhaseStepper'
import { ProcessPhase } from '../../types'

/** Merma tolerada entre planta origen y planta destino antes de levantar alerta. */
const MERMA_TOLERADA_PCT = 2
const HUMEDAD_MIN = 8
const HUMEDAD_MAX = 12.5

const vacio = {
  kg_pergamino_recibido: '', bolsas_recibidas: '', humedad_recepcion: '',
  temperatura_recepcion_c: '', recepcionista: '', estado_recepcion: 'conforme',
  nota_remision_verificada: false, observaciones: '', fecha_llegada: '',
}

/**
 * Recepcion en la planta de El Alto.
 *
 * Trabaja sobre los envios reales: el peso despachado y la nota de remision
 * vienen del despacho en Taipiplaya, no se escriben aqui. Guardar completa el
 * envio, y el sellado encola ese mismo registro con su hash encadenado al
 * anterior del lote.
 */
export default function Recepcion() {
  const { datos: envios, cargando, recargar } = useApi(() => api.recepciones(), [])
  const [loteSel, setLoteSel] = useState('')
  const [form, setForm] = useState(vacio)
  const [guardando, setGuardando] = useState(false)
  const [sellando, setSellando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const [copiado, setCopiado] = useState(false)

  const lista = envios ?? []
  const pendientes = lista.filter((e) => e.pendiente)
  // Si no se eligio nada, se propone el primero que falta recibir.
  const envio: RecepcionFila | undefined =
    lista.find((e) => e.lote === loteSel) ?? pendientes[0] ?? lista[0]

  const cambiar = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }))
    setMsg(null)
  }

  const despachado = Number(envio?.kg_pergamino_despachado ?? 0)
  // Si el envio ya se recibio, los calculos usan el dato guardado.
  const recibido = envio?.pendiente
    ? parseFloat(form.kg_pergamino_recibido) || 0
    : Number(envio?.kg_pergamino_recibido ?? 0)
  const humedad = envio?.pendiente
    ? parseFloat(form.humedad_recepcion) || 0
    : Number(envio?.humedad_recepcion ?? 0)

  const merma = recibido > 0 ? despachado - recibido : 0
  const mermaPct = recibido > 0 && despachado > 0 ? (merma / despachado) * 100 : 0
  const mermaExcedida = recibido > 0 && mermaPct > MERMA_TOLERADA_PCT
  const humedadFueraRango = humedad > 0 && (humedad < HUMEDAD_MIN || humedad > HUMEDAD_MAX)

  const completo = recibido > 0 && form.recepcionista.trim() !== '' && form.nota_remision_verificada
  const guardado = Boolean(envio && !envio.pendiente)

  const guardar = async () => {
    if (!envio) return
    setGuardando(true); setMsg(null)
    try {
      await api.registrarRecepcion({
        lote: envio.lote,
        kg_pergamino_recibido: form.kg_pergamino_recibido,
        bolsas_recibidas: form.bolsas_recibidas || null,
        humedad_recepcion: form.humedad_recepcion || null,
        temperatura_recepcion_c: form.temperatura_recepcion_c || null,
        recepcionista: form.recepcionista || null,
        estado_recepcion: mermaExcedida || humedadFueraRango
          ? 'observado' : form.estado_recepcion,
        nota_remision_verificada: form.nota_remision_verificada,
        observaciones: form.observaciones || null,
        fecha_llegada: form.fecha_llegada || new Date().toISOString(),
      })
      setMsg({ tipo: 'ok', texto: `Recepcion del lote ${envio.lote} registrada` })
      setForm(vacio)
      recargar()
    } catch (e) {
      setMsg({ tipo: 'error', texto: e instanceof Error ? e.message : 'No se pudo guardar' })
    } finally { setGuardando(false) }
  }

  const sellar = async () => {
    if (!envio) return
    setSellando(true); setMsg(null)
    try {
      const r = await api.encolarSello('envios', envio.id, 'recepcion')
      setMsg({ tipo: 'ok', texto: `Registro encolado con hash ${r.hash_sha256.slice(0, 12)}...` })
      recargar()
    } catch (e) {
      setMsg({ tipo: 'error', texto: e instanceof Error ? e.message : 'No se pudo encolar' })
    } finally { setSellando(false) }
  }

  const copiarHash = () => {
    if (!envio?.hash_sello) return
    navigator.clipboard.writeText(envio.hash_sello)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1800)
  }

  const input = `w-full px-4 py-2 border border-gray-300 rounded-lg text-sm
                 focus:outline-none focus:ring-2 focus:ring-sky-500`
  const etiqueta = 'block text-sm font-semibold text-gray-700 mb-2'

  if (cargando) return <div className="p-8 text-gray-500">Cargando envios...</div>

  if (!envio) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Recepcion en Planta El Alto</h1>
        <PhaseStepper currentPhase={ProcessPhase.RECEPCION} />
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 text-sm text-amber-900">
          No hay envios despachados desde Taipiplaya. La recepcion se registra sobre un envio
          existente: primero hay que despachar el lote en la etapa 8.
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Recepcion en Planta El Alto</h1>
        <p className="text-gray-600 mt-1">
          Fase III &middot; El Alto &mdash; control de peso, humedad y estado a la llegada.
        </p>
      </div>

      <PhaseStepper currentPhase={ProcessPhase.RECEPCION} />

      {/* Selector de envio */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <label className={etiqueta}>Envio a recibir</label>
        <select value={envio.lote} onChange={(e) => { setLoteSel(e.target.value); setForm(vacio) }}
          className={`${input} sm:w-96 bg-white`}>
          {lista.map((e) => (
            <option key={e.id} value={e.lote}>
              {e.lote} — {fmtKg(e.kg_pergamino_despachado)} kg despachados —{' '}
              {e.pendiente ? 'pendiente de recibir' : 'ya recibido'}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-2">
          {pendientes.length} de {lista.length} envios sin peso de recepcion registrado.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Datos heredados del despacho */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Datos del despacho (fase anterior)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {[
                ['Lote', envio.lote, 'font-mono'],
                ['Nota de remision', envio.nota_remision ?? '--', 'font-mono'],
                ['Peso despachado', `${fmtKg(envio.kg_pergamino_despachado)} kg`, 'font-semibold'],
                ['Bolsas enviadas', envio.numero_bolsas ?? '--', ''],
                ['Vehiculo', envio.vehiculo ?? '--', ''],
                ['Conductor', envio.conductor ?? '--', ''],
                ['Transportista', envio.responsable_transportista ?? '--', ''],
                ['Salida', fmtFecha(envio.fecha_salida), ''],
                ['Certificacion', envio.certificacion, 'capitalize'],
              ].map(([k, v, clase]) => (
                <div key={String(k)}>
                  <p className="text-xs text-gray-500 uppercase font-semibold">{k}</p>
                  <p className={`text-gray-900 ${clase}`}>{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Formulario */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Registro de recepcion</h2>

            {guardado ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 grid grid-cols-2
                              md:grid-cols-4 gap-4 text-sm">
                {[
                  ['Peso recibido', `${fmtKg(envio.kg_pergamino_recibido)} kg`],
                  ['Bolsas', envio.bolsas_recibidas ?? '--'],
                  ['Humedad', envio.humedad_recepcion != null ? `${envio.humedad_recepcion}%` : '--'],
                  ['Temperatura', envio.temperatura_recepcion_c != null
                    ? `${envio.temperatura_recepcion_c} C` : '--'],
                  ['Recepcionista', envio.recepcionista ?? '--'],
                  ['Estado', envio.estado_recepcion ?? '--'],
                  ['Llegada', fmtFecha(envio.fecha_llegada)],
                  ['Nota verificada', envio.nota_remision_verificada ? 'Si' : 'No'],
                ].map(([k, v]) => (
                  <div key={String(k)}>
                    <p className="text-xs text-gray-500 uppercase font-semibold">{k}</p>
                    <p className="text-gray-900 capitalize">{v}</p>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={etiqueta}>Peso recibido (kg) *</label>
                    <input type="number" name="kg_pergamino_recibido" step="0.01"
                      placeholder="0.00" value={form.kg_pergamino_recibido}
                      onChange={cambiar} className={input} />
                  </div>
                  <div>
                    <label className={etiqueta}>Bolsas recibidas</label>
                    <input type="number" name="bolsas_recibidas" value={form.bolsas_recibidas}
                      onChange={cambiar} className={input} />
                    {envio.numero_bolsas != null && form.bolsas_recibidas !== '' &&
                      Number(form.bolsas_recibidas) !== envio.numero_bolsas && (
                      <p className="text-xs text-red-700 mt-1">
                        Se despacharon {envio.numero_bolsas} bolsas: faltan{' '}
                        {envio.numero_bolsas - Number(form.bolsas_recibidas)}.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={etiqueta}>Humedad (%)</label>
                    <input type="number" name="humedad_recepcion" step="0.1" placeholder="0.0"
                      value={form.humedad_recepcion} onChange={cambiar}
                      className={humedadFueraRango
                        ? `${input} border-red-400 focus:ring-red-500` : input} />
                    <p className="text-xs text-gray-500 mt-1">
                      Rango aceptable: {HUMEDAD_MIN}% - {HUMEDAD_MAX}%
                    </p>
                  </div>
                  <div>
                    <label className={etiqueta}>Temperatura (C)</label>
                    <input type="number" name="temperatura_recepcion_c" step="0.1"
                      placeholder="0.0" value={form.temperatura_recepcion_c}
                      onChange={cambiar} className={input} />
                  </div>
                  <div>
                    <label className={etiqueta}>Recepcionista *</label>
                    <input type="text" name="recepcionista" placeholder="Nombre de quien recibe"
                      value={form.recepcionista} onChange={cambiar} className={input} />
                  </div>
                  <div>
                    <label className={etiqueta}>Fecha y hora de llegada</label>
                    <input type="datetime-local" name="fecha_llegada" value={form.fecha_llegada}
                      onChange={cambiar} className={input} />
                    <p className="text-xs text-gray-500 mt-1">Si se deja vacio se usa ahora.</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className={etiqueta}>Estado del lote</label>
                    <select name="estado_recepcion" value={form.estado_recepcion}
                      onChange={cambiar} className={`${input} bg-white`}>
                      <option value="conforme">Conforme</option>
                      <option value="observado">Observado</option>
                      <option value="rechazado">Rechazado</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className={etiqueta}>Observaciones</label>
                    <textarea name="observaciones" rows={3}
                      placeholder="Condiciones del grano al arribo, incidencias en ruta..."
                      value={form.observaciones} onChange={cambiar} className={input} />
                  </div>
                </div>

                <label className="flex items-start gap-3 mt-6 p-4 bg-gray-50 border
                                  border-gray-200 rounded-lg cursor-pointer">
                  <input type="checkbox" name="nota_remision_verificada"
                    checked={form.nota_remision_verificada} onChange={cambiar}
                    className="mt-0.5" />
                  <span className="text-sm text-gray-700">
                    Confirmo que la nota de remision{' '}
                    <span className="font-mono font-semibold">
                      {envio.nota_remision ?? '(sin numero)'}
                    </span>{' '}
                    fue presentada y coincide con la carga fisica.
                  </span>
                </label>

                <div className="flex flex-wrap items-center gap-3 mt-6">
                  <button type="button" onClick={guardar} disabled={!completo || guardando}
                    className="flex items-center gap-2 px-6 py-3 bg-coffee-700 text-white
                               font-medium rounded-lg hover:bg-coffee-800 transition
                               disabled:opacity-40 disabled:cursor-not-allowed">
                    {guardando ? <Loader2 size={18} className="animate-spin" />
                               : <Save size={18} />}
                    Guardar recepcion
                  </button>
                  {!completo && (
                    <span className="text-sm text-gray-500">
                      Faltan el peso recibido, el recepcionista y la verificacion de la nota.
                    </span>
                  )}
                </div>
              </>
            )}

            {msg && (
              <p className={`flex items-center gap-1.5 text-sm mt-4 ${
                msg.tipo === 'ok' ? 'text-green-700' : 'text-red-700'}`}>
                {msg.tipo === 'ok' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                {msg.texto}
              </p>
            )}
          </div>

          {/* Balance de masa */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Balance de masa</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Despachado</p>
                <p className="text-xl font-bold text-gray-900">{fmtKg(despachado)}</p>
                <p className="text-xs text-gray-500">kg</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Recibido</p>
                <p className="text-xl font-bold text-gray-900">{fmtKg(recibido)}</p>
                <p className="text-xs text-gray-500">kg</p>
              </div>
              <div className={`p-4 rounded-lg ${mermaExcedida ? 'bg-red-50' : 'bg-green-50'}`}>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Merma</p>
                <p className={`text-xl font-bold ${
                  mermaExcedida ? 'text-red-700' : 'text-green-700'}`}>{fmtKg(merma)}</p>
                <p className="text-xs text-gray-500">kg ({mermaPct.toFixed(2)}%)</p>
              </div>
            </div>

            {mermaExcedida && (
              <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200
                              rounded-lg">
                <AlertTriangle className="text-red-600 flex-shrink-0" size={18} />
                <p className="text-sm text-red-800">
                  La merma supera el {MERMA_TOLERADA_PCT}% tolerado. Registre la causa en
                  observaciones: el lote se guardara como observado.
                </p>
              </div>
            )}
            {humedadFueraRango && (
              <div className="mt-4 flex items-start gap-3 p-4 bg-amber-50 border
                              border-amber-200 rounded-lg">
                <AlertTriangle className="text-amber-600 flex-shrink-0" size={18} />
                <p className="text-sm text-amber-800">
                  Humedad fuera del rango {HUMEDAD_MIN}% - {HUMEDAD_MAX}%. Puede afectar el
                  rendimiento en trillado.
                </p>
              </div>
            )}
            {recibido > 0 && !mermaExcedida && !humedadFueraRango && (
              <div className="mt-4 flex items-start gap-3 p-4 bg-green-50 border
                              border-green-200 rounded-lg">
                <CheckCircle2 className="text-green-600 flex-shrink-0" size={18} />
                <p className="text-sm text-green-800">
                  Balance conforme. El lote puede avanzar a la limpieza de maquinas.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* -------------------------------------------------- sellado */}
        <aside className="space-y-4">
          <div className={`rounded-lg border-2 p-5 ${
            envio.encolado ? 'bg-green-50 border-green-300' : 'bg-sky-50 border-sky-300'}`}>
            <div className="flex items-center gap-2 mb-3">
              <Shield className={envio.encolado ? 'text-green-700' : 'text-sky-700'} size={22} />
              <h3 className={`font-bold text-lg ${
                envio.encolado ? 'text-green-900' : 'text-sky-900'}`}>
                Sellado en blockchain
              </h3>
            </div>

            <p className={`text-sm mb-4 ${
              envio.encolado ? 'text-green-900' : 'text-sky-900'}`}>
              La recepcion se guarda primero en la base, despues se calcula su hash SHA-256
              encadenado al registro anterior del lote{' '}
              <span className="font-mono font-semibold">{envio.lote}</span> y ese hash se sella
              en Hyperledger Fabric.
            </p>

            {envio.encolado && envio.hash_sello ? (
              <>
                <p className="text-xs font-semibold text-green-900 uppercase mb-1">
                  Hash SHA-256 del registro
                </p>
                <div className="bg-white border border-green-200 rounded p-3 mb-3">
                  <p className="text-xs font-mono text-gray-700 break-all">{envio.hash_sello}</p>
                  <button onClick={copiarHash}
                    className="flex items-center gap-1 text-xs text-green-800 hover:underline mt-2">
                    {copiado ? <Check size={12} /> : <Copy size={12} />}
                    {copiado ? 'Copiado' : 'Copiar hash'}
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-800 font-medium">
                  <Link2 size={15} />
                  Registro sellado · estado: {envio.estado_sello}
                </div>
              </>
            ) : (
              <>
                <button type="button" onClick={sellar} disabled={!guardado || sellando}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3
                             bg-sky-700 text-white font-semibold rounded-lg hover:bg-sky-800
                             transition disabled:opacity-40 disabled:cursor-not-allowed">
                  {sellando ? <Loader2 size={18} className="animate-spin" />
                            : <Shield size={18} />}
                  Sellar en blockchain
                </button>
                <p className="flex items-start gap-2 text-xs text-sky-800 mt-3">
                  <Clock size={13} className="shrink-0 mt-0.5" />
                  {guardado
                    ? 'El registro esta guardado y listo para sellarse.'
                    : 'Primero guarde la recepcion: solo se sella lo que ya esta registrado.'}
                </p>
              </>
            )}
          </div>

          <EstadoRed />
        </aside>
      </div>
    </div>
  )
}

/** Cola de sellado, con el estado real de la red. */
function EstadoRed() {
  const { datos: estado } = useApi(() => api.estadoBlockchain(), [])
  if (!estado) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Cola de sellado</p>
      <dl className="grid grid-cols-2 gap-y-1.5 text-sm">
        <dt className="text-gray-600">Pendientes</dt>
        <dd className="text-right font-semibold">{estado.cola.pendiente}</dd>
        <dt className="text-gray-600">Confirmados</dt>
        <dd className="text-right font-semibold">{estado.cola.confirmado}</dd>
        <dt className="text-gray-600">Sellos emitidos</dt>
        <dd className="text-right font-semibold">{estado.sellos}</dd>
        {estado.cola.error > 0 && (
          <>
            <dt className="text-red-700">Con error</dt>
            <dd className="text-right font-semibold text-red-700">{estado.cola.error}</dd>
          </>
        )}
      </dl>
    </div>
  )
}
