# 🤖 YAMINI INFOTECH - CUSTOMER CHATBOT SYSTEM
## Production Deployment Guide

**System Type**: ERP-Integrated AI Customer Support Chatbot  
**Target Users**: Website Visitors & Customers (Public Access)  
**Tech Stack**: FastAPI + PostgreSQL + FAISS + Mistral + React  
**Languages**: English + Tamil (Bilingual)  

---

## 🎯 WHAT THIS CHATBOT DOES

### ✅ Core Capabilities
1. **Answers customer questions** using company knowledge (no hallucination)
2. **Auto-creates enquiries** when customers show interest
3. **Detects language** automatically (English/Tamil)
4. **Hands off to receptionist** when needed
5. **Tracks conversations** for analytics
6. **Admin-controlled knowledge base** (FAQ management)

### 🚫 What It Does NOT Do
- Give fake prices or make up information
- Access customer private data
- Handle transactions or payments
- Replace human staff completely

---

## 📊 SYSTEM ARCHITECTURE

```
Customer Website
       ↓
   Chat Widget (React)
       ↓
   FastAPI Chatbot API
       ↓
┌──────────────────────────────┐
│  1. Language Detection       │
│  2. FAISS Vector Search      │
│  3. Mistral LLM Generation   │
│  4. Intent Detection         │
│  5. Auto Enquiry Creation    │
│  6. Handoff Logic            │
└──────────────────────────────┘
       ↓
  PostgreSQL ERP
  (chatbot_knowledge, chat_sessions, chat_messages, chatbot_handoffs)
```

---

## 🗄️ DATABASE TABLES ADDED

### 1. `chatbot_knowledge` - Knowledge Base
Stores FAQs, product info, policies for RAG retrieval
```sql
- id, title, content
- content_en, content_ta (bilingual)
- category (faq, product, service, amc, policy)
- embedding_en, embedding_ta (FAISS vectors)
- is_active, priority, usage_count
- created_by, updated_by, created_at, updated_at
```

### 2. `chat_sessions` - Conversation Sessions
Tracks each customer chat conversation
```sql
- id, session_id (UUID)
- customer_id, customer_phone, customer_email, customer_name
- language (en/ta), status (active/handed_off/closed)
- handoff_to, handoff_at
- message_count, avg_confidence
- enquiry_created, enquiry_id
- started_at, last_message_at, closed_at
```

### 3. `chat_messages` - Individual Messages
All customer-bot exchanges
```sql
- id, session_id
- message, sender (customer/bot/receptionist)
- language, intent_detected, confidence_score
- knowledge_docs_used (JSON)
- triggered_handoff, handoff_reason
- sent_at
```

### 4. `chatbot_handoffs` - Human Takeover Queue
When bot can't handle, passes to receptionist
```sql
- id, session_id
- reason, priority, status
- assigned_to, assigned_at, resolved_at
- customer_name, customer_phone
- summary, last_messages (context for receptionist)
```

### 5. `chatbot_analytics` - Daily Metrics
Performance tracking
```sql
- date, total_sessions, total_messages
- sessions_en, sessions_ta
- avg_confidence, enquiries_created, handoffs_triggered
- top_intents, unanswered_queries
```

---

## ⚙️ INSTALLATION & SETUP

### Step 1: Install Python Dependencies
```bash
cd /Users/ajaikumarn/Desktop/Yamini.pvt-master
source .venv/bin/activate
cd backend
pip install -r requirements.txt
```

New packages installed:
- `mistralai==1.0.1` - Mistral AI LLM
- `faiss-cpu==1.7.4` - Vector search
- `sentence-transformers==2.3.1` - Embeddings
- `langdetect==1.0.9` - Language detection

### Step 2: Set Environment Variables
Create `.env` file in `/backend/`:
```bash
# Existing database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/yamini_infotech

# NEW: Mistral AI API Key (Required)
MISTRAL_API_KEY=your_mistral_api_key_here
```

**Get Mistral API Key**:
1. Go to https://console.mistral.ai/
2. Sign up / Login
3. Create API key
4. Copy to `.env`

