"""
Customer Hub — 360° Customer View
Merges customers from Enquiries, Complaints, Outstanding, MIF into one unified view.
Smart deduplication by name + phone.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import models
import auth
from database import get_db

router = APIRouter(prefix="/api/customer-hub", tags=["Customer Hub"])


# ─── Response Schemas ───────────────────────────────────────────────

class CustomerHubItem(BaseModel):
    """Unified customer summary for the list view"""
    key: str                    # dedup key (normalized name|phone)
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    company: Optional[str] = None
    customer_id: Optional[int] = None   # customers table id (if exists)
    # stats
    enquiry_count: int = 0
    complaint_count: int = 0
    outstanding_count: int = 0
    mif_count: int = 0
    total_outstanding: float = 0
    total_machine_value: float = 0
    latest_activity: Optional[str] = None
    sources: List[str] = []

class CustomerHubDetail(BaseModel):
    """Full 360° customer detail"""
    # identity
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    company: Optional[str] = None
    customer_id: Optional[int] = None
    # aggregated data
    enquiries: list = []
    complaints: list = []
    outstandings: list = []
    mif_records: list = []
    followups: list = []
    feedbacks: list = []
    # stats
    total_enquiries: int = 0
    total_complaints: int = 0
    total_outstanding_amount: float = 0
    total_paid_amount: float = 0
    total_balance: float = 0
    total_machines: int = 0
    total_machine_value: float = 0
    total_followups: int = 0
    total_feedbacks: int = 0


def _normalize(val: str) -> str:
    """Normalize a string for dedup: lowercase, strip, collapse spaces."""
    if not val:
        return ""
    return " ".join(val.strip().lower().split())


def _dedup_key(name: str, phone: str = None) -> str:
    n = _normalize(name)
    p = _normalize(phone) if phone else ""
    # strip non-digits from phone
    p = "".join(c for c in p if c.isdigit())
    # use last 10 digits
    if len(p) > 10:
        p = p[-10:]
    return f"{n}|{p}"


def _pick_best(values: list) -> Optional[str]:
    """Pick first non-empty value from a list."""
    for v in values:
        if v and str(v).strip():
            return str(v).strip()
    return None


# ─── Endpoints ──────────────────────────────────────────────────────

@router.get("/customers", response_model=List[CustomerHubItem])
def list_all_customers(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Aggregate and merge all customers from every source.
    Smart dedup by normalised name + phone.
    """
    merged: dict[str, dict] = {}

    def _ensure(key, name, phone=None, email=None, address=None, company=None, source=""):
        if key not in merged:
            merged[key] = {
                "key": key,
                "name": name,
                "phone": phone,
                "email": email,
                "address": address,
                "company": company,
                "customer_id": None,
                "enquiry_count": 0,
                "complaint_count": 0,
                "outstanding_count": 0,
                "mif_count": 0,
                "total_outstanding": 0,
                "total_machine_value": 0,
                "latest_activity": None,
                "sources": [],
            }
        c = merged[key]
        # upgrade missing fields
        if not c["phone"] and phone:
            c["phone"] = phone
        if not c["email"] and email:
            c["email"] = email
        if not c["address"] and address:
            c["address"] = address
        if not c["company"] and company:
            c["company"] = company
        if source and source not in c["sources"]:
            c["sources"].append(source)
        return c

    # 1) Customers table
    customers = db.query(models.Customer).all()
    for cust in customers:
        key = _dedup_key(cust.name, cust.phone)
        c = _ensure(key, cust.name, cust.phone, cust.email, cust.address, cust.company, "Customers")
        c["customer_id"] = cust.id

    # 2) Enquiries
    enquiries = db.query(models.Enquiry).filter(
        or_(models.Enquiry.is_deleted == False, models.Enquiry.is_deleted == None)
    ).all()
    for enq in enquiries:
        key = _dedup_key(enq.customer_name, enq.phone)
        c = _ensure(key, enq.customer_name, enq.phone, enq.email, enq.address, None, "Enquiry")
        c["enquiry_count"] += 1
        if enq.created_at:
            ts = enq.created_at.isoformat()
            if not c["latest_activity"] or ts > c["latest_activity"]:
                c["latest_activity"] = ts

    # 3) Complaints
    complaints = db.query(models.Complaint).filter(
        or_(models.Complaint.is_deleted == False, models.Complaint.is_deleted == None)
    ).all()
    for comp in complaints:
        key = _dedup_key(comp.customer_name, comp.phone)
        c = _ensure(key, comp.customer_name, comp.phone, comp.email, comp.address, comp.company, "Service")
        c["complaint_count"] += 1
        if comp.created_at:
            ts = comp.created_at.isoformat()
            if not c["latest_activity"] or ts > c["latest_activity"]:
                c["latest_activity"] = ts

    # 4) Outstanding
    outstandings = db.query(models.Outstanding).filter(
        or_(models.Outstanding.is_deleted == False, models.Outstanding.is_deleted == None)
    ).all()
    for out in outstandings:
        key = _dedup_key(out.customer_name, out.customer_phone)
        c = _ensure(key, out.customer_name, out.customer_phone, out.customer_email, None, None, "Outstanding")
        c["outstanding_count"] += 1
        c["total_outstanding"] += float(out.balance or 0)
        if out.created_at:
            ts = out.created_at.isoformat()
            if not c["latest_activity"] or ts > c["latest_activity"]:
                c["latest_activity"] = ts

    # 5) MIF
    mifs = db.query(models.MIFRecord).all()
    for mif in mifs:
        key = _dedup_key(mif.customer_name)
        c = _ensure(key, mif.customer_name, None, None, mif.location, None, "MIF")
        c["mif_count"] += 1
        c["total_machine_value"] += float(mif.machine_value or 0)
        if mif.created_at:
            ts = mif.created_at.isoformat()
            if not c["latest_activity"] or ts > c["latest_activity"]:
                c["latest_activity"] = ts

    # Sort by latest activity desc, then name
    result = sorted(merged.values(), key=lambda x: (x["latest_activity"] or "", x["name"]), reverse=True)
    return result


