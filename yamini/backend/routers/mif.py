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
    
    # Return HTML view of MIF (for now)
    # In production, generate actual PDF
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Machine Installation Form - {mif.machine_serial_number}</title>
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
            <div class="label">Machine Serial Number:</div>
            <div>{mif.machine_serial_number}</div>
        </div>
        <div class="section">
            <div class="label">Machine Model:</div>
            <div>{mif.machine_model}</div>
        </div>
        <div class="section">
            <div class="label">Installation Date:</div>
            <div>{mif.installation_date}</div>
        </div>
        <div class="section">
            <div class="label">Customer Name:</div>
            <div>{mif.customer_name}</div>
        </div>
        <div class="section">
            <div class="label">Customer Contact:</div>
            <div>{mif.customer_contact}</div>
        </div>
        <div class="section">
            <div class="label">Installation Address:</div>
            <div>{mif.installation_address}</div>
        </div>
        <div class="section">
            <div class="label">Installed By:</div>
            <div>{mif.installed_by_name}</div>
        </div>
        <div class="section">
            <div class="label">Verification:</div>
            <div>Verified: {mif.customer_verified}</div>
        </div>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html_content)
