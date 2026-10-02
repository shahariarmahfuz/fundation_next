import uuid
from datetime import date
from decimal import Decimal
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, File, UploadFile, Form
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.member import Member
from backend.app.models.member_document import MemberDocument
from backend.app.models.group import Group
from backend.app.models.contribution import Contribution
from backend.app.models.user import User
from backend.app.schemas.member import MemberResponse, MemberCreate, MemberUpdate, MemberDocumentResponse
from backend.app.schemas.common import PaginatedResponse
from backend.app.api.deps import require_permission, get_current_user
from backend.app.services.audit_service import AuditService
from backend.app.services.accounting_service import AccountingService
from backend.app.services.code_service import CodeService
from backend.app.services.cloudinary_service import CloudinaryService

router = APIRouter()


def generate_member_number(db: Session) -> str:
    return CodeService.process_member_code(db)


def populate_member_metrics(db: Session, member: Member, foundation_amount: Optional[Decimal] = None) -> MemberResponse:
    total_paid = db.query(func.coalesce(func.sum(Contribution.amount), Decimal("0.00"))).filter(
        Contribution.member_id == member.id,
        Contribution.status == "PAID"
    ).scalar() or Decimal("0.00")

    pending_count = db.query(Contribution).filter(
        Contribution.member_id == member.id,
        Contribution.status.in_(["DUE", "CURRENT_PENDING"])
    ).count()

    current_foundation_amount = foundation_amount if foundation_amount is not None else AccountingService.get_monthly_contribution_amount(db)

    resp = MemberResponse.model_validate(member)
    resp.monthly_contribution_amount = current_foundation_amount
    resp.foundation_monthly_amount = current_foundation_amount
    resp.total_contributions_paid = total_paid
    resp.pending_contributions_count = pending_count
    return resp


