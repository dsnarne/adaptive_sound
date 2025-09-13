# Vibe Compressor API Documentation

## Overview

The Vibe Compressor is an AI-powered system that processes webpage text and generates structured JSON summaries for background music generation. It's designed to be ultra-concise (≤25 tokens), deterministic, and carbon-aware.

## Quick Start

```python
from enhanced_vibe_compressor import EnhancedVibeCompressor

# Initialize the compressor
compressor = EnhancedVibeCompressor()

# Compress webpage text
text = "Recent advances in quantum computing are revolutionizing science."
result = compressor.compress(text)

if result.success:
    print(result.json_output)
    # Output: {"topic":"science article","mood":["serious","analytical","contemplative"],"energy":0.5,"tempo":110,"palette":["synth pad","soft piano","subtle strings"],"vocals":"instrumental"}
else:
    print(f"Error: {result.error_message}")
```

## Core Classes

### EnhancedVibeCompressor

The main class for production use with advanced preprocessing and error handling.

#### Constructor

```python
EnhancedVibeCompressor(enable_logging: bool = True)
```

**Parameters:**
- `enable_logging`: Whether to enable logging (default: True)

#### Methods

##### compress(text, validate_output=True)

Compress webpage text into a vibe summary.

**Parameters:**
- `text` (str): Raw webpage text to compress
- `validate_output` (bool): Whether to validate the output (default: True)

**Returns:**
- `CompressionResult`: Result object with success status and data

**Example:**
```python
result = compressor.compress("Science article about quantum computing")
if result.success:
    print(f"Topic: {result.data['topic']}")
    print(f"JSON: {result.json_output}")
    print(f"Tokens: {result.token_count}")
```

##### compress_batch(texts, validate_output=True)

Compress multiple texts in batch.

**Parameters:**
- `texts` (List[str]): List of text strings to compress
- `validate_output` (bool): Whether to validate outputs (default: True)

**Returns:**
- `List[CompressionResult]`: List of compression results

**Example:**
```python
texts = [
    "Science article about quantum computing",
    "Romance novel about love",
    "Business news about markets"
]
results = compressor.compress_batch(texts)
for i, result in enumerate(results):
    print(f"Text {i+1}: {'Success' if result.success else 'Failed'}")
```

##### get_stats(results)

Generate statistics from compression results.

**Parameters:**
- `results` (List[CompressionResult]): List of compression results

**Returns:**
- `Dict[str, Any]`: Statistics dictionary

**Example:**
```python
stats = compressor.get_stats(results)
print(f"Success rate: {stats['success_rate']:.1f}%")
print(f"Average tokens: {stats['token_stats']['average']:.1f}")
```

### CompressionResult

Result object returned by compression operations.

#### Attributes

- `success` (bool): Whether compression succeeded
- `data` (Optional[Dict]): Vibe data dictionary (if successful)
- `json_output` (Optional[str]): Compact JSON string (if successful)
- `validation` (Optional[ValidationResult]): Validation result (if requested)
- `error_message` (Optional[str]): Error message (if failed)
- `processing_time` (Optional[float]): Processing time in seconds
- `token_count` (Optional[int]): Estimated token count

### VibeSchemaValidator

Validates vibe compression output against the expected schema.

#### Constructor

```python
VibeSchemaValidator()
```

#### Methods

##### validate(data)

Validate vibe compression output.

**Parameters:**
- `data` (Union[Dict, str]): Vibe data as dictionary or JSON string

**Returns:**
- `ValidationResult`: Validation result with errors and warnings

**Example:**
```python
validator = VibeSchemaValidator()
result = validator.validate({
    "topic": "science article",
    "mood": ["serious", "analytical", "contemplative"],
    "energy": 0.5,
    "tempo": 110,
    "palette": ["piano", "strings", "synth"],
    "vocals": "instrumental"
})
print(f"Valid: {result.is_valid}")
```

### TextPreprocessor

Advanced text preprocessing for improved accuracy.

#### Constructor

```python
TextPreprocessor()
```

#### Methods

##### process_text(raw_text)

Complete text processing pipeline.

**Parameters:**
- `raw_text` (str): Raw webpage text

**Returns:**
- `Dict[str, Any]`: Processed text and analysis

**Example:**
```python
preprocessor = TextPreprocessor()
result = preprocessor.process_text(raw_webpage_content)
print(f"Topic: {result['topic']}")
print(f"Cleaned length: {result['content_length']}")
```

## Output Schema

The vibe compression output follows this strict JSON schema:

```json
{
  "topic": "<≤4 words, e.g. 'science article', 'romantic novel'>",
  "mood": ["<3 adjectives, lowercase, no punctuation>"],
  "energy": "<float between 0.0 and 1.0>",
  "tempo": "<integer between 60 and 160>",
  "palette": ["<3 instruments, lowercase>"],
  "vocals": "<instrumental|ooh|light|lyrical>"
}
```

### Field Descriptions

- **topic**: Core subject matter in ≤4 words
- **mood**: Three descriptive adjectives (lowercase, no punctuation)
- **energy**: Energy level from calm/somber (0.2-0.4) to intense/energetic (0.7-1.0)
- **tempo**: BPM from slower/calm (60-90) to faster/energetic (120-160)
- **palette**: Three suitable instruments (lowercase)
- **vocals**: Vocal style, typically "instrumental" unless content is clearly lyrical

## Error Handling

The system includes comprehensive error handling:

### Input Validation Errors

- Empty or null input
- Input too short (< 10 characters)
- Invalid input type

### Processing Errors

- Text preprocessing failures (with fallback)
- Component extraction failures (with safe defaults)
- Validation failures (with warnings)

