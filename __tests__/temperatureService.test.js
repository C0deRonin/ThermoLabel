import * as temperatureService from '@/lib/services/temperatureService'

describe('temperatureService', () => {
  describe('rawToTemp', () => {
    it('should convert raw 0 to -20°C', () => {
      const result = temperatureService.rawToTemp(0)
      expect(result).toBe(-20)
    })

    it('should convert raw 255 to 120°C', () => {
      const result = temperatureService.rawToTemp(255)
      expect(result).toBe(120)
    })

    it('should convert raw 127-128 to ~50°C', () => {
      const result = temperatureService.rawToTemp(128)
      expect(result).toBeCloseTo(50, 0)
    })

    it('should handle all values in range 0-255', () => {
      for (let i = 0; i <= 255; i++) {
        const result = temperatureService.rawToTemp(i)
        expect(result).toBeGreaterThanOrEqual(-20)
        expect(result).toBeLessThanOrEqual(120)
      }
    })
  })

  describe('tempToRaw', () => {
    it('should convert -20°C to raw 0', () => {
      const result = temperatureService.tempToRaw(-20)
      expect(Math.round(result)).toBe(0)
    })

    it('should convert 120°C to raw 255', () => {
      const result = temperatureService.tempToRaw(120)
      expect(Math.round(result)).toBe(255)
    })

    it('should be inverse of rawToTemp', () => {
      for (let raw = 0; raw <= 255; raw += 25) {
        const temp = temperatureService.rawToTemp(raw)
        const backToRaw = temperatureService.tempToRaw(temp)
        expect(Math.round(backToRaw)).toBe(raw)
      }
    })
  })

  describe('getAreaStats', () => {
    it('should calculate statistics for annotation area', () => {
      const pixels = [50, 100, 150, 200]
      const stats = temperatureService.getAreaStats(pixels)
      
      expect(stats).toHaveProperty('mean')
      expect(stats).toHaveProperty('min')
      expect(stats).toHaveProperty('max')
      expect(stats.mean).toBeGreaterThan(0)
      expect(stats.min).toBeLessThanOrEqual(stats.max)
    })

    it('should handle single pixel', () => {
      const pixels = [100]
      const stats = temperatureService.getAreaStats(pixels)
      expect(stats.mean).toBeCloseTo(100, 1)
      expect(stats.min).toBe(100)
      expect(stats.max).toBe(100)
    })

    it('should handle empty array', () => {
      const pixels = []
      const stats = temperatureService.getAreaStats(pixels)
      expect(stats.mean).toBe(0)
    })
  })

  describe('calculateHistogram', () => {
    it('should return histogram with 64 buckets', () => {
      const pixels = Array.from({ length: 256 }, (_, i) => i)
      const histogram = temperatureService.calculateHistogram(pixels)
      
      expect(Array.isArray(histogram)).toBe(true)
      expect(histogram.length).toBe(64)
    })

    it('should have counts for each bucket', () => {
      const pixels = [50, 100, 150, 200]
      const histogram = temperatureService.calculateHistogram(pixels)
      
      const totalCount = histogram.reduce((sum, count) => sum + count, 0)
      expect(totalCount).toBe(pixels.length)
    })

    it('should sum to total pixels', () => {
      const pixels = Array(1000).fill(128)
      const histogram = temperatureService.calculateHistogram(pixels)
      
      const total = histogram.reduce((sum, count) => sum + count, 0)
      expect(total).toBe(1000)
    })
  })
})
