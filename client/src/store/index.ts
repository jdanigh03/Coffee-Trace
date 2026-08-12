import { create } from 'zustand'
import type { User, BlockchainStatus, Lot, ProcessPhase } from '../types'

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

  blockchainStatus: {
    isOnline: false,
    syncedNodes: 0,
    totalNodes: 12,
  },
  setBlockchainStatus: (status) => set({ blockchainStatus: status }),

  selectedLot: null,
  setSelectedLot: (lot) => set({ selectedLot: lot }),

  currentPhase: null,
  setCurrentPhase: (phase) => set({ currentPhase: phase }),

  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))
