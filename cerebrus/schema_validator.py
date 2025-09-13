"""
JSON Schema validation for Vibe Compressor output.

This module provides validation utilities to ensure the vibe compression
output conforms to the expected structure and constraints.
"""

import json
from typing import Dict, Any, List, Union
from dataclasses import dataclass


@dataclass
class ValidationResult:
    """Result of schema validation."""
    is_valid: bool
    errors: List[str]
    warnings: List[str]


class VibeSchemaValidator:
    """
    Validates vibe compression output against the expected schema.
    
    Ensures output meets all constraints for downstream processing.
    """
    
    # Valid values for categorical fields
    VALID_VOCALS = {'instrumental', 'ooh', 'light', 'lyrical'}
    
    # Common instrument names for validation
    VALID_INSTRUMENTS = {
        'piano', 'soft piano', 'acoustic guitar', 'electric guitar',
        'strings', 'soft strings', 'low strings', 'violin', 'cello',
        'synth', 'synth pad', 'subtle synth', 'electronic', 'arpeggiator',
        'orchestral', 'ambient', 'ambient pad', 'drums', 'light drums',
        'bass', 'light percussion', 'lo-fi kit'
    }
    
    def __init__(self):
        """Initialize the validator."""
        pass
    
    def validate_structure(self, data: Dict[str, Any]) -> List[str]:
        """
        Validate the basic structure of the vibe data.
        
        Args:
            data: Vibe compression output dictionary
            
        Returns:
            List of structural validation errors
        """
        errors = []
        
        # Check for Suno API format (new format)
        if 'topics' in data and 'tags' in data:
            required_fields = {'topics', 'tags'}
            # Check required fields
            missing_fields = required_fields - set(data.keys())
            if missing_fields:
                errors.append(f"Missing required fields: {', '.join(missing_fields)}")
            
            # Check extra fields
            extra_fields = set(data.keys()) - required_fields
            if extra_fields:
                errors.append(f"Unexpected fields: {', '.join(extra_fields)}")
        
        # Check for legacy format (old format)
        elif 'topic' in data or 'mood' in data:
            required_fields = {'topic', 'mood', 'energy', 'tempo', 'palette', 'vocals'}
            # Check required fields
            missing_fields = required_fields - set(data.keys())
            if missing_fields:
                errors.append(f"Missing required fields: {', '.join(missing_fields)}")
            
            # Check extra fields
            extra_fields = set(data.keys()) - required_fields
            if extra_fields:
                errors.append(f"Unexpected fields: {', '.join(extra_fields)}")
        
        else:
            errors.append("Invalid format: must contain either 'topics'+'tags' (Suno format) or 'topic'+'mood'+... (legacy format)")
        
        return errors
    
    def validate_topic(self, topic: Any) -> List[str]:
        """
        Validate the topic field.
        
        Args:
            topic: Topic value to validate
            
        Returns:
            List of topic validation errors
        """
        errors = []
        
        if not isinstance(topic, str):
            errors.append(f"Topic must be string, got {type(topic).__name__}")
            return errors
        
        if not topic.strip():
            errors.append("Topic cannot be empty")
        
        word_count = len(topic.split())
        if word_count > 4:
            errors.append(f"Topic must be ≤4 words, got {word_count} words")
        
        return errors
    
    def validate_mood(self, mood: Any) -> List[str]:
        """
        Validate the mood field.
        
        Args:
            mood: Mood value to validate
            
        Returns:
            List of mood validation errors
        """
        errors = []
        
        if not isinstance(mood, list):
            errors.append(f"Mood must be list, got {type(mood).__name__}")
            return errors
        
        if len(mood) != 3:
            errors.append(f"Mood must contain exactly 3 adjectives, got {len(mood)}")
        
        for i, adjective in enumerate(mood):
            if not isinstance(adjective, str):
                errors.append(f"Mood[{i}] must be string, got {type(adjective).__name__}")
            elif not adjective.strip():
                errors.append(f"Mood[{i}] cannot be empty")
            elif adjective != adjective.lower():
                errors.append(f"Mood[{i}] must be lowercase: '{adjective}'")
            elif any(char in adjective for char in '.,!?;:'):
                errors.append(f"Mood[{i}] should not contain punctuation: '{adjective}'")
        
        return errors
    
    def validate_energy(self, energy: Any) -> List[str]:
        """
        Validate the energy field.
        
        Args:
            energy: Energy value to validate
            
        Returns:
            List of energy validation errors
        """
        errors = []
        
        if not isinstance(energy, (int, float)):
            errors.append(f"Energy must be number, got {type(energy).__name__}")
            return errors
        
        if not (0.0 <= energy <= 1.0):
            errors.append(f"Energy must be between 0.0 and 1.0, got {energy}")
        
        return errors
    
    def validate_tempo(self, tempo: Any) -> List[str]:
        """
        Validate the tempo field.
        
        Args:
            tempo: Tempo value to validate
            
        Returns:
            List of tempo validation errors
        """
        errors = []
        
        if not isinstance(tempo, int):
            errors.append(f"Tempo must be integer, got {type(tempo).__name__}")
            return errors
        
        if not (60 <= tempo <= 160):
            errors.append(f"Tempo must be between 60 and 160 BPM, got {tempo}")
        
        return errors
    
    def validate_palette(self, palette: Any) -> List[str]:
        """
        Validate the palette field.
        
        Args:
            palette: Palette value to validate
            
        Returns:
            List of palette validation errors
        """
        errors = []
        
        if not isinstance(palette, list):
            errors.append(f"Palette must be list, got {type(palette).__name__}")
            return errors
        
        if len(palette) != 3:
            errors.append(f"Palette must contain exactly 3 instruments, got {len(palette)}")
        
        for i, instrument in enumerate(palette):
            if not isinstance(instrument, str):
                errors.append(f"Palette[{i}] must be string, got {type(instrument).__name__}")
            elif not instrument.strip():
                errors.append(f"Palette[{i}] cannot be empty")
            elif instrument != instrument.lower():
                errors.append(f"Palette[{i}] must be lowercase: '{instrument}'")
        
        return errors
    
    def validate_vocals(self, vocals: Any) -> List[str]:
        """
        Validate the vocals field.
        
        Args:
            vocals: Vocals value to validate
            
        Returns:
            List of vocals validation errors
        """
        errors = []
        
        if not isinstance(vocals, str):
            errors.append(f"Vocals must be string, got {type(vocals).__name__}")
            return errors
        
        if vocals not in self.VALID_VOCALS:
            errors.append(f"Vocals must be one of {self.VALID_VOCALS}, got '{vocals}'")
        
        return errors
    
    def validate_token_count(self, data: Dict[str, Any]) -> List[str]:
        """
        Validate that the output is concise enough (≤25 tokens).
        
        Args:
            data: Vibe compression output dictionary
            
        Returns:
            List of token count warnings
        """
        warnings = []
        
        # Convert to compact JSON and estimate tokens
        json_str = json.dumps(data, separators=(',', ':'))
        estimated_tokens = len(json_str.split())
        
        if estimated_tokens > 25:
            warnings.append(f"Output may exceed 25 token limit (estimated: {estimated_tokens})")
        
        return warnings
    
    def validate(self, data: Union[Dict[str, Any], str]) -> ValidationResult:
        """
        Perform complete validation of vibe compression output.
        
        Args:
            data: Vibe data as dictionary or JSON string
            
        Returns:
            ValidationResult with errors and warnings
        """
        errors = []
        warnings = []
        
        # Parse JSON if string provided
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except json.JSONDecodeError as e:
                return ValidationResult(False, [f"Invalid JSON: {e}"], [])
        
        if not isinstance(data, dict):
            return ValidationResult(False, ["Data must be dictionary or JSON string"], [])
        
        # Structural validation
        errors.extend(self.validate_structure(data))
        
        # Field-specific validation
        if 'topic' in data:
            errors.extend(self.validate_topic(data['topic']))
        
        if 'mood' in data:
            errors.extend(self.validate_mood(data['mood']))
        
        if 'energy' in data:
            errors.extend(self.validate_energy(data['energy']))
        
        if 'tempo' in data:
            errors.extend(self.validate_tempo(data['tempo']))
        
        if 'palette' in data:
            errors.extend(self.validate_palette(data['palette']))
        
        if 'vocals' in data:
            errors.extend(self.validate_vocals(data['vocals']))
        
        # Token count validation
        if not errors:  # Only check if structure is valid
            warnings.extend(self.validate_token_count(data))
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )


# Example usage and testing
if __name__ == "__main__":
    validator = VibeSchemaValidator()
    
    # Test valid data
    valid_data = {
        "topic": "science article",
        "mood": ["serious", "futuristic", "contemplative"],
        "energy": 0.35,
        "tempo": 82,
        "palette": ["synth pad", "soft piano", "arpeggiator"],
        "vocals": "instrumental"
    }
    
    result = validator.validate(valid_data)
    print("Valid data validation:")
    print(f"Is valid: {result.is_valid}")
    print(f"Errors: {result.errors}")
    print(f"Warnings: {result.warnings}")
    
    # Test invalid data
    invalid_data = {
        "topic": "this is way too many words for a topic",
        "mood": ["Serious", "futuristic"],  # Wrong case, wrong count
        "energy": 1.5,  # Out of range
        "tempo": 200,  # Out of range
        "palette": ["piano"],  # Wrong count
        "vocals": "invalid_vocal_type"
    }
    
    result = validator.validate(invalid_data)
    print("\nInvalid data validation:")
    print(f"Is valid: {result.is_valid}")
    print(f"Errors: {result.errors}")
    print(f"Warnings: {result.warnings}")