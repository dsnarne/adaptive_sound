# Adaptive Sound

Transform any webpage into music! This MVP analyzes the mood and content of web pages to generate matching music using AI.

## Features

- **Web Content Analysis**: Scrape and analyze webpage content
- **Mood Detection**: AI-powered mood analysis using OpenAI
- **Music Generation**: Generate music that matches the detected mood using Suno API
- **Beautiful UI**: Modern, responsive web interface built with Next.js and Tailwind CSS

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   - Copy `.env.example` to `.env.local`
   - Add your OpenAI API key for mood analysis
   - Add your Suno API key for music generation

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and go to `http://localhost:3000`

## How It Works

1. Enter any webpage URL
2. The system scrapes the content and analyzes its mood
3. AI generates music that matches the detected emotional tone
4. Listen to your personalized soundtrack!

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI Services**: OpenAI (mood analysis), Suno API (music generation)
- **Web Scraping**: Cheerio, Axios

## API Keys Required

- **OpenAI API Key**: For content mood analysis
- **Suno API Key**: For music generation

## Demo Mode

The app includes a demo mode that works without the Suno API key - it will show the mood analysis and music prompt without actually generating audio.

## Development Timeline

This MVP was built for a 24-hour development challenge, focusing on core functionality and user experience.