import express from 'express'

const router = express.Router()

// Mock data
const lots = [
  {
    id: '#TAI-2023-882',
    phase: 'seleccion',
    plant: 'Taipiplaya',
    weight: 12450.00,
    humidity: 11.2,
    status: 'verified',
    hash: '0x8a2f...1e39',
    producerId: 'PROD-8821'
  }
]

// Get all active lots
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: lots
  })
})

// Get lot by ID
router.get('/:id', (req, res) => {
  const lot = lots.find(l => l.id === req.params.id)
  if (!lot) {
    return res.status(404).json({ success: false, error: 'Lote no encontrado' })
  }
  res.json({ success: true, data: lot })
})

// Create new lot
router.post('/', (req, res) => {
  const newLot = {
    id: `#LOT-${Date.now()}`,
    ...req.body,
    createdAt: new Date().toISOString()
  }
  lots.push(newLot)
  res.status(201).json({ success: true, data: newLot })
})

// Update lot phase
router.put('/:id/phase', (req, res) => {
  const lot = lots.find(l => l.id === req.params.id)
  if (!lot) {
    return res.status(404).json({ success: false, error: 'Lote no encontrado' })
  }
  lot.phase = req.body.phase
  lot.updatedAt = new Date().toISOString()
  res.json({ success: true, data: lot })
})

// Register in blockchain
router.post('/:id/blockchain', (req, res) => {
  const lot = lots.find(l => l.id === req.params.id)
  if (!lot) {
    return res.status(404).json({ success: false, error: 'Lote no encontrado' })
  }

  lot.blockchainHash = req.body.hash || '0x' + Math.random().toString(16).slice(2)
  lot.txId = req.body.txId || '0x' + Math.random().toString(16).slice(2)
  lot.blockNumber = req.body.blockNumber || Math.floor(Math.random() * 100000)
  lot.blockchainVerified = true

  res.json({
    success: true,
    data: {
      lotId: lot.id,
      hash: lot.blockchainHash,
      txId: lot.txId,
      blockNumber: lot.blockNumber,
      timestamp: new Date().toISOString()
    }
  })
})

export default router
