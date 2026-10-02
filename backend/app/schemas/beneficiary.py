from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, EmailStr


class BeneficiaryBase(BaseModel):
    name: str
    phone: str
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    nid_or_id: Optional[str] = None
    status: str = "ACTIVE"
    notes: Optional[str] = None


class BeneficiaryCreate(BeneficiaryBase):
    pass


class BeneficiaryUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    nid_or_id: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class BeneficiaryResponse(BeneficiaryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    beneficiary_number: str
    created_at: datetime
    updated_at: datetime
    total_qard_received: Optional[Decimal] = None
    total_qard_repaid: Optional[Decimal] = None
    total_qard_outstanding: Optional[Decimal] = None
    total_sadakah_received: Optional[Decimal] = None
