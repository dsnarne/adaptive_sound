# Adaptive Sound - Vibe Compressor

An AI-powered browser extension component that generates background music to match web content.

## Overview

The "Vibe Compressor" is a critical component in an AI-powered browser extension that creates adaptive background music for web browsing. It processes scraped webpage text and distills it into a minimal "vibe summary" for music generation.

## Project Flow

1. **Browser Extension** - Scrapes main text content from webpages (articles, blogs, stories)
2. **Vibe Compressor (This Component)** - Processes raw text into structured vibe summaries
3. **Backend (Modal)** - Handles caching, orchestration, and throttling
4. **Suno API** - Generates instrumental soundtracks based on vibe summaries

## Core Functionality

The Vibe Compressor takes webpage text and outputs a strict JSON schema containing:

- **topic**: Core subject matter (≤4 words)
- **mood**: Three descriptive adjectives
- **energy**: Float value 0.0-1.0 (calm to intense)
- **tempo**: Integer 60-160 BPM
- **palette**: Three suitable instruments
- **vocals**: Vocal style (typically "instrumental")

## Design Constraints

- **Ultra-concise**: ≤25 tokens total output
- **Deterministic**: Consistent results for similar content
- **Carbon-aware**: Minimal token usage for efficiency
- **Noise-resistant**: Extracts dominant vibe from mixed content
- **Instrumental-first**: Defaults to instrumental unless content is clearly lyrical

## Example

**Input**: "Recent advances in quantum computing are opening new frontiers..."

**Output**:
```json
{
  "topic": "quantum computing",
  "mood": ["serious", "futuristic", "contemplative"],
  "energy": 0.35,
  "tempo": 82,
  "palette": ["synth pad", "soft piano", "arpeggiator"],
  "vocals": "instrumental"
}
```

## Implementation Status

This repository contains the core logic and examples for the Vibe Compressor component.
