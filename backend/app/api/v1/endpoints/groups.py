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


def populate_groups_metrics_batch(db: Session, groups: List[Group]) -> List[GroupResponse]:
    if not groups:
        return []

    group_ids = [g.id for g in groups]

    # 1. Batched transaction sums (inflow & outflow) by group_id
    tx_rows = db.query(
        FinancialTransaction.group_id,
        FinancialTransaction.flow_type,
        func.coalesce(func.sum(FinancialTransaction.amount), Decimal("0.00"))
    ).filter(
        FinancialTransaction.group_id.in_(group_ids)
    ).group_by(
        FinancialTransaction.group_id,
        FinancialTransaction.flow_type
    ).all()

    inflows_by_group: dict[int, Decimal] = {}
    outflows_by_group: dict[int, Decimal] = {}
    for gid, ftype, amt in tx_rows:
        if ftype == "INFLOW":
            inflows_by_group[gid] = amt
        elif ftype == "OUTFLOW":
            outflows_by_group[gid] = amt

    # 2. Batched active member count by group_id
    mem_rows = db.query(
        Member.group_id,
        func.count(Member.id)
    ).filter(
        Member.group_id.in_(group_ids),
        Member.status == "ACTIVE"
    ).group_by(
        Member.group_id
    ).all()
    members_by_group: dict[int, int] = dict(mem_rows)

    # 3. Batched active Qard Hasan outstanding by group_id
    qard_rows = db.query(
        QardHasan.group_id,
        func.coalesce(func.sum(QardHasan.outstanding_amount), Decimal("0.00"))
    ).filter(
        QardHasan.group_id.in_(group_ids),
        QardHasan.status == "ACTIVE"
    ).group_by(
        QardHasan.group_id
    ).all()
    qard_by_group: dict[int, Decimal] = dict(qard_rows)

    results: List[GroupResponse] = []
    for g in groups:
        inflow = inflows_by_group.get(g.id, Decimal("0.00"))
        outflow = outflows_by_group.get(g.id, Decimal("0.00"))
        opening = g.opening_balance if g.opening_balance is not None else Decimal("0.00")
        balance = opening + inflow - outflow

        resp = GroupResponse.model_validate(g)
        resp.current_balance = balance
        resp.total_income = inflow
        resp.total_expense = outflow
        resp.total_members = members_by_group.get(g.id, 0)
        resp.total_qard_outstanding = qard_by_group.get(g.id, Decimal("0.00"))
        results.append(resp)

    return results


def populate_group_metrics(db: Session, group: Group) -> GroupResponse:
    batch = populate_groups_metrics_batch(db, [group])
    return batch[0]


@router.get("", response_model=List[GroupResponse])
def get_groups(
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("groups.view"))
) -> Any:
    # Check cache for fast response
    clean_status = (status or "").strip().upper()
    clean_search = (search or "").strip()
    cache_key = f"groups:list:{clean_status or 'all'}:{clean_search or 'none'}"
    cached = cache.get(cache_key)
    if cached is not None:
        try:
            return [GroupResponse.model_validate(item) for item in cached]
        except Exception:
            pass

    query = db.query(Group)
    if clean_status and clean_status not in ("ALL", ""):
        query = query.filter(Group.status == clean_status)

    if clean_search:
        search_pattern = f"%{clean_search}%"
        query = query.filter(
            (Group.code.ilike(search_pattern)) |
            (Group.name.ilike(search_pattern)) |
            (Group.description.ilike(search_pattern))
        )

    groups = query.order_by(Group.id).all()
    results = populate_groups_metrics_batch(db, groups)

    # Cache for 60 seconds
    try:
        cache.set(cache_key, [r.model_dump(mode="json") for r in results], expire_seconds=60)
    except Exception:
        pass

    return results


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


@router.delete("/{group_id}")
def delete_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("groups.delete"))
) -> Any:
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    # Check for active members or financial transactions
    has_members = db.query(Member).filter(Member.group_id == group.id).first()
    has_transactions = db.query(FinancialTransaction).filter(FinancialTransaction.group_id == group.id).first()

    if has_transactions or has_members:
        # Group is a financial entity with historical transactions or members - NEVER hard delete
        group.status = "INACTIVE"
        db.commit()
        cache.invalidate_financial_caches(group.id)
        AuditService.log(
            db, action="ARCHIVE", module="groups", record_id=str(group.id),
            user=current_user, details=f"Group {group.name} ({group.code}) has linked financial transactions or members. Soft-archived and set to INACTIVE to preserve double-entry accounting ledger."
        )
        db.commit()
        return {
            "success": True,
            "archived": True,
            "message": f"Group '{group.name}' has active members or financial transactions. Safely archived (status set to INACTIVE) to protect double-entry ledger history."
        }

    db.delete(group)
    db.commit()
    cache.invalidate_financial_caches()
    AuditService.log(
        db, action="DELETE", module="groups", record_id=str(group_id),
        user=current_user, details=f"Group {group.code} ({group.name}) permanently deleted."
    )
    db.commit()
    return {"success": True, "archived": False, "message": f"Group '{group.name}' deleted successfully."}
