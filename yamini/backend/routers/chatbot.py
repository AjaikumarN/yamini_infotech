"""
Chatbot API Router - Customer Support Chatbot
Production-ready endpoints for Yamini Infotech ERP
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import json

from database import get_db
from auth import require_admin
import models
import schemas
from services.chatbot_ai import (
    get_vector_store,
    get_mistral_service,
    get_language_detector,
    get_intent_detector
)

router = APIRouter(prefix="/api/chatbot", tags=["chatbot"])


# ============================================================================
# CUSTOMER-FACING ENDPOINTS (Public)
# ============================================================================

@router.post("/chat", response_model=schemas.ChatMessageResponse)
def send_chat_message(
    request: schemas.ChatMessageRequest,
    db: Session = Depends(get_db)
):
    """
    Main chatbot endpoint - Customer sends message, gets AI response
    
    PUBLIC ENDPOINT - No auth required (customers can chat anonymously)
    """
    print(f"🤖 [CHATBOT] Received message: '{request.message}' from {request.customer_name or 'Anonymous'}")
    
    try:
        print("  Step 1: Getting or creating session...")
        # 1. Get or create chat session
        session = None
        if request.session_id:
            session = db.query(models.ChatSession).filter(
                models.ChatSession.session_id == request.session_id
            ).first()
        
        if not session:
            # Create new session
            session = models.ChatSession(
                session_id=str(uuid.uuid4()),
                customer_name=request.customer_name,
                customer_phone=request.customer_phone,
                customer_email=request.customer_email,
                language=request.language or 'en',
                status='active'
            )
            db.add(session)
            db.flush()
        print(f"  ✓ Session ID: {session.session_id}")
        
        print("  Step 2: Detecting language...")
        # 2. Detect language if not specified
        lang_detector = get_language_detector()
        language = request.language or lang_detector.detect_language(request.message)
        print(f"  ✓ Language: {language}")
        
        # Update session language if changed
        if session.language != language:
            session.language = language
        
        print("  Step 3: Saving customer message...")
        # 3. Save customer message
        customer_msg = models.ChatMessage(
            session_id=session.id,
            message=request.message,
            sender='customer',
            language=language
        )
        db.add(customer_msg)
        print("  ✓ Message saved")
        
        print("  Step 4: Vector search...")
        # 4. Vector search for relevant knowledge
        relevant_docs = []
        try:
            # Skip vector search for now - using simple fallback
            print("  ⚠️ Skipping vector search (using fallback mode)")
            # vector_store = get_vector_store()
            # relevant_docs = vector_store.search(
            #     query=request.message,
            #     language=language,
            #     top_k=5
            # )
            print(f"  ✓ Using fallback mode (0 vector documents)")
        except Exception as e:
            print(f"  ⚠️ Vector search failed: {e}, continuing without context")
            relevant_docs = []
        
        print("  Step 5: Getting conversation history...")
        # 5. Get conversation history
        history = db.query(models.ChatMessage).filter(
            models.ChatMessage.session_id == session.id
        ).order_by(models.ChatMessage.sent_at.desc()).limit(10).all()
        
        conversation_history = [
            {'role': 'assistant' if msg.sender == 'bot' else 'user', 
             'content': msg.message}
            for msg in reversed(history)
        ]
        print(f"  ✓ Got {len(history)} messages")
        
        print("  Step 6: Generating AI response with Mistral...")
        # 6. Generate AI response
        mistral_service = get_mistral_service()
        reply_text, confidence = mistral_service.generate_response(
            user_message=request.message,
            context_docs=relevant_docs,
            language=language,
            conversation_history=conversation_history
        )
        print(f"  ✓ AI Response generated (confidence: {confidence})")
        
        # 7. Detect intent
        intent_detector = get_intent_detector()
        intent = intent_detector.detect_intent(request.message)
        
        # 8. Check if handoff needed
        should_handoff, handoff_reason = intent_detector.should_handoff(
            request.message, confidence
        )
        
        # 9. Save bot response
        bot_msg = models.ChatMessage(
            session_id=session.id,
            message=reply_text,
            sender='bot',
            language=language,
            intent_detected=intent,
            confidence_score=confidence,
            knowledge_docs_used=json.dumps([doc['id'] for doc in relevant_docs]),
            triggered_handoff=should_handoff,
            handoff_reason=handoff_reason if should_handoff else None
        )
        db.add(bot_msg)
        
        # 10. Auto-create enquiry for relevant intents
        enquiry_created = False
        enquiry_id = None
        
        if intent in ['enquiry', 'service'] and confidence > 0.6:
            enquiry = models.Enquiry(
                enquiry_id=f"ENQ-CHAT-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                customer_name=request.customer_name or "Chat Customer",
                phone=request.customer_phone,
                email=request.customer_email,
                product_interest=intent,
                priority='WARM',
                status='NEW',
                source='chatbot',
                notes=f"Auto-created from chatbot\nCustomer query: {request.message}",
                created_at=datetime.utcnow()
            )
            db.add(enquiry)
            db.flush()
            
            enquiry_id = enquiry.id
            enquiry_created = True
            session.enquiry_created = True
            session.enquiry_id = enquiry_id
        
        # 11. Create handoff if needed
        if should_handoff:
            handoff = models.ChatbotHandoff(
                session_id=session.id,
                reason=handoff_reason,
                priority='normal' if confidence > 0.3 else 'urgent',
                status='pending',
                customer_name=request.customer_name,
                customer_phone=request.customer_phone,
                summary=f"Customer query: {request.message}",
                last_messages=json.dumps([
                    {'sender': msg.sender, 'message': msg.message, 'time': msg.sent_at.isoformat()}
                    for msg in history[-5:]
                ])
            )
            db.add(handoff)
            session.status = 'handed_off'
        
        # 12. Update session metrics
        session.message_count += 2  # Customer + bot message
        session.last_message_at = datetime.utcnow()
        if session.avg_confidence is None:
            session.avg_confidence = confidence
        else:
            # Rolling average
            session.avg_confidence = (session.avg_confidence * 0.8) + (confidence * 0.2)
        
        # 13. Update knowledge usage stats
        for doc in relevant_docs:
            kb_doc = db.query(models.ChatbotKnowledge).filter(
                models.ChatbotKnowledge.id == doc['id']
            ).first()
            if kb_doc:
                kb_doc.usage_count += 1
                kb_doc.last_used_at = datetime.utcnow()
        
        db.commit()
        
        # 14. Generate quick reply suggestions
        suggestions = _generate_suggestions(intent, language)
        
        return schemas.ChatMessageResponse(
            session_id=session.session_id,
            reply=reply_text,
            confidence=confidence,
            intent=intent,
            handoff_needed=should_handoff,
            enquiry_created=enquiry_created,
            enquiry_id=enquiry_id,
            suggestions=suggestions
        )
        
    except Exception as e:
        db.rollback()
        print(f"Chatbot error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Chatbot service temporarily unavailable"
        )


@router.post("/handoff")
def request_handoff(
    request: schemas.ChatHandoffRequest,
    db: Session = Depends(get_db)
):
    """Customer explicitly requests to talk to human"""
    
    session = db.query(models.ChatSession).filter(
        models.ChatSession.session_id == request.session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get last messages
    recent_msgs = db.query(models.ChatMessage).filter(
        models.ChatMessage.session_id == session.id
    ).order_by(models.ChatMessage.sent_at.desc()).limit(5).all()
    
    # Create handoff
    handoff = models.ChatbotHandoff(
        session_id=session.id,
        reason=request.reason or 'customer_request',
        priority='normal',
        status='pending',
        customer_name=session.customer_name,
        customer_phone=session.customer_phone,
        summary=f"Customer requested human assistance: {request.reason}",
        last_messages=json.dumps([
            {'sender': msg.sender, 'message': msg.message}
            for msg in reversed(recent_msgs)
        ])
    )
    db.add(handoff)
    
    session.status = 'handed_off'
    
    db.commit()
    
    return {"message": "Handoff request created", "status": "pending"}


# ============================================================================
# ADMIN ENDPOINTS - Knowledge Management
# ============================================================================

@router.get("/knowledge", response_model=List[schemas.ChatbotKnowledge])
def list_knowledge(
    category: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all knowledge base documents - Admin only"""
    
    query = db.query(models.ChatbotKnowledge)
    
    if category:
        query = query.filter(models.ChatbotKnowledge.category == category)
    if is_active is not None:
        query = query.filter(models.ChatbotKnowledge.is_active == is_active)
    
    return query.order_by(
        models.ChatbotKnowledge.priority.desc(),
        models.ChatbotKnowledge.created_at.desc()
    ).all()


