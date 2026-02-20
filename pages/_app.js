// pages/_app.js
import { useEffect, useState } from 'react'
import { getTheme } from '@/lib/theme'
import storageService from '@/lib/services/storageService'
import '@/styles/globals.css'

export default function App({ Component, pageProps }) {
  const [theme, setTheme] = useState('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const savedTheme = storageService.getTheme()
    setTheme(savedTheme)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const themeObj = getTheme(theme)
    const root = document.documentElement
    const cssVars = `
      --color-primary: ${themeObj.colors.primary};
      --color-secondary: ${themeObj.colors.secondary};
      --color-background: ${themeObj.colors.background};
      --color-surface: ${themeObj.colors.surface};
      --color-surface2: ${themeObj.colors.surface2};
      --color-text: ${themeObj.colors.text};
      --color-text-secondary: ${themeObj.colors.textSecondary};
      --color-border: ${themeObj.colors.border};
      --color-error: ${themeObj.colors.error};
      --color-success: ${themeObj.colors.success};
      --color-warning: ${themeObj.colors.warning};
    `
    root.style.cssText = cssVars
    
    // Add theme class to body for theme-specific styling
    if (typeof document !== 'undefined') {
      document.body.className = theme === 'light' ? 'light-theme' : 'dark-theme'
    }
    
    storageService.setTheme(theme)
  }, [theme, mounted])

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
  }

  if (!mounted) {
    return null
  }

  return (
    <Component 
      {...pageProps} 
      onThemeChange={handleThemeChange} 
      theme={theme} 
    />
  )
}
