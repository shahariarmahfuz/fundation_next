from datetime import date
from decimal import Decimal
from typing import List, Any, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.beneficiary import Beneficiary
from backend.app.models.group import Group
from backend.app.models.transaction import FinancialTransaction
from backend.app.models.qard_hasan import QardHasan, QardRepayment
from backend.app.models.sadakah import Sadakah
from backend.app.models.user import User
from backend.app.schemas.beneficiary import (
    BeneficiaryResponse,
    BeneficiaryCreate,
    BeneficiaryUpdate,
    BeneficiaryLedgerResponse,
    BeneficiaryLedgerItem,
    BeneficiaryLedgerSummary
)
from backend.app.schemas.common import PaginatedResponse
from backend.app.api.deps import require_permission, get_current_user
from backend.app.services.audit_service import AuditService
from backend.app.services.code_service import CodeService

router = APIRouter()


def populate_beneficiary_metrics(db: Session, b: Beneficiary) -> BeneficiaryResponse:
    qard_stats = db.query(
        func.coalesce(func.sum(QardHasan.principal_amount), Decimal("0.00")).label("principal"),
        func.coalesce(func.sum(QardHasan.total_repaid), Decimal("0.00")).label("repaid"),
        func.coalesce(func.sum(QardHasan.outstanding_amount), Decimal("0.00")).label("outstanding")
    ).filter(QardHasan.beneficiary_id == b.id).first()

    sadakah_total = db.query(func.coalesce(func.sum(Sadakah.amount), Decimal("0.00"))).filter(
        Sadakah.beneficiary_id == b.id
    ).scalar() or Decimal("0.00")

    resp = BeneficiaryResponse.model_validate(b)
    resp.total_qard_received = qard_stats.principal if qard_stats else Decimal("0.00")
    resp.total_qard_repaid = qard_stats.repaid if qard_stats else Decimal("0.00")
    resp.total_qard_outstanding = qard_stats.outstanding if qard_stats else Decimal("0.00")
    resp.total_sadakah_received = sadakah_total
    return resp


