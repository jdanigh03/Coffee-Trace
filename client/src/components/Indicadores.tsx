import { TrendingUp, Archive, HelpCircle, AlertTriangle, Info } from 'lucide-react'
import type { IndicadorFila, Indicadores as IndicadoresData } from '../api/client'
import { fmtKg } from '../api/useApi'

const pct = (n: number | null) => (n == null ? '--' : `${n.toFixed(2)}%`)

/** Barra apilada TEE / TIN / TND. Por construccion las tres suman 100. */
function BarraComposicion({ f }: { f: IndicadorFila }) {
  const tramos = [
    { v: f.tee ?? 0, color: 'bg-emerald-500', label: 'Exportado' },
    { v: f.tin ?? 0, color: 'bg-amber-400', label: 'En almacen' },
    { v: f.tnd ?? 0, color: 'bg-red-500', label: 'Sin destino' },
  ]
  return (
    <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100">
      {tramos.map((t) => (
        <div key={t.label} className={t.color} style={{ width: `${Math.max(t.v, 0)}%` }}
          title={`${t.label}: ${t.v.toFixed(2)}%`} />
      ))}
    </div>
  )
}

export default function Indicadores({ datos }: { datos: IndicadoresData }) {
  const t = datos.total
  if (!t) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-5 text-sm text-gray-500">
        Sin datos de exportacion para la campaña {datos.campania}.
      </div>
    )
  }

  const tarjetas = [
    {
      sigla: 'TEE', nombre: 'Tasa de Eficiencia Exportadora', valor: t.tee,
      icono: <TrendingUp size={18} />, formula: 'VOe / VOp × 100',
      detalle: `${fmtKg(t.voe)} de ${fmtKg(t.vop)} kg`,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      principal: true,
    },
    {
      sigla: 'TIN', nombre: 'Tasa de Inmovilizacion de Inventario', valor: t.tin,
      icono: <Archive size={18} />, formula: 'VOs / VOp × 100',
      detalle: `${fmtKg(t.vos)} kg en almacen`,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
    },
    {
      sigla: 'TND', nombre: 'Tasa de Producto sin Destino Documentado', valor: t.tnd,
      icono: <HelpCircle size={18} />, formula: 'VOnd / VOp × 100',
      detalle: `${fmtKg(t.vond)} kg sin acreditar`,
      color: 'text-red-700 bg-red-50 border-red-200',
    },
  ]

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Eficiencia en la exportacion</h2>
          <p className="text-sm text-gray-600">
            Café verde oro de la campaña {datos.campania}, medido sobre {fmtKg(t.vop)} kg producidos
          </p>
        </div>
        <p className="text-xs text-gray-500">TEE + TIN + TND = 100%</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tarjetas.map((c) => (
          <div key={c.sigla}
            className={`bg-white border rounded-lg p-5 ${
              c.principal ? 'border-emerald-300 ring-1 ring-emerald-100' : 'border-gray-200'}`}>
            <div className="flex items-start justify-between mb-2">
              <div className={`p-2 rounded-lg border ${c.color}`}>{c.icono}</div>
              <span className="text-xs font-mono text-gray-400">{c.formula}</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{pct(c.valor)}</p>
            <p className="text-xs font-semibold text-gray-700 mt-1">
              {c.sigla}
              {c.principal && (
                <span className="ml-2 text-[10px] uppercase tracking-wide text-emerald-700">
                  indicador principal
                </span>
              )}
            </p>
            <p className="text-xs text-gray-500 leading-snug mt-0.5">{c.nombre}</p>
            <p className="text-xs text-gray-600 mt-2">{c.detalle}</p>
          </div>
        ))}
      </div>

      {/* Desglose por certificacion: el documento pide medirlas por separado,
          porque orgánico y transición tienen mercados distintos. */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Por categoria</h3>
        <div className="space-y-5">
          {datos.porCertificacion.map((f) => (
            <div key={f.certificacion}>
              <div className="flex items-baseline justify-between mb-1.5">
                <p className="font-medium capitalize text-gray-900">{f.certificacion}</p>
                <p className="text-sm text-gray-600">
                  TEE <span className="font-semibold text-gray-900">{pct(f.tee)}</span>
                  <span className="mx-2 text-gray-300">|</span>
                  TIN {pct(f.tin)}
                  <span className="mx-2 text-gray-300">|</span>
                  TND {pct(f.tnd)}
                </p>
              </div>
              <BarraComposicion f={f} />
              <p className="text-xs text-gray-500 mt-1">
                {fmtKg(f.vop)} kg producidos · {fmtKg(f.voe)} exportados ·
                {' '}{fmtKg(f.vos)} en almacen · {fmtKg(f.vond)} sin destino
              </p>
              {f.inconsistente && (
                <p className="text-xs text-red-700 mt-1 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  Lo exportado mas lo almacenado supera lo producido: hay una
                  inconsistencia en los datos, no una brecha real.
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-4 pt-3 border-t text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Exportado (TEE)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> Inmovilizado (TIN)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Sin destino (TND)
          </span>
        </div>
      </div>

      {datos.baseEstimada && (
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="text-sky-700 shrink-0 mt-0.5" size={16} />
          <p className="text-sm text-sky-900">
            <strong>Los tres indicadores estan calculados sobre volumenes estimados.</strong>{' '}
            Hoy nadie pesa el cafe verde oro en planta: el VOp sale de multiplicar los kilos de
            guinda por factores fijos. Cuando El Alto registre el peso real, estos porcentajes
            cambiaran y recien entonces mediran el rendimiento verdadero.
          </p>
        </div>
      )}
    </section>
  )
}
