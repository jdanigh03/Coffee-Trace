import { Download, BarChart3, Calendar } from 'lucide-react'

export default function Reportes() {
  const reports = [
    {
      name: 'Reporte de Producción Mensual',
      description: 'Volumen procesado, rendimiento y eficiencia',
      date: '2024-08-08',
      type: 'production'
    },
    {
      name: 'Trazabilidad Completa por Lote',
      description: 'Historial detallado de todas las fases',
      date: '2024-08-07',
      type: 'traceability'
    },
    {
      name: 'Reporte de Exportaciones',
      description: 'Destinos, volúmenes y certificaciones',
      date: '2024-08-06',
      type: 'export'
    },
    {
      name: 'Análisis de Calidad',
      description: 'Defectos encontrados, rendimiento y pérdidas',
      date: '2024-08-05',
      type: 'quality'
    }
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-600 mt-1">Consulte y descargue reportes detallados del sistema.</p>
      </div>

      {/* Report Filters */}
      <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Período</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500">
              <option>Último Mes</option>
              <option>Últimos 3 Meses</option>
              <option>Últimos 6 Meses</option>
              <option>Este Año</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Planta</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500">
              <option>Todas</option>
              <option>Taipiplaya</option>
              <option>El Alto</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500">
              <option>Todos</option>
              <option>Producción</option>
              <option>Exportación</option>
              <option>Calidad</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-sky-500 text-white font-medium rounded-lg hover:bg-sky-600 transition">
              Generar
            </button>
          </div>
        </div>
      </div>

      {/* Available Reports */}
      <div className="space-y-4">
        {reports.map((report, idx) => (
          <div key={idx} className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-sky-100 rounded-lg text-sky-600">
                    <BarChart3 size={20} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{report.name}</h3>
                </div>
                <p className="text-gray-600 mb-3">{report.description}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar size={16} />
                  <span>Generado: {report.date}</span>
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-sky-50 text-sky-600 font-medium rounded-lg hover:bg-sky-100 transition">
                <Download size={18} />
                Descargar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Report Generator */}
      <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg p-8 border border-sky-200">
        <h2 className="text-2xl font-bold text-sky-900 mb-4">Generador de Reportes Personalizado</h2>
        <p className="text-sky-800 mb-6">Cree reportes personalizados seleccionando los datos y períodos específicos que desea analizar.</p>
        <button className="px-6 py-3 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 transition">
          + Crear Reporte Personalizado
        </button>
      </div>
    </div>
  )
}
