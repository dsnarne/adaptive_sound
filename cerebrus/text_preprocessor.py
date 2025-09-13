"""
Advanced text preprocessing utilities for the Vibe Compressor.

This module provides enhanced text cleaning and analysis capabilities
to improve the accuracy of vibe extraction from webpage content.
"""

import re
from typing import Dict, List, Tuple, Optional
from collections import Counter


class TextPreprocessor:
    """
    Advanced text preprocessing for vibe compression.
    
    Handles noise removal, content extraction, and semantic analysis.
    """
    
    # Enhanced keyword mappings for better topic detection
    TOPIC_KEYWORDS = {
        'science': [
            'research', 'study', 'experiment', 'discovery', 'scientific',
            'quantum', 'physics', 'chemistry', 'biology', 'astronomy',
            'laboratory', 'hypothesis', 'theory', 'analysis', 'data',
            'findings', 'methodology', 'peer-reviewed', 'journal'
        ],
        'technology': [
            'technology', 'tech', 'software', 'hardware', 'digital',
            'artificial intelligence', 'ai', 'machine learning', 'algorithm',
            'computer', 'programming', 'code', 'app', 'platform',
            'innovation', 'startup', 'silicon valley', 'cybersecurity'
        ],
        'business': [
            'business', 'market', 'economy', 'finance', 'investment',
            'stock', 'revenue', 'profit', 'company', 'corporate',
            'industry', 'trade', 'commerce', 'entrepreneur', 'startup',
            'merger', 'acquisition', 'ipo', 'earnings', 'quarterly'
        ],
        'health': [
            'health', 'medical', 'medicine', 'doctor', 'patient',
            'treatment', 'therapy', 'wellness', 'fitness', 'nutrition',
            'disease', 'symptoms', 'diagnosis', 'hospital', 'clinic',
            'pharmaceutical', 'vaccine', 'mental health', 'exercise'
        ],
        'travel': [
            'travel', 'trip', 'journey', 'destination', 'vacation',
            'tourism', 'hotel', 'flight', 'airport', 'adventure',
            'explore', 'culture', 'sightseeing', 'backpacking',
            'cruise', 'resort', 'guide', 'itinerary', 'passport'
        ],
        'food': [
            'recipe', 'cooking', 'food', 'kitchen', 'chef', 'restaurant',
            'cuisine', 'ingredients', 'flavor', 'taste', 'meal',
            'dish', 'culinary', 'baking', 'dining', 'nutrition',
            'organic', 'fresh', 'delicious', 'gourmet'
        ],
        'romance': [
            'love', 'romance', 'relationship', 'heart', 'romantic',
            'dating', 'couple', 'marriage', 'wedding', 'valentine',
            'passion', 'intimate', 'affection', 'beloved', 'soulmate',
            'kiss', 'embrace', 'tender', 'devotion', 'commitment'
        ],
        'entertainment': [
            'movie', 'film', 'music', 'concert', 'album', 'artist',
            'celebrity', 'entertainment', 'show', 'performance',
            'theater', 'drama', 'comedy', 'actor', 'actress',
            'director', 'producer', 'streaming', 'netflix', 'spotify'
        ],
        'sports': [
            'sports', 'game', 'team', 'player', 'athlete', 'competition',
            'championship', 'tournament', 'league', 'season',
            'football', 'basketball', 'baseball', 'soccer', 'tennis',
            'olympics', 'coach', 'training', 'fitness', 'workout'
        ],
        'news': [
            'news', 'breaking', 'report', 'journalist', 'media',
            'press', 'headline', 'story', 'coverage', 'investigation',
            'politics', 'government', 'election', 'policy', 'law',
            'court', 'legal', 'crisis', 'emergency', 'update'
        ]
    }
    
    # Mood indicators for better sentiment analysis
    MOOD_INDICATORS = {
        'positive': [
            'amazing', 'wonderful', 'excellent', 'fantastic', 'great',
            'beautiful', 'inspiring', 'uplifting', 'joyful', 'happy',
            'exciting', 'thrilling', 'delightful', 'magnificent', 'brilliant'
        ],
        'negative': [
            'terrible', 'awful', 'horrible', 'disappointing', 'sad',
            'tragic', 'devastating', 'alarming', 'concerning', 'worrying',
            'dangerous', 'threatening', 'crisis', 'problem', 'issue'
        ],
        'serious': [
            'important', 'critical', 'significant', 'major', 'serious',
            'urgent', 'essential', 'crucial', 'vital', 'fundamental',
            'substantial', 'considerable', 'notable', 'remarkable'
        ],
        'calm': [
            'peaceful', 'calm', 'serene', 'tranquil', 'quiet',
            'gentle', 'soft', 'soothing', 'relaxing', 'meditative',
            'mindful', 'zen', 'balanced', 'harmonious', 'still'
        ],
        'energetic': [
            'fast', 'quick', 'rapid', 'dynamic', 'active', 'vibrant',
            'lively', 'energetic', 'powerful', 'intense', 'strong',
            'bold', 'aggressive', 'fierce', 'passionate', 'vigorous'
        ]
    }
    
    def __init__(self):
        """Initialize the text preprocessor."""
        pass
    
    def remove_noise(self, text: str) -> str:
        """
        Remove noise from webpage text more effectively.
        
        Args:
            text: Raw webpage content
            
        Returns:
            Cleaned text with noise removed
        """
        # Remove HTML tags and entities
        text = re.sub(r'<[^>]+>', ' ', text)
        text = re.sub(r'&[a-zA-Z0-9#]+;', ' ', text)
        
        # Remove common webpage noise patterns
        noise_patterns = [
            r'(advertisement|ad|sponsored|promo)\b.*?(?=\n|\.|$)',
            r'(navigation|nav|menu|sidebar|footer|header)\b.*?(?=\n|\.|$)',
            r'(subscribe|newsletter|follow us|social media)\b.*?(?=\n|\.|$)',
            r'(copyright|privacy policy|terms of service|cookies)\b.*?(?=\n|\.|$)',
            r'(related articles|popular posts|trending|most read)\b.*?(?=\n|\.|$)',
            r'\b(home|about|contact|shop|cart|login|register)\b',
            r'(click here|read more|learn more|see more)\b.*?(?=\n|\.|$)',
            r'\$\d+\.?\d*\s*(off|discount|save)',  # Price/discount text
            r'\d+%\s*(off|discount|save)',
            r'(buy now|order now|shop now|get yours)',
        ]
        
        for pattern in noise_patterns:
            text = re.sub(pattern, ' ', text, flags=re.IGNORECASE)
        
        # Clean up whitespace and formatting
        text = re.sub(r'\s+', ' ', text)  # Multiple spaces to single
        text = re.sub(r'\n+', ' ', text)  # Multiple newlines to space
        text = text.strip()
        
        return text
    
    def extract_main_content(self, text: str, max_length: int = 800) -> str:
        """
        Extract the main content from cleaned text.
        
        Args:
            text: Cleaned text
            max_length: Maximum length to extract
            
        Returns:
            Main content text
        """
        # Split into sentences
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
        
        # Build content up to max_length
        content = ""
        for sentence in sentences:
            if len(content + sentence) > max_length:
                break
            content += sentence + ". "
        
        return content.strip()
    
    def analyze_keywords(self, text: str) -> Dict[str, float]:
        """
        Analyze keyword density for topic classification.
        
        Args:
            text: Text to analyze
            
        Returns:
            Dictionary of topic scores
        """
        text_lower = text.lower()
        topic_scores = {}
        
        for topic, keywords in self.TOPIC_KEYWORDS.items():
            score = 0
            for keyword in keywords:
                # Count occurrences, with bonus for exact matches
                count = text_lower.count(keyword.lower())
                if count > 0:
                    # Weight longer keywords more heavily
                    weight = len(keyword.split()) * 1.5
                    score += count * weight
            
            # Normalize by text length
            topic_scores[topic] = score / max(len(text_lower), 100)
        
        return topic_scores
    
    def analyze_sentiment(self, text: str) -> Dict[str, float]:
        """
        Analyze sentiment and mood indicators.
        
        Args:
            text: Text to analyze
            
        Returns:
            Dictionary of mood scores
        """
        text_lower = text.lower()
        mood_scores = {}
        
        for mood, indicators in self.MOOD_INDICATORS.items():
            score = 0
            for indicator in indicators:
                count = text_lower.count(indicator.lower())
                score += count
            
            # Normalize by text length
            mood_scores[mood] = score / max(len(text_lower), 100)
        
        return mood_scores
    
    def extract_topic_enhanced(self, text: str) -> str:
        """
        Enhanced topic extraction using keyword analysis.
        
        Args:
            text: Text to analyze
            
        Returns:
            Best matching topic
        """
        keyword_scores = self.analyze_keywords(text)
        
        # Find the topic with highest score
        if keyword_scores:
            best_topic = max(keyword_scores.items(), key=lambda x: x[1])
            
            # Only use if score is above threshold
            if best_topic[1] > 0.001:  # Minimum threshold
                topic_name = best_topic[0]
                
                # Map to output format
                topic_mapping = {
                    'science': 'science article',
                    'technology': 'tech article',
                    'business': 'business news',
                    'health': 'health article',
                    'travel': 'travel guide',
                    'food': 'food content',
                    'romance': 'romantic story',
                    'entertainment': 'entertainment news',
                    'sports': 'sports article',
                    'news': 'news article'
                }
                
                return topic_mapping.get(topic_name, 'general article')
        
        return 'general article'
    
    def determine_mood_enhanced(self, text: str, topic: str) -> List[str]:
        """
        Enhanced mood determination using sentiment analysis.
        
        Args:
            text: Text to analyze
            topic: Detected topic
            
        Returns:
            List of three mood adjectives
        """
        sentiment_scores = self.analyze_sentiment(text)
        
        # Base mood from topic
        topic_moods = {
            'science article': ['serious', 'analytical', 'contemplative'],
            'tech article': ['modern', 'innovative', 'precise'],
            'business news': ['professional', 'focused', 'informative'],
            'health article': ['calm', 'reassuring', 'informative'],
            'travel guide': ['adventurous', 'inspiring', 'wandering'],
            'food content': ['warm', 'comforting', 'inviting'],
            'romantic story': ['warm', 'tender', 'intimate'],
            'entertainment news': ['light', 'engaging', 'entertaining'],
            'sports article': ['energetic', 'competitive', 'dynamic'],
            'news article': ['serious', 'informative', 'current']
        }
        
        base_mood = topic_moods.get(topic, ['neutral', 'balanced', 'general'])
        
        # Adjust based on sentiment
        if sentiment_scores.get('positive', 0) > sentiment_scores.get('negative', 0):
            if sentiment_scores['positive'] > 0.01:
                base_mood[0] = 'upbeat'
        elif sentiment_scores.get('negative', 0) > 0.01:
            base_mood[0] = 'serious'
        
        if sentiment_scores.get('energetic', 0) > 0.005:
            base_mood[2] = 'energetic'
        elif sentiment_scores.get('calm', 0) > 0.005:
            base_mood[2] = 'calm'
        
        return base_mood
    
    def calculate_energy_enhanced(self, text: str, mood: List[str]) -> float:
        """
        Enhanced energy calculation using multiple factors.
        
        Args:
            text: Text to analyze
            mood: Determined mood
            
        Returns:
            Energy level (0.0-1.0)
        """
        sentiment_scores = self.analyze_sentiment(text)
        
        # Base energy from mood
        mood_energy = {
            'energetic': 0.8, 'dynamic': 0.8, 'exciting': 0.8,
            'upbeat': 0.7, 'lively': 0.7, 'vibrant': 0.7,
            'serious': 0.5, 'focused': 0.5, 'professional': 0.5,
            'calm': 0.3, 'peaceful': 0.3, 'gentle': 0.3,
            'contemplative': 0.4, 'thoughtful': 0.4, 'analytical': 0.4
        }
        
        base_energy = 0.5
        for mood_word in mood:
            if mood_word in mood_energy:
                base_energy = mood_energy[mood_word]
                break
        
        # Adjust based on sentiment analysis
        energy_adjustment = 0
        energy_adjustment += sentiment_scores.get('energetic', 0) * 30
        energy_adjustment += sentiment_scores.get('positive', 0) * 20
        energy_adjustment -= sentiment_scores.get('calm', 0) * 20
        energy_adjustment -= sentiment_scores.get('negative', 0) * 10
        
        final_energy = base_energy + energy_adjustment
        return max(0.2, min(1.0, round(final_energy, 2)))
    
    def process_text(self, raw_text: str) -> Dict[str, any]:
        """
        Complete text processing pipeline.
        
        Args:
            raw_text: Raw webpage text
            
        Returns:
            Dictionary with processed text and analysis
        """
        # Step 1: Remove noise
        cleaned_text = self.remove_noise(raw_text)
        
        # Step 2: Extract main content
        main_content = self.extract_main_content(cleaned_text)
        
        # Step 3: Analyze content
        topic = self.extract_topic_enhanced(main_content)
        mood = self.determine_mood_enhanced(main_content, topic)
        energy = self.calculate_energy_enhanced(main_content, mood)
        
        # Step 4: Additional analysis
        keyword_scores = self.analyze_keywords(main_content)
        sentiment_scores = self.analyze_sentiment(main_content)
        
        return {
            'cleaned_text': cleaned_text,
            'main_content': main_content,
            'topic': topic,
            'mood': mood,
            'energy': energy,
            'keyword_scores': keyword_scores,
            'sentiment_scores': sentiment_scores,
            'content_length': len(main_content),
            'word_count': len(main_content.split())
        }


