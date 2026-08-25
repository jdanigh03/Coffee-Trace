import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useAppStore } from './store'
import { api } from './api/client'
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
import Configuracion from './pages/Configuracion'
import Etapa from './pages/Procesos/Etapa'

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
            {/* Etapas de la Fase II: una sola pantalla parametrizada por slug.
                Sin estas rutas, el sidebar enlazaba a paginas en blanco. */}
            <Route path="/procesos/tolva" element={<Etapa />} />
            <Route path="/procesos/despulpado" element={<Etapa />} />
            <Route path="/procesos/fermentacion" element={<Etapa />} />
            <Route path="/procesos/lavado" element={<Etapa />} />
            <Route path="/procesos/secado" element={<Etapa />} />
            <Route path="/procesos/almacen-temporal" element={<Etapa />} />
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
            <Route path="/configuracion" element={<Configuracion />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function App() {
  const { setBlockchainStatus } = useAppStore()

  useEffect(() => {
    // Estado real de la cola de sellado. No se simula: si el API no responde,
    // el store conserva `redDesplegada: false`, que es la verdad hoy.
    let vivo = true
    api.estadoBlockchain()
      .then((e) => { if (vivo) setBlockchainStatus(e) })
      .catch(() => { /* el estado inicial ya refleja "no desplegada" */ })
    return () => { vivo = false }
  }, [setBlockchainStatus])

  // El usuario se establece al iniciar sesion. Hasta que exista Supabase Auth
  // no hay sesion, y la UI lo muestra en vez de inventar un operador.

  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

export default App
