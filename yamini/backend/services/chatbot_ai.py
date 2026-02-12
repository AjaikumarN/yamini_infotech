"""
Chatbot AI Services - Mistral LLM, FAISS Vector Search, Language Detection
Production-ready implementation for Yamini Infotech ERP
"""

import os
import json
import re
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import numpy as np
from langdetect import detect, LangDetectException

# Mistral AI SDK
try:
    from mistralai import Mistral
    from mistralai.models.chat_completion import ChatMessage
    MISTRAL_AVAILABLE = True
except ImportError:
    try:
        # Fallback for older versions
        from mistralai.client import MistralClient
        from mistralai.models.chat_completion import ChatMessage
        MISTRAL_AVAILABLE = True
    except ImportError:
        MISTRAL_AVAILABLE = False
        print("[WARNING] Mistral AI SDK not installed. Run: pip install mistralai")

# FAISS for vector search
try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False
    print("[WARNING] FAISS not installed. Run: pip install faiss-cpu")

# Sentence transformers for embeddings
try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMER_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMER_AVAILABLE = False
    print("⚠️  Sentence Transformers not installed. Run: pip install sentence-transformers")


class LanguageDetector:
    """Detect language (English/Tamil) with fallback"""
    
    @staticmethod
    def detect_language(text: str) -> str:
        """
        Detect if text is English or Tamil
        Returns: 'en' or 'ta'
        """
        try:
            # Quick Tamil script detection (Tamil Unicode range: 0x0B80-0x0BFF)
            tamil_chars = sum(1 for c in text if '\u0B80' <= c <= '\u0BFF')
            if tamil_chars > len(text) * 0.3:  # 30%+ Tamil characters
                return 'ta'
            
            # Use langdetect for English/Tamil
            detected = detect(text)
            return 'ta' if detected in ['ta', 'ml', 'te'] else 'en'
        except LangDetectException:
            # Default to English if detection fails
            return 'en'
    
    @staticmethod
    def is_tamil(text: str) -> bool:
        """Check if text contains significant Tamil script"""
        tamil_chars = sum(1 for c in text if '\u0B80' <= c <= '\u0BFF')
        return tamil_chars > len(text) * 0.2


