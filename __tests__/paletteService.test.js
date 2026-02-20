import * as paletteService from '@/lib/services/paletteService'

describe('paletteService', () => {
  describe('applyPalette', () => {
    it('should apply iron palette to grayscale value', () => {
      const result = paletteService.applyPalette(128, 'iron')
      expect(result).toHaveProperty('r')
      expect(result).toHaveProperty('g')
      expect(result).toHaveProperty('b')
      expect(result.r).toBeGreaterThanOrEqual(0)
      expect(result.r).toBeLessThanOrEqual(255)
    })

    it('should apply rainbow palette', () => {
      const result = paletteService.applyPalette(200, 'rainbow')
      expect(result).toHaveProperty('r')
      expect(result).toHaveProperty('g')
      expect(result).toHaveProperty('b')
    })

    it('should apply grayscale palette', () => {
      const result = paletteService.applyPalette(100, 'grayscale')
      expect(result.r).toBe(result.g)
      expect(result.g).toBe(result.b)
    })

    it('should apply hotspot palette', () => {
      const result = paletteService.applyPalette(255, 'hotspot')
      expect(result).toHaveProperty('r')
    })

    it('should apply arctic palette', () => {
      const result = paletteService.applyPalette(50, 'arctic')
      expect(result).toHaveProperty('b')
    })

    it('should apply viridis palette', () => {
      const result = paletteService.applyPalette(150, 'viridis')
      expect(result).toHaveProperty('g')
    })

    it('should handle edge values', () => {
      const min = paletteService.applyPalette(0, 'iron')
      const max = paletteService.applyPalette(255, 'iron')
      
      expect(min).toHaveProperty('r')
      expect(max).toHaveProperty('r')
    })

    it('should return consistent colors for same input', () => {
      const result1 = paletteService.applyPalette(128, 'iron')
      const result2 = paletteService.applyPalette(128, 'iron')
      
      expect(result1.r).toBe(result2.r)
      expect(result1.g).toBe(result2.g)
      expect(result1.b).toBe(result2.b)
    })
  })

  describe('getPalettes', () => {
    it('should return list of available palettes', () => {
      const palettes = paletteService.getPalettes()
      expect(Array.isArray(palettes)).toBe(true)
      expect(palettes.length).toBeGreaterThan(0)
      expect(palettes).toContain('iron')
      expect(palettes).toContain('rainbow')
    })
  })
})
