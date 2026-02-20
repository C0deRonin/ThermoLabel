import { HistoryManager } from '@/lib/services/historyService'

describe('historyService', () => {
  describe('HistoryManager', () => {
    let manager

    beforeEach(() => {
      manager = new HistoryManager()
    })

    describe('logChange', () => {
      it('should add change to history', () => {
        const change = { type: 'annotation_added', data: { id: 1, label: 'Test' } }
        manager.logChange(change)
        
        expect(manager.canUndo()).toBe(true)
      })

      it('should build undo stack', () => {
        manager.logChange({ type: 'annotation_added', data: { id: 1 } })
        manager.logChange({ type: 'annotation_added', data: { id: 2 } })
        
        expect(manager.canUndo()).toBe(true)
        expect(manager.canRedo()).toBe(false)
      })

      it('should clear redo stack on new change', () => {
        manager.logChange({ type: 'annotation_added', data: { id: 1 } })
        manager.undo()
        manager.logChange({ type: 'annotation_added', data: { id: 2 } })
        
        expect(manager.canRedo()).toBe(false)
      })
    })

    describe('undo', () => {
      it('should return previous change', () => {
        const change1 = { type: 'annotation_added', data: { id: 1 } }
        const change2 = { type: 'annotation_added', data: { id: 2 } }
        
        manager.logChange(change1)
        manager.logChange(change2)
        
        const undone = manager.undo()
        
        expect(undone).toEqual(change2)
      })

      it('should allow multiple undos', () => {
        manager.logChange({ type: 'annotation_added', data: { id: 1 } })
        manager.logChange({ type: 'annotation_added', data: { id: 2 } })
        manager.logChange({ type: 'annotation_added', data: { id: 3 } })
        
        manager.undo()
        manager.undo()
        
        expect(manager.canUndo()).toBe(true)
        expect(manager.canRedo()).toBe(true)
      })

      it('should return null when no undo available', () => {
        manager.logChange({ type: 'annotation_added', data: { id: 1 } })
        manager.undo()
        
        const result = manager.undo()
        
        expect(result).toBeNull()
      })
    })

    describe('redo', () => {
      it('should restore undone change', () => {
        const change = { type: 'annotation_added', data: { id: 1 } }
        
        manager.logChange(change)
        manager.undo()
        const redone = manager.redo()
        
        expect(redone).toEqual(change)
      })

      it('should allow multiple redos', () => {
        manager.logChange({ type: 'annotation_added', data: { id: 1 } })
        manager.logChange({ type: 'annotation_added', data: { id: 2 } })
        
        manager.undo()
        manager.undo()
        manager.redo()
        manager.redo()
        
        expect(manager.canUndo()).toBe(true)
        expect(manager.canRedo()).toBe(false)
      })

      it('should return null when no redo available', () => {
        manager.logChange({ type: 'annotation_added', data: { id: 1 } })
        
        const result = manager.redo()
        
        expect(result).toBeNull()
      })
    })

    describe('canUndo/canRedo', () => {
      it('should reflect undo/redo availability', () => {
        expect(manager.canUndo()).toBe(false)
        expect(manager.canRedo()).toBe(false)
        
        manager.logChange({ type: 'annotation_added', data: { id: 1 } })
        
        expect(manager.canUndo()).toBe(true)
        expect(manager.canRedo()).toBe(false)
        
        manager.undo()
        
        expect(manager.canUndo()).toBe(false)
        expect(manager.canRedo()).toBe(true)
      })
    })

    describe('history limit', () => {
      it('should limit history to 50 items', () => {
        for (let i = 0; i < 60; i++) {
          manager.logChange({ type: 'annotation_added', data: { id: i } })
        }
        
        for (let i = 0; i < 10; i++) {
          manager.undo()
        }
        
        const last = manager.undo()
        expect(last).toBeNull()
      })
    })
  })
})
