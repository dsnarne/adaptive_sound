# Adaptive Sound Setup Guide

## Complete Pipeline: OCR → Cerebrus → Suno

This app captures screen text via OCR, analyzes it with Cerebrus AI, and generates adaptive music with Suno.

### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt
pip install cerebras-cloud-sdk python-dotenv requests
```

### 2. Environment Variables

Create a `.env` file in the project root:

```env
# Cerebras API Key for text analysis
CEREBRAS_API_KEY=your_cerebras_api_key_here

# Suno API Token for music generation  
SUNO_API_TOKEN=your_suno_api_token_here

# Optional: OpenAI API Key (for fallback analysis)
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Run the App

```bash
npm run dev
```

Open http://localhost:3000/ocr

### 4. How to Use

1. **Start Capture**: Click "Start Capture" → select "Window" to follow tab switches
2. **Browse**: Navigate to text-heavy pages; OCR will extract text automatically
3. **Music Generation**: The app will:
   - Extract text via OCR
   - Send to Cerebrus for mood/vibe analysis
   - Generate instrumental music via Suno
   - Display audio player when ready
4. **Play**: Use the built-in audio controls to play generated music

### 5. API Endpoints

- `/api/ocr-ingest` - Receives OCR text
- `/api/cerebrus-analyze` - Analyzes text for topics/tags  
- `/api/suno-generate` - Generates music from topics/tags
- `/api/suno-status` - Checks music generation status

### 6. Features

- **Live OCR**: ImageCapture.grabFrame() for fast screen capture
- **Smart Analysis**: Cerebrus extracts mood, energy, and themes
- **Background Music**: Suno generates instrumental tracks
- **Real-time Updates**: Status indicators and progress tracking
- **Audio Player**: Built-in controls for generated music

### 7. Troubleshooting

- **Screen Permission**: macOS → System Settings → Privacy & Security → Screen Recording → enable Chrome
- **OCR Issues**: Try higher zoom (Cmd +), better contrast, or adjust interval
- **API Errors**: Check environment variables and API key validity
- **Python Issues**: Ensure Python 3.8+ and all dependencies installed
