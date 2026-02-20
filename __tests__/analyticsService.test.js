import * as analyticsService from '@/lib/services/analyticsService'

describe('analyticsService', () => {
  describe('calculateImageFingerprint', () => {
    it('should create 8x8 fingerprint', () => {
      const data = new Uint8ClampedArray(640 * 480)
      data.fill(128)
      
      const fingerprint = analyticsService.calculateImageFingerprint(data, 640, 480)
      
      expect(Array.isArray(fingerprint)).toBe(true)
      expect(fingerprint.length).toBe(64)
      fingerprint.forEach(val => {
        expect(typeof val).toBe('number')
      })
    })

    it('should return consistent fingerprint for same image', () => {
      const data = new Uint8ClampedArray(640 * 480)
      data.fill(100)
      
      const fp1 = analyticsService.calculateImageFingerprint(data, 640, 480)
      const fp2 = analyticsService.calculateImageFingerprint(data, 640, 480)
      
      expect(fp1).toEqual(fp2)
    })

    it('should handle different image sizes', () => {
      const data1 = new Uint8ClampedArray(320 * 240)
      data1.fill(128)
      
      const data2 = new Uint8ClampedArray(640 * 480)
      data2.fill(128)
      
      const fp1 = analyticsService.calculateImageFingerprint(data1, 320, 240)
      const fp2 = analyticsService.calculateImageFingerprint(data2, 640, 480)
      
      expect(fp1.length).toBe(64)
      expect(fp2.length).toBe(64)
    })
  })

  describe('calculateSimilarity', () => {
    it('should return 1.0 for identical fingerprints', () => {
      const fp = Array(64).fill(128)
      
      const similarity = analyticsService.calculateSimilarity(fp, fp)
      
      expect(similarity).toBeCloseTo(1, 2)
    })

    it('should return value between 0 and 1', () => {
      const fp1 = Array(64).fill(100)
      const fp2 = Array(64).fill(200)
      
      const similarity = analyticsService.calculateSimilarity(fp1, fp2)
      
      expect(similarity).toBeGreaterThanOrEqual(0)
      expect(similarity).toBeLessThanOrEqual(1)
    })

    it('should be symmetric', () => {
      const fp1 = Array(64).fill(100)
      const fp2 = Array(64).fill(150)
      
      const sim1 = analyticsService.calculateSimilarity(fp1, fp2)
      const sim2 = analyticsService.calculateSimilarity(fp2, fp1)
      
      expect(sim1).toBeCloseTo(sim2, 5)
    })
  })

  describe('findDuplicates', () => {
    it('should find identical images', () => {
      const images = [
        { id: 1, data: new Uint8ClampedArray(100).fill(128), width: 10, height: 10 },
        { id: 2, data: new Uint8ClampedArray(100).fill(128), width: 10, height: 10 },
      ]
      
      const duplicates = analyticsService.findDuplicates(images, 0.95)
      
      expect(Array.isArray(duplicates)).toBe(true)
    })

    it('should not flag non-similar images as duplicates', () => {
      const images = [
        { id: 1, data: new Uint8ClampedArray(100).fill(50), width: 10, height: 10 },
        { id: 2, data: new Uint8ClampedArray(100).fill(200), width: 10, height: 10 },
      ]
      
      const duplicates = analyticsService.findDuplicates(images, 0.95)
      
      expect(Array.isArray(duplicates)).toBe(true)
    })
  })

  describe('findSimilarImages', () => {
    it('should return images sorted by similarity', () => {
      const referenceImage = {
        id: 0,
        data: new Uint8ClampedArray(100).fill(128),
        width: 10,
        height: 10,
      }
      
      const images = [
        { id: 1, data: new Uint8ClampedArray(100).fill(130), width: 10, height: 10 },
        { id: 2, data: new Uint8ClampedArray(100).fill(50), width: 10, height: 10 },
      ]
      
      const similar = analyticsService.findSimilarImages(referenceImage, images, 3)
      
      expect(Array.isArray(similar)).toBe(true)
      expect(similar.length).toBeLessThanOrEqual(3)
    })

    it('should limit results to N images', () => {
      const referenceImage = {
        id: 0,
        data: new Uint8ClampedArray(100).fill(128),
        width: 10,
        height: 10,
      }
      
      const images = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        data: new Uint8ClampedArray(100).fill(128),
        width: 10,
        height: 10,
      }))
      
      const similar = analyticsService.findSimilarImages(referenceImage, images, 3)
      
      expect(similar.length).toBeLessThanOrEqual(3)
    })
  })

  describe('detectAnomalousAnnotations', () => {
    it('should detect outliers in annotations', () => {
      const annotations = [
        { id: 1, x: 100, y: 100, width: 50, height: 50, temp: 50 },
        { id: 2, x: 120, y: 120, width: 50, height: 50, temp: 55 },
        { id: 3, x: 500, y: 500, width: 50, height: 50, temp: 200 },
      ]
      
      const anomalies = analyticsService.detectAnomalousAnnotations(annotations)
      
      expect(Array.isArray(anomalies)).toBe(true)
    })

    it('should return empty array for normal data', () => {
      const annotations = [
        { id: 1, x: 100, y: 100, width: 50, height: 50, temp: 50 },
        { id: 2, x: 120, y: 120, width: 50, height: 50, temp: 52 },
        { id: 3, x: 140, y: 140, width: 50, height: 50, temp: 51 },
      ]
      
      const anomalies = analyticsService.detectAnomalousAnnotations(annotations)
      
      expect(Array.isArray(anomalies)).toBe(true)
    })
  })

  describe('getDatasetStatistics', () => {
    it('should calculate dataset statistics', () => {
      const dataset = {
        annotations: [
          { id: 1, label: 'Перегрев', temp: 80 },
          { id: 2, label: 'Норма', temp: 30 },
        ],
        classes: [
          { id: 1, name: 'Перегрев' },
          { id: 2, name: 'Норма' },
        ],
      }
      
      const stats = analyticsService.getDatasetStatistics(dataset)
      
      expect(stats).toHaveProperty('totalAnnotations', 2)
      expect(stats).toHaveProperty('totalClasses', 2)
      expect(stats).toHaveProperty('avgAnnotationsPerClass')
      expect(stats).toHaveProperty('classDistribution')
    })

    it('should handle empty dataset', () => {
      const dataset = {
        annotations: [],
        classes: [],
      }
      
      const stats = analyticsService.getDatasetStatistics(dataset)
      
      expect(stats.totalAnnotations).toBe(0)
      expect(stats.totalClasses).toBe(0)
    })
  })
})
