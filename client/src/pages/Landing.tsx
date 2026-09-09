import { Link } from 'react-router-dom'
import {
  Leaf, ArrowRight, Search, FileSearch, ShieldCheck, Mountain, Globe, UserCircle2,
  FileText, Lock, Users, ScrollText, Eye, Boxes, Check, Sprout, Target,
} from 'lucide-react'
import { api } from '../api/client'
import { useApi, fmtKg } from '../api/useApi'
import FlujoTrazabilidad from '../components/publico/FlujoTrazabilidad'
import ConsultaLote from '../components/publico/ConsultaLote'

/**
 * Cara publica de CoffeeTrace: lo que ve un comprador antes de entrar al ERP.
 *
 * Sigue la maqueta de identidad de ASOCAFE. Las cifras salen de
 * /api/publico/resumen y ninguna esta escrita a mano: si una etapa deja de
 * registrarse, la portada lo refleja.
 */

const FOTOS = {
  recoleccion: '/marca/recoleccion.jpg',
  terrenos: '/marca/terrenos.jpg',
  granos: '/marca/granos.jpg',
  logo: '/marca/asocafe-logo.png',
}

function Marca({ claro = false }: { claro?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className="w-9 h-9 rounded-lg bg-verde-700 text-white flex items-center
                       justify-center shrink-0">
        <Leaf size={18} />
      </span>
      <span className="leading-none">
        <span className={`block font-display font-bold text-xl tracking-tight ${
          claro ? 'text-white' : 'text-gray-900'}`}>CoffeeTrace</span>
        <span className={`hidden sm:block text-[9px] tracking-[0.22em] uppercase mt-0.5 ${
          claro ? 'text-white/60' : 'text-gray-400'}`}>Del origen al mundo</span>
      </span>
    </span>
  )
}

