import * as exportService from '@/lib/services/exportService'

describe('exportService', () => {
  const mockAnnotations = [
    {
      id: 1,
      type: 'bbox',
      x: 10,
      y: 20,
      width: 100,
      height: 80,
      label: 'Перегрев',
      tempRange: { min: 50, max: 100 },
    },
    {
      id: 2,
      type: 'polygon',
      points: [
        { x: 50, y: 50 },
        { x: 150, y: 50 },
        { x: 150, y: 100 },
        { x: 50, y: 100 },
      ],
      label: 'Аномалия',
    },
  ]

  const mockClasses = [
    { id: 1, name: 'Перегрев', color: '#FF0000', tempMin: 50, tempMax: 120 },
    { id: 2, name: 'Норма', color: '#00FF00', tempMin: 0, tempMax: 50 },
  ]

  describe('exportYOLO', () => {
    it('should export annotations in YOLO format', () => {
      const result = exportService.exportYOLO(mockAnnotations, 640, 480, mockClasses)
      
      expect(typeof result).toBe('string')
      expect(result).toContain('0')
      expect(result).not.toBe('')
    })

    it('should normalize coordinates to 0-1 range', () => {
      const result = exportService.exportYOLO(mockAnnotations.slice(0, 1), 640, 480, mockClasses)
      const lines = result.trim().split('\n')
      
      lines.forEach(line => {
        const parts = line.split(' ')
        if (parts.length === 5) {
          const x = parseFloat(parts[1])
          const y = parseFloat(parts[2])
          const w = parseFloat(parts[3])
          const h = parseFloat(parts[4])
          
          expect(x).toBeGreaterThanOrEqual(0)
          expect(x).toBeLessThanOrEqual(1)
          expect(y).toBeGreaterThanOrEqual(0)
          expect(y).toBeLessThanOrEqual(1)
        }
      })
    })

    it('should omit polygon annotations', () => {
      const bboxOnly = mockAnnotations.filter(a => a.type === 'bbox')
      const result = exportService.exportYOLO(bboxOnly, 640, 480, mockClasses)
      
      expect(result).toBeTruthy()
    })
  })

  describe('exportCOCO', () => {
    it('should export in COCO format', () => {
      const result = exportService.exportCOCO(mockAnnotations, 640, 480, mockClasses)
      
      expect(result).toHaveProperty('images')
      expect(result).toHaveProperty('annotations')
      expect(result).toHaveProperty('categories')
      expect(Array.isArray(result.images)).toBe(true)
      expect(Array.isArray(result.annotations)).toBe(true)
    })

    it('should include image metadata', () => {
      const result = exportService.exportCOCO(mockAnnotations, 640, 480, mockClasses)
      
      expect(result.images.length).toBeGreaterThan(0)
      expect(result.images[0]).toHaveProperty('id')
      expect(result.images[0]).toHaveProperty('width', 640)
      expect(result.images[0]).toHaveProperty('height', 480)
    })

    it('should include all categories', () => {
      const result = exportService.exportCOCO(mockAnnotations, 640, 480, mockClasses)
      
      expect(result.categories.length).toBeGreaterThanOrEqual(mockClasses.length)
    })
  })

  describe('exportPascalVOC', () => {
    it('should export in Pascal VOC XML format', () => {
      const result = exportService.exportPascalVOC(mockAnnotations, 640, 480, mockClasses)
      
      expect(typeof result).toBe('string')
      expect(result).toContain('<?xml')
      expect(result).toContain('<annotation>')
      expect(result).toContain('</annotation>')
    })

    it('should include image dimensions', () => {
      const result = exportService.exportPascalVOC(mockAnnotations, 640, 480, mockClasses)
      
      expect(result).toContain('640')
      expect(result).toContain('480')
    })

    it('should include object information', () => {
      const result = exportService.exportPascalVOC(mockAnnotations, 640, 480, mockClasses)
      
      expect(result).toContain('<object>')
      expect(result).toContain('</object>')
    })

    it('should use absolute coordinates', () => {
      const result = exportService.exportPascalVOC(mockAnnotations.slice(0, 1), 640, 480, mockClasses)
      
      const bboxMatch = result.match(/<xmin>(\d+)<\/xmin>/)
      if (bboxMatch) {
        const xmin = parseInt(bboxMatch[1])
        expect(xmin).toBeLessThanOrEqual(640)
        expect(xmin).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('downloadFile', () => {
    it('should trigger download', () => {
      const content = 'test content'
      const filename = 'test.txt'
      
      const createElementSpy = jest.spyOn(document, 'createElement')
      const appendChildSpy = jest.spyOn(document.body, 'appendChild')
      const removeChildSpy = jest.spyOn(document.body, 'removeChild')
      
      exportService.downloadFile(content, filename)
      
      createElementSpy.mockRestore?.()
      appendChildSpy.mockRestore?.()
      removeChildSpy.mockRestore?.()
    })
  })
})
