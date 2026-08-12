import express from 'express'

const router = express.Router()

// Mock data
const producers = [
  {
    id: 'PROD-8821',
    name: 'Roberto Quispe',
    community: 'Taipiplaya - Central',
    verified: true,
    lastHarvest: '2024-08-06',
    activeLotsCount: 3,
    blockchainStatus: 'verified'
  },
  {
    id: 'PROD-8755',
    name: 'Maria Condori',
    community: 'Yungas',
    verified: true,
    lastHarvest: '2024-08-05',
    activeLotsCount: 2,
    blockchainStatus: 'verified'
  },
  {
    id: 'PROD-8690',
    name: 'Juan Perez',
    community: 'Beni',
    verified: false,
    lastHarvest: '2024-08-04',
    activeLotsCount: 1,
    blockchainStatus: 'pending'
  }
]

// Get all producers
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: producers
  })
})

// Get producer by ID
router.get('/:id', (req, res) => {
  const producer = producers.find(p => p.id === req.params.id)
  if (!producer) {
    return res.status(404).json({ success: false, error: 'Productor no encontrado' })
  }
  res.json({ success: true, data: producer })
})

// Create new producer
router.post('/', (req, res) => {
  const newProducer = {
    id: `PROD-${Math.floor(Math.random() * 10000)}`,
    ...req.body,
    verified: false,
    blockchainStatus: 'pending',
    createdAt: new Date().toISOString()
  }
  producers.push(newProducer)
  res.status(201).json({ success: true, data: newProducer })
})

// Verify producer
router.post('/:id/verify', (req, res) => {
  const producer = producers.find(p => p.id === req.params.id)
  if (!producer) {
    return res.status(404).json({ success: false, error: 'Productor no encontrado' })
  }
  producer.verified = true
  producer.blockchainStatus = 'verified'
  res.json({ success: true, data: producer })
})

export default router