### Example Error Handling

```python
result = compressor.compress("")
if not result.success:
    print(f"Error: {result.error_message}")
    # Output: "Error: Invalid input: text must be a non-empty string"

result = compressor.compress("Hi")
if not result.success:
    print(f"Error: {result.error_message}")
    # Output: "Error: Input text too short (minimum 10 characters)"
```

## Performance Considerations

### Token Efficiency

- Target: ≤25 tokens per output
- Typical range: 3-5 tokens
- Compact JSON format (no spaces)

### Processing Speed

- Typical processing time: 0.001-0.1s (local processing)
- Cerebras API processing: 1-3s (includes network latency)
- Batch processing includes small delays to avoid rate limiting

## Cerebras Integration

### CerebrasVibeCompressor

Advanced AI-powered vibe compressor using the Cerebras Cloud SDK.

#### Constructor

```python
CerebrasVibeCompressor(api_key: Optional[str] = None, enable_logging: bool = True)
```

**Parameters:**
- `api_key`: Cerebras API key (if None, uses CEREBRAS_API_KEY env var)
- `enable_logging`: Whether to enable logging (default: True)

#### Methods

##### compress(text, validate_output=True)

Compress webpage text using Cerebras AI.

**Parameters:**
- `text` (str): Raw webpage text to compress
- `validate_output` (bool): Whether to validate the output (default: True)

**Returns:**
- `CerebrasCompressionResult`: Enhanced result object with AI metadata

**Example:**
```python
from cerebras_vibe_compressor import CerebrasVibeCompressor

# Initialize with API key
compressor = CerebrasVibeCompressor(api_key="your-api-key")

# Compress text using AI
result = compressor.compress("Science article about quantum computing")
if result.success:
    print(f"Topic: {result.data['topic']}")
    print(f"JSON: {result.json_output}")
    print(f"AI tokens used: {result.tokens_used}")
    print(f"Model response: {result.model_response}")
```

### CerebrasCompressionResult

Enhanced result object for Cerebras-powered compression.

#### Additional Attributes

- `model_response` (Optional[str]): Raw response from Cerebras model
- `tokens_used` (Optional[int]): Total tokens consumed by the API call

## Installation

### Basic Installation

```bash
pip install -r requirements.txt
```

### With Cerebras Support

```bash
pip install cerebras-cloud-sdk
```

### Environment Setup

```bash
export CEREBRAS_API_KEY="your-api-key-here"
```

## Usage Examples

### Basic Usage

```python
from enhanced_vibe_compressor import EnhancedVibeCompressor

compressor = EnhancedVibeCompressor()
result = compressor.compress("Your webpage text here")

if result.success:
    print(result.json_output)
else:
    print(f"Error: {result.error_message}")
```

### Cerebras AI Usage

```python
from cerebras_vibe_compressor import CerebrasVibeCompressor

compressor = CerebrasVibeCompressor(api_key="your-key")
result = compressor.compress("Your webpage text here")

if result.success:
    print(f"AI-generated vibe: {result.json_output}")
    print(f"Tokens used: {result.tokens_used}")
```

### Batch Processing

```python
texts = [
    "Science article about quantum computing",
    "Romance novel excerpt",
    "Business news about markets"
]

results = compressor.compress_batch(texts)
stats = compressor.get_stats(results)

print(f"Success rate: {stats['success_rate']:.1f}%")
print(f"Topic distribution: {stats['topic_distribution']}")
```

### Validation Only

```python
from schema_validator import VibeSchemaValidator

validator = VibeSchemaValidator()
result = validator.validate({
    "topic": "science article",
    "mood": ["serious", "analytical", "contemplative"],
    "energy": 0.5,
    "tempo": 110,
    "palette": ["piano", "strings", "synth"],
    "vocals": "instrumental"
})

print(f"Valid: {result.is_valid}")
if not result.is_valid:
    print(f"Errors: {result.errors}")
```

## Testing

### Run Unit Tests

```bash
python -m unittest test_unit.py -v
```

### Run Example Tests

```bash
python test_cases.py
```

### Test Cerebras Integration

```bash
export CEREBRAS_API_KEY="your-key"
python cerebras_vibe_compressor.py
```

## Best Practices

### Input Preprocessing

- Always preprocess noisy webpage content
- Remove advertisements, navigation, and boilerplate
- Extract main content for better accuracy

### Error Handling

- Always check `result.success` before accessing data
- Implement fallback strategies for API failures
- Log errors for debugging and monitoring

### Performance Optimization

- Use batch processing for multiple texts
- Implement caching for repeated content
- Monitor token usage for cost optimization

### Validation

- Always validate output in production
- Handle validation errors gracefully
- Monitor validation failure rates

## API Limits and Considerations

### Cerebras API

- Rate limiting: Implement delays between requests
- Token limits: Monitor usage to avoid overages
- Error handling: Implement retry logic for transient failures

### Local Processing

- Memory usage: Minimal for text preprocessing
- CPU usage: Low for rule-based compression
- Scalability: Suitable for high-volume processing

## Troubleshooting

### Common Issues

1. **Import Error**: Install required packages
   ```bash
   pip install cerebras-cloud-sdk
   ```

2. **API Key Error**: Set environment variable
   ```bash
   export CEREBRAS_API_KEY="your-key"
   ```

3. **Validation Failures**: Check output format
   ```python
   if not result.validation.is_valid:
       print(result.validation.errors)
   ```

4. **JSON Parsing Error**: Check model response format
   ```python
   if not result.success:
       print(result.model_response)
   ```

### Debug Mode

Enable detailed logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)

compressor = CerebrasVibeCompressor(enable_logging=True)
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
