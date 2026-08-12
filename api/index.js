/**
 * Punto de entrada serverless de Vercel.
 *
 * Vercel convierte cada archivo de `api/` en una funcion. El rewrite definido en
 * `vercel.json` manda todo `/api/*` aqui y la app de Express resuelve la ruta
 * concreta, conservando el prefijo `/api` con el que estan montados los routers.
 */
export { default } from '../server/app.js'