@router.get("", response_model=PaginatedResponse[MemberResponse])
def get_members(
    group_id: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("members.view"))
) -> Any:
    query = db.query(Member)

    if group_id:
        query = query.filter(Member.group_id == group_id)
    if status:
        query = query.filter(Member.status == status)
    if search:
        s = f"%{search}%"
        query = query.filter(
            or_(
                Member.full_name.ilike(s),
                Member.member_number.ilike(s),
                Member.phone.ilike(s),
                Member.email.ilike(s)
            )
        )

    total = query.count()
    items = query.order_by(Member.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    current_foundation_amount = AccountingService.get_monthly_contribution_amount(db)

    return {
        "items": [populate_member_metrics(db, m, current_foundation_amount) for m in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.get("/{member_id}", response_model=MemberResponse)
def get_member(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("members.view"))
) -> Any:
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    return populate_member_metrics(db, member)


@router.post("", response_model=MemberResponse)
def create_member(
    member_in: MemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("members.create"))
) -> Any:
    if not member_in.full_name or not member_in.full_name.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Full name is required.")

    # 1. Enforce that member MUST belong to a Group
    group = db.query(Group).filter(Group.id == member_in.group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assigned group does not exist. A member MUST belong to a valid Group.")

    input_code = member_in.code or member_in.member_number
    member_num = CodeService.process_member_code(db, code=input_code)

    member = Member(
        member_number=member_num,
        full_name=member_in.full_name.strip(),
        group_id=member_in.group_id,
        status=member_in.status or "ACTIVE",
        joining_date=member_in.joining_date or date.today(),
        email=member_in.email,
        phone=member_in.phone,
        alternative_phone=member_in.alternative_phone,
        address=member_in.address,
        present_address=member_in.present_address,
        permanent_address=member_in.permanent_address,
        nid_or_id=member_in.nid_or_id,
        father_name=member_in.father_name,
        mother_name=member_in.mother_name,
        date_of_birth=member_in.date_of_birth,
        gender=member_in.gender,
        occupation=member_in.occupation,
        education=member_in.education,
        blood_group=member_in.blood_group,
        marital_status=member_in.marital_status,
        emergency_contact_name=member_in.emergency_contact_name,
        emergency_contact_relationship=member_in.emergency_contact_relationship,
        emergency_contact_phone=member_in.emergency_contact_phone,
        reference_name=member_in.reference_name,
        reference_phone=member_in.reference_phone,
        reference_relationship=member_in.reference_relationship,
        commitment=member_in.commitment,
        photo_url=member_in.photo_url,
        photo_public_id=member_in.photo_public_id,
        signature_url=member_in.signature_url,
        signature_public_id=member_in.signature_public_id,
        document_type=member_in.document_type,
        nid_front_url=member_in.nid_front_url,
        nid_front_public_id=member_in.nid_front_public_id,
        nid_back_url=member_in.nid_back_url,
        nid_back_public_id=member_in.nid_back_public_id,
        birth_certificate_url=member_in.birth_certificate_url,
        birth_certificate_public_id=member_in.birth_certificate_public_id,
        reason_for_joining=member_in.reason_for_joining,
        notes=member_in.notes
    )
    db.add(member)
    db.commit()
    db.refresh(member)

    # Automatically create MemberDocument records for any documents provided during creation
    docs_to_record = []
    if member.photo_url:
        docs_to_record.append(MemberDocument(
            member_id=member.id, document_type="PHOTO", document_category="PHOTO",
            cloudinary_public_id=member.photo_public_id or f"photo_{member.id}",
            secure_url=member.photo_url, resource_type="image", uploaded_by=current_user.id
        ))
    if member.signature_url:
        docs_to_record.append(MemberDocument(
            member_id=member.id, document_type="SIGNATURE", document_category="SIGNATURE",
            cloudinary_public_id=member.signature_public_id or f"sig_{member.id}",
            secure_url=member.signature_url, resource_type="image", uploaded_by=current_user.id
        ))
    if member.nid_front_url:
        docs_to_record.append(MemberDocument(
            member_id=member.id, document_type=member.document_type or "National ID", document_category="NID_FRONT",
            cloudinary_public_id=member.nid_front_public_id or f"nid_front_{member.id}",
            secure_url=member.nid_front_url, resource_type="auto", uploaded_by=current_user.id
        ))
    if member.nid_back_url:
        docs_to_record.append(MemberDocument(
            member_id=member.id, document_type=member.document_type or "National ID", document_category="NID_BACK",
            cloudinary_public_id=member.nid_back_public_id or f"nid_back_{member.id}",
            secure_url=member.nid_back_url, resource_type="auto", uploaded_by=current_user.id
        ))
    if member.birth_certificate_url:
        docs_to_record.append(MemberDocument(
            member_id=member.id, document_type=member.document_type or "Birth Certificate", document_category="BIRTH_CERTIFICATE",
            cloudinary_public_id=member.birth_certificate_public_id or f"bc_{member.id}",
            secure_url=member.birth_certificate_url, resource_type="auto", uploaded_by=current_user.id
        ))

    if docs_to_record:
        db.add_all(docs_to_record)
        db.commit()
        db.refresh(member)

    AuditService.log(
        db, action="CREATE", module="members", record_id=str(member.id),
        user=current_user, new_values={"name": member.full_name, "member_number": member.member_number, "group_id": member.group_id}
    )
    db.commit()
    return populate_member_metrics(db, member)


@router.put("/{member_id}", response_model=MemberResponse)
def update_member(
    member_id: int,
    member_in: MemberUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("members.update"))
) -> Any:
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    old_vals = {
        "member_number": member.member_number,
        "full_name": member.full_name,
        "phone": member.phone,
        "group_id": member.group_id,
        "status": member.status
    }

    # Code update validation if provided
    input_code = member_in.code or member_in.member_number
    if input_code is not None and input_code.strip() and input_code.strip().upper() != member.member_number.upper():
        new_code = CodeService.process_member_code(db, code=input_code, exclude_id=member.id)
        member.member_number = new_code

    if member_in.group_id is not None:
        group = db.query(Group).filter(Group.id == member_in.group_id).first()
        if not group:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assigned group does not exist.")
        member.group_id = member_in.group_id

    optional_fields = [
        "full_name", "email", "phone", "alternative_phone", "address", "present_address",
        "permanent_address", "nid_or_id", "father_name", "mother_name", "date_of_birth",
        "gender", "occupation", "education", "blood_group", "marital_status",
        "emergency_contact_name", "emergency_contact_relationship", "emergency_contact_phone",
        "reference_name", "reference_phone", "reference_relationship",
        "commitment", "photo_url", "photo_public_id", "signature_url", "signature_public_id",
        "document_type", "nid_front_url", "nid_front_public_id", "nid_back_url", "nid_back_public_id",
        "birth_certificate_url", "birth_certificate_public_id", "reason_for_joining", "status", "notes", "joining_date"
    ]
    for field in optional_fields:
        val = getattr(member_in, field, None)
        if val is not None:
            setattr(member, field, val)

    db.commit()
    db.refresh(member)

    AuditService.log(
        db, action="UPDATE", module="members", record_id=str(member.id),
        user=current_user, old_values=old_vals,
        new_values={
            "member_number": member.member_number,
            "full_name": member.full_name,
            "group_id": member.group_id,
            "status": member.status
        }
    )
    db.commit()
    return populate_member_metrics(db, member)


@router.delete("/{member_id}")
def delete_member(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("members.delete"))
) -> Any:
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    # Check for linked financial contributions
    has_contributions = db.query(Contribution).filter(Contribution.member_id == member.id).first()
    if has_contributions:
        # Protect financial audit trail: Archive/Deactivate instead of hard deleting
        member.status = "INACTIVE"
        db.commit()
        AuditService.log(
            db, action="ARCHIVE", module="members", record_id=str(member.id),
            user=current_user, details=f"Member {member.member_number} ({member.full_name}) has financial records. Soft-archived and set to INACTIVE to preserve ledger audit trail."
        )
        db.commit()
        return {
            "success": True,
            "archived": True,
            "message": f"Member {member.member_number} has historical financial contributions. Safely archived and marked INACTIVE to preserve financial ledger integrity."
        }

    # If no financial contributions exist, safe to hard delete
    # Clean up Cloudinary assets
    for doc in list(member.documents):
        if doc.cloudinary_public_id:
            try:
                CloudinaryService.delete(doc.cloudinary_public_id, resource_type=doc.resource_type)
            except Exception:
                pass
    if member.photo_public_id:
        try:
            CloudinaryService.delete(member.photo_public_id, resource_type="image")
        except Exception:
            pass
    if member.signature_public_id:
        try:
            CloudinaryService.delete(member.signature_public_id, resource_type="image")
        except Exception:
            pass

    db.delete(member)
    db.commit()
    AuditService.log(
        db, action="DELETE", module="members", record_id=str(member_id),
        user=current_user, details=f"Member {member.member_number} ({member.full_name}) permanently deleted."
    )
    db.commit()
    return {"success": True, "archived": False, "message": f"Member {member.member_number} deleted successfully."}