### Step 3: Run Database Migration
```bash
cd backend
python3 << EOF
from database import engine
import models
models.Base.metadata.create_all(bind=engine)
print("✅ Chatbot tables created")
EOF
```

### Step 4: Seed Initial Knowledge Base
```bash
python3 << EOF
from database import SessionLocal
import models
from datetime import datetime

db = SessionLocal()

# Sample FAQs
faqs = [
    {
        "title": "What products do you sell?",
        "content_en": "Yamini Infotech sells office automation equipment including printers, copiers, scanners, and related supplies. We specialize in HP, Canon, and Epson products.",
        "content_ta": "Yamini Infotech அலுவலக automation உபகரணங்கள், printers, copiers, scanners மற்றும் தொடர்புடைய பொருட்களை விற்கிறது. நாங்கள் HP, Canon, Epson products-ல் நிபுணர்கள்.",
        "category": "product"
    },
    {
        "title": "How to book service?",
        "content_en": "To book a service, provide your machine model and issue description. Our team will assign an engineer within 24 hours. For urgent issues, mention 'urgent' in your request.",
        "content_ta": "Service booking செய்ய, உங்கள் machine model மற்றும் problem-ஐ சொல்லுங்கள். எங்கள் team 24 மணி நேரத்தில் engineer-ஐ assign செய்யும். Urgent என்றால், 'urgent' என்று குறிப்பிடுங்கள்.",
        "category": "service"
    },
    {
        "title": "AMC Benefits",
        "content_en": "Annual Maintenance Contract (AMC) includes: 4 free preventive services per year, priority support, discounted spare parts, and 24/7 helpline access.",
        "content_ta": "Annual Maintenance Contract (AMC) இதை உள்ளடக்கியது: வருடத்திற்கு 4 இலவச preventive services, priority support, spare parts discount, 24/7 helpline.",
        "category": "amc"
    },
    {
        "title": "Contact Information",
        "content_en": "Yamini Infotech - Phone: +91 1234567890 | Email: info@yamini-infotech.com | Office Hours: Mon-Sat 9AM-6PM",
        "content_ta": "Yamini Infotech - Phone: +91 1234567890 | Email: info@yamini-infotech.com | அலுவலக நேரம்: திங்கள்-சனி காலை 9-மாலை 6",
        "category": "faq"
    }
]

for faq in faqs:
    kb = models.ChatbotKnowledge(
        title=faq["title"],
        content=faq.get("content_en", ""),
        content_en=faq.get("content_en"),
        content_ta=faq.get("content_ta"),
        category=faq["category"],
        is_active=True,
        priority=1,
        created_by=1,  # Admin user
        updated_by=1
    )
    db.add(kb)

db.commit()
print("✅ Knowledge base seeded with sample FAQs")
db.close()
EOF
```

### Step 5: Build FAISS Vector Index
```bash
curl -X POST http://127.0.0.1:8000/api/chatbot/knowledge/rebuild-index \
  -H "Authorization: Bearer <admin_token>"
```

---

## 🔑 API ENDPOINTS

### Customer Endpoints (Public - No Auth)

#### 1. Send Chat Message
```http
POST /api/chatbot/chat
Content-Type: application/json

{
  "session_id": null,  // null for new session
  "message": "What printers do you have?",
  "customer_name": "John",
  "customer_phone": "+919876543210",
  "language": "en"  // optional, auto-detected
}
```

**Response:**
```json
{
  "session_id": "uuid-here",
  "reply": "We offer HP, Canon, and Epson printers...",
  "confidence": 0.85,
  "intent": "enquiry",
  "handoff_needed": false,
  "enquiry_created": true,
  "enquiry_id": 123,
  "suggestions": ["Show me products", "Book a service", "Talk to someone"]
}
```

#### 2. Request Human Handoff
```http
POST /api/chatbot/handoff
Content-Type: application/json

{
  "session_id": "uuid-here",
  "reason": "Need detailed pricing"
}
```

### Admin Endpoints (Auth Required)

#### 3. List Knowledge Base
```http
GET /api/chatbot/knowledge?category=faq&is_active=true
Authorization: Bearer <admin_token>
```

