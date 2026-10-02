from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, EmailStr, model_validator


class BeneficiaryBase(BaseModel):
    beneficiary_number: Optional[str] = None
    code: Optional[str] = None
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
    beneficiary_number: Optional[str] = None
    code: Optional[str] = None
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
    code: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    total_qard_received: Optional[Decimal] = None
    total_qard_repaid: Optional[Decimal] = None
    total_qard_outstanding: Optional[Decimal] = None
    total_sadakah_received: Optional[Decimal] = None

    @model_validator(mode="after")
    def populate_code(self):
        if not self.code and self.beneficiary_number:
            self.code = self.beneficiary_number
        elif not self.beneficiary_number and self.code:
            self.beneficiary_number = self.code
        return self
