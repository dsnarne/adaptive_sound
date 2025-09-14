# Tuneshift - Real-Time Adaptive Music Generation

Tuneshift is a full-stack AI-powered application that generates personalized background music in real-time based on the content you're reading on your screen. By combining modern web technologies with specialized AI services, we achieve sub-12-second latency from screen capture to music playback.

## 🎵 Features

- **Real-Time Screen Capture**: Automatically captures and analyzes web content as you browse
- **AI-Powered Content Analysis**: Uses Cerebras AI to extract mood and topics from messy OCR text
- **Instant Music Generation**: Generates personalized background music in 10-12 seconds
- **Custom Music Player**: Built-in player with playback controls and progress tracking
- **Session History**: Track and replay previously generated music
- **Multiple Themes**: Choose from Blue (Dark), Green (Sage), or Orange (Muted) themes

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- Modal.com account
- Cerebras API key
- Suno API token

### Installation

1. **Clone and install dependencies**

```bash
git clone https://github.com/yourusername/tuneshift.git
cd tuneshift
npm install
pip install -r requirements.txt
pip install -r modal_functions/requirements.txt
```

2. **Set up environment variables**

```bash
# Create .env.local file
CEREBRAS_API_KEY=your_cerebras_api_key
SUNO_API_TOKEN=your_suno_api_token
MODAL_AUTH_TOKEN=your_modal_auth_token
MODAL_RECORD_PLAY_URL=https://your-modal-app--record-play.modal.run
MODAL_GET_PLAYS_URL=https://your-modal-app--get-recent-plays.modal.run
```

3. **Deploy and run**

```bash
modal deploy modal_functions/recent_plays.py
npm run dev
```

## Architecture

### Real-Time Pipeline

1. **Screen Capture** → Browser captures screen content
2. **OCR Processing** → Tesseract.js extracts text locally
3. **Content Analysis** → Cerebras AI analyzes mood and topics (sub-second)
4. **Music Generation** → Suno API generates personalized music (10-12 seconds)
5. **Playback** → Custom player delivers seamless audio experience

### Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **AI Services**: Cerebras Cloud SDK, Suno API
- **Data Storage**: Modal.com serverless functions
- **Screen Capture**: MediaDevices API, Tesseract.js