# ==============================================================================
# CLOUDINARY MEDIA UPLOADS & MANAGEMENT ENDPOINTS
# ==============================================================================

@router.post("/upload-temp")
def upload_temp_file(
    file: UploadFile = File(...),
    category: str = Form("PHOTO"),
    current_user: User = Depends(require_permission("members.create"))
) -> Any:
    """
    Temporary/staging upload for Member creation.
    Uploads file to Cloudinary and returns secure URL and metadata.
    """
    category_norm = category.upper().strip()
    file_bytes, clean_filename, mime_type = CloudinaryService.validate_file(file, category=category_norm)

    folder = f"foundation/members/temp/{category_norm.lower()}"
    resource_type = "image" if category_norm in ("PHOTO", "SIGNATURE") else "auto"

    upload_res = CloudinaryService.upload(
        file_bytes=file_bytes,
        filename=clean_filename,
        folder=folder,
        resource_type=resource_type
    )

    return {
        "success": True,
        "category": category_norm,
        "original_filename": clean_filename,
        "mime_type": mime_type,
        "secure_url": upload_res["secure_url"],
        "public_id": upload_res["public_id"],
        "resource_type": upload_res["resource_type"],
        "format": upload_res.get("format"),
        "bytes": upload_res.get("bytes"),
        "width": upload_res.get("width"),
        "height": upload_res.get("height")
    }


