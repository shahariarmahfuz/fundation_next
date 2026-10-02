from decimal import Decimal
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.cache import cache
from backend.app.models.group import Group
from backend.app.models.member import Member
from backend.app.models.transaction import FinancialTransaction
from backend.app.models.qard_hasan import QardHasan
from backend.app.models.user import User
from backend.app.schemas.group import GroupResponse, GroupCreate, GroupUpdate, GroupTransferCreate, GroupTransferResponse
from backend.app.api.deps import require_permission, get_current_user
from backend.app.services.accounting_service import AccountingService
from backend.app.services.audit_service import AuditService

router = APIRouter()


def populate_group_metrics(db: Session, group: Group) -> GroupResponse:
    balance = AccountingService.get_group_current_balance(db, group.id)
    
    inflows = db.query(func.coalesce(func.sum(FinancialTransaction.amount), Decimal("0.00"))).filter(
        FinancialTransaction.group_id == group.id,
        FinancialTransaction.flow_type == "INFLOW"
    ).scalar() or Decimal("0.00")

    outflows = db.query(func.coalesce(func.sum(FinancialTransaction.amount), Decimal("0.00"))).filter(
        FinancialTransaction.group_id == group.id,
        FinancialTransaction.flow_type == "OUTFLOW"
    ).scalar() or Decimal("0.00")

    members_count = db.query(Member).filter(Member.group_id == group.id, Member.status == "ACTIVE").count()
    
    qard_outstanding = db.query(func.coalesce(func.sum(QardHasan.outstanding_amount), Decimal("0.00"))).filter(
        QardHasan.group_id == group.id,
        QardHasan.status == "ACTIVE"
    ).scalar() or Decimal("0.00")

    resp = GroupResponse.model_validate(group)
    resp.current_balance = balance
    resp.total_income = inflows
    resp.total_expense = outflows
    resp.total_members = members_count
    resp.total_qard_outstanding = qard_outstanding
    return resp


@router.get("", response_model=List[GroupResponse])
def get_groups(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("groups.view"))
) -> Any:
    query = db.query(Group)
    if status:
        query = query.filter(Group.status == status)
    groups = query.order_by(Group.id).all()
    return [populate_group_metrics(db, g) for g in groups]


@router.get("/{group_id}", response_model=GroupResponse)
def get_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("groups.view"))
) -> Any:
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    return populate_group_metrics(db, group)


@router.post("", response_model=GroupResponse)
def create_group(
    group_in: GroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("groups.create"))
) -> Any:
    existing = db.query(Group).filter(
        (Group.code == group_in.code) | (Group.name == group_in.name)
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Group code or name already exists")

    group = Group(
        code=group_in.code.upper(),
        name=group_in.name,
        description=group_in.description,
        status=group_in.status,
        opening_balance=group_in.opening_balance
    )
    db.add(group)
    db.commit()
    db.refresh(group)

    cache.invalidate_financial_caches()
    AuditService.log(
        db, action="CREATE", module="groups", record_id=str(group.id),
        user=current_user, new_values={"name": group.name, "code": group.code, "opening_balance": str(group.opening_balance)}
    )
    db.commit()
    return populate_group_metrics(db, group)


@router.put("/{group_id}", response_model=GroupResponse)
def update_group(
    group_id: int,
    group_in: GroupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("groups.update"))
) -> Any:
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    old_vals = {"name": group.name, "code": group.code, "status": group.status}

    if group_in.code and group_in.code != group.code:
        existing = db.query(Group).filter(Group.code == group_in.code).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Group code already in use")
        group.code = group_in.code.upper()

    if group_in.name and group_in.name != group.name:
        existing = db.query(Group).filter(Group.name == group_in.name).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Group name already in use")
        group.name = group_in.name

    if group_in.description is not None:
        group.description = group_in.description
    if group_in.status is not None:
        group.status = group_in.status

    db.commit()
    db.refresh(group)
    cache.invalidate_financial_caches(group.id)
    AuditService.log(
        db, action="UPDATE", module="groups", record_id=str(group.id),
        user=current_user, old_values=old_vals,
        new_values={"name": group.name, "code": group.code, "status": group.status}
    )
    db.commit()
    return populate_group_metrics(db, group)


@router.post("/transfer", response_model=GroupTransferResponse)
def transfer_group_funds(
    transfer_in: GroupTransferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("groups.update"))
) -> Any:
    """
    Transfers funds atomically between two foundation accounting groups.
    Creates paired TRANSFER_OUT and TRANSFER_IN double-entry transactions.
    """
    outflow_txn, inflow_txn = AccountingService.transfer_funds(
        db=db,
        source_group_id=transfer_in.source_group_id,
        destination_group_id=transfer_in.destination_group_id,
        amount=transfer_in.amount,
        notes=transfer_in.notes,
        user_id=current_user.id,
        payment_method=transfer_in.payment_method
    )
    db.commit()

    src_bal = AccountingService.get_group_current_balance(db, transfer_in.source_group_id)
    dest_bal = AccountingService.get_group_current_balance(db, transfer_in.destination_group_id)

    AuditService.log(
        db, action="TRANSFER", module="groups",
        record_id=f"{transfer_in.source_group_id}->{transfer_in.destination_group_id}",
        user=current_user,
        details=f"Transferred ৳{transfer_in.amount:,.2f} from Group {transfer_in.source_group_id} to Group {transfer_in.destination_group_id}. Notes: {transfer_in.notes or 'None'}"
    )
    db.commit()

    return GroupTransferResponse(
        success=True,
        transfer_amount=transfer_in.amount,
        source_group_id=transfer_in.source_group_id,
        source_group_new_balance=src_bal,
        destination_group_id=transfer_in.destination_group_id,
        destination_group_new_balance=dest_bal,
        outflow_transaction_number=outflow_txn.transaction_number,
        inflow_transaction_number=inflow_txn.transaction_number,
        message=f"Successfully transferred ৳{transfer_in.amount:,.2f}"
    )
