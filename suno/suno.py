import requests
import time
import os
import tempfile
import subprocess
import json
from typing import Dict
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class SunoAPI:
    """
    Suno API client for HackMIT 2025 that generates and plays AI music.
    Supports prompt-based generation for adaptive sound based on user context.
    """

    BASE_URL = "https://studio-api.prod.suno.com/api/v2/external/hackmit"
    
    def __init__(self, api_token: str):
        """Initialize the Suno API client with authentication token."""
        self.api_token = api_token
        self.headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        }
        
        # Audio system ready (using afplay)
        pass
    
    def generate_song(self, 
                     topic: str,
                     tags: str,
                     make_instrumental: bool = False) -> Dict:
        """
        Generate a new song using Suno API.
        
        Args:
            topic: Description for the song (max 2500 chars)
            tags: Musical style/genres (max 100 chars)
            make_instrumental: Generate without vocals
            
        Returns:
            Dict containing clip information with ID for polling
        """
        url = f"{self.BASE_URL}/generate"
        
        data = {
            "topic": topic[:2500],  # Ensure max length
            "tags": tags[:100],     # Ensure max length
        }
        if make_instrumental:
            data["make_instrumental"] = make_instrumental
            
        try:
            api_start = time.time()
            print(f"[0.0s] 🚀 Sending generation request to Suno API...")
            response = requests.post(url, headers=self.headers, json=data)
            api_time = time.time() - api_start
            print(f"[{api_time:.1f}s] ✅ API request completed in {api_time:.3f}s")
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error generating song: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Response: {e.response.text}")
            raise
    
    def _get_clip_status(self, clip_id: str) -> Dict:
        """
        Get status and audio URL for a single clip.
        
        Args:
            clip_id: Clip UUID
            
        Returns:
            Clip object with status and audio_url when ready
        """
        url = f"{self.BASE_URL}/clips"
        params = {"ids": clip_id}
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            clips = response.json()
            return clips[0] if clips else None
        except requests.exceptions.RequestException as e:
            print(f"Error fetching clip: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Response: {e.response.text}")
            raise
    
    def wait_for_streaming(self, clip_id: str, max_wait: int = 300) -> Dict:
        """
        Poll clip status until it's ready for streaming or complete.
        
        Args:
            clip_id: UUID of the clip to monitor
            max_wait: Maximum seconds to wait
            
        Returns:
            Clip object when streaming or complete
        """
        start_time = time.time()
        poll_count = 0
        
        print(f"[{0:.1f}s] 📊 Starting polling for clip {clip_id}")
        
        while time.time() - start_time < max_wait:
            poll_count += 1
            elapsed = time.time() - start_time
            
            print(f"[{elapsed:.1f}s] 🔍 Poll #{poll_count}: Checking status...")
            
            poll_start = time.time()
            clip = self._get_clip_status(clip_id)
            poll_time = time.time() - poll_start
            
            if not clip:
                raise Exception(f"Clip {clip_id} not found")
                
            status = clip.get("status")
            elapsed = time.time() - start_time
            
            print(f"[{elapsed:.1f}s] 📊 Poll #{poll_count}: Status = '{status}' (API call: {poll_time:.3f}s)")
            
            if status in ["streaming", "complete"]:
                print(f"[{elapsed:.1f}s] ✅ Ready! Status changed to '{status}' after {poll_count} polls")
                return clip
            elif status == "error":
                error_msg = clip.get("metadata", {}).get("error_message", "Unknown error")
                raise Exception(f"Generation failed: {error_msg}")
            
            # Wait before next poll
            print(f"[{elapsed:.1f}s] ⏳ Waiting 5 seconds before next poll...")
            time.sleep(5)
        
        raise TimeoutError(f"Clip {clip_id} did not become ready within {max_wait} seconds")
    
    def _check_audio_player_availability(self) -> str:
        """
        Check which audio player is available on the system.
        
        Returns:
            Name of available audio player ('mpv', 'afplay', or None)
        """
        try:
            subprocess.run(["mpv", "--version"], capture_output=True, check=True)
            return "mpv"
        except (subprocess.CalledProcessError, FileNotFoundError):
            try:
                subprocess.run(["afplay", "--help"], capture_output=True, check=True)
                return "afplay"
            except (subprocess.CalledProcessError, FileNotFoundError):
                return None
    
    def _validate_audio_url(self, audio_url: str) -> bool:
        """
        Validate that the audio URL is accessible.
        
        Args:
            audio_url: URL to validate
            
        Returns:
            True if URL is accessible, False otherwise
        """
        try:
            response = requests.head(audio_url, timeout=10)
            return response.status_code == 200
        except Exception:
            return False
    
    def stream_and_play_audio(self, audio_url: str, start_time: float) -> tuple:
        """
        Stream audio directly from URL using mpv (preferred) or afplay fallback.
        
        Args:
            audio_url: URL to the audio file
            start_time: Start time for elapsed timing
            
        Returns:
            Tuple of (audio_url, process)
        """
        elapsed = time.time() - start_time
        print(f"[{elapsed:.1f}s] 🎵 Starting direct streaming from: {audio_url}")
        
        # Check which audio player is available
        player = self._check_audio_player_availability()
        if not player:
            raise Exception("No compatible audio player found. Please install mpv (brew install mpv) or ensure afplay is available.")
        
        # Validate URL accessibility
        print(f"[{elapsed:.1f}s] 🔍 Validating audio URL...")
        if not self._validate_audio_url(audio_url):
            raise Exception("Audio URL is not accessible or has expired")
        
        try:
            playback_start = time.time()
            
            if player == "mpv":
                # Use mpv with optimized streaming settings
                process = subprocess.Popen([
                    "mpv", 
                    audio_url,
                    "--no-video",           # Audio only
                    "--really-quiet",       # Suppress output
                    "--cache=yes",          # Enable caching
                    "--demuxer-max-bytes=1M"  # Limit buffer size for faster startup
                ])
                print(f"[{elapsed:.1f}s] 🎶 Using mpv for audio streaming")
            else:
                # Fallback to afplay
                process = subprocess.Popen(["afplay", audio_url])
                print(f"[{elapsed:.1f}s] 🎶 Using afplay for audio streaming")
            
            playback_startup = time.time() - playback_start
            elapsed = time.time() - start_time
            print(f"[{elapsed:.1f}s] 🎶 Audio streaming started! (startup: {playback_startup:.3f}s)")
            
            return audio_url, process
            
        except Exception as e:
            elapsed = time.time() - start_time
            print(f"[{elapsed:.1f}s] ❌ Error with streaming: {e}")
            raise
    
    def generate_and_play(self, topic: str, tags: str, make_instrumental: bool = False) -> Dict:
        """
        Generate music and play it immediately.
        
        Args:
            topic: Description for the song
            tags: Musical style/genres
            make_instrumental: Generate without vocals
            
        Returns:
            Clip info with metadata
        """
        overall_start = time.time()
        
        print(f"Topic: {topic}")
        print(f"Tags: {tags}")
        print(f"Instrumental: {make_instrumental}")
        
        # Generate the song
        clip_info = self.generate_song(topic, tags, make_instrumental)
        
        print(f"🚀 Generation started. Clip ID: {clip_info['id']}")
        
        # Wait for streaming to be available
        ready_clip = self.wait_for_streaming(clip_info["id"])
        
        # Stream and play
        audio_file, process = self.stream_and_play_audio(ready_clip["audio_url"], overall_start)
        
        total_time = time.time() - overall_start
        print(f"🎉 Total pipeline time: {total_time:.1f}s")
        
        return ready_clip, process
    