@router.post("/{member_id}/photo")
def upload_member_photo(
    member_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("members.update"))
) -> Any:
    """
    Uploads or replaces a Member's profile photo in Cloudinary.
    Folder: foundation/members/{member_id}/profile
    """
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    file_bytes, clean_filename, mime_type = CloudinaryService.validate_file(file, category="PHOTO")
    folder = f"foundation/members/{member.id}/profile"

    # Safely replace: upload new asset first, then delete old asset
    upload_res = CloudinaryService.replace(
        old_public_id=member.photo_public_id,
        file_bytes=file_bytes,
        filename=clean_filename,
        folder=folder,
        resource_type="image",
        old_resource_type="image"
    )

    member.photo_url = upload_res["secure_url"]
    member.photo_public_id = upload_res["public_id"]

    # Upsert MemberDocument
    doc = db.query(MemberDocument).filter(
        MemberDocument.member_id == member.id,
        MemberDocument.document_category == "PHOTO"
    ).first()

    if not doc:
        doc = MemberDocument(
            member_id=member.id,
            document_type="PHOTO",
            document_category="PHOTO",
            uploaded_by=current_user.id
        )
        db.add(doc)

    doc.cloudinary_public_id = upload_res["public_id"]
    doc.secure_url = upload_res["secure_url"]
    doc.resource_type = upload_res["resource_type"]
    doc.format = upload_res.get("format")
    doc.file_size = upload_res.get("bytes")
    doc.width = upload_res.get("width")
    doc.height = upload_res.get("height")
    doc.original_filename = clean_filename
    doc.mime_type = mime_type
    doc.uploaded_by = current_user.id

    db.commit()
    db.refresh(member)
    db.refresh(doc)

    AuditService.log(
        db, action="UPLOAD_PHOTO", module="members", record_id=str(member.id),
        user=current_user, details=f"Uploaded profile photo for member {member.member_number}"
    )
    db.commit()

    return {
        "success": True,
        "message": "Profile photo uploaded successfully.",
        "secure_url": upload_res["secure_url"],
        "public_id": upload_res["public_id"],
        "document": MemberDocumentResponse.model_validate(doc)
    }


@router.delete("/{member_id}/photo")
def delete_member_photo(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("members.update"))
) -> Any:
    """Deletes member profile photo from Cloudinary and PostgreSQL."""
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    if member.photo_public_id:
        CloudinaryService.delete(member.photo_public_id, resource_type="image")

    member.photo_url = None
    member.photo_public_id = None

    db.query(MemberDocument).filter(
        MemberDocument.member_id == member.id,
        MemberDocument.document_category == "PHOTO"
    ).delete()

    db.commit()

    AuditService.log(
        db, action="DELETE_PHOTO", module="members", record_id=str(member.id),
        user=current_user, details=f"Removed profile photo for member {member.member_number}"
    )
    db.commit()

    return {"success": True, "message": "Profile photo deleted successfully."}


