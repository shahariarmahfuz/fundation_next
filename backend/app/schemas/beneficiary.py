from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, EmailStr, model_validator


class BeneficiaryBase(BaseModel):
    beneficiary_number: Optional[str] = None
    code: Optional[str] = None
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    nid_or_id: Optional[str] = None
    status: str = "ACTIVE"
    notes: Optional[str] = None

    # Optional Personal Information
    father_or_husband_name: Optional[str] = None
    present_address: Optional[str] = None
    permanent_address: Optional[str] = None

    # Optional Emergency Contact
    emergency_contact_name: Optional[str] = None
    emergency_contact_relation: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

    # Optional Documents
    photo_url: Optional[str] = None
    signature_url: Optional[str] = None
    id_document_type: Optional[str] = None
    nid_front_url: Optional[str] = None
    nid_back_url: Optional[str] = None


class BeneficiaryCreate(BeneficiaryBase):
    pass


class BeneficiaryUpdate(BaseModel):
    beneficiary_number: Optional[str] = None
    code: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    nid_or_id: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

    # Optional Personal Information
    father_or_husband_name: Optional[str] = None
    present_address: Optional[str] = None
    permanent_address: Optional[str] = None

    # Optional Emergency Contact
    emergency_contact_name: Optional[str] = None
    emergency_contact_relation: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

    # Optional Documents
    photo_url: Optional[str] = None
    signature_url: Optional[str] = None
    id_document_type: Optional[str] = None
    nid_front_url: Optional[str] = None
    nid_back_url: Optional[str] = None


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


class BeneficiaryLedgerItem(BaseModel):
    id: int
    transaction_number: str
    transaction_date: datetime
    transaction_type: str  # SADAKAH, QARD_HASAN_DISBURSEMENT, QARD_HASAN_REPAYMENT
    flow_type: str  # INFLOW, OUTFLOW
    amount: Decimal
    balance_after: Decimal
    description: str
    payment_method: str
    reference: Optional[str] = None
    beneficiary_id: int
    beneficiary_name: str
    beneficiary_number: str
    group_id: int
    group_name: str
    group_code: Optional[str] = None
    created_by_name: Optional[str] = None
    is_reversed: bool = False


class BeneficiaryLedgerSummary(BaseModel):
    total_aid_disbursed: Decimal
    total_sadakah: Decimal
    total_qard_disbursed: Decimal
    total_qard_repaid: Decimal
    net_qard_outstanding: Decimal


class BeneficiaryLedgerResponse(BaseModel):
    items: list[BeneficiaryLedgerItem]
    total: int
    page: int
    page_size: int
    total_pages: int
    summary: BeneficiaryLedgerSummary

