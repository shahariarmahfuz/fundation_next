import re
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import text, func
from sqlalchemy.orm import Session

from backend.app.models.member import Member
from backend.app.models.group import Group
from backend.app.models.beneficiary import Beneficiary


class CodeService:
    ENTITY_MEMBER = "MEMBER"
    ENTITY_GROUP = "GROUP"
    ENTITY_BENEFICIARY = "BENEFICIARY"

    PREFIX_MAP = {
        ENTITY_MEMBER: "M-",
        ENTITY_GROUP: "G-",
        ENTITY_BENEFICIARY: "B-",
    }

    SEQUENCE_MAP = {
        ENTITY_MEMBER: "member_code_seq",
        ENTITY_GROUP: "group_code_seq",
        ENTITY_BENEFICIARY: "beneficiary_code_seq",
    }

    @classmethod
    def init_sequences(cls, db: Session) -> None:
        """
        Ensures dedicated PostgreSQL sequences exist for Member, Group, and Beneficiary.
        """
        bind = db.get_bind()
        if bind.dialect.name == "postgresql":
            db.execute(text("CREATE SEQUENCE IF NOT EXISTS member_code_seq START WITH 1;"))
            db.execute(text("CREATE SEQUENCE IF NOT EXISTS group_code_seq START WITH 1;"))
            db.execute(text("CREATE SEQUENCE IF NOT EXISTS beneficiary_code_seq START WITH 1;"))
            db.commit()

    @classmethod
    def _code_exists(cls, db: Session, entity_type: str, code: str, exclude_id: Optional[int] = None) -> bool:
        """
        Checks case-insensitively whether a code is already assigned to an entity.
        """
        norm_code = code.strip().upper()
        if entity_type == cls.ENTITY_MEMBER:
            q = db.query(Member.id).filter(func.upper(Member.member_number) == norm_code)
            if exclude_id is not None:
                q = q.filter(Member.id != exclude_id)
            return q.first() is not None
        elif entity_type == cls.ENTITY_GROUP:
            q = db.query(Group.id).filter(func.upper(Group.code) == norm_code)
            if exclude_id is not None:
                q = q.filter(Group.id != exclude_id)
            return q.first() is not None
        elif entity_type == cls.ENTITY_BENEFICIARY:
            q = db.query(Beneficiary.id).filter(func.upper(Beneficiary.beneficiary_number) == norm_code)
            if exclude_id is not None:
                q = q.filter(Beneficiary.id != exclude_id)
            return q.first() is not None
        return False

    @classmethod
    def _fallback_nextval(cls, db: Session, entity_type: str) -> int:
        """
        Fallback counter calculation if running on an engine without sequence support (e.g. SQLite tests).
        """
        prefix = cls.PREFIX_MAP[entity_type]
        if entity_type == cls.ENTITY_MEMBER:
            records = db.query(Member.member_number).all()
        elif entity_type == cls.ENTITY_GROUP:
            records = db.query(Group.code).all()
        elif entity_type == cls.ENTITY_BENEFICIARY:
            records = db.query(Beneficiary.beneficiary_number).all()
        else:
            records = []

        max_num = 0
        for (rec,) in records:
            if rec:
                m = re.match(rf"^{re.escape(prefix)}(\d+)$", rec, re.IGNORECASE)
                if m:
                    max_num = max(max_num, int(m.group(1)))
        return max_num + 1

    @classmethod
    def generate_code(cls, db: Session, entity_type: str) -> str:
        """
        Concurrency-safe generation of next serial code for the specified entity type.
        Format:
          - Member: M-0001, M-0002...
          - Group: G-0001, G-0002...
          - Beneficiary: B-0001, B-0002...
        Padded to minimum 4 digits (e.g. M-0001), expanding to 5+ digits if > 9999.
        Skips any numbers that are already taken.
        Dedicated independent sequence per entity type.
        """
        entity_key = entity_type.upper()
        if entity_key not in cls.PREFIX_MAP:
            raise ValueError(f"Unknown entity type: {entity_type}")

        prefix = cls.PREFIX_MAP[entity_key]
        seq_name = cls.SEQUENCE_MAP[entity_key]
        bind = db.get_bind()

        while True:
            if bind.dialect.name == "postgresql":
                seq_val = db.execute(text(f"SELECT nextval('{seq_name}')")).scalar()
            else:
                seq_val = cls._fallback_nextval(db, entity_key)

            candidate = f"{prefix}{seq_val:04d}"

            if not cls._code_exists(db, entity_key, candidate):
                return candidate

    @classmethod
    def validate_and_process_code(
        cls,
        db: Session,
        entity_type: str,
        code: Optional[str] = None,
        exclude_id: Optional[int] = None
    ) -> str:
        """
        Validates custom code if provided, or generates automatic next code if empty.
        Enforces:
        - Prefix matches M-, G-, or B-
        - Permitted characters: alphanumeric, hyphens, and underscores
        - Case-insensitivity (normalized to uppercase)
        - DB-level uniqueness (returns clean 400 Bad Request, never 500)
        """
        entity_key = entity_type.upper()
        if entity_key not in cls.PREFIX_MAP:
            raise ValueError(f"Unknown entity type: {entity_type}")

        prefix = cls.PREFIX_MAP[entity_key]
        entity_title = entity_type.capitalize()

        # If not provided or empty string / whitespace, generate automatically
        if not code or not code.strip():
            return cls.generate_code(db, entity_key)

        cleaned = code.strip().upper()

        # 1. Validate prefix
        if not cleaned.startswith(prefix):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{entity_title} code must start with prefix '{prefix}'"
            )

        # 2. Validate allowed pattern: e.g. M-0100, M-9999, G-5000, B-2026-001
        pattern = rf"^{re.escape(prefix)}[A-Z0-9_-]+$"
        if not re.match(pattern, cleaned):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid {entity_title} code format. After prefix '{prefix}', only alphanumeric characters, dashes, and underscores are allowed."
            )

        # 3. Validate uniqueness
        if cls._code_exists(db, entity_key, cleaned, exclude_id=exclude_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{entity_title} code already exists"
            )

        return cleaned

    # Convenience wrappers
    @classmethod
    def process_member_code(cls, db: Session, code: Optional[str] = None, exclude_id: Optional[int] = None) -> str:
        return cls.validate_and_process_code(db, cls.ENTITY_MEMBER, code=code, exclude_id=exclude_id)

    @classmethod
    def process_group_code(cls, db: Session, code: Optional[str] = None, exclude_id: Optional[int] = None) -> str:
        return cls.validate_and_process_code(db, cls.ENTITY_GROUP, code=code, exclude_id=exclude_id)

    @classmethod
    def process_beneficiary_code(cls, db: Session, code: Optional[str] = None, exclude_id: Optional[int] = None) -> str:
        return cls.validate_and_process_code(db, cls.ENTITY_BENEFICIARY, code=code, exclude_id=exclude_id)