@router.post("/{member_id}/signature")
def upload_member_signature(
    member_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("members.update"))
) -> Any:
    """
    Uploads or replaces a Member's signature in Cloudinary.
    Folder: foundation/members/{member_id}/signature
    """
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    file_bytes, clean_filename, mime_type = CloudinaryService.validate_file(file, category="SIGNATURE")
    folder = f"foundation/members/{member.id}/signature"

    upload_res = CloudinaryService.replace(
        old_public_id=member.signature_public_id,
        file_bytes=file_bytes,
        filename=clean_filename,
        folder=folder,
        resource_type="image",
        old_resource_type="image"
    )

    member.signature_url = upload_res["secure_url"]
    member.signature_public_id = upload_res["public_id"]

    doc = db.query(MemberDocument).filter(
        MemberDocument.member_id == member.id,
        MemberDocument.document_category == "SIGNATURE"
    ).first()

    if not doc:
        doc = MemberDocument(
            member_id=member.id,
            document_type="SIGNATURE",
            document_category="SIGNATURE",
            uploaded_by=current_user.id
        )
        db.add(doc)

    doc.cloudinary_public_id = upload_res["public_id"]
    doc.secure_url = upload_res["secure_url"]
    doc.resource_type = upload_res["resource_type"]
    doc.format = upload_res.get("format")
    doc.file_size = upload_res.get("bytes")
    doc.width = upload_res.get("width")
    doc.height = upload_res.get("height")
    doc.original_filename = clean_filename
    doc.mime_type = mime_type
    doc.uploaded_by = current_user.id

    db.commit()
    db.refresh(member)
    db.refresh(doc)

    AuditService.log(
        db, action="UPLOAD_SIGNATURE", module="members", record_id=str(member.id),
        user=current_user, details=f"Uploaded signature for member {member.member_number}"
    )
    db.commit()

    return {
        "success": True,
        "message": "Signature uploaded successfully.",
        "secure_url": upload_res["secure_url"],
        "public_id": upload_res["public_id"],
        "document": MemberDocumentResponse.model_validate(doc)
    }


@router.delete("/{member_id}/signature")
def delete_member_signature(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("members.update"))
) -> Any:
    """Deletes member signature from Cloudinary and PostgreSQL."""
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    if member.signature_public_id:
        CloudinaryService.delete(member.signature_public_id, resource_type="image")

    member.signature_url = None
    member.signature_public_id = None

    db.query(MemberDocument).filter(
        MemberDocument.member_id == member.id,
        MemberDocument.document_category == "SIGNATURE"
    ).delete()

    db.commit()

    AuditService.log(
        db, action="DELETE_SIGNATURE", module="members", record_id=str(member.id),
        user=current_user, details=f"Removed signature for member {member.member_number}"
    )
    db.commit()

    return {"success": True, "message": "Signature deleted successfully."}