@router.get("/customers/{customer_key:path}/detail")
def get_customer_detail(
    customer_key: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Full 360° view for a single merged customer.
    customer_key = normalised "name|phone" key.
    """
    parts = customer_key.split("|", 1)
    name_norm = parts[0].strip() if parts else ""
    phone_norm = parts[1].strip() if len(parts) > 1 else ""

    if not name_norm:
        raise HTTPException(400, "Invalid customer key")

    # Collect all matching records by checking normalised name and phone

    # Helper to check match
    def name_match(record_name):
        return _normalize(record_name) == name_norm

    def phone_match(record_phone):
        if not phone_norm:
            return True  # no phone filter
        rp = "".join(c for c in (record_phone or "") if c.isdigit())
        if len(rp) > 10:
            rp = rp[-10:]
        return rp == phone_norm

    # ─── Collect from each source ───

    # Identity fields
    names, phones, emails, addresses, companies = [], [], [], [], []
    customer_id = None

    # 1) Customers table
    all_customers = db.query(models.Customer).all()
    for cust in all_customers:
        if name_match(cust.name) and phone_match(cust.phone):
            customer_id = cust.id
            names.append(cust.name)
            phones.append(cust.phone)
            emails.append(cust.email)
            addresses.append(cust.address)
            companies.append(cust.company)

    # 2) Enquiries
    all_enq = db.query(models.Enquiry).filter(
        or_(models.Enquiry.is_deleted == False, models.Enquiry.is_deleted == None)
    ).all()
    enquiries = []
    enquiry_ids = []
    for enq in all_enq:
        if name_match(enq.customer_name) and phone_match(enq.phone):
            enquiries.append({
                "id": enq.id,
                "enquiry_id": enq.enquiry_id,
                "product_interest": enq.product_interest,
                "priority": enq.priority,
                "status": enq.status,
                "source": enq.source,
                "next_follow_up": enq.next_follow_up.isoformat() if enq.next_follow_up else None,
                "notes": enq.notes,
                "created_at": enq.created_at.isoformat() if enq.created_at else None,
            })
            enquiry_ids.append(enq.id)
            names.append(enq.customer_name)
            phones.append(enq.phone)
            emails.append(enq.email)
            addresses.append(enq.address)

    # 3) Follow-ups for those enquiries
    followups = []
    if enquiry_ids:
        fups = db.query(models.SalesFollowUp).filter(
            models.SalesFollowUp.enquiry_id.in_(enquiry_ids)
        ).order_by(models.SalesFollowUp.followup_date.desc()).all()
        for f in fups:
            followups.append({
                "id": f.id,
                "enquiry_id": f.enquiry_id,
                "note": f.note,
                "note_type": f.note_type,
                "followup_date": f.followup_date.isoformat() if f.followup_date else None,
                "status": f.status,
                "outcome": f.outcome,
                "created_at": f.created_at.isoformat() if f.created_at else None,
            })

    # 4) Complaints / Service Requests
    all_comp = db.query(models.Complaint).filter(
        or_(models.Complaint.is_deleted == False, models.Complaint.is_deleted == None)
    ).all()
    complaints = []
    complaint_ids = []
    for comp in all_comp:
        if name_match(comp.customer_name) and phone_match(comp.phone):
            complaints.append({
                "id": comp.id,
                "ticket_no": comp.ticket_no,
                "machine_model": comp.machine_model,
                "fault_description": comp.fault_description,
                "priority": comp.priority,
                "status": comp.status,
                "resolution_notes": comp.resolution_notes,
                "parts_replaced": comp.parts_replaced,
                "completed_at": comp.completed_at.isoformat() if comp.completed_at else None,
                "created_at": comp.created_at.isoformat() if comp.created_at else None,
            })
            complaint_ids.append(comp.id)
            names.append(comp.customer_name)
            phones.append(comp.phone)
            emails.append(comp.email)
            addresses.append(comp.address)
            companies.append(comp.company)

    # 5) Feedbacks for those complaints
    feedbacks = []
    if complaint_ids:
        fbs = db.query(models.Feedback).filter(
            models.Feedback.service_request_id.in_(complaint_ids)
        ).order_by(models.Feedback.created_at.desc()).all()
        for fb in fbs:
            feedbacks.append({
                "id": fb.id,
                "rating": fb.rating,
                "comment": fb.comment,
                "is_negative": fb.is_negative,
                "created_at": fb.created_at.isoformat() if fb.created_at else None,
            })

    # 6) Outstanding
    all_out = db.query(models.Outstanding).filter(
        or_(models.Outstanding.is_deleted == False, models.Outstanding.is_deleted == None)
    ).all()
    outstandings = []
    for out in all_out:
        if name_match(out.customer_name) and phone_match(out.customer_phone):
            outstandings.append({
                "id": out.id,
                "invoice_no": out.invoice_no,
                "total_amount": out.total_amount,
                "paid_amount": out.paid_amount,
                "balance": out.balance,
                "due_date": out.due_date.isoformat() if out.due_date else None,
                "invoice_date": out.invoice_date.isoformat() if out.invoice_date else None,
                "status": out.status,
                "notes": out.notes,
            })
            names.append(out.customer_name)
            phones.append(out.customer_phone)
            emails.append(out.customer_email)

    # 7) MIF Records
    all_mif = db.query(models.MIFRecord).all()
    mif_records = []
    for mif in all_mif:
        if name_match(mif.customer_name):
            mif_records.append({
                "id": mif.id,
                "mif_id": mif.mif_id,
                "machine_model": mif.machine_model,
                "serial_number": mif.serial_number,
                "installation_date": mif.installation_date.isoformat() if mif.installation_date else None,
                "machine_value": mif.machine_value,
                "warranty_months": mif.warranty_months,
                "amc_status": mif.amc_status,
                "amc_expiry": mif.amc_expiry.isoformat() if mif.amc_expiry else None,
                "engineer_name": mif.engineer_name,
                "location": mif.location,
                "status": mif.status,
            })
            names.append(mif.customer_name)
            addresses.append(mif.location)

    # ─── Build response ─────────────

    total_outstanding = sum(o.get("total_amount", 0) or 0 for o in outstandings)
    total_paid = sum(o.get("paid_amount", 0) or 0 for o in outstandings)
    total_balance = sum(o.get("balance", 0) or 0 for o in outstandings)
    total_machine_val = sum(m.get("machine_value", 0) or 0 for m in mif_records)

    return {
        "name": _pick_best(names) or name_norm,
        "phone": _pick_best(phones),
        "email": _pick_best(emails),
        "address": _pick_best(addresses),
        "company": _pick_best(companies),
        "customer_id": customer_id,
        "enquiries": enquiries,
        "complaints": complaints,
        "outstandings": outstandings,
        "mif_records": mif_records,
        "followups": followups,
        "feedbacks": feedbacks,
        "total_enquiries": len(enquiries),
        "total_complaints": len(complaints),
        "total_outstanding_amount": total_outstanding,
        "total_paid_amount": total_paid,
        "total_balance": total_balance,
        "total_machines": len(mif_records),
        "total_machine_value": total_machine_val,
        "total_followups": len(followups),
        "total_feedbacks": len(feedbacks),
    }


@router.post("/customers/create")
def create_hub_customer(
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Create a new customer in the Customers table AND also create an enquiry
    so they appear in both systems.
    """
    from crud import generate_id

    name = data.get("name", "").strip()
    phone = data.get("phone", "").strip()
    email = data.get("email", "").strip()
    address = data.get("address", "").strip()
    company = data.get("company", "").strip()

    if not name:
        raise HTTPException(400, "Customer name is required")

    # Check if customer already exists
    existing = db.query(models.Customer).filter(
        func.lower(models.Customer.name) == name.lower()
    ).first()

    if existing:
        # Update missing fields
        if not existing.phone and phone:
            existing.phone = phone
        if not existing.email and email:
            existing.email = email
        if not existing.address and address:
            existing.address = address
        if not existing.company and company:
            existing.company = company
        db.commit()
        db.refresh(existing)
        customer = existing
    else:
        customer_id = generate_id("CUST-", db, models.Customer, "customer_id")
        customer = models.Customer(
            customer_id=customer_id,
            name=name,
            phone=phone,
            email=email,
            address=address,
            company=company,
            status="Active"
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)

    return {
        "message": "Customer created successfully",
        "customer_id": customer.id,
        "customer_name": customer.name
    }