def load_json_config(file_path: str) -> Dict:
    """Load topics and tags from JSON file."""
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: JSON file '{file_path}' not found")
        return None
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON format - {e}")
        return None

def generate_default_tags(topic: str) -> str:
    """Generate default tags based on topic keywords."""
    topic_lower = topic.lower()
    if any(word in topic_lower for word in ["workout", "exercise", "energy", "upbeat"]):
        return "electronic, energetic, upbeat"
    elif any(word in topic_lower for word in ["relax", "calm", "peaceful", "ambient"]):
        return "ambient, peaceful, relaxing"
    elif any(word in topic_lower for word in ["focus", "concentration", "study"]):
        return "instrumental, lo-fi, focus"
    elif any(word in topic_lower for word in ["rock", "metal", "heavy"]):
        return "rock, electric guitar, energetic"
    elif any(word in topic_lower for word in ["jazz", "smooth", "sophisticated"]):
        return "jazz, smooth, sophisticated"
    else:
        return "instrumental, ambient, versatile"

def main():
    """Generate and play music with command line arguments or JSON file."""
    import sys
    
    # Parse command line arguments
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python suno.py <topic> [tags] [--instrumental]")
        print("  python suno.py --json <json_file> [--instrumental]")
        print()
        print("Examples:")
        print("  python suno.py 'Relaxing ambient music'")
        print("  python suno.py 'Relaxing ambient music' 'ambient, lo-fi, peaceful'")
        print("  python suno.py --json music_config.json")
        print("  python suno.py --json music_config.json --instrumental")
        return
    
    make_instrumental = "--instrumental" in sys.argv
    
    # Check if using JSON file input
    if sys.argv[1] == "--json":
        if len(sys.argv) < 3:
            print("Error: JSON file path required when using --json")
            return
        
        json_file = sys.argv[2]
        config = load_json_config(json_file)
        if not config:
            return
        
        # Extract topic and tags from JSON
        topic = config.get("topic", "")
        tags = config.get("tags", "")
        
        if not topic:
            print("Error: 'topic' field is required in JSON file")
            return
        
        # Use default tags if empty or not provided
        if not tags:
            tags = generate_default_tags(topic)
            print(f"Using default tags: {tags}")
    
    else:
        # Original command line parsing
        topic = sys.argv[1]
        
        # Check if second argument is tags or --instrumental
        if len(sys.argv) >= 3 and not sys.argv[2].startswith('--'):
            tags = sys.argv[2]
        else:
            tags = generate_default_tags(topic)
    
    # Get API token from environment variable
    api_token = os.getenv("SUNO_API_TOKEN")
    if not api_token:
        print("Please set SUNO_API_TOKEN environment variable")
        print("export SUNO_API_TOKEN='your_hackmit_token_here'")
        return
    
    # Initialize API client
    suno = SunoAPI(api_token)
    
    # Generate and play music
    print("🎵 Generating music...")
    try:
        clip_info, process = suno.generate_and_play(topic, tags, make_instrumental)
        print(f"Success! Generated: {clip_info.get('title', 'Untitled')}")
        
        # Keep playing until user stops
        input("Press Enter to stop...")
        
        # Stop the audio playback
        process.terminate()
        print("Playback stopped.")
        
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    main()