@router.get("", response_model=PaginatedResponse[BeneficiaryResponse])
def get_beneficiaries(
    search: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("beneficiaries.view"))
) -> Any:
    query = db.query(Beneficiary)
    if status:
        query = query.filter(Beneficiary.status == status)
    if search:
        s = f"%{search}%"
        query = query.filter(
            or_(
                Beneficiary.name.ilike(s),
                Beneficiary.beneficiary_number.ilike(s),
                Beneficiary.phone.ilike(s)
            )
        )

    total = query.count()
    items = query.order_by(Beneficiary.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": [populate_beneficiary_metrics(db, b) for b in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.get("/ledger", response_model=BeneficiaryLedgerResponse)
def get_beneficiary_ledger(
    beneficiary_id: Optional[int] = None,
    aid_type: Optional[str] = None,
    group_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("beneficiaries.view"))
) -> Any:
    """
    Returns unified Beneficiary Financial Ledger containing all Sadakah grants and
    Qard Hasan disbursements/repayments with summary statistics and multi-parameter filtering.
    """
    query = db.query(FinancialTransaction, Beneficiary, Group, User).join(
        Beneficiary, Beneficiary.id == FinancialTransaction.related_entity_id
    ).join(
        Group, Group.id == FinancialTransaction.group_id
    ).outerjoin(
        User, User.id == FinancialTransaction.created_by_id
    ).filter(
        FinancialTransaction.related_entity_type == "beneficiary"
    )

    if beneficiary_id:
        query = query.filter(FinancialTransaction.related_entity_id == beneficiary_id)
    if group_id:
        query = query.filter(FinancialTransaction.group_id == group_id)
    if date_from:
        query = query.filter(func.date(FinancialTransaction.transaction_date) >= date_from)
    if date_to:
        query = query.filter(func.date(FinancialTransaction.transaction_date) <= date_to)

    if aid_type and aid_type.upper() != "ALL":
        norm_type = aid_type.upper()
        if norm_type in ["SADAKAH", "SADAQAH"]:
            query = query.filter(FinancialTransaction.transaction_type == "SADAKAH")
        elif norm_type in ["QARD_HASAN", "QARD"]:
            query = query.filter(FinancialTransaction.transaction_type.in_(["QARD_HASAN_DISBURSEMENT", "QARD_HASAN_REPAYMENT"]))
        elif norm_type in ["QARD_DISBURSEMENT", "DISBURSEMENT", "QARD_HASAN_DISBURSEMENT"]:
            query = query.filter(FinancialTransaction.transaction_type == "QARD_HASAN_DISBURSEMENT")
        elif norm_type in ["QARD_REPAYMENT", "REPAYMENT", "QARD_HASAN_REPAYMENT"]:
            query = query.filter(FinancialTransaction.transaction_type == "QARD_HASAN_REPAYMENT")

    if search:
        s = f"%{search}%"
        query = query.filter(
            or_(
                Beneficiary.name.ilike(s),
                Beneficiary.beneficiary_number.ilike(s),
                FinancialTransaction.transaction_number.ilike(s),
                FinancialTransaction.description.ilike(s),
                FinancialTransaction.reference.ilike(s)
            )
        )

    # Compute overall summary metrics across matching transactions
    summary_results = query.with_entities(
        FinancialTransaction.transaction_type,
        FinancialTransaction.flow_type,
        func.sum(FinancialTransaction.amount)
    ).group_by(
        FinancialTransaction.transaction_type,
        FinancialTransaction.flow_type
    ).all()

    total_sadakah = Decimal("0.00")
    total_qard_disbursed = Decimal("0.00")
    total_qard_repaid = Decimal("0.00")

    for t_type, f_type, amt_sum in summary_results:
        amount = amt_sum or Decimal("0.00")
        if t_type == "SADAKAH":
            total_sadakah += amount
        elif t_type == "QARD_HASAN_DISBURSEMENT":
            total_qard_disbursed += amount
        elif t_type == "QARD_HASAN_REPAYMENT":
            total_qard_repaid += amount

    total_aid_disbursed = total_sadakah + total_qard_disbursed
    net_qard_outstanding = total_qard_disbursed - total_qard_repaid

    summary = BeneficiaryLedgerSummary(
        total_aid_disbursed=total_aid_disbursed,
        total_sadakah=total_sadakah,
        total_qard_disbursed=total_qard_disbursed,
        total_qard_repaid=total_qard_repaid,
        net_qard_outstanding=net_qard_outstanding
    )

    total = query.count()
    rows = query.order_by(
        FinancialTransaction.transaction_date.desc(),
        FinancialTransaction.id.desc()
    ).offset((page - 1) * page_size).limit(page_size).all()

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    items = []
    for txn, ben, grp, usr in rows:
        items.append(BeneficiaryLedgerItem(
            id=txn.id,
            transaction_number=txn.transaction_number,
            transaction_date=txn.transaction_date,
            transaction_type=txn.transaction_type,
            flow_type=txn.flow_type,
            amount=txn.amount,
            balance_after=txn.balance_after,
            description=txn.description,
            payment_method=txn.payment_method,
            reference=txn.reference,
            beneficiary_id=ben.id,
            beneficiary_name=ben.name,
            beneficiary_number=ben.beneficiary_number,
            group_id=grp.id,
            group_name=grp.name,
            group_code=grp.code,
            created_by_name=usr.full_name or usr.username if usr else None,
            is_reversed=txn.is_reversed
        ))

    return BeneficiaryLedgerResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        summary=summary
    )


@router.get("/{beneficiary_id}", response_model=BeneficiaryResponse)
def get_beneficiary(
    beneficiary_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("beneficiaries.view"))
) -> Any:
    b = db.query(Beneficiary).filter(Beneficiary.id == beneficiary_id).first()
    if not b:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Beneficiary not found")
    return populate_beneficiary_metrics(db, b)


@router.get("/{beneficiary_id}/assistance-history")
def get_beneficiary_history(
    beneficiary_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("beneficiaries.view"))
) -> Any:
    b = db.query(Beneficiary).filter(Beneficiary.id == beneficiary_id).first()
    if not b:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Beneficiary not found")

    qards = db.query(QardHasan).filter(QardHasan.beneficiary_id == b.id).all()
    repayments = db.query(QardRepayment).filter(QardRepayment.beneficiary_id == b.id).all()
    sadakahs = db.query(Sadakah).filter(Sadakah.beneficiary_id == b.id).all()

    return {
        "beneficiary": populate_beneficiary_metrics(db, b),
        "qard_hasan_loans": qards,
        "qard_repayments": repayments,
        "sadakah_grants": sadakahs
    }


