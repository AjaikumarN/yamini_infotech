# 🤖 Chatbot Setup Guide

## ✅ Current Status
- Backend: Running on http://127.0.0.1:8000
- Frontend: Running on http://localhost:5173
- All AI dependencies installed

## 🚀 Quick Setup (3 Steps)

### Step 1: Set Mistral API Key

1. Get your API key from [Mistral Console](https://console.mistral.ai/api-keys/)
2. Edit `backend/.env` file:
   ```bash
   MISTRAL_API_KEY=your_actual_api_key_here
   ```
3. Restart backend server (Ctrl+C and run again)

### Step 2: Create Database Tables

```bash
cd backend
python init_chatbot_db.py
```

This creates 5 tables:
- `chatbot_knowledge` - FAQ knowledge base
- `chat_sessions` - Customer chat sessions
- `chat_messages` - Individual messages
- `chatbot_handoffs` - Requests for human help
- `chatbot_analytics` - Performance metrics

### Step 3: Seed Sample Knowledge

```bash
python seed_chatbot_knowledge.py
```

This adds 7 sample FAQs in English + Tamil about:
- Products (Dell laptops, electronics)
- Services (repair, maintenance)
- AMC (Annual Maintenance Contract)
- Business hours
- Contact information

## 🎯 Testing the Chatbot

### Customer Side (No Login Required)
1. Visit http://localhost:5173
2. Click the **floating chat bubble** (bottom-right, cyan color)
3. Enter customer details (name required)
4. Toggle language: 🇬🇧 EN ↔ 🇮🇳 தமிழ்
5. Ask questions like:
   - "What products do you sell?"
   - "How long does laptop repair take?"
   - "நீங்கள் என்ன சேவைகளை வழங்குகிறீர்கள்?" (Tamil)

### Admin Side (Login Required)
1. Login at http://localhost:5173/admin
2. Click **"AI Chatbot"** in left sidebar
3. Four tabs available:
   - **Knowledge Base**: Add/edit FAQs, Rebuild Index
   - **Live Chats**: Monitor customer conversations
   - **Handoff Queue**: Handle human transfer requests
   - **Analytics**: View chatbot performance metrics

## 📊 Admin Features

### Knowledge Base Management
- ➕ Add new FAQs (English + Tamil)
- ✏️ Edit existing knowledge
- 🔄 Rebuild FAISS vector index (after adding/editing)
- 🗂️ Categories: product, service, amc, complaint, general
- 📊 View usage count for each FAQ
- ✅/❌ Enable/disable knowledge items

### Building the Vector Index
**IMPORTANT**: After adding knowledge, click **"Rebuild Index"** button to create embeddings for semantic search!

### Live Chat Monitoring
- See all customer chat sessions
- View customer info (name, phone, email)
- Check language (EN/TA), confidence, status
- Filter by status: active, completed, handoff

### Handoff Queue
- Customers can request "talk to human"
- Shows pending requests with context
- **"Assign to Me"** button to take over chat
- Add handoff notes

### Analytics Dashboard
- Total sessions & enquiries created
- Conversion rate (chats → enquiries)
- Average confidence score
- Handoff rate
- Language distribution (EN vs TA)
- Top intents detected

## 🔧 Troubleshooting

### Error: "MISTRAL_API_KEY environment variable not set"
**Fix**: Add your API key to `backend/.env` and restart server

### Error: "Cannot copy out of meta tensor"
**Fix**: Already fixed! Embedding service now uses `device='cpu'`

### Error: "numpy version incompatible with FAISS"
**Fix**: Already fixed! NumPy downgraded to 1.26.4

### Chatbot not responding
**Checklist**:
1. ✅ Mistral API key set?
2. ✅ Knowledge base has entries?
3. ✅ Vector index built? (Click "Rebuild Index")
4. ✅ Backend server restarted after .env changes?

## 🎨 Chatbot Features

### Intelligence
- **RAG Architecture**: Retrieval Augmented Generation
- **Vector Search**: FAISS similarity search finds relevant knowledge
- **No Hallucination**: Only answers from knowledge base
- **Context Injection**: Retrieved knowledge added to LLM prompt
- **Confidence Scoring**: 0-1 scale for answer quality

### Languages
- **Auto-detection**: Detects English or Tamil automatically
- **Tamil Script**: Unicode range \u0B80-\u0BFF detection
- **Bilingual Knowledge**: Each FAQ has EN + TA versions
- **Smart Fallback**: Uses langdetect library as backup

### Intent Detection
Automatically detects customer intentions:
- 📧 **Enquiry**: "I want to buy", "interested in"
  → Auto-creates Enquiry in ERP
- 🔧 **Service**: "repair", "fix", "not working"
  → Suggests service request
- 😤 **Complaint**: "issue", "problem", "not satisfied"
  → Offers complaint form
- 📝 **AMC**: "maintenance contract", "annual"
  → Provides AMC information
- 👤 **Talk to Human**: "speak to person", "agent"
  → Creates handoff to reception

### ERP Integration
- **Customer Detection**: Checks if chat user exists in ERP
- **Auto-Enquiry**: Creates enquiry record with chat context
- **Product Linking**: Can reference products from database
- **Service History**: Can check customer's past services

## 📝 Adding Custom Knowledge

### Via Admin Panel (Recommended)
1. Login → AI Chatbot → Knowledge Base
2. Click **"+ Add Knowledge"**
3. Fill form:
   - Question (English) *
   - Answer (English) *
   - Question (Tamil) - optional
   - Answer (Tamil) - optional
   - Category - dropdown
   - Keywords - comma-separated
4. Click **"Save"**
5. **Click "Rebuild Index"** ← Don't forget!

### Via Database Directly
```python
from models import ChatbotKnowledge
from database import SessionLocal

db = SessionLocal()
knowledge = ChatbotKnowledge(
    question_en="Your question?",
    answer_en="Your answer.",
    question_ta="உங்கள் கேள்வி?",  # Optional
    answer_ta="உங்கள் பதில்.",      # Optional
    category="product",
    keywords="keyword1, keyword2",
    enabled=True
)
db.add(knowledge)
db.commit()
db.close()
```

Then rebuild index from admin panel!

## 🔐 Security

- ✅ Customer chat endpoints: **Public** (no auth required)
- ✅ Admin endpoints: **Protected** (require admin role)
- ✅ API key: Stored in `.env` (not in code)
- ✅ CORS: Configured for frontend origin
- ✅ Input validation: Pydantic schemas

## 📦 Tech Stack

- **LLM**: Mistral AI (mistral-tiny model)
- **Vector DB**: FAISS (CPU version)
- **Embeddings**: Sentence Transformers (paraphrase-multilingual-MiniLM-L12-v2)
- **Language Detection**: langdetect + Tamil Unicode detection
- **Backend**: FastAPI + PostgreSQL + SQLAlchemy
- **Frontend**: React + Vite

## 🎯 Next Steps

1. ✅ Add your Mistral API key
2. ✅ Run table creation script
3. ✅ Seed sample knowledge
4. ✅ Test customer chat
5. ✅ Add more company-specific FAQs
6. ✅ Monitor analytics and improve

## 💡 Tips

- **Start Small**: Add 10-20 FAQs initially
- **Test Both Languages**: Add Tamil translations for better UX
- **Monitor Confidence**: Low scores indicate missing knowledge
- **Review Handoffs**: Shows what customers need that chatbot can't answer
- **Update Keywords**: Helps with intent detection
- **Disable Old FAQs**: Instead of deleting, disable outdated knowledge

## 🆘 Support

- Check logs in terminal for errors
- Use admin analytics to see what's working
- Review chat sessions to see customer questions
- Check handoff queue for unanswered queries

---

**Built with ❤️ for Yamini Infotech ERP**
