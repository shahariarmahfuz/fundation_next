from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.audit_log import AuditLog
from backend.app.models.user import User


class AuditService:
    @staticmethod
    def log(
        db: Session,
        action: str,
        module: str,
        record_id: Optional[str] = None,
        user: Optional[User] = None,
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        details: Optional[str] = None
    ) -> AuditLog:
        audit_entry = AuditLog(
            user_id=user.id if user else None,
            user_email=user.email if user else None,
            action=action.upper(),
            module=module.lower(),
            record_id=str(record_id) if record_id is not None else None,
            timestamp=datetime.now(timezone.utc),
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            details=details
        )
        db.add(audit_entry)
        db.flush()
        return audit_entry
