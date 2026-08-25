import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAppStore } from '../store'
import { Search, Settings, LogOut, Bell, Menu } from 'lucide-react'
import { api } from '../api/client'
import { useApi } from '../api/useApi'
import PanelNotificaciones from './PanelNotificaciones'

export default function Header() {
  const { user, toggleSidebar } = useAppStore()
  const location = useLocation()
  const [abierto, setAbierto] = useState(false)

  // Estado real de la cadena y de las alertas, no del store sin poblar.
  const { datos: cadena } = useApi(() => api.estadoBlockchain(), [])
  const { datos: notis } = useApi(() => api.notificaciones(), [location.pathname])

  const criticas = (notis?.porSeveridad.critica ?? 0) + (notis?.porSeveridad.alta ?? 0)

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg md:hidden"
          >
            <Menu size={20} />
          </button>
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar registros, lotes, hashes"
              className="pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 w-64"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              cadena?.redDesplegada ? 'bg-green-500' : 'bg-amber-500'}`} />
            <span className="text-sm text-gray-600">
              {cadena?.redDesplegada
                ? `Blockchain: ${cadena.sellos} sellos`
                : `Sin red Fabric · ${cadena?.cola.pendiente ?? 0} en cola`}
            </span>
          </div>

          <div className="relative">
            <button
              onClick={() => setAbierto((v) => !v)}
              aria-label={`Alertas${notis ? `: ${notis.total}` : ''}`}
              className={`p-2 rounded-lg relative transition ${
                abierto ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
            >
              <Bell size={20} />
              {/* El punto solo aparece si hay alertas de verdad. */}
              {notis && notis.total > 0 && (
                <span className={`absolute -top-0.5 -right-0.5 min-w-[1.15rem] h-[1.15rem] px-1
                                  flex items-center justify-center rounded-full text-[10px]
                                  font-bold text-white ${
                                    criticas > 0 ? 'bg-red-500' : 'bg-sky-500'}`}>
                  {notis.total}
                </span>
              )}
            </button>
            {abierto && <PanelNotificaciones onCerrar={() => setAbierto(false)} />}
          </div>

          <Link
            to="/configuracion"
            aria-label="Configuracion"
            className={`p-2 rounded-lg transition ${
              location.pathname.startsWith('/configuracion')
                ? 'bg-sky-100 text-sky-800' : 'hover:bg-gray-100'}`}
          >
            <Settings size={20} />
          </Link>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <img
              src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`}
              alt={user?.name}
              className="w-8 h-8 rounded-full"
            />
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name || 'Usuario'}</p>
              <p className="text-xs text-gray-600">{user?.role || 'Operador'}</p>
            </div>
          </div>

          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  )
}
