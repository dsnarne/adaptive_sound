# Adaptive Sound - Suno AI Music Generator

A Python client for the Suno API that generates AI-created music based on topic and tags, with automatic playback using macOS system audio.

## Features

- 🎵 Generate AI music using Suno's HackMIT 2025 API
- � Simple topic and tags-based generation
- ⚡ Real-time streaming - start playing as soon as generation begins
- 🎧 Automatic audio playback using afplay (macOS)
- 🔄 Smart polling system for generation status
- 🛡️ Built-in error handling and rate limiting

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set your Suno API token:
```bash
export SUNO_API_TOKEN="your_hackmit_token_here"
```

## Quick Start

### Command Line Usage
```bash
# Basic usage
python suno.py "Relaxing ambient music" "ambient, lo-fi, peaceful"

# With instrumental option
python suno.py "Upbeat workout music" "electronic, energetic" --instrumental

# More examples
python suno.py "Deep focus music" "ambient, instrumental, concentration"
python suno.py "Chill gaming beats" "electronic, chill, lo-fi"
```

### Programmatic Usage
```python
from suno import SunoAPI

# Initialize with your API token
suno = SunoAPI("your_token_here")

# Generate and play music
clip_info, process = suno.generate_and_play(
    topic="Relaxing ambient music for focus",
    tags="ambient, instrumental, peaceful",
    make_instrumental=True
)

# Stop playback when done
process.terminate()
```

## API Methods

### `generate_song(topic, tags, make_instrumental)`
Generate a new song with specified parameters.

### `generate_and_play(topic, tags, make_instrumental)`
Generate a song and play it immediately using afplay.

### `wait_for_streaming(clip_id, max_wait)`
Poll until a clip is ready for streaming or complete.

### `download_and_play_audio(audio_url)`
Download and play audio using macOS afplay.

## Tag Examples

**Genres:**
- Electronic: `"electronic, synthwave, upbeat"`
- Ambient: `"ambient, peaceful, atmospheric"`
- Rock: `"rock, electric guitar, energetic"`
- Jazz: `"jazz, saxophone, smooth"`

**Moods:**
- Focus: `"instrumental, lo-fi, concentration"`
- Workout: `"electronic, energetic, motivational"`
- Relaxation: `"ambient, peaceful, meditation"`
- Gaming: `"electronic, chill, background"`

## Requirements

- Python 3.7+
- requests>=2.31.0
- python-dotenv>=1.0.0
- macOS (for afplay audio playback)
- Suno HackMIT 2025 API token

## Error Handling

The client handles:
- Rate limiting (60 songs/minute)
- Authentication errors
- Generation failures
- Network timeouts
- Audio playback issues

## Stopping Playback

- **During script**: Press Enter when prompted
- **Manual cleanup**: `killall afplay` to stop any running audio

## License

MIT License - see LICENSE file for details.