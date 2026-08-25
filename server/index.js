import app from './app.js'

const PORT = process.env.PORT || 3000

const server = app.listen(PORT, () => {
  console.log(`CoffeeTrace API escuchando en http://localhost:${PORT}`)
})

// Sin esto, un puerto ocupado tira un volcado de stack de 20 lineas que no
// dice como resolverlo.
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`
El puerto ${PORT} ya esta en uso. Suele ser otra instancia del API que quedo viva.

  Ver quien lo ocupa:   netstat -ano | findstr :${PORT}
  Liberarlo (PowerShell):
    Get-NetTCPConnection -LocalPort ${PORT} -State Listen | %{ Stop-Process -Id $_.OwningProcess -Force }

  O usar otro puerto:   $env:PORT=3001; npm run dev:server
`)
    process.exit(1)
  }
  console.error('Error del servidor:', e.message)
  process.exit(1)
})

// Cierre limpio: sin esto las conexiones del pool de Postgres quedan abiertas
// y Supabase las mantiene ocupadas hasta que expiran solas.
for (const senal of ['SIGINT', 'SIGTERM']) {
  process.on(senal, () => {
    console.log('\nCerrando el API...')
    server.close(() => process.exit(0))
    // Si alguna conexion no cierra sola, no se queda colgado indefinidamente.
    setTimeout(() => process.exit(0), 5000).unref()
  })
}