#### 4. Create Knowledge Document
```http
POST /api/chatbot/knowledge
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Printer Installation Process",
  "content": "Installation takes 2-3 hours...",
  "content_en": "English version...",
  "content_ta": "Tamil version...",
  "category": "service",
  "keywords": "installation, setup, printer"
}
```

#### 5. Get Analytics Dashboard
```http
GET /api/chatbot/analytics/dashboard?days=7
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "period_days": 7,
  "sessions": {"total": 150, "active": 12, "avg_per_day": 21.4},
  "messages": {"total": 600, "avg_per_session": 4},
  "handoffs": {"total": 15, "pending": 3, "rate": 10},
  "enquiries_created": 45,
  "conversion_rate": 30,
  "avg_confidence": 0.78,
  "language_distribution": {"en": 100, "ta": 50},
  "top_intents": [
    {"intent": "enquiry", "count": 80},
    {"intent": "service", "count": 40}
  ]
}
```

#### 6. List Handoff Requests (Reception Dashboard)
```http
GET /api/chatbot/handoffs?status=pending
Authorization: Bearer <reception_token>
```

---

## 🧠 PROMPT ENGINEERING (MISTRAL)

### System Prompt (English)
```
You are Yamini Infotech's customer support assistant.

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
```

### Context Injection
```
COMPANY KNOWLEDGE:
1. What products do you sell?
Yamini Infotech sells office automation equipment including printers...

2. How to book service?
To book a service, provide your machine model and issue description...

CUSTOMER QUESTION:
What printers do you have?

Respond in English only.
```

---

## 🎨 FRONTEND INTEGRATION

### Chat Widget (React Component)
Will be created at: `/frontend/src/components/ChatWidget.jsx`

Key features:
- Floating chat bubble
- Minimizable chat window
- Language toggle (EN/TA)
- Message history
- Quick reply buttons
- Typing indicators
- Auto-scroll
- Session persistence

### Admin Chatbot Panel
Will be created at: `/frontend/src/admin/pages/ChatbotControl.jsx`

Tabs:
1. **Knowledge Base** - Add/Edit/Delete FAQs
2. **Live Chats** - Monitor active conversations
3. **Handoff Queue** - Reception takeover requests
4. **Analytics** - Performance metrics
5. **Settings** - Confidence threshold, auto-enquiry rules

---

## 🔒 SECURITY & ROLE SEPARATION

### Customer Chatbot
- **No authentication required** (public access)
- Cannot access private ERP data
- Only sees knowledge base content
- Cannot view other customers' chats
- Rate limited to prevent abuse

### Admin/Reception Access
- **Full authentication required**
- View all chat sessions
- Access handoff queue
- Manage knowledge base
- View analytics
- Cannot impersonate customers

### Data Privacy
- No PII stored unless customer provides
- Chat sessions auto-expire after 30 days
- GDPR-compliant data handling
- Audit logs for all admin actions

---

## 📈 SCALING STRATEGY

### Phase 1: Current (MVP)
- In-memory FAISS index
- Single Mistral API instance
- PostgreSQL for persistence
- 100-500 sessions/day capacity

### Phase 2: Production Scale (1000+ sessions/day)
```
┌─────────────────┐
│   NGINX LB      │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│FastAPI│ │FastAPI│ (Multiple instances)
└───┬───┘ └──┬────┘
    │        │
    └────┬───┘
         │
┌────────▼────────┐
│   Redis Cache   │ (Session + FAISS index)
└────────┬────────┘
         │
┌────────▼────────┐
│   PostgreSQL    │ (Primary database)
└─────────────────┘
```

### Phase 3: Enterprise (5000+ sessions/day)
- Dedicated FAISS server
- Mistral fine-tuned model
- Multi-region deployment
- CDN for chat widget
- Real-time analytics dashboard

---

## 🧪 TESTING CHECKLIST

### Before Going Live:
- [ ] Database tables created
- [ ] Mistral API key configured and working
- [ ] FAISS index built successfully
- [ ] Test English conversation
- [ ] Test Tamil conversation
- [ ] Test enquiry auto-creation
- [ ] Test handoff to reception
- [ ] Test admin knowledge base CRUD
- [ ] Test analytics dashboard
- [ ] Load test (100 concurrent chats)
- [ ] Security audit (no data leaks)