@router.post("/knowledge", response_model=schemas.ChatbotKnowledge)
def create_knowledge(
    knowledge: schemas.ChatbotKnowledgeCreate,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create new knowledge document - Admin only"""
    
    kb = models.ChatbotKnowledge(
        **knowledge.dict(),
        created_by=current_user.id,
        updated_by=current_user.id
    )
    db.add(kb)
    db.commit()
    db.refresh(kb)
    
    # Rebuild vector index
    _rebuild_vector_index(db)
    
    return kb


@router.put("/knowledge/{kb_id}", response_model=schemas.ChatbotKnowledge)
def update_knowledge(
    kb_id: int,
    knowledge: schemas.ChatbotKnowledgeUpdate,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update knowledge document - Admin only"""
    
    kb = db.query(models.ChatbotKnowledge).filter(
        models.ChatbotKnowledge.id == kb_id
    ).first()
    
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge document not found")
    
    for field, value in knowledge.dict(exclude_unset=True).items():
        setattr(kb, field, value)
    
    kb.updated_by = current_user.id
    kb.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(kb)
    
    # Rebuild vector index
    _rebuild_vector_index(db)
    
    return kb


@router.delete("/knowledge/{kb_id}")
def delete_knowledge(
    kb_id: int,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Delete knowledge document - Admin only"""
    
    kb = db.query(models.ChatbotKnowledge).filter(
        models.ChatbotKnowledge.id == kb_id
    ).first()
    
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge document not found")
    
    db.delete(kb)
    db.commit()
    
    # Rebuild vector index
    _rebuild_vector_index(db)
    
    return {"message": "Knowledge document deleted"}


@router.post("/knowledge/rebuild-index")
def rebuild_vector_index(
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Manually rebuild FAISS vector index - Admin only"""
    
    try:
        _rebuild_vector_index(db)
        return {"message": "Vector index rebuilt successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Index rebuild failed: {str(e)}"
        )


# ============================================================================
# ADMIN ENDPOINTS - Monitoring & Analytics
# ============================================================================

@router.get("/sessions", response_model=List[schemas.ChatSessionInfo])
def list_chat_sessions(
    status: Optional[str] = None,
    limit: int = 50,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List recent chat sessions - Admin only"""
    
    query = db.query(models.ChatSession)
    
    if status:
        query = query.filter(models.ChatSession.status == status)
    
    return query.order_by(
        models.ChatSession.last_message_at.desc()
    ).limit(limit).all()


@router.get("/handoffs", response_model=List[schemas.ChatHandoffInfo])
def list_handoffs(
    status: str = "pending",
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List handoff requests - Reception/Admin"""
    
    return db.query(models.ChatbotHandoff).filter(
        models.ChatbotHandoff.status == status
    ).order_by(
        models.ChatbotHandoff.created_at.desc()
    ).all()


@router.put("/handoffs/{handoff_id}/assign")
def assign_handoff(
    handoff_id: int,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Assign handoff to current user (receptionist)"""
    
    handoff = db.query(models.ChatbotHandoff).filter(
        models.ChatbotHandoff.id == handoff_id
    ).first()
    
    if not handoff:
        raise HTTPException(status_code=404, detail="Handoff not found")
    
    handoff.assigned_to = current_user.id
    handoff.assigned_at = datetime.utcnow()
    handoff.status = 'assigned'
    
    db.commit()
    
    return {"message": "Handoff assigned", "assigned_to": current_user.full_name}


@router.get("/analytics/dashboard")
def get_chatbot_analytics(
    days: int = 7,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get chatbot performance analytics - Admin only"""
    
    since = datetime.utcnow() - timedelta(days=days)
    
    # Session stats
    total_sessions = db.query(func.count(models.ChatSession.id)).filter(
        models.ChatSession.started_at >= since
    ).scalar()
    
    active_sessions = db.query(func.count(models.ChatSession.id)).filter(
        models.ChatSession.status == 'active'
    ).scalar()
    
    # Message stats
    total_messages = db.query(func.count(models.ChatMessage.id)).filter(
        models.ChatMessage.sent_at >= since
    ).scalar()
    
    # Handoff stats
    total_handoffs = db.query(func.count(models.ChatbotHandoff.id)).filter(
        models.ChatbotHandoff.created_at >= since
    ).scalar()
    
    pending_handoffs = db.query(func.count(models.ChatbotHandoff.id)).filter(
        models.ChatbotHandoff.status == 'pending'
    ).scalar()
    
    # Enquiries created
    enquiries_from_chat = db.query(func.count(models.Enquiry.id)).filter(
        models.Enquiry.source == 'chatbot',
        models.Enquiry.created_at >= since
    ).scalar()
    
    # Language distribution
    lang_stats = db.query(
        models.ChatSession.language,
        func.count(models.ChatSession.id)
    ).filter(
        models.ChatSession.started_at >= since
    ).group_by(models.ChatSession.language).all()
    
    # Top intents
    intent_stats = db.query(
        models.ChatMessage.intent_detected,
        func.count(models.ChatMessage.id)
    ).filter(
        models.ChatMessage.intent_detected.isnot(None),
        models.ChatMessage.sent_at >= since
    ).group_by(models.ChatMessage.intent_detected).order_by(
        func.count(models.ChatMessage.id).desc()
    ).limit(5).all()
    
    # Average confidence
    avg_confidence = db.query(
        func.avg(models.ChatMessage.confidence_score)
    ).filter(
        models.ChatMessage.sender == 'bot',
        models.ChatMessage.sent_at >= since
    ).scalar() or 0.0
    
    return {
        "period_days": days,
        "sessions": {
            "total": total_sessions,
            "active": active_sessions,
            "avg_per_day": round(total_sessions / max(days, 1), 1)
        },
        "messages": {
            "total": total_messages,
            "avg_per_session": round(total_messages / max(total_sessions, 1), 1)
        },
        "handoffs": {
            "total": total_handoffs,
            "pending": pending_handoffs,
            "rate": round((total_handoffs / max(total_sessions, 1)) * 100, 1)
        },
        "enquiries_created": enquiries_from_chat,
        "conversion_rate": round((enquiries_from_chat / max(total_sessions, 1)) * 100, 1),
        "avg_confidence": round(avg_confidence, 2),
        "language_distribution": {lang: count for lang, count in lang_stats},
        "top_intents": [{"intent": intent, "count": count} for intent, count in intent_stats]
    }


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def _rebuild_vector_index(db: Session):
    """Rebuild FAISS vector index from database"""
    vector_store = get_vector_store()
    
    # Get all active knowledge documents
    docs = db.query(models.ChatbotKnowledge).filter(
        models.ChatbotKnowledge.is_active == True
    ).all()
    
    # Convert to dict format
    doc_list = [
        {
            'id': doc.id,
            'title': doc.title,
            'content': doc.content,
            'content_en': doc.content_en,
            'content_ta': doc.content_ta,
            'category': doc.category,
            'keywords': doc.keywords,
            'is_active': doc.is_active
        }
        for doc in docs
    ]
    
    vector_store.rebuild_index(doc_list)


def _generate_suggestions(intent: str, language: str) -> List[str]:
    """Generate quick reply suggestions based on intent"""
    
    suggestions_en = {
        'enquiry': [
            "What products do you have?",
            "Can you share the price?",
            "I want to place an order"
        ],
        'service': [
            "Book a service",
            "My machine needs repair",
            "Check service status"
        ],
        'amc': [
            "Tell me about AMC",
            "AMC renewal",
            "What's covered in AMC?"
        ],
        'general': [
            "Show me products",
            "Book a service",
            "Talk to someone"
        ]
    }
    
    suggestions_ta = {
        'enquiry': [
            "என்ன products உள்ளன?",
            "விலை சொல்லுங்கள்",
            "Order போட விரும்புகிறேன்"
        ],
        'service': [
            "Service booking செய்ய",
            "Machine சரி செய்ய வேண்டும்",
            "Service status பார்க்க"
        ],
        'amc': [
            "AMC பற்றி சொல்லுங்கள்",
            "AMC renewal",
            "AMC-ல் என்ன cover ஆகும்?"
        ],
        'general': [
            "Products காட்டுங்கள்",
            "Service booking",
            "யாராவது பேச"
        ]
    }
    
    suggestions = suggestions_ta if language == 'ta' else suggestions_en
    return suggestions.get(intent, suggestions['general'])
