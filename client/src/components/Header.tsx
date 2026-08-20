import { useAppStore } from '../store'
import { Search, Settings, LogOut, Bell, Menu } from 'lucide-react'

export default function Header() {
  const { user, toggleSidebar, blockchainStatus } = useAppStore()

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
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              blockchainStatus.redDesplegada ? 'bg-green-500' : 'bg-amber-500'}`} />
            <span className="text-sm text-gray-600">
              {blockchainStatus.redDesplegada
                ? `Blockchain: ${blockchainStatus.sellos} sellos`
                : `Sin red Fabric · ${blockchainStatus.cola.pendiente} en cola`}
            </span>
          </div>

          <button className="p-2 hover:bg-gray-100 rounded-lg relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Settings size={20} />
          </button>

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
