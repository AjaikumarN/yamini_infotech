from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
import schemas
import crud
import models
import auth
from database import get_db

router = APIRouter(prefix="/api/mif", tags=["MIF (Confidential)"])

@router.post("/", response_model=schemas.MIFRecord)
def create_mif_record(
    mif: schemas.MIFRecordCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_mif_write)  # Admin only
):
    """Create MIF record (Admin only)"""
    return crud.create_mif_record(db=db, mif=mif)

@router.get("/", response_model=List[schemas.MIFRecord])
def get_mif_records(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_mif_access)  # Admin + Reception
):
    """Get all MIF records (Admin full access, Reception READ ONLY - ACCESS LOGGED)"""
    ip_address = request.client.host
    return crud.get_mif_records(
        db, 
        user_id=current_user.id,
        ip_address=ip_address,
        skip=skip, 
        limit=limit
    )

@router.get("/access-logs")
def get_mif_access_logs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_permission("manage_employees"))
):
    """Get MIF access logs (Admin only)"""
    return crud.get_mif_access_logs(db, skip=skip, limit=limit)

@router.put("/{mif_id}", response_model=schemas.MIFRecord)
def update_mif_record(
    mif_id: int,
    mif_update: schemas.MIFRecordUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_mif_write)  # Admin only
):
    """Update MIF record (Admin WRITE only - Reception READ-ONLY)"""
    mif = db.query(models.MIFRecord).filter(models.MIFRecord.id == mif_id).first()
    if not mif:
        raise HTTPException(status_code=404, detail="MIF record not found")
    
    update_data = mif_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(mif, key, value)
    
    db.commit()
    db.refresh(mif)
    return mif

@router.delete("/{mif_id}")
def delete_mif_record(
    mif_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_mif_write)  # Admin only
):
    """Delete MIF record (Admin WRITE only - Reception READ-ONLY)"""
    mif = db.query(models.MIFRecord).filter(models.MIFRecord.id == mif_id).first()
    if not mif:
        raise HTTPException(status_code=404, detail="MIF record not found")
    
    db.delete(mif)
    db.commit()
    return {"message": "MIF record deleted successfully"}

@router.get("/{mif_id}/pdf")
def get_mif_pdf(
    mif_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_mif_access)
):
    """Get MIF record as PDF (Admin + Reception)"""
    from fastapi.responses import HTMLResponse
    
    mif = db.query(models.MIFRecord).filter(models.MIFRecord.id == mif_id).first()
    if not mif:
        raise HTTPException(status_code=404, detail="MIF record not found")
    
    # Derive customer contact from linked customer
    customer_contact = ""
    if mif.customer_id:
        customer = db.query(models.Customer).filter(models.Customer.id == mif.customer_id).first()
        if customer:
            customer_contact = customer.phone or customer.email or "N/A"
    
    # Return HTML view of MIF (for now)
    # In production, generate actual PDF
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Machine Installation Form - {mif.serial_number or 'N/A'}</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 40px; }}
            h1 {{ color: #333; }}
            .section {{ margin: 20px 0; }}
            .label {{ font-weight: bold; }}
        </style>
    </head>
    <body>
        <h1>MACHINE INSTALLATION FORM (MIF)</h1>
        <div class="section">
            <div class="label">MIF ID:</div>
            <div>{mif.mif_id or 'N/A'}</div>
        </div>
        <div class="section">
            <div class="label">Machine Serial Number:</div>
            <div>{mif.serial_number or 'N/A'}</div>
        </div>
        <div class="section">
            <div class="label">Machine Model:</div>
            <div>{mif.machine_model or 'N/A'}</div>
        </div>
        <div class="section">
            <div class="label">Installation Date:</div>
            <div>{mif.installation_date.strftime('%d/%m/%Y') if mif.installation_date else 'N/A'}</div>
        </div>
        <div class="section">
            <div class="label">Customer Name:</div>
            <div>{mif.customer_name or 'N/A'}</div>
        </div>
        <div class="section">
            <div class="label">Customer Contact:</div>
            <div>{customer_contact}</div>
        </div>
        <div class="section">
            <div class="label">Installation Address:</div>
            <div>{mif.location or 'N/A'}</div>
        </div>
        <div class="section">
            <div class="label">Machine Value:</div>
            <div>{'₹{:,.2f}'.format(mif.machine_value) if mif.machine_value else 'N/A'}</div>
        </div>
        <div class="section">
            <div class="label">AMC Status:</div>
            <div>{mif.amc_status or 'N/A'}</div>
        </div>
        <div class="section">
            <div class="label">Status:</div>
            <div>{mif.status or 'Active'}</div>
        </div>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html_content)
