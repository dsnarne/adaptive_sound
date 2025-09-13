import requests
import time
import os
import tempfile
import subprocess
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
            response = requests.post(url, headers=self.headers, json=data)
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
        
        while time.time() - start_time < max_wait:
            clip = self._get_clip_status(clip_id)
            if not clip:
                raise Exception(f"Clip {clip_id} not found")
                
            status = clip.get("status")
            
            print(f"Status: {status}")
            
            if status in ["streaming", "complete"]:
                return clip
            elif status == "error":
                error_msg = clip.get("metadata", {}).get("error_message", "Unknown error")
                raise Exception(f"Generation failed: {error_msg}")
            
            # Wait before next poll
            time.sleep(5)
        
        raise TimeoutError(f"Clip {clip_id} did not become ready within {max_wait} seconds")
    
    def download_and_play_audio(self, audio_url: str) -> tuple:
        """
        Download audio from URL and play it using afplay.
        
        Args:
            audio_url: URL to the audio file
            
        Returns:
            Tuple of (audio_file_path, process)
        """
        try:
            print(f"Downloading audio from: {audio_url}")
            
            # Download audio to temporary file
            response = requests.get(audio_url, stream=True)
            response.raise_for_status()
            
            # Get file size if available
            total_size = int(response.headers.get('content-length', 0))
            if total_size > 0:
                print(f"File size: {total_size / (1024*1024):.1f} MB")
            
            # Create temporary file
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_file:
                downloaded = 0
                print("⬇️ Downloading... ", end="", flush=True)
                
                for chunk in response.iter_content(chunk_size=8192):
                    temp_file.write(chunk)
                    downloaded += len(chunk)
                    
                    # Show progress for larger files
                    if total_size > 0 and downloaded % (1024*1024) == 0:  # Every MB
                        progress = (downloaded / total_size) * 100
                        print(f"{progress:.0f}% ", end="", flush=True)
                
                temp_path = temp_file.name
                print("Complete!")
            
            print(f"Audio saved to: {temp_path}")
            print("Starting playback with afplay...")
            
            # Play audio using afplay and keep reference to process
            process = subprocess.Popen(["afplay", temp_path])
            print("Audio is now playing!")
            
            return temp_path, process
            
        except Exception as e:
            print(f"Error with audio: {e}")
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
        print(f"Topic: {topic}")
        print(f"Tags: {tags}")
        print(f"Instrumental: {make_instrumental}")
        
        # Generate the song
        clip_info = self.generate_song(topic, tags, make_instrumental)
        
        print(f"🚀 Generation started. Clip ID: {clip_info['id']}")
        
        # Wait for streaming to be available
        ready_clip = self.wait_for_streaming(clip_info["id"])
        
        # Download and play
        audio_file, process = self.download_and_play_audio(ready_clip["audio_url"])
        
        return ready_clip, process
    


def main():
    """Generate and play music with command line arguments."""
    import sys
    
    # Parse command line arguments
    if len(sys.argv) < 2:
        print("Usage: python suno.py <topic> [tags] [--instrumental]")
        print("Example: python suno.py 'Relaxing ambient music'")
        print("Example: python suno.py 'Relaxing ambient music' 'ambient, lo-fi, peaceful'")
        print("Example: python suno.py 'Upbeat workout music' 'electronic, energetic' --instrumental")
        return
    
    topic = sys.argv[1]
    
    # Check if second argument is tags or --instrumental
    if len(sys.argv) >= 3 and not sys.argv[2].startswith('--'):
        tags = sys.argv[2]
    else:
        # Default tags based on topic keywords
        topic_lower = topic.lower()
        if any(word in topic_lower for word in ["workout", "exercise", "energy", "upbeat"]):
            tags = "electronic, energetic, upbeat"
        elif any(word in topic_lower for word in ["relax", "calm", "peaceful", "ambient"]):
            tags = "ambient, peaceful, relaxing"
        elif any(word in topic_lower for word in ["focus", "concentration", "study"]):
            tags = "instrumental, lo-fi, focus"
        elif any(word in topic_lower for word in ["rock", "metal", "heavy"]):
            tags = "rock, electric guitar, energetic"
        elif any(word in topic_lower for word in ["jazz", "smooth", "sophisticated"]):
            tags = "jazz, smooth, sophisticated"
        else:
            tags = "instrumental, ambient, versatile"
    
    make_instrumental = "--instrumental" in sys.argv
    
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