/** Tarjeta de las cuatro garantias, con el circulo de color a la izquierda. */
function Garantia({ icono, titulo, texto, tono }: {
  icono: React.ReactNode; titulo: React.ReactNode; texto: string; tono: string
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex gap-4 items-start">
      <span className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0
                        text-white ${tono}`}>
        {icono}
      </span>
      <div className="min-w-0">
        <p className="font-display font-bold text-gray-900 leading-snug">{titulo}</p>
        <p className="text-sm text-gray-600 leading-snug mt-1">{texto}</p>
      </div>
    </div>
  )
}

export default function Landing() {
  const { datos, cargando, error } = useApi(() => api.resumenPublico(), [])

  const nav = [
    { href: '#inicio', texto: 'Inicio', activo: true },
    { href: '#consultar', texto: 'Consultar lote' },
    { href: '#documentos', texto: 'Documentos' },
    { href: '#asocafe', texto: 'Sobre ASOCAFE' },
  ]

  const pilares = [
    { icono: <Lock size={18} />, texto: 'Datos integros' },
    { icono: <Users size={18} />, texto: 'Autoria identificada' },
    { icono: <ScrollText size={18} />, texto: 'Historial verificable' },
    { icono: <Eye size={18} />, texto: 'Transparencia total' },
  ]

  const documentos = [
    'Certificado de origen', 'Documentos de embarque',
    'Lista de empaque', 'Certificado de calidad',
  ]

  return (
    <div id="inicio" className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* ---------------------------------------------- barra superior */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <Marca />

          <nav className="hidden md:flex items-center gap-8">
            {nav.map((n) => (
              <a key={n.href} href={n.href}
                className={`text-sm transition ${
                  n.activo
                    ? 'text-verde-800 font-semibold border-b-2 border-verde-700 pb-1'
                    : 'text-gray-600 hover:text-verde-800'}`}>
                {n.texto}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4 shrink-0">
            <span className="hidden lg:flex items-center gap-1.5 text-sm text-gray-500">
              <Globe size={16} /> Espanol
            </span>
            <Link to="/dashboard"
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full
                         text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              <UserCircle2 size={16} /> Entrar al sistema
            </Link>
          </div>
        </div>
      </header>

      {/* ---------------------------------------------- portada */}
      <section className="relative">
        <img src={FOTOS.recoleccion} alt="Cosecha de cafe en Taipiplaya"
          className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90
                        to-transparent" />
        {/* Segundo velo solo en el borde derecho: la foto tiene hojas oscuras
            justo donde va el lema, y sin esto el texto no se lee. */}
        <div className="absolute inset-0 bg-gradient-to-l from-white/90 via-white/25
                        to-transparent" />

        <div className="relative max-w-[1600px] mx-auto px-5 py-12 md:py-16">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-10">
            {/* El PNG trae fondo blanco, no transparencia: mix-blend-multiply
                lo funde con el fondo claro en vez de dejar un recuadro. */}
            <img src={FOTOS.logo} alt="ASOCAFE Taipiplaya"
              className="w-44 lg:w-56 shrink-0 mix-blend-multiply" />

            <div className="md:border-l md:border-gray-300 md:pl-10 max-w-2xl">
              <h1 className="font-display text-3xl md:text-5xl font-bold text-coffee-900
                             leading-[1.15]">
                Trazabilidad verificable<br />para compradores de cafe
              </h1>
              <p className="mt-4 text-base md:text-lg text-gray-700 leading-relaxed">
                Siga el recorrido del cafe desde el productor hasta la exportacion, con
                evidencia documentada y registros protegidos con blockchain.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#trazabilidad"
                  className="flex items-center gap-2 px-6 py-3 bg-verde-800 text-white
                             rounded-lg font-medium hover:bg-verde-900 transition">
                  Explorar trazabilidad <ArrowRight size={17} />
                </a>
                <a href="#consultar"
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300
                             rounded-lg font-medium text-gray-800 hover:bg-gray-50 transition">
                  <Search size={17} /> Consultar lote
                </a>
              </div>
            </div>

            <div className="hidden xl:block ml-auto text-right shrink-0 w-64 pr-2">
              <p className="font-script text-4xl text-coffee-900 leading-[1.1]">
                Cafe que conecta origenes con un mejor manana
              </p>
              <span className="block w-24 h-px bg-verde-700 ml-auto my-3" />
              <p className="text-xs font-semibold tracking-[0.18em] text-coffee-800">
                TAIPIPLAYA · BOLIVIA
              </p>
              <p className="text-[10px] tracking-[0.12em] text-coffee-700/70">
                CAFE ESPECIAL QUE TRASCIENDE
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">
        <div className="max-w-[1600px] mx-auto px-5 py-8 space-y-6">

          {error && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm
                            text-amber-900">
              No se pudieron cargar las cifras en vivo: {error}
            </div>
          )}
          {cargando && <p className="text-sm text-gray-500">Cargando datos de la campana...</p>}

          {datos && (
            <>
              {/* ------------------------------------ cuatro garantias */}
              <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <Garantia
                  tono="bg-verde-600" icono={<FileText size={22} />}
                  titulo={
                    <>
                      <span className="block text-2xl">
                        {datos.cobertura.etapas_cubiertas}/{datos.cobertura.etapas}
                      </span>
                      etapas documentadas
                    </>
                  }
                  texto="Trazabilidad completa del campo a la exportacion."
                />
                <Garantia
                  tono="bg-verde-500" icono={<Mountain size={22} />}
                  titulo="Origen verificable"
                  texto={`Cafe de Taipiplaya, Bolivia, con ${datos.alcance.productores} productores identificados en ${datos.alcance.comunidades} comunidades.`}
                />
                <Garantia
                  tono="bg-coffee-500" icono={<FileSearch size={22} />}
                  titulo="Documentos de exportacion"
                  texto={datos.certificaciones.length
                    ? `${datos.certificaciones.join(', ')} y documentos de embarque por lote.`
                    : 'Certificados, lista de empaque y documentos clave.'}
                />
                <Garantia
                  tono="bg-sky-700" icono={<ShieldCheck size={22} />}
                  titulo="Registro protegido con blockchain"
                  texto="Informacion integra, segura y verificable."
                />
              </section>

              {/* ------------------------------------ flujo */}
              <section id="trazabilidad"
                className="bg-white border border-gray-200 rounded-xl p-6 scroll-mt-20">
                <div className="flex items-start gap-3 mb-5">
                  <Boxes size={26} className="text-verde-700 shrink-0 mt-0.5" />
                  <div>
                    <h2 className="font-display text-2xl font-bold text-gray-900">
                      Flujo de trazabilidad del sistema
                    </h2>
                    <p className="text-gray-600">
                      Del origen en Taipiplaya al mundo, con {datos.cobertura.etapas} etapas
                      documentadas.
                    </p>
                  </div>
                </div>
                <FlujoTrazabilidad etapas={datos.cobertura.etapasDetalle} />
              </section>

              {/* ------------------------------------ tres columnas */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                {/* blockchain */}
                <div className="bg-verde-50 border border-verde-200 rounded-xl p-6 h-full">
                  <div className="flex items-start gap-3 mb-3">
                    <Boxes size={24} className="text-verde-700 shrink-0 mt-0.5" />
                    <h2 className="font-display text-xl font-bold text-gray-900">
                      Integridad y confianza con blockchain
                    </h2>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Cada evento critico del proceso se registra con autoria, asegurando
                    integridad, historial verificable y transparencia total con tecnologia
                    Hyperledger Fabric.
                  </p>
                  <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-verde-200">
                    {pilares.map((p) => (
                      <div key={p.texto} className="text-center">
                        <span className="w-9 h-9 mx-auto rounded-lg bg-white border
                                         border-verde-200 text-verde-700 flex items-center
                                         justify-center mb-1.5">
                          {p.icono}
                        </span>
                        <p className="text-[11px] leading-tight text-gray-700">{p.texto}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* consulta */}
                <div id="consultar"
                  className="bg-white border border-gray-200 rounded-xl p-6 h-full scroll-mt-20">
                  <div className="flex items-start gap-3 mb-1">
                    <Search size={24} className="text-verde-700 shrink-0 mt-0.5" />
                    <h2 className="font-display text-xl font-bold text-gray-900">
                      Verificacion del comprador
                    </h2>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 pl-9">
                    Consulte un lote para conocer su trazabilidad y documentos.
                  </p>
                  <ConsultaLote codigosSugeridos={datos.lotes.map((l) => l.codigo)} />
                </div>

                {/* mercados */}
                <div id="documentos"
                  className="bg-white border border-gray-200 rounded-xl p-6 h-full scroll-mt-20">
                  <div className="flex items-start gap-3 mb-1">
                    <Globe size={24} className="text-verde-700 shrink-0 mt-0.5" />
                    <h2 className="font-display text-xl font-bold text-gray-900">
                      Nuestros cafes en el mundo
                    </h2>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 pl-9">
                    Cafe de Taipiplaya, presente en mercados internacionales.
                  </p>

                  {datos.paises.length ? (
                    <div className="flex flex-wrap gap-x-6 gap-y-2 pb-4 border-b border-gray-100">
                      {datos.paises.map((p) => (
                        <div key={p.pais}>
                          <p className="font-semibold text-gray-900 text-sm">{p.pais}</p>
                          <p className="text-xs text-gray-500 tabular-nums">
                            {fmtKg(p.kg)} kg · {p.embarques}{' '}
                            {p.embarques === 1 ? 'embarque' : 'embarques'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 pb-4 border-b border-gray-100">
                      Sin embarques registrados todavia.
                    </p>
                  )}

                  <p className="text-xs font-semibold text-gray-700 mt-4 mb-2">
                    Principales documentos de exportacion
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                    {documentos.map((d) => (
                      <p key={d} className="flex items-center gap-1.5 text-sm text-gray-700">
                        <Check size={14} className="text-verde-600 shrink-0" /> {d}
                      </p>
                    ))}
                  </div>
                </div>
              </section>

              {/* ------------------------------------ ASOCAFE */}
              <section id="asocafe"
                className="bg-white border border-gray-200 rounded-xl overflow-hidden
                           scroll-mt-20 grid grid-cols-1 lg:grid-cols-[18rem_1fr]">
                <div className="relative min-h-[13rem]">
                  <img src={FOTOS.granos} alt="Cafe guinda recolectado"
                    className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-coffee-900/35" />
                  <p className="relative font-script text-2xl text-white p-6 leading-tight
                                drop-shadow">
                    Productores de hoy, un mejor manana para el cafe
                  </p>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-6
                                items-center">
                  <div className="flex items-start gap-4">
                    <img src={FOTOS.logo} alt=""
                      className="w-16 shrink-0 mix-blend-multiply" />
                    <div>
                      <p className="font-display font-bold text-gray-900">
                        {datos.organizacion?.nombre ?? 'ASOCAFE Taipiplaya'}
                      </p>
                      <p className="text-sm text-gray-600 leading-snug mt-1">
                        Somos una organizacion de productores de cafe de Taipiplaya, Bolivia.
                        En la campana {datos.campania} acopiamos{' '}
                        {fmtKg(datos.alcance.kg_guinda)} kg de cafe guinda en{' '}
                        {datos.alcance.lotes} lotes, con separacion fisica entre cafe organico
                        y en transicion.
                      </p>
                      {datos.organizacion?.codigo_ico && (
                        <p className="text-xs text-gray-500 mt-1">
                          Codigo ICO {datos.organizacion.codigo_ico}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3 md:border-l md:border-gray-200
                                  md:pl-6 max-w-xs">
                    <Sprout size={20} className="text-verde-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Nuestra mision</p>
                      <p className="text-sm text-gray-600 leading-snug">
                        Promover un cafe de calidad que genere bienestar para nuestras familias.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 md:border-l md:border-gray-200
                                  md:pl-6 max-w-xs">
                    <Target size={20} className="text-verde-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Nuestra vision</p>
                      <p className="text-sm text-gray-600 leading-snug">
                        Ser un referente de cafe especial boliviano en el mundo, reconocidos por
                        su trazabilidad.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      {/* ---------------------------------------------- pie */}
      <footer className="bg-verde-900 text-white/75">
        <div className="max-w-[1600px] mx-auto px-5 py-4 flex flex-col lg:flex-row
                        items-center justify-between gap-3 text-xs">
          <Marca claro />
          <p className="text-center">
            Cafe de Taipiplaya, Bolivia, para el mundo · Un comercio mas transparente es posible.
          </p>
          <p className="text-white/50 text-center lg:text-right">
            Los datos personales de los productores y los importes pagados no se publican.
          </p>
        </div>
      </footer>
    </div>
  )
}
