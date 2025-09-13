'use client'

import { useState, useEffect } from 'react'
import { useTheme } from './ThemeProvider'

export default function FloatingThemeButton() {
  const { themeName, setTheme, availableThemes } = useTheme()
  const [isVisible, setIsVisible] = useState(true)

  const getNextTheme = () => {
    const currentIndex = availableThemes.indexOf(themeName)
    const nextIndex = (currentIndex + 1) % availableThemes.length
    return availableThemes[nextIndex]
  }

  const handleToggle = () => {
    setTheme(getNextTheme())
  }

  const getThemeColor = (theme: string) => {
    switch (theme) {
      case 'blue': return 'rgb(71, 85, 105)'
      case 'green': return 'rgb(132, 148, 132)'
      case 'orange': return 'rgb(180, 130, 90)'
      default: return 'var(--color-primary)'
    }
  }

  useEffect(() => {
    let lastScrollY = window.scrollY

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Show button when at top, hide when scrolling down
      if (currentScrollY <= 10) {
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true)
      }
      
      lastScrollY = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div 
      className={`fixed top-4 z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
      style={{ right: '336px' }} // 320px (sidebar width) + 16px (gap)
    >
      <button
        onClick={handleToggle}
        className="w-12 h-12 rounded-full shadow-lg border-2 transition-all hover:shadow-xl hover:scale-105"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
        title={`Switch theme`}
      >
        <div
          className="w-6 h-6 rounded-full mx-auto"
          style={{ backgroundColor: getThemeColor(themeName) }}
        />
      </button>
    </div>
  )
}
