"""
Cerebras-powered Vibe Compressor using the Cerebras Cloud SDK.

This module integrates the Cerebras API to provide AI-powered vibe compression
with the qwen-3-235b-a22b-instruct-2507 model for optimal performance.
"""

import os
import json
import logging
import time
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

try:
    from cerebras.cloud.sdk import Cerebras
except ImportError:
    print("Warning: cerebras package not installed. Install with: pip install cerebras-cloud-sdk")
    Cerebras = None

from cerebrus.schema_validator import VibeSchemaValidator, ValidationResult
from cerebrus.text_preprocessor import TextPreprocessor

@dataclass
class CerebrasCompressionResult:
    """Result of Cerebras-powered vibe compression."""
    success: bool
    data: Optional[Dict[str, Any]]
    json_output: Optional[str]
    validation: Optional[ValidationResult]
    error_message: Optional[str]
    processing_time: Optional[float]
    token_count: Optional[int]
    model_response: Optional[str]
    tokens_used: Optional[int]


class CerebrasVibeCompressor:
    """
    Cerebras-powered vibe compressor using advanced AI for optimal accuracy.
    
    Uses the Cerebras Cloud SDK with qwen-3-235b-a22b-instruct-2507 model
    for intelligent vibe extraction from webpage content.
    """
    
    def __init__(self, api_key: Optional[str] = None, enable_logging: bool = True):
        """
        Initialize the Cerebras vibe compressor.
        
        Args:
            api_key: Cerebras API key (if None, uses CEREBRAS_API_KEY env var)
            enable_logging: Whether to enable logging
        """
        if Cerebras is None:
            raise ImportError("cerebras-cloud-sdk package is required. Install with: pip install cerebras-cloud-sdk")
        
        # Setup API key
        if api_key:
            os.environ["CEREBRAS_API_KEY"] = api_key
        elif not os.environ.get("CEREBRAS_API_KEY"):
            raise ValueError("Cerebras API key must be provided or set in CEREBRAS_API_KEY environment variable")
        
        # Initialize Cerebras client
        self.client = Cerebras(api_key=os.environ.get("CEREBRAS_API_KEY"))
        
        # Initialize supporting components
        self.preprocessor = TextPreprocessor()
        self.validator = VibeSchemaValidator()
        
        # Setup logging
        if enable_logging:
            logging.basicConfig(
                level=logging.INFO,
                format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
        self.logger = logging.getLogger(__name__)
        
        # Model configuration
        self.model = "qwen-3-235b-a22b-instruct-2507"
        self.max_tokens = 100  # Keep low for concise output
        self.temperature = 0.1  # Low temperature for deterministic output
        self.top_p = 0.8
    
    def _create_system_prompt(self) -> str:
        """Create the system prompt for the Cerebras model."""
        return """You are the "Vibe Compressor" inside an AI-powered browser extension that generates background music to match what a user is reading on the web.

Your task is to analyze webpage text and generate a JSON summary for the Suno API to create fitting background music.

CONSTRAINTS:
- Output must be SHORT, STRUCTURED JSON ONLY — no prose, no explanations
- Keep it concise (≤25 tokens total)
- Be deterministic and avoid creativity outside the schema
- If the page content is noisy (ads, navigation, mixed topics), infer the DOMINANT vibe
- Always focus on INSTRUMENTAL background music
- This is part of a carbon-aware pipeline: fewer tokens = better

OUTPUT SCHEMA (Suno API format):
{
  "topic": "<natural language description of the music, e.g. 'An upbeat instrumental track for coding'>",
  "tags": "<comma-separated tags, e.g. 'instrumental, electronic, upbeat, energetic'>"
}

RULES:
- topic = natural description of the desired instrumental music (1-2 sentences max)
- tags = comma-separated descriptive tags including: instrumental style, mood, energy, tempo, instruments
- Always include "instrumental" as the first tag
- Focus on background music suitable for reading/browsing
- Match the energy and mood to the content type

Examples:
Science article → "topic": "A calm instrumental track for reading scientific content", "tags": "instrumental, ambient, contemplative, piano, strings"
Romance story → "topic": "A gentle romantic instrumental piece", "tags": "instrumental, romantic, soft, piano, strings"
Business news → "topic": "A professional instrumental background track", "tags": "instrumental, professional, moderate, piano, subtle"

Output strictly as JSON, no additional commentary."""
    
    def _create_user_prompt(self, text: str) -> str:
        """Create the user prompt with the text to analyze."""
        return f"""Input webpage text:
<<<
{text}
>>>

Task: Summarize this into a strict JSON object following the schema. Output JSON only."""
    
    def _parse_model_response(self, response: str) -> Optional[Dict[str, Any]]:
        """
        Parse the model response to extract JSON.
        
        Args:
            response: Raw model response
            
        Returns:
            Parsed JSON data or None if parsing fails
        """
        try:
            # Try to find JSON in the response
            response = response.strip()
            
            # Look for JSON object boundaries
            start_idx = response.find('{')
            end_idx = response.rfind('}')
            
            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                json_str = response[start_idx:end_idx + 1]
                return json.loads(json_str)
            
            # If no braces found, try parsing the whole response
            return json.loads(response)
            
        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to parse JSON from model response: {e}")
            self.logger.debug(f"Raw response: {response}")
            return None
    
    def compress(self, text: str, validate_output: bool = True) -> CerebrasCompressionResult:
        """
        Compress webpage text using Cerebras AI.
        
        Args:
            text: Raw webpage text to compress
            validate_output: Whether to validate the output
            
        Returns:
            CerebrasCompressionResult with success status and data
        """
        start_time = time.time()
        
        try:
            # Input validation
            if not text or not isinstance(text, str):
                return CerebrasCompressionResult(
                    success=False,
                    data=None,
                    json_output=None,
                    validation=None,
                    error_message="Invalid input: text must be a non-empty string",
                    processing_time=None,
                    token_count=None,
                    model_response=None,
                    tokens_used=None
                )
            
            if len(text.strip()) < 10:
                return CerebrasCompressionResult(
                    success=False,
                    data=None,
                    json_output=None,
                    validation=None,
                    error_message="Input text too short (minimum 10 characters)",
                    processing_time=None,
                    token_count=None,
                    model_response=None,
                    tokens_used=None
                )
            
            # Preprocess text to clean and extract main content
            try:
                processed = self.preprocessor.process_text(text)
                main_content = processed['main_content']
                
                if not main_content or len(main_content.strip()) < 5:
                    # Fallback to basic cleaning
                    main_content = text[:800].strip()
                    
            except Exception as e:
                self.logger.warning(f"Text preprocessing failed, using fallback: {e}")
                main_content = text[:800].strip()
            
            # Create prompts
            system_prompt = self._create_system_prompt()
            user_prompt = self._create_user_prompt(main_content)
            
            # Call Cerebras API
            self.logger.info("Calling Cerebras API for vibe compression")
            
            response = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model=self.model,
                max_completion_tokens=self.max_tokens,
                temperature=self.temperature,
                top_p=self.top_p,
                stream=False
            )
            
            # Extract response content
            model_response = response.choices[0].message.content
            tokens_used = response.usage.total_tokens if hasattr(response, 'usage') else None
            
            self.logger.info(f"Received response from Cerebras API (tokens: {tokens_used})")
            
            # Parse JSON from response
            vibe_data = self._parse_model_response(model_response)
            
            if not vibe_data:
                return CerebrasCompressionResult(
                    success=False,
                    data=None,
                    json_output=None,
                    validation=None,
                    error_message="Failed to parse JSON from model response",
                    processing_time=time.time() - start_time,
                    token_count=None,
                    model_response=model_response,
                    tokens_used=tokens_used
                )
            
            # Generate compact JSON
            json_output = json.dumps(vibe_data, separators=(',', ':'))
            token_count = len(json_output.split())
            
            # Validate if requested
            validation = None
            if validate_output:
                validation = self.validator.validate(vibe_data)
                if not validation.is_valid:
                    self.logger.warning(f"Validation failed: {validation.errors}")
            
            processing_time = time.time() - start_time
            
            self.logger.info(f"Compression successful in {processing_time:.3f}s, {token_count} output tokens")
            
            return CerebrasCompressionResult(
                success=True,
                data=vibe_data,
                json_output=json_output,
                validation=validation,
                error_message=None,
                processing_time=processing_time,
                token_count=token_count,
                model_response=model_response,
                tokens_used=tokens_used
            )
            
        except Exception as e:
            processing_time = time.time() - start_time
            error_msg = f"Cerebras compression failed: {str(e)}"
            self.logger.error(error_msg)
            
            return CerebrasCompressionResult(
                success=False,
                data=None,
                json_output=None,
                validation=None,
                error_message=error_msg,
                processing_time=processing_time,
                token_count=None,
                model_response=None,
                tokens_used=None
            )
    
    def compress_batch(self, texts: List[str], validate_output: bool = True) -> List[CerebrasCompressionResult]:
        """
        Compress multiple texts using Cerebras AI.
        
        Args:
            texts: List of text strings to compress
            validate_output: Whether to validate outputs
            
        Returns:
            List of CerebrasCompressionResults
        """
        results = []
        
        for i, text in enumerate(texts):
            try:
                self.logger.info(f"Processing batch item {i+1}/{len(texts)}")
                result = self.compress(text, validate_output)
                results.append(result)
                
                # Small delay to avoid rate limiting
                time.sleep(0.1)
                
            except Exception as e:
                self.logger.error(f"Batch item {i+1} failed: {e}")
                results.append(CerebrasCompressionResult(
                    success=False,
                    data=None,
                    json_output=None,
                    validation=None,
                    error_message=f"Batch processing failed: {e}",
                    processing_time=None,
                    token_count=None,
                    model_response=None,
                    tokens_used=None
                ))
        
        return results
    
    def get_stats(self, results: List[CerebrasCompressionResult]) -> Dict[str, Any]:
        """
        Generate statistics from Cerebras compression results.
        
        Args:
            results: List of compression results
            
        Returns:
            Statistics dictionary
        """
        successful = [r for r in results if r.success]
        failed = [r for r in results if not r.success]
        
        if not successful:
            return {
                'total': len(results),
                'successful': 0,
                'failed': len(failed),
                'success_rate': 0.0,
                'error': 'No successful compressions'
            }
        
        # Token statistics
        output_tokens = [r.token_count for r in successful if r.token_count]
        input_tokens = [r.tokens_used for r in successful if r.tokens_used]
        processing_times = [r.processing_time for r in successful if r.processing_time]
        
        # Topic distribution
        topics = [r.data['topic'] for r in successful if r.data and 'topic' in r.data]
        topic_counts = {}
        for topic in topics:
            topic_counts[topic] = topic_counts.get(topic, 0) + 1
        
        return {
            'total': len(results),
            'successful': len(successful),
            'failed': len(failed),
            'success_rate': len(successful) / len(results) * 100,
            'token_stats': {
                'output_tokens': {
                    'average': sum(output_tokens) / len(output_tokens) if output_tokens else 0,
                    'min': min(output_tokens) if output_tokens else 0,
                    'max': max(output_tokens) if output_tokens else 0,
                    'within_limit': sum(1 for t in output_tokens if t <= 25)
                },
                'input_tokens': {
                    'total': sum(input_tokens) if input_tokens else 0,
                    'average': sum(input_tokens) / len(input_tokens) if input_tokens else 0
                }
            },
            'performance': {
                'avg_processing_time': sum(processing_times) / len(processing_times) if processing_times else 0,
                'total_processing_time': sum(processing_times) if processing_times else 0
            },
            'topic_distribution': topic_counts,
            'common_errors': [r.error_message for r in failed]
        }