@router.post("", response_model=BeneficiaryResponse)
def create_beneficiary(
    ben_in: BeneficiaryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("beneficiaries.create"))
) -> Any:
    input_code = ben_in.code or ben_in.beneficiary_number
    b_num = CodeService.process_beneficiary_code(db, code=input_code)

    b = Beneficiary(
        beneficiary_number=b_num,
        name=ben_in.name,
        phone=ben_in.phone,
        email=ben_in.email,
        address=ben_in.address,
        nid_or_id=ben_in.nid_or_id,
        status=ben_in.status,
        notes=ben_in.notes
    )
    db.add(b)
    db.commit()
    db.refresh(b)

    AuditService.log(
        db, action="CREATE", module="beneficiaries", record_id=str(b.id),
        user=current_user, new_values={"name": b.name, "beneficiary_number": b.beneficiary_number}
    )
    db.commit()
    return populate_beneficiary_metrics(db, b)


@router.put("/{beneficiary_id}", response_model=BeneficiaryResponse)
def update_beneficiary(
    beneficiary_id: int,
    ben_in: BeneficiaryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("beneficiaries.update"))
) -> Any:
    b = db.query(Beneficiary).filter(Beneficiary.id == beneficiary_id).first()
    if not b:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Beneficiary not found")

    old_vals = {
        "beneficiary_number": b.beneficiary_number,
        "name": b.name,
        "phone": b.phone,
        "status": b.status
    }

    input_code = ben_in.code or ben_in.beneficiary_number
    if input_code is not None and input_code.strip() and input_code.strip().upper() != b.beneficiary_number.upper():
        new_code = CodeService.process_beneficiary_code(db, code=input_code, exclude_id=b.id)
        b.beneficiary_number = new_code

    if ben_in.name is not None:
        b.name = ben_in.name
    if ben_in.phone is not None:
        b.phone = ben_in.phone
    if ben_in.email is not None:
        b.email = ben_in.email
    if ben_in.address is not None:
        b.address = ben_in.address
    if ben_in.nid_or_id is not None:
        b.nid_or_id = ben_in.nid_or_id
    if ben_in.status is not None:
        b.status = ben_in.status
    if ben_in.notes is not None:
        b.notes = ben_in.notes

    db.commit()
    db.refresh(b)

    AuditService.log(
        db, action="UPDATE", module="beneficiaries", record_id=str(b.id),
        user=current_user, old_values=old_vals,
        new_values={
            "beneficiary_number": b.beneficiary_number,
            "name": b.name,
            "phone": b.phone,
            "status": b.status
        }
    )
    db.commit()
    return populate_beneficiary_metrics(db, b)


@router.delete("/{beneficiary_id}")
def delete_beneficiary(
    beneficiary_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("beneficiaries.delete"))
) -> Any:
    b = db.query(Beneficiary).filter(Beneficiary.id == beneficiary_id).first()
    if not b:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Beneficiary not found")

    # Check for historical Qard Hasan or Sadakah assistance
    has_qard = db.query(QardHasan).filter(QardHasan.beneficiary_id == b.id).first()
    has_sadakah = db.query(Sadakah).filter(Sadakah.beneficiary_id == b.id).first()

    if has_qard or has_sadakah:
        # Beneficiary has financial history - preserve records and archive
        b.status = "INACTIVE"
        db.commit()
        AuditService.log(
            db, action="ARCHIVE", module="beneficiaries", record_id=str(b.id),
            user=current_user, details=f"Beneficiary {b.beneficiary_number} ({b.name}) has financial assistance history. Safely archived and marked INACTIVE to preserve audit trail."
        )
        db.commit()
        return {
            "success": True,
            "archived": True,
            "message": f"Beneficiary {b.beneficiary_number} has historical assistance records (Qard Hasan/Sadakah). Safely archived and set to INACTIVE to preserve financial ledger records."
        }

    db.delete(b)
    db.commit()
    AuditService.log(
        db, action="DELETE", module="beneficiaries", record_id=str(beneficiary_id),
        user=current_user, details=f"Beneficiary {b.beneficiary_number} ({b.name}) permanently deleted."
    )
    db.commit()
    return {"success": True, "archived": False, "message": f"Beneficiary {b.beneficiary_number} deleted successfully."}