# Example usage and testing
if __name__ == "__main__":
    preprocessor = TextPreprocessor()
    
    # Test with noisy webpage content
    noisy_text = """
    ADVERTISEMENT: Buy now and save 50%! Limited time offer!
    Navigation: Home | About | Contact | Shop | Cart (0)
    
    The latest breakthrough in quantum computing research has scientists excited about 
    the future of computational power. Researchers at MIT have developed a new quantum 
    processor that can maintain coherence for unprecedented durations. This advancement 
    could revolutionize cryptography, drug discovery, and artificial intelligence.
    
    SIDEBAR: Related Articles
    - Quantum Computing Basics
    - Future of AI
    - Tech Investment Tips
    
    Subscribe to our newsletter for more tech news!
    FOOTER: Copyright 2024 | Privacy Policy | Terms of Service
    """
    
    result = preprocessor.process_text(noisy_text)
    
    print("Text Processing Results:")
    print(f"Original length: {len(noisy_text)}")
    print(f"Cleaned length: {result['content_length']}")
    print(f"Word count: {result['word_count']}")
    print(f"\nDetected topic: {result['topic']}")
    print(f"Mood: {result['mood']}")
    print(f"Energy: {result['energy']}")
    print(f"\nKeyword scores: {result['keyword_scores']}")
    print(f"Sentiment scores: {result['sentiment_scores']}")
    print(f"\nMain content: {result['main_content'][:200]}...")