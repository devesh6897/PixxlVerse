import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface GameWindowState {
  isOpen: boolean
  selectedGame: string | null
}

const initialState: GameWindowState = {
  isOpen: false,
  selectedGame: null
}

export const gameWindowSlice = createSlice({
  name: 'gameWindow',
  initialState,
  reducers: {
    openGameWindow: (state) => {
      state.isOpen = true
    },
    closeGameWindow: (state) => {
      state.isOpen = false
      state.selectedGame = null
    },
    setSelectedGame: (state, action: PayloadAction<string | null>) => {
      state.selectedGame = action.payload
    }
  }
})

export const { openGameWindow, closeGameWindow, setSelectedGame } = gameWindowSlice.actions

export default gameWindowSlice.reducer 