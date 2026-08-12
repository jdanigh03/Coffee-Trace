import express from 'express'
import crypto from 'crypto'

const router = express.Router()

// Mock blockchain data
const blockchainRecords = []

// Get blockchain status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      isOnline: true,
      syncedNodes: 12,
      totalNodes: 12,
      lastBlock: 12451,
      chainLength: 50000,
      timestamp: new Date().toISOString()
    }
  })
})

// Verify hash
router.post('/verify', (req, res) => {
  const { hash, data } = req.body

  if (!hash || !data) {
    return res.status(400).json({
      success: false,
      error: 'Hash y datos son requeridos'
    })
  }

  // Calculate expected hash
  const expectedHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex')

  const isValid = hash === expectedHash

  res.json({
    success: true,
    data: {
      isValid,
      hash,
      expectedHash,
      message: isValid
        ? 'Hash verificado correctamente en blockchain'
        : 'Hash no coincide - Posible alteración de datos'
    }
  })
})

// Submit to blockchain
router.post('/submit', (req, res) => {
  const { data, type } = req.body

  if (!data || !type) {
    return res.status(400).json({
      success: false,
      error: 'Datos y tipo de transacción requeridos'
    })
  }

  // Generate hash
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex')

  // Generate transaction ID
  const txId = '0x' + Math.random().toString(16).slice(2)

  const record = {
    hash,
    txId,
    type,
    blockNumber: Math.floor(Math.random() * 100000),
    timestamp: new Date().toISOString(),
    status: 'confirmed'
  }

  blockchainRecords.push(record)

  res.json({
    success: true,
    data: record
  })
})

// Get transaction by ID
router.get('/tx/:txId', (req, res) => {
  const record = blockchainRecords.find(r => r.txId === req.params.txId)

  if (!record) {
    return res.status(404).json({
      success: false,
      error: 'Transacción no encontrada'
    })
  }

  res.json({ success: true, data: record })
})

// Get transaction history
router.get('/history/:type', (req, res) => {
  const { type } = req.params
  const records = blockchainRecords.filter(r => r.type === type)

  res.json({
    success: true,
    data: {
      type,
      count: records.length,
      records
    }
  })
})

export default router