### Test Conversations:
```
EN: "What printers do you sell?"
TA: "என்ன printers விற்கிறீர்கள்?"
EN: "My printer is not working"
TA: "என் printer work ஆகவில்லை"
EN: "I want to talk to someone"
TA: "யாராவது பேச விரும்புகிறேன்"
```

---

## 🚨 FAILURE HANDLING

### Mistral API Down
- Return: "I'm experiencing technical difficulties. I'll connect you to our reception team."
- Auto-create handoff request
- Log error for monitoring

### FAISS Index Empty
- Fallback to keyword search in PostgreSQL
- Alert admin to rebuild index

### Low Confidence Response
- Threshold: 50%
- Action: Auto-handoff to reception
- Store conversation context

### Database Connection Lost
- Cache last 10 messages in memory
- Retry connection
- Graceful degradation

---

## 📞 PRODUCTION DEPLOYMENT

### Environment Setup
```bash
# .env.production
DATABASE_URL=postgresql://user:pass@db-host:5432/yamini_infotech
MISTRAL_API_KEY=live-key-here
REDIS_URL=redis://redis-host:6379/0
CORS_ORIGINS=https://www.yamini-infotech.com
```

### Docker Compose (Recommended)
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    environment:
      - MISTRAL_API_KEY=${MISTRAL_API_KEY}
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
  
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
  
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: yamini_infotech
    volumes:
      - pgdata:/var/lib/postgresql/data
```

### Health Monitoring
```bash
# Healthcheck endpoint
curl http://localhost:8000/api/health

# Chatbot-specific health
curl http://localhost:8000/api/chatbot/analytics/dashboard?days=1
```

---

## 💡 ADMIN USAGE GUIDE

### Adding New FAQ
1. Login as Admin
2. Go to `/admin/chatbot`
3. Click "Knowledge Base" tab
4. Click "Add Knowledge"
5. Fill form:
   - Title: Short question
   - Content (EN): English answer
   - Content (TA): Tamil answer (optional)
   - Category: Select appropriate
   - Keywords: Comma-separated
6. Click "Save"
7. System auto-rebuilds vector index

### Monitoring Live Chats
1. Go to "Live Chats" tab
2. See active conversations
3. Filter by language/status
4. Click to view full conversation
5. Take over if needed

### Handling Handoff Requests
1. Go to "Handoff Queue" tab
2. See pending requests with context
3. Click "Assign to Me"
4. Continue conversation
5. Mark as resolved when done

---

## 📚 NEXT STEPS

### Immediate (Week 1)
- [ ] Create React Chat Widget component
- [ ] Create Admin UI pages
- [ ] Deploy to staging
- [ ] Internal testing

### Short-term (Month 1)
- [ ] Fine-tune prompts based on real conversations
- [ ] Add more knowledge base content
- [ ] Integrate with WhatsApp Business API
- [ ] Multi-language support (Hindi, etc.)

### Long-term (Quarter 1)
- [ ] Voice input/output
- [ ] Image recognition (send photo of issue)
- [ ] Predictive enquiry scoring
- [ ] Auto-reply to common emails
- [ ] Integration with CRM

---

## 🎓 TRAINING RESOURCES

### For Reception Team
- How to handle chatbot handoffs
- When to take over conversations
- How to update knowledge base

### For Admin
- Prompt engineering best practices
- Analytics interpretation
- Knowledge base optimization

### For Management
- ROI tracking
- Conversion rate analysis
- Customer satisfaction metrics

---

## 📄 API DOCUMENTATION

Full Swagger documentation available at:
```
http://localhost:8000/docs#/chatbot
```

Interactive testing available in Swagger UI.

---

**Document Version**: 1.0  
**Last Updated**: December 30, 2025  
**System Status**: ✅ Backend Complete, 🔨 Frontend In Progress  
**Production Ready**: Backend API - YES | Frontend - Pending

---

**Need Help?**  
Contact: Senior AI Architect | System Administrator  
This is a REAL production system, not a demo.
