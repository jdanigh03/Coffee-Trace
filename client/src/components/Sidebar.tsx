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
import { PHASES } from '../constants/phases'

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

  // Despacho y Exportacion comparten pantalla, se muestran una sola vez.
  const cadena = PHASES.filter(
    (p, idx, arr) => arr.findIndex((o) => o.path === p.path) === idx
  )

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

            {/* La cadena va numerada en el orden real del workflow */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                Cadena de Trazabilidad
              </p>
              <ul className="space-y-1">
                {cadena.map((step) => {
                  const active = isActive(step.path)
                  return (
                    <li key={step.path}>
                      <Link
                        to={step.path}
                        onClick={() => window.innerWidth < 768 && toggleSidebar()}
                        title={step.actor}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                          active
                            ? 'bg-sky-200 text-sky-900 font-medium'
                            : 'text-gray-700 hover:bg-sky-100'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-semibold ${
                            active ? 'bg-coffee-700 text-white' : 'bg-white text-gray-500'
                          }`}
                        >
                          {step.order}
                        </span>
                        <span className="flex-1 text-sm">{step.label}</span>
                        {active && <ChevronRight size={16} />}
                      </Link>
                    </li>
                  )
                })}
              </ul>
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
          <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-sky-100 rounded-lg transition">
            <Settings size={18} />
            <span className="flex-1 text-sm text-left">Ajustes</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-sky-100 rounded-lg transition">
            <LogOut size={18} />
            <span className="flex-1 text-sm text-left">Cerrar Sesion</span>
          </button>
        </div>
      </aside>
    </>
  )
}