class EmbeddingService:
    """Generate embeddings for text using Sentence Transformers"""
    
    def __init__(self, model_name: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"):
        """
        Initialize embedding model
        Using multilingual model for English + Tamil support
        """
        if not SENTENCE_TRANSFORMER_AVAILABLE:
            raise ImportError("sentence-transformers not installed")
        
        try:
            # Initialize with device='cpu' to avoid meta tensor issues
            import torch
            self.model = SentenceTransformer(model_name, device='cpu')
            self.dimension = 384  # MiniLM embedding dimension
        except Exception as e:
            print(f"⚠️  Warning: Could not load embedding model: {e}")
            print("   Chatbot will work with reduced functionality")
            self.model = None
            self.dimension = 384
    
    def encode(self, text: str) -> np.ndarray:
        """Generate embedding vector for text"""
        if self.model is None:
            # Return zero vector if model failed to load
            return np.zeros(self.dimension)
        try:
            return self.model.encode(text, convert_to_numpy=True)
        except Exception as e:
            print(f"⚠️  Encoding failed: {e}")
            return np.zeros(self.dimension)
    
    def encode_batch(self, texts: List[str]) -> np.ndarray:
        """Generate embeddings for multiple texts"""
        if self.model is None:
            # Return zero vectors if model failed to load
            return np.zeros((len(texts), self.dimension))
        return self.model.encode(texts, convert_to_numpy=True)


class FAISSVectorStore:
    """FAISS-based vector search for knowledge retrieval"""
    
    def __init__(self, dimension: int = 384):
        self.dimension = dimension
        self.index_en = faiss.IndexFlatL2(dimension)  # English index
        self.index_ta = faiss.IndexFlatL2(dimension)  # Tamil index
        self.documents_en: List[Dict] = []
        self.documents_ta: List[Dict] = []
        self.embedding_service = EmbeddingService()
    
    def add_document(self, doc_id: int, title: str, content: str, language: str, 
                     category: str, metadata: Dict = None):
        """Add document to vector store"""
        embedding = self.embedding_service.encode(content)
        
        doc_data = {
            'id': doc_id,
            'title': title,
            'content': content,
            'category': category,
            'metadata': metadata or {}
        }
        
        if language == 'en':
            self.index_en.add(np.array([embedding]))
            self.documents_en.append(doc_data)
        else:
            self.index_ta.add(np.array([embedding]))
            self.documents_ta.append(doc_data)
    
    def search(self, query: str, language: str, top_k: int = 5) -> List[Dict]:
        """Search for most relevant documents"""
        query_embedding = self.embedding_service.encode(query)
        
        # Select appropriate index
        index = self.index_en if language == 'en' else self.index_ta
        documents = self.documents_en if language == 'en' else self.documents_ta
        
        if index.ntotal == 0:
            return []
        
        # Search
        distances, indices = index.search(np.array([query_embedding]), min(top_k, index.ntotal))
        
        results = []
        for idx, distance in zip(indices[0], distances[0]):
            if idx < len(documents):
                doc = documents[idx].copy()
                doc['relevance_score'] = float(1 / (1 + distance))  # Convert distance to similarity
                results.append(doc)
        
        return results
    
    def rebuild_index(self, documents: List[Dict]):
        """Rebuild FAISS index from database documents"""
        # Clear existing indices
        self.index_en = faiss.IndexFlatL2(self.dimension)
        self.index_ta = faiss.IndexFlatL2(self.dimension)
        self.documents_en = []
        self.documents_ta = []
        
        # Add all documents
        for doc in documents:
            if doc.get('is_active', True):
                self.add_document(
                    doc_id=doc['id'],
                    title=doc['title'],
                    content=doc.get('content_en') or doc['content'],
                    language='en',
                    category=doc['category'],
                    metadata={'keywords': doc.get('keywords')}
                )
                
                if doc.get('content_ta'):
                    self.add_document(
                        doc_id=doc['id'],
                        title=doc['title'],
                        content=doc['content_ta'],
                        language='ta',
                        category=doc['category'],
                        metadata={'keywords': doc.get('keywords')}
                    )


class MistralService:
    """Mistral LLM integration for chat responses"""
    
    def __init__(self):
        self.api_key = os.getenv("MISTRAL_API_KEY")
        self.client = None
        self.model = "mistral-small-latest"
        
        if not self.api_key:
            print("⚠️  MISTRAL_API_KEY not set - using fallback responses")
            return
        
        if not MISTRAL_AVAILABLE:
            print("⚠️  Mistral AI package not available - using fallback responses")
            return
        
        try:
            self.client = MistralClient(api_key=self.api_key)
        except Exception as e:
            print(f"⚠️  Could not initialize Mistral client: {e}")
            self.client = None
    
    def generate_response(self, user_message: str, context_docs: List[Dict], 
                         language: str, conversation_history: List[Dict] = None) -> Tuple[str, float]:
        """
        Generate chatbot response using Mistral
        Returns: (response_text, confidence_score)
        """
        
        # Fallback if Mistral not available
        if not self.client:
            return self._generate_fallback_response(user_message, language, context_docs)
        
        try:
            # Build system prompt
            system_prompt = self._build_system_prompt(language)
            
            # Build context from retrieved documents
            context = self._build_context(context_docs, language)
            
            # Build conversation history
            messages = [
                ChatMessage(role="system", content=system_prompt)
            ]
            
            # Add conversation history if exists
            if conversation_history:
                for msg in conversation_history[-5:]:  # Last 5 messages
                    messages.append(ChatMessage(
                        role=msg['role'],
                        content=msg['content']
                    ))
            
            # Add current user message with context
            user_prompt = f"""COMPANY KNOWLEDGE:
{context}

CUSTOMER QUESTION:
{user_message}

Respond in {'Tamil' if language == 'ta' else 'English'} only."""
            
            messages.append(ChatMessage(role="user", content=user_prompt))
            
            # Call Mistral API
            response = self.client.chat(
                model=self.model,
                messages=messages,
                temperature=0.3,  # Low temperature for consistent, factual responses
                max_tokens=300
            )
            
            reply = response.choices[0].message.content
            
            # Calculate confidence based on context relevance
            confidence = self._calculate_confidence(context_docs, user_message)
            
            return reply, confidence
            
        except Exception as e:
            print(f"Mistral API error: {e}")
            return self._generate_fallback_response(user_message, language, context_docs)
    
    def _build_system_prompt(self, language: str) -> str:
        """Build system prompt for Mistral"""
        if language == 'ta':
            return """நீங்கள் Yamini Infotech நிறுவனத்தின் வாடிக்கையாளர் ஆதரவு உதவியாளர்.

விதிகள்:
- கொடுக்கப்பட்ட நிறுவன தகவலை மட்டும் பயன்படுத்தவும்
- தகவல் தெரியாவிட்டால், reception-உடன் இணைப்பேன் என்று கூறவும்
- எளிமையான, மரியாதையான மொழியில் பதிலளிக்கவும்
- குறுகிய, நடைமுறை பதில்களை தரவும்
- AI என்று குறிப்பிட வேண்டாம்

கேள்வி பற்றி:
- விலை → செயல்முறையை விளக்கவும், போலி விலை சொல்ல வேண்டாம்
- சேவை → படிகளை விளக்கி request உருவாக்கவும்
- புகார் → machine விவரங்களை கேட்கவும்
- தெளிவற்றது → reception-க்கு escalate செய்யவும்"""
        else:
            return """You are Yamini Infotech's customer support assistant.

RULES:
- Answer ONLY using the provided company data
- Do NOT invent information or make up prices
- If unsure, say you will connect to reception team
- Speak like a professional office assistant, not AI
- Use simple, polite business language
- Keep replies short and practical (max 3-4 sentences)
- NEVER say "I'm an AI" or "I'm a chatbot"

If the question is about:
- price → explain process, never give fake prices
- service → explain steps and offer to create service request
- complaint → ask for machine details politely
- unclear/complex → escalate to receptionist

END EVERY RESPONSE WITH:
- Clear next step OR
- "I'll connect you to our reception team for detailed help."
"""
    
    def _build_context(self, docs: List[Dict], language: str) -> str:
        """Build context string from retrieved documents"""
        if not docs:
            return "No specific information available."
        
        context_parts = []
        for i, doc in enumerate(docs[:5], 1):
            context_parts.append(f"{i}. {doc['title']}\n{doc['content']}")
        
        return "\n\n".join(context_parts)
    
    def _calculate_confidence(self, docs: List[Dict], query: str) -> float:
        """
        Calculate confidence score based on:
        - Number of relevant docs found
        - Relevance scores
        """
        if not docs:
            return 0.0
        
        # Average relevance score
        avg_relevance = sum(doc.get('relevance_score', 0) for doc in docs) / len(docs)
        
        # More docs = higher confidence (up to 5 docs)
        doc_factor = min(len(docs) / 5.0, 1.0)
        
        # Combine factors
        confidence = (avg_relevance * 0.7) + (doc_factor * 0.3)
        
        return min(confidence, 1.0)
    
    def _generate_fallback_response(self, user_message: str, language: str, context_docs: List[Dict]) -> Tuple[str, float]:
        """Simple rule-based responses when Mistral unavailable"""
        message_lower = user_message.lower()
        
        # Greeting patterns
        if any(word in message_lower for word in ['hi', 'hello', 'hey', 'vanakam', 'வணக்கம்']):
            if language == 'ta':
                return ("வணக்கம்! நான் Yamini Infotech-ன் virtual assistant. நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?", 0.8)
            else:
                return ("Hello! I'm Yamini Infotech's virtual assistant. How can I help you today?", 0.8)
        
        # Product inquiry
        if any(word in message_lower for word in ['product', 'products', 'item', 'sell']):
            if language == 'ta':
                return ("எங்களிடம் YAMINI மற்றும் YUVRAJ brand தயாரிப்புகள் உள்ளன. Products பார்க்க, எங்கள் website-ஐ பார்க்கவும் அல்லது விவரங்களுக்கு எங்கள் sales team-ஐ தொடர்பு கொள்ளவும்.", 0.7)
            else:
                return ("We offer YAMINI and YUVRAJ brand products. Please view our product catalog or contact our sales team for details.", 0.7)
        
        # Service/Repair
        if any(word in message_lower for word in ['service', 'repair', 'fix', 'maintenance', 'சரிசெய்']):
            if language == 'ta':
                return ("எங்களிடம் விரிவான service மற்றும் maintenance திட்டங்கள் உள்ளன. Service booking-க்கு, உங்கள் தொடர்பு விவரங்களை பகிரவும், நாங்கள் உங்களை தொடர்பு கொள்வோம்.", 0.75)
            else:
                return ("We provide comprehensive service and maintenance. To book a service, please share your contact details and we'll get back to you.", 0.75)
        
        # Pricing
        if any(word in message_lower for word in ['price', 'cost', 'how much', 'விலை', 'எவ்வளவு']):
            if language == 'ta':
                return ("விலை விவரங்களுக்கு, தயவுசெய்து உங்கள் தொடர்பு விவரங்களை பகிரவும். எங்கள் sales team உங்களுக்கு சரியான விலை மற்றும் சலுகைகளை வழங்கும்.", 0.7)
            else:
                return ("For pricing details, please share your contact information. Our sales team will provide you with accurate prices and offers.", 0.7)
        
        # Default fallback
        if language == 'ta':
            return ("மன்னிக்கவும், உங்கள் கேள்வியை நான் புரிந்து கொள்ளவில்லை. எங்கள் reception team உங்களுக்கு சிறப்பாக உதவ முடியும். நான் உங்களை அவர்களுடன் இணைக்கட்டுமா?", 0.5)
        else:
            return ("I'm not sure I understood your question correctly. Our reception team can help you better. Would you like me to connect you with them?", 0.5)
    
    def _get_fallback_response(self, language: str) -> str:
        """Fallback response when API fails"""
        if language == 'ta':
            return "மன்னிக்கவும், தற்போது சில தொழில்நுட்ப சிக்கல்கள் உள்ளன. தயவுசெய்து சிறிது நேரம் கழித்து முயற்சிக்கவும் அல்லது நேரடியாக எங்கள் reception-ஐ தொடர்பு கொள்ளவும்."
        else:
            return "I apologize, but I'm experiencing technical difficulties. Please try again in a moment, or I can connect you with our reception team."


class IntentDetector:
    """Detect user intent from message"""
    
    # Intent patterns (English + Tamil)
    INTENT_PATTERNS = {
        'enquiry': [
            r'\b(price|cost|how much|quote|estimate|buy|purchase|interested)\b',
            r'\b(விலை|எவ்வளவு|வாங்க|purchase)\b'
        ],
        'service': [
            r'\b(service|repair|fix|maintenance|amc|broken|not working)\b',
            r'\b(service|சரிசெய்|பழுது|maintenance)\b'
        ],
        'complaint': [
            r'\b(complaint|problem|issue|faulty|defect|not satisfied)\b',
            r'\b(complaint|பிரச்சனை|சரியாக இல்லை)\b'
        ],
        'amc': [
            r'\b(amc|annual maintenance|contract|warranty|guarantee)\b',
            r'\b(amc|warranty|வருட பராமரிப்பு)\b'
        ],
        'talk_to_human': [
            r'\b(talk to (human|person|agent|reception)|speak to someone|call me)\b',
            r'\b(யாராவது பேச|reception|அழைக்க)\b'
        ]
    }
    
    @staticmethod
    def detect_intent(message: str) -> Optional[str]:
        """Detect primary intent from user message"""
        message_lower = message.lower()
        
        for intent, patterns in IntentDetector.INTENT_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, message_lower, re.IGNORECASE):
                    return intent
        
        return 'general'
    
    @staticmethod
    def should_handoff(message: str, confidence: float) -> Tuple[bool, str]:
        """
        Determine if conversation should be handed off to human
        Returns: (should_handoff, reason)
        """
        # Explicit request
        if IntentDetector.detect_intent(message) == 'talk_to_human':
            return True, 'customer_request'
        
        # Low confidence
        if confidence < 0.5:
            return True, 'low_confidence'
        
        return False, ''


# Singleton instances
_vector_store = None
_mistral_service = None
_language_detector = LanguageDetector()
_intent_detector = IntentDetector()


def get_vector_store() -> FAISSVectorStore:
    """Get or create vector store instance"""
    global _vector_store
    if _vector_store is None:
        _vector_store = FAISSVectorStore()
    return _vector_store


def get_mistral_service() -> MistralService:
    """Get or create Mistral service instance"""
    global _mistral_service
    if _mistral_service is None:
        _mistral_service = MistralService()
    return _mistral_service


def get_language_detector() -> LanguageDetector:
    """Get language detector"""
    return _language_detector


def get_intent_detector() -> IntentDetector:
    """Get intent detector"""
    return _intent_detector