@router.post("/{member_id}/documents")
def upload_member_document(
    member_id: int,
    file: UploadFile = File(...),
    document_type: str = Form("National ID"),
    document_category: str = Form("NID_FRONT"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("members.update"))
) -> Any:
    """
    Uploads or replaces Member document (NID Front, NID Back, Birth Certificate, etc.) in Cloudinary.
    Folder:
      - foundation/members/{member_id}/documents/nid-front
      - foundation/members/{member_id}/documents/nid-back
      - foundation/members/{member_id}/documents/birth-certificate
      - foundation/members/{member_id}/documents/other
    """
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    category_norm = document_category.upper().strip()
    file_bytes, clean_filename, mime_type = CloudinaryService.validate_file(file, category=category_norm)

    folder_map = {
        "NID_FRONT": f"foundation/members/{member.id}/documents/nid-front",
        "NID_BACK": f"foundation/members/{member.id}/documents/nid-back",
        "BIRTH_CERTIFICATE": f"foundation/members/{member.id}/documents/birth-certificate"
    }
    folder = folder_map.get(category_norm, f"foundation/members/{member.id}/documents/other")
    resource_type = "auto"

    # Check for existing document in this category to safely replace
    existing_doc = db.query(MemberDocument).filter(
        MemberDocument.member_id == member.id,
        MemberDocument.document_category == category_norm
    ).first()

    old_public_id = existing_doc.cloudinary_public_id if existing_doc else None
    old_resource_type = existing_doc.resource_type if existing_doc else "auto"

    upload_res = CloudinaryService.replace(
        old_public_id=old_public_id,
        file_bytes=file_bytes,
        filename=clean_filename,
        folder=folder,
        resource_type=resource_type,
        old_resource_type=old_resource_type
    )

    # Update Member shortcuts
    member.document_type = document_type
    if category_norm == "NID_FRONT":
        member.nid_front_url = upload_res["secure_url"]
        member.nid_front_public_id = upload_res["public_id"]
    elif category_norm == "NID_BACK":
        member.nid_back_url = upload_res["secure_url"]
        member.nid_back_public_id = upload_res["public_id"]
    elif category_norm == "BIRTH_CERTIFICATE":
        member.birth_certificate_url = upload_res["secure_url"]
        member.birth_certificate_public_id = upload_res["public_id"]

    if not existing_doc:
        doc = MemberDocument(
            member_id=member.id,
            document_type=document_type,
            document_category=category_norm,
            uploaded_by=current_user.id
        )
        db.add(doc)
    else:
        doc = existing_doc
        doc.document_type = document_type

    doc.cloudinary_public_id = upload_res["public_id"]
    doc.secure_url = upload_res["secure_url"]
    doc.resource_type = upload_res["resource_type"]
    doc.format = upload_res.get("format")
    doc.file_size = upload_res.get("bytes")
    doc.width = upload_res.get("width")
    doc.height = upload_res.get("height")
    doc.original_filename = clean_filename
    doc.mime_type = mime_type
    doc.uploaded_by = current_user.id

    db.commit()
    db.refresh(member)
    db.refresh(doc)

    AuditService.log(
        db, action="UPLOAD_DOCUMENT", module="members", record_id=str(member.id),
        user=current_user, details=f"Uploaded {category_norm} document for member {member.member_number}"
    )
    db.commit()

    return {
        "success": True,
        "message": f"{category_norm} document uploaded successfully.",
        "document": MemberDocumentResponse.model_validate(doc)
    }


@router.get("/{member_id}/documents", response_model=List[MemberDocumentResponse])
def get_member_documents(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("members.view"))
) -> Any:
    """Lists all stored documents with Cloudinary metadata for a Member."""
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    
    docs = db.query(MemberDocument).filter(MemberDocument.member_id == member.id).order_by(MemberDocument.id.desc()).all()
    return docs


@router.delete("/{member_id}/documents/{document_id}")
def delete_member_document(
    member_id: int,
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("members.update"))
) -> Any:
    """Deletes a document from Cloudinary and PostgreSQL."""
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    doc = db.query(MemberDocument).filter(
        MemberDocument.id == document_id,
        MemberDocument.member_id == member.id
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # Delete from Cloudinary
    if doc.cloudinary_public_id:
        CloudinaryService.delete(doc.cloudinary_public_id, resource_type=doc.resource_type)

    # Clear Member shortcut if matching
    if doc.document_category == "NID_FRONT" and member.nid_front_public_id == doc.cloudinary_public_id:
        member.nid_front_url = None
        member.nid_front_public_id = None
    elif doc.document_category == "NID_BACK" and member.nid_back_public_id == doc.cloudinary_public_id:
        member.nid_back_url = None
        member.nid_back_public_id = None
    elif doc.document_category == "BIRTH_CERTIFICATE" and member.birth_certificate_public_id == doc.cloudinary_public_id:
        member.birth_certificate_url = None
        member.birth_certificate_public_id = None
    elif doc.document_category == "PHOTO" and member.photo_public_id == doc.cloudinary_public_id:
        member.photo_url = None
        member.photo_public_id = None
    elif doc.document_category == "SIGNATURE" and member.signature_public_id == doc.cloudinary_public_id:
        member.signature_url = None
        member.signature_public_id = None

    db.delete(doc)
    db.commit()

    AuditService.log(
        db, action="DELETE_DOCUMENT", module="members", record_id=str(member.id),
        user=current_user, details=f"Deleted document {document_id} ({doc.document_category}) for member {member.member_number}"
    )
    db.commit()

    return {"success": True, "message": "Document deleted successfully."}