# Example usage and testing
if __name__ == "__main__":
    # Set API key (replace with your actual key)
    api_key = "csk-cmtnd545nxkdhfmc5vvw2ymfr2x3e344j96xnjne82dke9m5"
    
    try:
        compressor = CerebrasVibeCompressor(api_key=api_key)
        
        # Test cases
        test_texts = [
            "Recent advances in quantum computing are opening new frontiers in computational science. Researchers have demonstrated quantum supremacy in specific problem domains.",
            "Sarah's heart fluttered as she saw him across the crowded café. Their eyes met for just a moment, but it felt like an eternity filled with possibility.",
            "The stock market experienced significant volatility today as investors reacted to the Federal Reserve's latest interest rate decision.",
        ]
        
        print("Cerebras Vibe Compressor Test Results:")
        print("=" * 60)
        
        # Test individual compression
        for i, text in enumerate(test_texts):
            print(f"\nTest {i+1}:")
            print(f"Input: {text[:80]}...")
            
            result = compressor.compress(text)
            
            if result.success:
                print(f"Success: {result.success}")
                print(f"Topic: {result.data['topic']}")
                print(f"Tags: {result.data['tags']}")
                print(f"JSON: {result.json_output}")
                print(f"Output tokens: {result.token_count}")
                print(f"Total tokens used: {result.tokens_used}")
                print(f"Processing time: {result.processing_time:.3f}s")
                if result.validation:
                    print(f"Valid: {result.validation.is_valid}")
            else:
                print(f"Error: {result.error_message}")
                print(f"Raw response: {result.model_response}")
        
        # Test batch processing
        print(f"\n{'='*60}")
        print("Batch Processing Test:")
        batch_results = compressor.compress_batch(test_texts)
        stats = compressor.get_stats(batch_results)
        
        print(f"Total processed: {stats['total']}")
        print(f"Success rate: {stats['success_rate']:.1f}%")
        print(f"Average output tokens: {stats['token_stats']['output_tokens']['average']:.1f}")
        print(f"Total input tokens: {stats['token_stats']['input_tokens']['total']}")
        print(f"Average processing time: {stats['performance']['avg_processing_time']:.3f}s")
        print(f"Topic distribution: {stats['topic_distribution']}")
        
    except ImportError as e:
        print(f"Error: {e}")
        print("Please install the Cerebras SDK: pip install cerebras-cloud-sdk")
    except Exception as e:
        print(f"Error: {e}")
