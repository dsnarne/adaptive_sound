'use client'

import { useState } from 'react'
import MainContent from './components/MainContent'
import Sidebar from './components/Sidebar'
import BottomThemeToggle from './components/BottomThemeToggle'
import { ThemeProvider } from './components/ThemeProvider'

export default function Home() {
  // Settings state
  const [autoplay, setAutoplay] = useState(true)
  const [fade, setFade] = useState(true)
  const [autoSwitch, setAutoSwitch] = useState(false)
  
  // Music state
  const [currentSong, setCurrentSong] = useState('Ambient Webpage Symphony')
  const [mood, setMood] = useState('thoughtful and informative')
  const [readingContent, setReadingContent] = useState('This webpage contains content about adaptive sound generation. The system analyzes text patterns, emotional undertones, and thematic elements to create matching musical compositions that enhance the reading experience.')

  const handleProfileClick = () => {
    console.log('Profile clicked')
    // TODO: Implement profile/settings modal
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen flex">
        <MainContent 
          currentSong={currentSong}
          mood={mood}
          readingContent={readingContent}
        />
        
        <Sidebar
          autoplay={autoplay}
          fade={fade}
          autoSwitch={autoSwitch}
          onAutoplayChange={setAutoplay}
          onFadeChange={setFade}
          onAutoSwitchChange={setAutoSwitch}
          onProfileClick={handleProfileClick}
        />
        
        <BottomThemeToggle />
      </div>
    </ThemeProvider>
  )
}
