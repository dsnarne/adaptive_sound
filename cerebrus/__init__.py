"""
Suno Vibe Compressor Package

Simple interface for converting text to Suno API format for adaptive music generation.
"""

import os
from dotenv import load_dotenv
from .cerebras_vibe_compressor import CerebrasVibeCompressor

# Load environment variables
load_dotenv()

def compress_text(text: str):
    """
    Simple function to compress text to Suno API format.
    
    Args:
        text (str): Input text to compress
        
    Returns:
        CompressorResult: Result object with .success, .data, .error_message
        
    Example:
        >>> from suno import compress_text
        >>> result = compress_text("Recent advances in quantum computing...")
        >>> if result.success:
        ...     print(result.data)  # {"topics": "...", "tags": "..."}
    """
    compressor = CerebrasVibeCompressor(
        api_key=os.environ.get("CEREBRAS_API_KEY"),
        enable_logging=False
    )
    return compressor.compress(text)

# Export the main interface
__all__ = ['compress_text', 'CerebrasVibeCompressor']