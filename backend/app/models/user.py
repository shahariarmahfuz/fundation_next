from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.base import TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(150), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="SET NULL"), nullable=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)

    role = relationship("Role", back_populates="users", lazy="joined")
    audit_logs = relationship("AuditLog", back_populates="user")

    def has_permission(self, permission_code: str) -> bool:
        if self.is_superuser:
            return True
        if not self.role:
            return False
        user_perms = {p.code for p in self.role.permissions}
        if permission_code in user_perms:
            return True
        # Module-level manage fallback (e.g. roles.manage grants roles.view, roles.create, etc.)
        if "." in permission_code:
            module = permission_code.split(".")[0]
            if f"{module}.manage" in user_perms:
                return True
        # Common module aliases
        aliases = {
            "sadaqah.view": ["sadakah.view"],
            "sadaqah.create": ["sadakah.create"],
            "sadaqah.update": ["sadakah.update"],
            "sadaqah.delete": ["sadakah.delete"],
            "qard_hasan.repay": ["qard_hasan.repayment"],
            "qard_hasan.repayment": ["qard_hasan.repay"],
            "organization.view": ["settings.manage"],
            "organization.update": ["settings.manage"],
        }
        for alias in aliases.get(permission_code, []):
            if alias in user_perms:
                return True
        return False
