/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Host del API en produccion. Vacio en desarrollo: Vite hace proxy de /api. */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
