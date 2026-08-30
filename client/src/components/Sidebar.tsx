import { Link, useLocation } from 'react-router-dom'
import {
  Users,
  Droplet,
  Cpu,
  BarChart3,
  Shield,
  Settings,
  LogOut,
  ChevronRight,
  Search,
} from 'lucide-react'
import { useAppStore } from '../store'
import { fasesConEtapas } from '../constants/phases'

export default function Sidebar() {
  const location = useLocation()
  const { sidebarOpen, toggleSidebar } = useAppStore()

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  const operaciones = [
    { label: 'Dashboard', path: '/', icon: BarChart3 },
    { label: 'Productores', path: '/productores', icon: Users },
    { label: 'Planta Taipiplaya', path: '/plantas/taipiplaya', icon: Droplet },
    { label: 'Planta El Alto', path: '/plantas/el-alto', icon: Cpu },
  ]

  const analisis = [
    { label: 'Reportes', path: '/reportes', icon: BarChart3 },
    { label: 'Consultas', path: '/consultas', icon: Search },
    { label: 'Verificacion Blockchain', path: '/verificacion', icon: Shield },
  ]

  // Agrupado por fase segun el documento de cadena de suministro.
  // Dentro de cada fase se descartan las etapas que comparten pantalla, para
  // no repetir el mismo enlace dos veces.
  const cadena = fasesConEtapas().map((f) => ({
    ...f,
    etapas: f.etapas.filter(
      (p, i, arr) => arr.findIndex((o) => o.path === p.path) === i
    ),
  }))

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-sky-50 to-sky-100 border-r border-sky-200 overflow-y-auto z-40 transition-transform md:relative md:translate-x-0 md:z-auto flex flex-col`}
      >
        <div className="p-6 flex-1">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-coffee-700 rounded-lg flex items-center justify-center text-white font-bold">
              CT
            </div>
            <div>
              <h1 className="font-bold text-coffee-900">CoffeeTrace</h1>
              <p className="text-xs text-gray-600">Precision Logistics</p>
            </div>
          </div>

          <nav className="space-y-8">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                Operaciones
              </p>
              <ul className="space-y-1">
                {operaciones.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.path)
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={() => window.innerWidth < 768 && toggleSidebar()}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                          active
                            ? 'bg-sky-200 text-sky-900 font-medium'
                            : 'text-gray-700 hover:bg-sky-100'
                        }`}
                      >
                        <Icon size={18} />
                        <span className="flex-1 text-sm">{item.label}</span>
                        {active && <ChevronRight size={16} />}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Cadena agrupada en las tres fases del documento */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                Cadena de Trazabilidad
              </p>

              {cadena.map((fase) => (
                <div key={fase.id} className="mb-4">
                  <div className="px-3 mb-2">
                    <p className="text-[11px] font-bold text-coffee-800 tracking-wide">
                      {fase.label}
                    </p>
                    <p className="text-[10px] text-gray-500 leading-tight">
                      {fase.subtitulo} · {fase.plant}
                    </p>
                  </div>
                  <ul className="space-y-1">
                    {fase.etapas.map((step) => {
                      const active = isActive(step.path)
                      return (
                        <li key={`${fase.id}-${step.path}`}>
                          <Link
                            to={step.path}
                            onClick={() => window.innerWidth < 768 && toggleSidebar()}
                            title={
                              step.pendiente
                                ? `${step.actor} - etapa aun sin registro en el sistema`
                                : step.actor
                            }
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                              active
                                ? 'bg-sky-200 text-sky-900 font-medium'
                                : step.pendiente
                                  ? 'text-gray-400 hover:bg-sky-100'
                                  : 'text-gray-700 hover:bg-sky-100'
                            }`}
                          >
                            <span
                              className={`w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-semibold ${
                                active
                                  ? 'bg-coffee-700 text-white'
                                  : step.pendiente
                                    ? 'bg-white text-gray-300 border border-dashed border-gray-300'
                                    : 'bg-white text-gray-500'
                              }`}
                            >
                              {step.ordenEnFase}
                            </span>
                            <span className="flex-1 text-sm">{step.label}</span>
                            {/* Las etapas del documento marcadas "se debe
                                agregar" todavia no tienen datos: se muestran
                                atenuadas en vez de ocultarse, para que se vea
                                lo que falta de la cadena. */}
                            {step.pendiente && !active && (
                              <span className="text-[9px] uppercase text-gray-400 tracking-wide">
                                pend
                              </span>
                            )}
                            {active && <ChevronRight size={16} />}
                          </Link>
                        </li>
                      )
                    })}

                    {/* Subproductos: cuelgan de la fase pero no se numeran,
                        porque el lote no pasa por ellos. */}
                    {fase.extras.map((extra) => {
                      const active = isActive(extra.path)
                      return (
                        <li key={`${fase.id}-${extra.path}`}>
                          <Link
                            to={extra.path}
                            onClick={() => window.innerWidth < 768 && toggleSidebar()}
                            title={`${extra.actor} - subproducto de ${extra.derivaDe}`}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                              active
                                ? 'bg-sky-200 text-sky-900 font-medium'
                                : 'text-gray-700 hover:bg-sky-100'
                            }`}
                          >
                            <span
                              className={`w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-semibold ${
                                active ? 'bg-coffee-700 text-white' : 'bg-white text-gray-400'
                              }`}
                            >
                              +
                            </span>
                            <span className="flex-1 text-sm">{extra.label}</span>
                            {active && <ChevronRight size={16} />}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                Analisis
              </p>
              <ul className="space-y-1">
                {analisis.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.path)
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={() => window.innerWidth < 768 && toggleSidebar()}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                          active
                            ? 'bg-sky-200 text-sky-900 font-medium'
                            : 'text-gray-700 hover:bg-sky-100'
                        }`}
                      >
                        <Icon size={18} />
                        <span className="flex-1 text-sm">{item.label}</span>
                        {active && <ChevronRight size={16} />}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          </nav>
        </div>

        <div className="p-4 border-t border-sky-200 bg-sky-50">
          <Link
            to="/configuracion"
            onClick={() => window.innerWidth < 768 && toggleSidebar()}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
              isActive('/configuracion')
                ? 'bg-sky-200 text-sky-900 font-medium'
                : 'text-gray-700 hover:bg-sky-100'
            }`}
          >
            <Settings size={18} />
            <span className="flex-1 text-sm text-left">Configuracion</span>
          </Link>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-sky-100 rounded-lg transition">
            <LogOut size={18} />
            <span className="flex-1 text-sm text-left">Cerrar Sesion</span>
          </button>
        </div>
      </aside>
    </>
  )
}
