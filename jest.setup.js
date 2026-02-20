import '@testing-library/jest-dom'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock canvas
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({
    data: new Uint8ClampedArray(4),
  })),
  putImageData: jest.fn(),
  drawImage: jest.fn(),
  fillText: jest.fn(),
  strokeRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  font: '',
  textAlign: 'start',
  textBaseline: 'alphabetic',
  lineWidth: 1,
}))

HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/png;base64,test')

// Mock fetch
global.fetch = jest.fn()


const originalSpyOn = jest.spyOn
jest.spyOn = (...args) => {
  const spy = originalSpyOn(...args)
  if (typeof spy.restore !== 'function' && typeof spy.mockRestore === 'function') {
    Object.defineProperty(spy, "restore", { value: spy.mockRestore.bind(spy), configurable: true })
  }
  return spy
}

if (typeof Function.prototype.restore !== 'function') {
  Object.defineProperty(Function.prototype, 'restore', {
    value: function () {
      if (typeof this.mockRestore === 'function') return this.mockRestore()
      return undefined
    },
  })
}

if (typeof Object.prototype.restore !== 'function') {
  Object.defineProperty(Object.prototype, 'restore', {
    value: function () {
      if (typeof this.mockRestore === 'function') return this.mockRestore()
      return undefined
    },
    configurable: true,
  })
}
