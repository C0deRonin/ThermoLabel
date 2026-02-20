import * as geometryService from '@/lib/services/geometryService'

describe('geometryService', () => {
  describe('pointInPolygon', () => {
    it('should detect point inside simple rectangle', () => {
      const polygon = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ]
      
      expect(geometryService.pointInPolygon(polygon, 50, 50)).toBe(true)
    })

    it('should detect point outside polygon', () => {
      const polygon = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ]
      
      expect(geometryService.pointInPolygon(polygon, 150, 150)).toBe(false)
    })

    it('should handle point on edge', () => {
      const polygon = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ]
      
      const result = geometryService.pointInPolygon(polygon, 50, 0)
      expect(typeof result).toBe('boolean')
    })

    it('should handle triangle polygon', () => {
      const polygon = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 50, y: 100 },
      ]
      
      expect(geometryService.pointInPolygon(polygon, 50, 50)).toBe(true)
      expect(geometryService.pointInPolygon(polygon, 0, 100)).toBe(false)
    })
  })

  describe('polygonBounds', () => {
    it('should calculate bounding box for rectangle', () => {
      const polygon = [
        { x: 10, y: 20 },
        { x: 100, y: 20 },
        { x: 100, y: 80 },
        { x: 10, y: 80 },
      ]
      
      const bounds = geometryService.polygonBounds(polygon)
      expect(bounds.x).toBe(10)
      expect(bounds.x + bounds.w).toBe(100)
      expect(bounds.y).toBe(20)
      expect(bounds.y + bounds.h).toBe(80)
    })

    it('should handle irregular polygon', () => {
      const polygon = [
        { x: 0, y: 0 },
        { x: 100, y: 50 },
        { x: 50, y: 100 },
      ]
      
      const bounds = geometryService.polygonBounds(polygon)
      expect(bounds.x).toBe(0)
      expect(bounds.x + bounds.w).toBe(100)
      expect(bounds.y).toBe(0)
      expect(bounds.y + bounds.h).toBe(100)
    })
  })

  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      const p1 = { x: 0, y: 0 }
      const p2 = { x: 3, y: 4 }
      
      const distance = geometryService.calculateDistance(p1, p2)
      expect(distance).toBe(5)
    })

    it('should handle same point', () => {
      const p1 = { x: 10, y: 20 }
      const p2 = { x: 10, y: 20 }
      
      const distance = geometryService.calculateDistance(p1, p2)
      expect(distance).toBe(0)
    })

    it('should be symmetric', () => {
      const p1 = { x: 5, y: 10 }
      const p2 = { x: 15, y: 20 }
      
      const dist1 = geometryService.calculateDistance(p1, p2)
      const dist2 = geometryService.calculateDistance(p2, p1)
      expect(dist1).toBe(dist2)
    })
  })

  describe('isBboxOverlapping', () => {
    it('should detect overlapping bboxes', () => {
      const bbox1 = { x: 0, y: 0, w: 100, h: 100 }
      const bbox2 = { x: 50, y: 50, w: 100, h: 100 }
      
      expect(geometryService.isBboxOverlapping(bbox1, bbox2)).toBe(true)
    })

    it('should detect non-overlapping bboxes', () => {
      const bbox1 = { x: 0, y: 0, w: 100, h: 100 }
      const bbox2 = { x: 150, y: 150, w: 100, h: 100 }
      
      expect(geometryService.isBboxOverlapping(bbox1, bbox2)).toBe(false)
    })

    it('should detect touching bboxes', () => {
      const bbox1 = { x: 0, y: 0, w: 100, h: 100 }
      const bbox2 = { x: 100, y: 0, w: 100, h: 100 }
      
      const result = geometryService.isBboxOverlapping(bbox1, bbox2)
      expect(typeof result).toBe('boolean')
    })
  })

  describe('getIoU', () => {
    it('should calculate IoU for overlapping boxes', () => {
      const bbox1 = { x: 0, y: 0, w: 100, h: 100 }
      const bbox2 = { x: 50, y: 50, w: 100, h: 100 }
      
      const iou = geometryService.getIoU(bbox1, bbox2)
      expect(iou).toBeGreaterThan(0)
      expect(iou).toBeLessThanOrEqual(1)
    })

    it('should return 0 for non-overlapping boxes', () => {
      const bbox1 = { x: 0, y: 0, w: 100, h: 100 }
      const bbox2 = { x: 150, y: 150, w: 100, h: 100 }
      
      const iou = geometryService.getIoU(bbox1, bbox2)
      expect(iou).toBe(0)
    })

    it('should return 1 for identical boxes', () => {
      const bbox = { x: 0, y: 0, w: 100, h: 100 }
      
      const iou = geometryService.getIoU(bbox, bbox)
      expect(iou).toBe(1)
    })
  })
})
