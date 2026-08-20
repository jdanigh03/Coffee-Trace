import { create } from 'zustand'
import type { User, Lot, ProcessPhase } from '../types'
import type { EstadoBlockchain } from '../api/client'

type BlockchainStatus = EstadoBlockchain

interface AppState {
  user: User | null
  setUser: (user: User | null) => void

  blockchainStatus: BlockchainStatus
  setBlockchainStatus: (status: BlockchainStatus) => void

  selectedLot: Lot | null
  setSelectedLot: (lot: Lot | null) => void

  currentPhase: ProcessPhase | null
  setCurrentPhase: (phase: ProcessPhase | null) => void

  sidebarOpen: boolean
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  // Estado inicial de una red que todavia no existe. NO se inventan nodos
  // sincronizados: hasta que Fabric este desplegado, la UI dice la verdad.
  blockchainStatus: {
    redDesplegada: false,
    cola: { pendiente: 0, enviado: 0, confirmado: 0, error: 0 },
    sellos: 0,
    ultimoBloque: null,
    ultimoSello: null,
  },
  setBlockchainStatus: (status) => set({ blockchainStatus: status }),

  selectedLot: null,
  setSelectedLot: (lot) => set({ selectedLot: lot }),

  currentPhase: null,
  setCurrentPhase: (phase) => set({ currentPhase: phase }),

  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))
