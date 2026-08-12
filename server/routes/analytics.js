import express from 'express'

const router = express.Router()

// Get production metrics
router.get('/metrics', (req, res) => {
  res.json({
    success: true,
    data: {
      totalLotsProcessed: 156,
      totalWeight: 125420.50,
      averageHumidity: 11.8,
      averageYield: 78.2,
      exportedThisMonth: 24,
      containersInPort: 4,
      activeProducers: 45,
      averageQuality: 'AAA'
    }
  })
})

// Get plant statistics
router.get('/plants/:plantId', (req, res) => {
  const { plantId } = req.params

  const plantStats = {
    'taipiplaya': {
      name: 'Planta Taipiplaya',
      lotsInProcess: 24,
      capacity: 80,
      efficiency: 94,
      avgHumidity: 12.5,
      temperature: 18
    },
    'el-alto': {
      name: 'Planta El Alto',
      lotsInProcess: 18,
      capacity: 100,
      efficiency: 92,
      avgHumidity: 11.2,
      temperature: 16
    }
  }

  const stats = plantStats[plantId]
  if (!stats) {
    return res.status(404).json({ success: false, error: 'Planta no encontrada' })
  }

  res.json({ success: true, data: stats })
})

// Get traceability report
router.get('/traceability/:lotId', (req, res) => {
  const { lotId } = req.params

  res.json({
    success: true,
    data: {
      lotId,
      producer: 'Roberto Quispe',
      origin: 'Taipiplaya - Central',
      phases: [
        {
          name: 'Acopio',
          date: '2024-08-01',
          weight: 1300,
          hash: '0x1a2b...',
          verified: true
        },
        {
          name: 'Transporte',
          date: '2024-08-02',
          hash: '0x3c4d...',
          verified: true
        },
        {
          name: 'Recepción',
          date: '2024-08-02',
          weight: 1280,
          hash: '0x5e6f...',
          verified: true
        },
        {
          name: 'Limpieza',
          date: '2024-08-03',
          hash: '0x7g8h...',
          verified: true
        },
        {
          name: 'Trillado',
          date: '2024-08-04',
          weight: 1050,
          yield: 85,
          hash: '0x9i0j...',
          verified: true
        },
        {
          name: 'Clasificación',
          date: '2024-08-05',
          quality: 'AAA',
          hash: '0xk1l2...',
          verified: true
        },
        {
          name: 'Almacenamiento',
          date: '2024-08-06',
          location: 'Sector A',
          hash: '0xm3n4...',
          verified: true
        }
      ]
    }
  })
})

// Get quality report
router.get('/quality', (req, res) => {
  res.json({
    success: true,
    data: {
      period: 'August 2024',
      totalLots: 156,
      qualityDistribution: {
        'AAA': 45,
        'AA': 63,
        'A': 38,
        'defective': 10
      },
      commonDefects: [
        { type: 'Broken', count: 15 },
        { type: 'Moldy', count: 8 },
        { type: 'Fermented', count: 5 },
        { type: 'Foreign', count: 2 }
      ],
      averageYield: 78.2,
      totalWeight: 125420.50
    }
  })
})

// Get export report
router.get('/exports', (req, res) => {
  res.json({
    success: true,
    data: {
      period: 'August 2024',
      totalExports: 24,
      totalVolume: 485000,
      byDestination: [
        { country: 'Germany', volume: 150000 },
        { country: 'France', volume: 120000 },
        { country: 'USA', volume: 100000 },
        { country: 'Italy', volume: 75000 },
        { country: 'Spain', volume: 40000 }
      ],
      byQuality: [
        { grade: 'AAA', percentage: 45 },
        { grade: 'AA', percentage: 40 },
        { grade: 'A', percentage: 15 }
      ]
    }
  })
})

export default router
