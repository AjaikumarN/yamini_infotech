import React, { useState, useEffect, useRef } from 'react';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [language, setLanguage] = useState('en');
  const [isTyping, setIsTyping] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', email: '' });
  const [showInfoForm, setShowInfoForm] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load session from localStorage
    const saved = localStorage.getItem('chatbot_session');
    if (saved) {
      const data = JSON.parse(saved);
      setSessionId(data.sessionId);
      setMessages(data.messages || []);
      setCustomerInfo(data.customerInfo || { name: '', phone: '', email: '' });
      setShowInfoForm(!data.customerInfo?.name);
    }
  }, []);

  const saveSession = (sid, msgs, info) => {
    localStorage.setItem('chatbot_session', JSON.stringify({
      sessionId: sid,
      messages: msgs,
      customerInfo: info
    }));
  };

  const sendMessage = async (text = input) => {
    if (!text.trim()) return;

    const userMsg = {
      sender: 'customer',
      message: text,
      timestamp: new Date().toISOString()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: text,
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone,
          customer_email: customerInfo.email,
          language: language
        })
      });

      const data = await response.json();
      
      if (!sessionId) {
        setSessionId(data.session_id);
      }

      const botMsg = {
        sender: 'bot',
        message: data.reply,
        confidence: data.confidence,
        intent: data.intent,
        suggestions: data.suggestions,
        timestamp: new Date().toISOString()
      };

      const updatedMessages = [...newMessages, botMsg];
      setMessages(updatedMessages);
      saveSession(data.session_id, updatedMessages, customerInfo);

      if (data.handoff_needed) {
        setTimeout(() => {
          const handoffMsg = {
            sender: 'system',
            message: language === 'ta' 
              ? '👤 நாங்கள் உங்களை எங்கள் reception team உடன் இணைக்கிறோம்...'
              : '👤 Connecting you with our reception team...',
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, handoffMsg]);
        }, 1000);
      }

      if (data.enquiry_created) {
        setTimeout(() => {
          const enquiryMsg = {
            sender: 'system',
            message: language === 'ta'
              ? `✅ உங்கள் enquiry உருவாக்கப்பட்டது (ID: ${data.enquiry_id})`
              : `✅ Enquiry created successfully (ID: ${data.enquiry_id})`,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, enquiryMsg]);
        }, 500);
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg = {
        sender: 'system',
        message: language === 'ta'
          ? '❌ மன்னிக்கவும், தொழில்நுட்ப சிக்கல் உள்ளது. மீண்டும் முயற்சிக்கவும்.'
          : '❌ Sorry, technical issue. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestion = (suggestion) => {
    sendMessage(suggestion);
  };

  const handleInfoSubmit = (e) => {
    e.preventDefault();
    if (customerInfo.name) {
      setShowInfoForm(false);
      const welcomeMsg = {
        sender: 'bot',
        message: language === 'ta'
          ? `வணக்கம் ${customerInfo.name}! நான் Yamini Infotech இன் virtual assistant. நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?`
          : `Hello ${customerInfo.name}! I'm Yamini Infotech's virtual assistant. How can I help you today?`,
        timestamp: new Date().toISOString(),
        suggestions: language === 'ta'
          ? ['Products பார்க்க', 'Service booking', 'விலை தெரிந்து கொள்ள']
          : ['View Products', 'Book Service', 'Get Pricing']
      };
      setMessages([welcomeMsg]);
      saveSession(sessionId, [welcomeMsg], customerInfo);
    }
  };

  const clearChat = () => {
    if (confirm(language === 'ta' ? 'Chat-ஐ clear செய்ய வேண்டுமா?' : 'Clear chat history?')) {
      setMessages([]);
      setSessionId(null);
      setShowInfoForm(true);
      localStorage.removeItem('chatbot_session');
    }
  };

  const styles = {
    widget: {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    bubble: {
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      boxShadow: '0 8px 24px rgba(6,182,212,0.4)',
      transition: 'transform 0.2s',
      fontSize: '28px'
    },
    window: {
      position: 'absolute',
      bottom: '80px',
      right: '0',
      width: '380px',
      height: '600px',
      maxHeight: '80vh',
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    },
    header: {
      background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
      color: 'white',
      padding: '16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    messages: {
      flex: 1,
      padding: '16px',
      overflowY: 'auto',
      background: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    message: (sender) => ({
      maxWidth: '75%',
      padding: '10px 14px',
      borderRadius: '12px',
      alignSelf: sender === 'customer' ? 'flex-end' : 'flex-start',
      background: sender === 'customer' ? 'linear-gradient(135deg, #06b6d4, #0891b2)' : 
                  sender === 'system' ? '#fef3c7' : 'white',
      color: sender === 'customer' ? 'white' : '#0f172a',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      fontSize: '14px',
      lineHeight: '1.5'
    }),
    suggestions: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px',
      marginTop: '8px'
    },
    suggestionBtn: {
      padding: '6px 12px',
      borderRadius: '16px',
      border: '1px solid #06b6d4',
      background: 'white',
      color: '#0891b2',
      fontSize: '12px',
      cursor: 'pointer',
      fontWeight: 600,
      transition: 'all 0.2s'
    },
    inputArea: {
      padding: '12px',
      borderTop: '1px solid #e2e8f0',
      background: 'white',
      display: 'flex',
      gap: '8px'
    },
    input: {
      flex: 1,
      padding: '10px 14px',
      borderRadius: '20px',
      border: '1px solid #e2e8f0',
      fontSize: '14px',
      outline: 'none'
    },
    sendBtn: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      border: 'none',
      background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
      color: 'white',
      cursor: 'pointer',
      fontSize: '18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    infoForm: {
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    },
    formInput: {
      padding: '10px 12px',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      fontSize: '14px'
    },
    formBtn: {
      padding: '12px',
      borderRadius: '8px',
      border: 'none',
      background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
      color: 'white',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer'
    },
    typing: {
      display: 'flex',
      gap: '4px',
      padding: '10px 14px',
      background: 'white',
      borderRadius: '12px',
      alignSelf: 'flex-start',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    },
    typingDot: (delay) => ({
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: '#94a3b8',
      animation: 'pulse 1.4s ease-in-out infinite',
      animationDelay: delay
    })
  };

  return (
    <div style={styles.widget}>
      {!isOpen ? (
        <div 
          style={styles.bubble}
          onClick={() => setIsOpen(true)}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          💬
        </div>
      ) : (
        <div style={styles.window}>
          {/* Header */}
          <div style={styles.header}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700 }}>Yamini Infotech</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>Virtual Assistant</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '6px', padding: '6px 10px', color: 'white', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
              >
                {language === 'en' ? '🇮🇳 தமிழ்' : '🇬🇧 EN'}
              </button>
              <button 
                onClick={clearChat}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '6px', padding: '6px 10px', color: 'white', fontSize: '16px', cursor: 'pointer' }}
              >
                🔄
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '6px', padding: '6px 10px', color: 'white', fontSize: '16px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Customer Info Form */}
          {showInfoForm ? (
            <div style={styles.infoForm}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0891b2' }}>
                {language === 'ta' ? 'வணக்கம்! உங்கள் விவரங்கள்' : 'Welcome! Tell us about you'}
              </h3>
              <form onSubmit={handleInfoSubmit}>
                <input
                  type="text"
                  placeholder={language === 'ta' ? 'உங்கள் பெயர்' : 'Your Name'}
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  required
                  style={styles.formInput}
                />
                <input
                  type="tel"
                  placeholder={language === 'ta' ? 'Phone Number' : 'Phone Number'}
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  style={styles.formInput}
                />
                <input
                  type="email"
                  placeholder="Email (Optional)"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  style={styles.formInput}
                />
                <button type="submit" style={styles.formBtn}>
                  {language === 'ta' ? 'Chat தொடங்க' : 'Start Chat'}
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div style={styles.messages}>
                {messages.map((msg, idx) => (
                  <div key={idx}>
                    <div style={styles.message(msg.sender)}>
                      {msg.message}
                      {msg.confidence && (
                        <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px' }}>
                          Confidence: {(msg.confidence * 100).toFixed(0)}%
                        </div>
                      )}
                    </div>
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div style={styles.suggestions}>
                        {msg.suggestions.map((sug, i) => (
                          <button
                            key={i}
                            style={styles.suggestionBtn}
                            onClick={() => handleSuggestion(sug)}
                            onMouseEnter={(e) => e.target.style.background = '#06b6d4'}
                            onMouseLeave={(e) => e.target.style.background = 'white'}
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div style={styles.typing}>
                    <div style={styles.typingDot('0s')}></div>
                    <div style={styles.typingDot('0.2s')}></div>
                    <div style={styles.typingDot('0.4s')}></div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={styles.inputArea}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder={language === 'ta' ? 'உங்கள் கேள்வியை type செய்யுங்கள்...' : 'Type your question...'}
                  style={styles.input}
                />
                <button style={styles.sendBtn} onClick={() => sendMessage()}>
                  ➤
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
