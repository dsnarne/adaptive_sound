import { NextRequest, NextResponse } from 'next/server'
import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Suno API configuration
const SUNO_API_BASE = 'https://api.suno.ai/v1'
const SUNO_API_KEY = process.env.SUNO_API_KEY

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Step 1: Scrape the webpage content
    console.log('Scraping webpage:', url)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const html = await response.text()

    const $ = cheerio.load(html)
    
    // Extract meaningful content
    $('script, style, nav, footer, header, .advertisement, .ad').remove()
    
    const title = $('title').text().trim()
    const headings = $('h1, h2, h3').map((_, el) => $(el).text().trim()).get().join(' ')
    const paragraphs = $('p').map((_, el) => $(el).text().trim()).get().slice(0, 10).join(' ')
    const content = `${title} ${headings} ${paragraphs}`.substring(0, 3000)

    if (!content || content.length < 50) {
      return NextResponse.json({ error: 'Could not extract meaningful content from the webpage' }, { status: 400 })
    }

    // Step 2: Analyze mood using OpenAI (or demo mode)
    console.log('Analyzing mood...')
    let analysis;

    if (!process.env.OPENAI_API_KEY) {
      // Demo mode - create mock analysis based on content
      console.log('Running in demo mode - no OpenAI API key')
      analysis = {
        mood: "thoughtful and informative",
        genre: "ambient electronic",
        tempo: "medium",
        energy: "medium",
        summary: `This webpage contains content about: ${title}. The content appears to be ${content.length > 1000 ? 'comprehensive and detailed' : 'concise and focused'}.`
      }
    } else {
      const moodAnalysis = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a mood analyzer. Analyze the content and determine its emotional tone and vibe. 
            Respond with a JSON object containing:
            - mood: A brief description of the overall mood (e.g., "upbeat and energetic", "melancholic and reflective", "tense and dramatic")
            - genre: A music genre that would match this mood (e.g., "uplifting pop", "ambient electronic", "dramatic orchestral")
            - tempo: Either "slow", "medium", or "fast"
            - energy: Either "low", "medium", or "high"
            - summary: A brief summary of what the content is about`
          },
          {
            role: 'user',
            content: `Analyze this webpage content: ${content}`
          }
        ],
        temperature: 0.7,
      })

      analysis = JSON.parse(moodAnalysis.choices[0].message.content || '{}')
    }
    
    // Step 3: Generate music prompt for Suno
    const musicPrompt = `Create a ${analysis.tempo} tempo, ${analysis.energy} energy ${analysis.genre} track that captures a ${analysis.mood} feeling. The music should evoke the same emotional atmosphere as the analyzed content.`

    // Step 4: Call Suno API to generate music
    console.log('Generating music with Suno...')
    
    if (!SUNO_API_KEY) {
      // For demo purposes, return mock data if Suno API key is not available
      return NextResponse.json({
        mood: analysis.mood,
        summary: analysis.summary,
        genre: analysis.genre,
        prompt: musicPrompt,
        status: 'demo_mode',
        message: 'Demo mode: Suno API key not configured. Music generation would happen here.'
      })
    }

    try {
      const sunoResponse = await fetch(`${SUNO_API_BASE}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUNO_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: musicPrompt,
          duration: 30, // 30 second clip for MVP
          style: analysis.genre
        })
      })

      const sunoData = await sunoResponse.json() as any

      return NextResponse.json({
        mood: analysis.mood,
        summary: analysis.summary,
        genre: analysis.genre,
        prompt: musicPrompt,
        musicUrl: sunoData.audio_url,
        status: 'completed'
      })
    } catch (sunoError: any) {
      console.error('Suno API error:', sunoError.response?.data || sunoError.message)
      
      return NextResponse.json({
        mood: analysis.mood,
        summary: analysis.summary,
        genre: analysis.genre,
        prompt: musicPrompt,
        status: 'suno_error',
        error: 'Music generation failed. Please check Suno API configuration.'
      })
    }

  } catch (error: any) {
    console.error('Error in generate-music API:', error)
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return NextResponse.json({ error: 'Could not access the webpage. Please check the URL.' }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: error.message || 'An unexpected error occurred' 
    }, { status: 500 })
  }
}
