import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface BoardData {
  data: any // TLDraw snapshot
  name: string
  updatedAt: Date
  thumbnail?: string
}

interface WhiteboardStore {
  boards: Record<string, BoardData>
  activeBoard: string | null
  
  // Actions
  saveBoard: (id: string, data: any, name?: string) => void
  loadBoard: (id: string) => any
  deleteBoard: (id: string) => void
  createBoard: (name: string) => string
  listBoards: () => { id: string; name: string; updatedAt: Date }[]
  setActiveBoard: (id: string) => void
  renameBoard: (id: string, name: string) => void
}

export const useWhiteboardStore = create<WhiteboardStore>()(
  persist(
    (set, get) => ({
      boards: {},
      activeBoard: null,
      
      saveBoard: (id, data, name) => {
        set((state) => ({
          boards: {
            ...state.boards,
            [id]: {
              data,
              name: name || state.boards[id]?.name || `Board ${id}`,
              updatedAt: new Date(),
            }
          }
        }))
      },
      
      loadBoard: (id) => {
        const board = get().boards[id]
        return board?.data || null
      },
      
      deleteBoard: (id) => {
        set((state) => {
          const { [id]: deleted, ...rest } = state.boards
          return { 
            boards: rest,
            activeBoard: state.activeBoard === id ? null : state.activeBoard
          }
        })
      },
      
      createBoard: (name) => {
        const id = `board_${Date.now()}`
        set((state) => ({
          boards: {
            ...state.boards,
            [id]: {
              data: null,
              name,
              updatedAt: new Date(),
            }
          },
          activeBoard: id
        }))
        return id
      },
      
      listBoards: () => {
        return Object.entries(get().boards).map(([id, board]) => ({
          id,
          name: board.name,
          updatedAt: board.updatedAt,
        }))
      },
      
      setActiveBoard: (id) => {
        set({ activeBoard: id })
      },
      
      renameBoard: (id, name) => {
        set((state) => ({
          boards: {
            ...state.boards,
            [id]: {
              ...state.boards[id],
              name
            }
          }
        }))
      }
    }),
    {
      name: 'blox-buddy-whiteboards',
    }
  )
)