import React, { useState } from 'react'

const ImageLoadModal = ({ onLoad, onCancel, isOpen = false }) => {
  const [mode, setMode] = useState('with-palette')
  const [loading, setLoading] = useState(false)

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          // Create canvas to get image data
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0)

          const imageData = ctx.getImageData(0, 0, img.width, img.height)
          let grayscaleData = imageData.data

          // If loading with palette, convert to grayscale
          if (mode === 'with-palette') {
            const newData = new Uint8ClampedArray(imageData.data.length)
            for (let i = 0; i < imageData.data.length; i += 4) {
              // Convert to grayscale using luminosity
              const r = imageData.data[i]
              const g = imageData.data[i + 1]
              const b = imageData.data[i + 2]
              const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
              newData[i] = gray
              newData[i + 1] = gray
              newData[i + 2] = gray
              newData[i + 3] = imageData.data[i + 3]
            }
            grayscaleData = newData
          }

          if (onLoad) {
            onLoad({
              data: grayscaleData,
              width: img.width,
              height: img.height,
              mode: mode,
              name: file.name.replace(/\.[^.]+$/, ''),
            })
          }
          setLoading(false)
        }
        img.src = event.target.result
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error loading image:', error)
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Загрузить изображение</h2>

        <div className="mode-selection">
          <label>
            <input
              type="radio"
              value="with-palette"
              checked={mode === 'with-palette'}
              onChange={(e) => setMode(e.target.value)}
              disabled={loading}
            />
            <span>С палитрой (тепловое изображение)</span>
            <small>
              Изображение будет преобразовано в оттенки серого и раскрашено с
              использованием выбранной палитры
            </small>
          </label>

          <label>
            <input
              type="radio"
              value="without-palette"
              checked={mode === 'without-palette'}
              onChange={(e) => setMode(e.target.value)}
              disabled={loading}
            />
            <span>Без палитры (обычное изображение)</span>
            <small>
              Изображение будет загружено как есть без применения палитры
            </small>
          </label>
        </div>

        <div className="file-input-container">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={loading}
            id="image-file-input"
          />
          <label htmlFor="image-file-input" className="file-label">
            {loading ? 'Загрузка...' : 'Выбрать файл'}
          </label>
        </div>

        <div className="modal-buttons">
          <button onClick={onCancel} disabled={loading} className="cancel-btn">
            Отмена
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }

        .modal-content {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: 24px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        }

        h2 {
          margin: 0 0 20px 0;
          font-size: 18px;
          font-weight: 600;
          color: var(--color-text);
        }

        .mode-selection {
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        label {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          cursor: pointer;
          padding: 12px;
          border: 1px solid var(--color-border);
          border-radius: 4px;
          transition: all 0.2s;
        }

        label:hover {
          background: var(--color-surface2);
          border-color: var(--color-primary);
        }

        label input[type='radio'] {
          margin-top: 2px;
          cursor: pointer;
          flex-shrink: 0;
        }

        label span {
          display: block;
          font-weight: 500;
          color: var(--color-text);
          margin-bottom: 4px;
        }

        small {
          display: block;
          font-size: 12px;
          color: var(--color-text-secondary);
          line-height: 1.4;
        }

        .file-input-container {
          margin-bottom: 20px;
        }

        #image-file-input {
          display: none;
        }

        .file-label {
          display: block;
          background: var(--color-primary);
          color: white;
          padding: 12px 16px;
          border-radius: 4px;
          text-align: center;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
          border: 2px dashed var(--color-primary);
        }

        .file-label:hover {
          opacity: 0.9;
        }

        #image-file-input:disabled + .file-label {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .modal-buttons {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .cancel-btn {
          background: var(--color-surface2);
          color: var(--color-text);
          border: 1px solid var(--color-border);
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .cancel-btn:hover {
          background: var(--color-border);
        }

        .cancel-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}

export default ImageLoadModal
