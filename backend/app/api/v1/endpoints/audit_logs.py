from typing import List, Any, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.audit_log import AuditLog
from backend.app.models.user import User
from backend.app.schemas.audit_log import AuditLogResponse
from backend.app.schemas.common import PaginatedResponse
from backend.app.api.deps import require_permission

router = APIRouter()


@router.get("", response_model=PaginatedResponse[AuditLogResponse])
def get_audit_logs(
    module: Optional[str] = None,
    action: Optional[str] = None,
    user_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("audit.view"))
) -> Any:
    query = db.query(AuditLog)
    if module:
        query = query.filter(AuditLog.module == module)
    if action:
        query = query.filter(AuditLog.action == action.upper())
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)

    total = query.count()
    items = query.order_by(AuditLog.timestamp.desc(), AuditLog.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }
