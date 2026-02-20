export class HistoryManager {
  constructor(limit = 10) {
    this.limit = limit;
    this.undoStack = [];
    this.redoStack = [];
  }

  logChange(change) {
    this.undoStack.push(change);
    if (this.undoStack.length > this.limit) this.undoStack.shift();
    this.redoStack = [];
  }

  undo() {
    if (!this.undoStack.length) return null;
    const item = this.undoStack.pop();
    this.redoStack.push(item);
    return item;
  }

  redo() {
    if (!this.redoStack.length) return null;
    const item = this.redoStack.pop();
    this.undoStack.push(item);
    return item;
  }

  canUndo() { return this.undoStack.length > 0; }
  canRedo() { return this.redoStack.length > 0; }
}
