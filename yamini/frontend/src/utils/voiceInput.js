/**
 * Voice-to-Text Utility (Tamil + English Mixed Mode)
 * Uses Web Speech API for browser-based speech recognition
 * Primary language: Tamil (ta-IN), preserves English words (names, products)
 * 
 * Enhanced Features:
 * - Auto-detects Tamil + English code-mixing
 * - Preserves English words (customer names, product names, technical terms)
 * - Capitalizes proper nouns automatically
 */

export class VoiceInput {
  constructor(onResult, onError, onStatusChange, options = {}) {
    this.onResult = onResult;
    this.onError = onError;
    this.onStatusChange = onStatusChange;
    this.recognition = null;
    this.isListening = false;
    this.options = {
      preserveEnglish: true,
      capitalizeNames: true,
      multipleAlternatives: 3, // Get multiple recognition alternatives
      ...options
    };
    
    // Check browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this browser');
      this.supported = false;
      return;
    }
    
    this.supported = true;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    // Configure recognition for Tamil-English code-mixing
    this.recognition.lang = 'ta-IN'; // Primary: Tamil (India)
    this.recognition.continuous = false; // Single recognition session
    this.recognition.interimResults = true; // Show interim results for better UX
    this.recognition.maxAlternatives = this.options.multipleAlternatives;
    
    // Event handlers
    this.recognition.onstart = () => {
      this.isListening = true;
      this.onStatusChange?.('listening', 'Listening… (Tamil + English)');
    };
    
    this.recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const isFinal = result.isFinal;
      
      if (isFinal) {
        // Get best transcript and process it
        const transcript = this.processTranscript(result[0].transcript);
        this.onResult?.(transcript);
        this.onStatusChange?.('success', 'Converted to text – please review');
      }
    };
    
    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      let message = 'Could not hear clearly, try again';
      
      switch (event.error) {
        case 'no-speech':
          message = 'No speech detected, try again';
          break;
        case 'network':
          message = 'Network error, check connection';
          break;
        case 'not-allowed':
          message = 'Microphone permission denied';
          break;
      }
      
      this.onError?.(message);
      this.onStatusChange?.('error', message);
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onStatusChange) {
        // Only show idle if not already showing success/error
        setTimeout(() => this.onStatusChange?.('idle', null), 2000);
      }
    };
  }
  
  /**
   * Process transcript to preserve English words and capitalize proper nouns
   * Handles Tamil-English code-mixing intelligently
   */
  processTranscript(text) {
    if (!this.options.preserveEnglish) {
      return text;
    }
    
    // Step 1: Split into words
    let words = text.split(/\s+/);
    
    // Step 2: Process each word
    words = words.map((word, index) => {
      // Check if word contains Latin characters (English)
      const hasEnglish = /[a-zA-Z]/.test(word);
      
      if (hasEnglish) {
        // Word contains English characters
        const cleanWord = word.replace(/[^\w\s-]/g, ''); // Remove punctuation
        
        // Capitalize if:
        // 1. It's the first word, OR
        // 2. capitalizeNames is enabled and word length > 2 (likely a name)
        if (index === 0 || (this.options.capitalizeNames && cleanWord.length > 2)) {
          return this.capitalizeWord(cleanWord);
        }
        
        return cleanWord;
      }
      
      // Tamil word - keep as is
      return word;
    });
    
    // Step 3: Rejoin with spaces
    return words.join(' ').trim();
  }
  
  /**
   * Capitalize first letter of a word (for proper nouns)
   */
  capitalizeWord(word) {
    if (!word) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }
  
  start() {
    if (!this.supported) {
      this.onError?.('Voice input not supported in this browser');
      return false;
    }
    
    if (this.isListening) {
      this.stop();
      return false;
    }
    
    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Failed to start recognition:', error);
      this.onError?.('Failed to start voice input');
      return false;
    }
  }
  
  stop() {
    if (this.isListening && this.recognition) {
      this.recognition.stop();
    }
  }
  
  isSupported() {
    return this.supported;
  }
}

/**
 * Enhanced Voice Input with Context Awareness
 * Specialized version that handles specific field types better
 */
export class ContextAwareVoiceInput extends VoiceInput {
  constructor(onResult, onError, onStatusChange, fieldContext = 'general') {
    super(onResult, onError, onStatusChange, {
      preserveEnglish: true,
      capitalizeNames: fieldContext === 'customer_name' || fieldContext === 'product_name',
      multipleAlternatives: 3
    });
    
    this.fieldContext = fieldContext;
  }
  
  /**
   * Override process to add context-specific handling
   */
  processTranscript(text) {
    let processed = super.processTranscript(text);
    
    // Context-specific processing
    switch (this.fieldContext) {
      case 'customer_name':
      case 'shop_name':
        // Ensure all words are capitalized (proper noun)
        processed = processed.split(' ').map(word => 
          /[a-zA-Z]/.test(word) ? this.capitalizeWord(word) : word
        ).join(' ');
        break;
        
      case 'product_name':
        // Product names: capitalize first letter of each word
        processed = processed.split(' ').map((word, idx) => {
          if (/[a-zA-Z]/.test(word)) {
            // If it's an English word, capitalize it
            return this.capitalizeWord(word);
          }
          return word;
        }).join(' ');
        break;
        
      case 'phone':
        // Extract only digits
        processed = processed.replace(/\D/g, '');
        break;
        
      case 'address':
      case 'remarks':
      case 'notes':
        // Keep as is, just ensure first letter is capitalized
        if (processed.length > 0) {
          processed = processed.charAt(0).toUpperCase() + processed.slice(1);
        }
        break;
    }
    
    return processed;
  }
}

/**
 * React Hook for Voice Input
 * Usage:
 * const { startListening, status, statusMessage } = useVoiceInput((text) => {
 *   setFormData({...formData, remarks: text});
 * }, 'remarks'); // Optional: field context for smart processing
 */
export function useVoiceInput(onResult, fieldContext = 'general') {
  const [status, setStatus] = React.useState('idle');
  const [statusMessage, setStatusMessage] = React.useState(null);
  const [voiceInput, setVoiceInput] = React.useState(null);
  
  React.useEffect(() => {
    const voice = new ContextAwareVoiceInput(
      onResult,
      (error) => console.error('Voice error:', error),
      (newStatus, message) => {
        setStatus(newStatus);
        setStatusMessage(message);
      },
      fieldContext
    );
    setVoiceInput(voice);
    
    return () => {
      if (voice) {
        voice.stop();
      }
    };
  }, [onResult, fieldContext]);
  
  const startListening = () => {
    if (voiceInput) {
      voiceInput.start();
    }
  };
  
  return {
    startListening,
    status,
    statusMessage,
    isSupported: voiceInput?.isSupported() || false
  };
}
