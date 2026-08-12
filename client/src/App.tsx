import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useAppStore } from './store'
import Header from './components/Header'
import Sidebar from './components/Sidebar'

// Pages
import Dashboard from './pages/Dashboard'
import Productores from './pages/Productores'
import Acopio from './pages/Acopio'
import PlantaTaipiplaya from './pages/PlantaTaipiplaya'
import PlantaElAlto from './pages/PlantaElAlto'
import Transporte from './pages/Procesos/Transporte'
import Recepcion from './pages/Procesos/Recepcion'
import Trillado from './pages/Procesos/Trillado'
import Limpieza from './pages/Procesos/Limpieza'
import Clasificacion from './pages/Procesos/Clasificacion'
import Almacenamiento from './pages/Procesos/Almacenamiento'
import Exportacion from './pages/Procesos/Exportacion'
import Reportes from './pages/Reportes'
import Consultas from './pages/Consultas'
import Verificacion from './pages/Verificacion'

function AppLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/productores" element={<Productores />} />
            <Route path="/acopio" element={<Acopio />} />
            <Route path="/plantas/taipiplaya" element={<PlantaTaipiplaya />} />
            <Route path="/plantas/el-alto" element={<PlantaElAlto />} />
            <Route path="/procesos/transporte" element={<Transporte />} />
            <Route path="/procesos/recepcion" element={<Recepcion />} />
            <Route path="/procesos/limpieza" element={<Limpieza />} />
            <Route path="/procesos/trillado" element={<Trillado />} />
            <Route path="/procesos/clasificacion" element={<Clasificacion />} />
            <Route path="/procesos/almacenamiento" element={<Almacenamiento />} />
            <Route path="/procesos/exportacion" element={<Exportacion />} />
            <Route path="/reportes" element={<Reportes />} />
            <Route path="/consultas" element={<Consultas />} />
            <Route path="/verificacion" element={<Verificacion />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function App() {
  const { setUser, setBlockchainStatus } = useAppStore()

  useEffect(() => {
    // Simular inicialización del usuario
    setUser({
      id: '1',
      name: 'M. Choque',
      email: 'm.choque@coffeetrace.com',
      role: 'operator',
      plant: 'Taipiplaya',
      permissions: ['read', 'write', 'verify']
    })

    // Simular status blockchain
    setBlockchainStatus({
      isOnline: true,
      lastSync: new Date().toISOString(),
      syncedNodes: 12,
      totalNodes: 12
    })
  }, [setUser, setBlockchainStatus])

  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

export default App
