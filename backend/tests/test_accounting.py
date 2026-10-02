import uuid
from decimal import Decimal
import pytest
from backend.app.models.group import Group
from backend.app.models.member import Member
from backend.app.models.beneficiary import Beneficiary
from backend.app.models.expense import ExpenseCategory


def test_member_must_belong_to_group(client, auth_headers):
    # Attempt to create a member without a valid group
    payload = {
        "full_name": "Test Stray Member",
        "phone": "+880 1812345678",
        "monthly_contribution_amount": "500.00",
        "group_id": 99999  # Non-existent group
    }
    response = client.post("/api/v1/members", json=payload, headers=auth_headers)
    assert response.status_code == 400
    assert "Assigned group does not exist" in response.json()["error"]["message"]


def test_complete_accounting_cycle(client, auth_headers):
    # 1. Create a dedicated test Group
    unique_id = uuid.uuid4().hex[:6].upper()
    group_payload = {
        "code": f"TST{unique_id}",
        "name": f"Test Accounting Group {unique_id}",
        "description": "Group for testing atomic accounting rules",
        "opening_balance": "10000.00",
        "status": "ACTIVE"
    }
    grp_resp = client.post("/api/v1/groups", json=group_payload, headers=auth_headers)
    assert grp_resp.status_code == 200
    group_data = grp_resp.json()
    group_id = group_data["id"]
    initial_balance = Decimal(str(group_data["current_balance"]))
    assert initial_balance == Decimal("10000.00")

    # 2. Create a Member in this Group
    member_payload = {
        "full_name": "Rahim Uddin",
        "phone": f"+880 171{unique_id}",
        "monthly_contribution_amount": "500.00",
        "group_id": group_id,
        "status": "ACTIVE"
    }
    mem_resp = client.post("/api/v1/members", json=member_payload, headers=auth_headers)
    assert mem_resp.status_code == 200
    member_data = mem_resp.json()
    member_id = member_data["id"]
    assert member_data["group_id"] == group_id

    # 3. Test: Contribution increases Group balance
    contrib_payload = {
        "member_id": member_id,
        "contribution_month": "2026-01",
        "amount": "500.00",
        "payment_method": "BKASH",
        "reference": "TRX-BK-001"
    }
    con_resp = client.post("/api/v1/contributions", json=contrib_payload, headers=auth_headers)
    assert con_resp.status_code == 200
    assert con_resp.json()["status"] == "PAID"

    # Verify group balance increased by 500
    grp_check = client.get(f"/api/v1/groups/{group_id}", headers=auth_headers).json()
    assert Decimal(str(grp_check["current_balance"])) == Decimal("10500.00")

    cats = client.get("/api/v1/expense-categories", headers=auth_headers).json()
    cat_id = cats[0]["id"]
    expense_payload = {
        "category_id": cat_id,
        "group_id": group_id,
        "amount": "2000.00",
        "description": "Urgent Medical Assistance Test",
        "payment_method": "CASH"
    }
    exp_resp = client.post("/api/v1/expenses", json=expense_payload, headers=auth_headers)
    assert exp_resp.status_code == 200

    # Verify group balance decreased by 2000
    grp_check = client.get(f"/api/v1/groups/{group_id}", headers=auth_headers).json()
    assert Decimal(str(grp_check["current_balance"])) == Decimal("8500.00")

    # 5. Create a Beneficiary for Qard Hasan and Sadakah
    ben_payload = {
        "name": "Karim Mia",
        "phone": f"+880 182{unique_id}",
        "address": "Village Aid Center",
        "status": "ACTIVE"
    }
    ben_resp = client.post("/api/v1/beneficiaries", json=ben_payload, headers=auth_headers)
    assert ben_resp.status_code == 200
    beneficiary_id = ben_resp.json()["id"]

    # 6. Test: Qard Hasan decreases available Group balance and creates outstanding receivable (interest=0)
    qard_payload = {
        "group_id": group_id,
        "beneficiary_id": beneficiary_id,
        "principal_amount": "3000.00",
        "monthly_repayment_amount": "500.00",
        "repayment_schedule_notes": "6 months x ৳500 interest-free"
    }
    qard_resp = client.post("/api/v1/qard-hasan", json=qard_payload, headers=auth_headers)
    assert qard_resp.status_code == 200
    qard_data = qard_resp.json()
    qard_id = qard_data["id"]
    assert Decimal(str(qard_data["interest_rate"])) == Decimal("0.00")
    assert Decimal(str(qard_data["outstanding_amount"])) == Decimal("3000.00")
    assert Decimal(str(qard_data["total_repaid"])) == Decimal("0.00")

    # Group balance should decrease by 3000
    grp_check = client.get(f"/api/v1/groups/{group_id}", headers=auth_headers).json()
    assert Decimal(str(grp_check["current_balance"])) == Decimal("5500.00")

    # 7. Test: Overpayment of Qard is rejected
    overpay_payload = {
        "qard_hasan_id": qard_id,
        "amount": "3500.00",  # exceeds 3000.00 outstanding
        "payment_method": "CASH"
    }
    overpay_resp = client.post("/api/v1/qard-hasan/repayments", json=overpay_payload, headers=auth_headers)
    assert overpay_resp.status_code == 400
    assert "exceeds outstanding principal" in overpay_resp.json()["error"]["message"]

    # 8. Test: Qard repayment increases Group balance and reduces outstanding Qard
    repay_payload = {
        "qard_hasan_id": qard_id,
        "amount": "1000.00",
        "payment_method": "CASH",
        "reference": "REP-PARTIAL-001"
    }
    rep_resp = client.post("/api/v1/qard-hasan/repayments", json=repay_payload, headers=auth_headers)
    assert rep_resp.status_code == 200

    # Loan state check: outstanding should be 2000, total_repaid should be 1000
    qard_check = client.get(f"/api/v1/qard-hasan/{qard_id}", headers=auth_headers).json()
    assert Decimal(str(qard_check["outstanding_amount"])) == Decimal("2000.00")
    assert Decimal(str(qard_check["total_repaid"])) == Decimal("1000.00")
    assert qard_check["status"] == "ACTIVE"

    # Group balance should increase by 1000 (from 5500 to 6500)
    grp_check = client.get(f"/api/v1/groups/{group_id}", headers=auth_headers).json()
    assert Decimal(str(grp_check["current_balance"])) == Decimal("6500.00")

    # 9. Test: Sadakah decreases Group balance and creates no receivable
    sadakah_payload = {
        "group_id": group_id,
        "beneficiary_id": beneficiary_id,
        "amount": "1500.00",
        "description": "Emergency food and medicine grant",
        "payment_method": "CASH"
    }
    sad_resp = client.post("/api/v1/sadakah", json=sadakah_payload, headers=auth_headers)
    assert sad_resp.status_code == 200

    # Group balance should decrease by 1500 (from 6500 to 5000)
    grp_check = client.get(f"/api/v1/groups/{group_id}", headers=auth_headers).json()
    assert Decimal(str(grp_check["current_balance"])) == Decimal("5000.00")

    # 10. Test: Insufficient funds check prevents overdraft
    excess_exp_payload = {
        "category_id": cat_id,
        "group_id": group_id,
        "amount": "10000.00",  # Available is only 5000.00
        "description": "Overdraft test",
        "payment_method": "CASH"
    }
    excess_resp = client.post("/api/v1/expenses", json=excess_exp_payload, headers=auth_headers)
    assert excess_resp.status_code == 400
    assert "Insufficient funds in Group" in excess_resp.json()["error"]["message"]

    # Balance remains unchanged at 5000.00
    grp_check = client.get(f"/api/v1/groups/{group_id}", headers=auth_headers).json()
    assert Decimal(str(grp_check["current_balance"])) == Decimal("5000.00")

    # 11. Test: Group ledger running balance reconciles perfectly
    ledger_resp = client.get(f"/api/v1/ledgers/group/{group_id}", headers=auth_headers)
    assert ledger_resp.status_code == 200
    ledger_data = ledger_resp.json()

    assert Decimal(str(ledger_data["group"]["initial_opening_balance"])) == Decimal("10000.00")
    assert Decimal(str(ledger_data["group"]["authoritative_current_balance"])) == Decimal("5000.00")
    assert Decimal(str(ledger_data["period"]["period_closing_balance"])) == Decimal("5000.00")
    
    # Inflows: 500 (contribution) + 1000 (repayment) = 1500
    assert Decimal(str(ledger_data["period"]["period_total_inflows"])) == Decimal("1500.00")
    # Outflows: 2000 (expense) + 3000 (qard) + 1500 (sadakah) = 6500
    assert Decimal(str(ledger_data["period"]["period_total_outflows"])) == Decimal("6500.00")
    # Opening (10000) + Inflow (1500) - Outflow (6500) = 5000
    assert Decimal("10000.00") + Decimal("1500.00") - Decimal("6500.00") == Decimal("5000.00")


def test_inter_group_transfer(client, auth_headers):
    unique_id = uuid.uuid4().hex[:6].upper()
    
    # 1. Create source and destination groups
    grp_a_resp = client.post("/api/v1/groups", json={
        "code": f"TGA{unique_id}",
        "name": f"Transfer Group Alpha {unique_id}",
        "description": "Source test group",
        "opening_balance": "10000.00",
        "status": "ACTIVE"
    }, headers=auth_headers)
    assert grp_a_resp.status_code == 200
    group_a_id = grp_a_resp.json()["id"]

    grp_b_resp = client.post("/api/v1/groups", json={
        "code": f"TGB{unique_id}",
        "name": f"Transfer Group Beta {unique_id}",
        "description": "Destination test group",
        "opening_balance": "5000.00",
        "status": "ACTIVE"
    }, headers=auth_headers)
    assert grp_b_resp.status_code == 200
    group_b_id = grp_b_resp.json()["id"]

    # 2. Reject self-transfer
    self_resp = client.post("/api/v1/groups/transfer", json={
        "source_group_id": group_a_id,
        "destination_group_id": group_a_id,
        "amount": "1000.00",
        "notes": "Invalid self-transfer"
    }, headers=auth_headers)
    assert self_resp.status_code == 400
    assert "must be different" in self_resp.json()["error"]["message"]

    # 3. Reject overdraft transfer
    overdraft_resp = client.post("/api/v1/groups/transfer", json={
        "source_group_id": group_a_id,
        "destination_group_id": group_b_id,
        "amount": "15000.00",
        "notes": "Exceeds balance"
    }, headers=auth_headers)
    assert overdraft_resp.status_code == 400
    assert "Insufficient funds" in overdraft_resp.json()["error"]["message"]

    # 4. Valid transfer of 3,000 from Group A to Group B
    valid_resp = client.post("/api/v1/groups/transfer", json={
        "source_group_id": group_a_id,
        "destination_group_id": group_b_id,
        "amount": "3000.00",
        "notes": "Inter-group loan allocation"
    }, headers=auth_headers)
    assert valid_resp.status_code == 200
    transfer_data = valid_resp.json()
    assert transfer_data["success"] is True
    assert Decimal(str(transfer_data["transfer_amount"])) == Decimal("3000.00")
    assert Decimal(str(transfer_data["source_group_new_balance"])) == Decimal("7000.00")
    assert Decimal(str(transfer_data["destination_group_new_balance"])) == Decimal("8000.00")
    assert transfer_data["outflow_transaction_number"].startswith("TXN-")
    assert transfer_data["inflow_transaction_number"].startswith("TXN-")

    # Verify updated balances
    check_a = client.get(f"/api/v1/groups/{group_a_id}", headers=auth_headers).json()
    assert Decimal(str(check_a["current_balance"])) == Decimal("7000.00")
    check_b = client.get(f"/api/v1/groups/{group_b_id}", headers=auth_headers).json()
    assert Decimal(str(check_b["current_balance"])) == Decimal("8000.00")

    # Verify ledger reconciliations
    ledger_a = client.get(f"/api/v1/ledgers/group/{group_a_id}", headers=auth_headers).json()
    assert Decimal(str(ledger_a["period"]["period_closing_balance"])) == Decimal("7000.00")
    assert Decimal(str(ledger_a["group"]["authoritative_current_balance"])) == Decimal("7000.00")

    ledger_b = client.get(f"/api/v1/ledgers/group/{group_b_id}", headers=auth_headers).json()
    assert Decimal(str(ledger_b["period"]["period_closing_balance"])) == Decimal("8000.00")
    assert Decimal(str(ledger_b["group"]["authoritative_current_balance"])) == Decimal("8000.00")


def test_reversal_domain_state_sync_and_ledger_reconciliation(client, auth_headers):
    unique_id = uuid.uuid4().hex[:6].upper()

    # 1. Create a dedicated Group
    grp_resp = client.post("/api/v1/groups", json={
        "code": f"TRE{unique_id}",
        "name": f"Reversal Test Group {unique_id}",
        "description": "Group for testing reversal state synchronization",
        "opening_balance": "20000.00",
        "status": "ACTIVE"
    }, headers=auth_headers)
    assert grp_resp.status_code == 200
    group_id = grp_resp.json()["id"]

    # 2. Create Member and record contribution
    mem_resp = client.post("/api/v1/members", json={
        "full_name": f"Anwar Hossain {unique_id}",
        "phone": f"+880 161{unique_id}",
        "monthly_contribution_amount": "800.00",
        "group_id": group_id,
        "status": "ACTIVE"
    }, headers=auth_headers)
    assert mem_resp.status_code == 200
    member_id = mem_resp.json()["id"]

    # Record paid contribution
    con_resp = client.post("/api/v1/contributions", json={
        "member_id": member_id,
        "contribution_month": "2026-04",
        "amount": "800.00",
        "payment_method": "BKASH"
    }, headers=auth_headers)
    assert con_resp.status_code == 200
    contrib_id = con_resp.json()["id"]
    con_txn_id = con_resp.json()["transaction_id"]
    assert con_resp.json()["status"] == "PAID"

    # Group balance should now be 20800
    grp_chk = client.get(f"/api/v1/groups/{group_id}", headers=auth_headers).json()
    assert Decimal(str(grp_chk["current_balance"])) == Decimal("20800.00")

    # Reverse contribution transaction
    rev_resp = client.post(f"/api/v1/transactions/{con_txn_id}/reverse", json={
        "reversal_reason": "Member paid wrong account by mistake"
    }, headers=auth_headers)
    assert rev_resp.status_code == 200

    # Verify: Group balance is restored to 20000
    grp_chk = client.get(f"/api/v1/groups/{group_id}", headers=auth_headers).json()
    assert Decimal(str(grp_chk["current_balance"])) == Decimal("20000.00")

    # Verify: Contribution status has reverted to DUE
    contrib_chk = client.get(f"/api/v1/contributions?group_id={group_id}", headers=auth_headers).json()
    our_contrib = next(c for c in contrib_chk["items"] if c["id"] == contrib_id)
    assert our_contrib["status"] == "DUE"
    assert our_contrib["payment_date"] is None

    # 3. Create Beneficiary and test Qard Hasan Repayment Reversal
    ben_resp = client.post("/api/v1/beneficiaries", json={
        "name": f"Shamsu Mia {unique_id}",
        "phone": f"+880 188{unique_id}",
        "address": "Aid Ward 3",
        "status": "ACTIVE"
    }, headers=auth_headers)
    beneficiary_id = ben_resp.json()["id"]

    # Disburse Qard Hasan of 5000
    qard_resp = client.post("/api/v1/qard-hasan", json={
        "group_id": group_id,
        "beneficiary_id": beneficiary_id,
        "principal_amount": "5000.00",
        "monthly_repayment_amount": "1000.00"
    }, headers=auth_headers)
    assert qard_resp.status_code == 200
    qard_id = qard_resp.json()["id"]

    # Balance drops to 15000
    grp_chk = client.get(f"/api/v1/groups/{group_id}", headers=auth_headers).json()
    assert Decimal(str(grp_chk["current_balance"])) == Decimal("15000.00")

    # Repay 2000
    repay_resp = client.post("/api/v1/qard-hasan/repayments", json={
        "qard_hasan_id": qard_id,
        "amount": "2000.00",
        "payment_method": "CASH"
    }, headers=auth_headers)
    assert repay_resp.status_code == 200
    repay_txn_id = repay_resp.json()["transaction_id"]

    # Check loan state: outstanding 3000, total_repaid 2000
    qard_chk = client.get(f"/api/v1/qard-hasan/{qard_id}", headers=auth_headers).json()
    assert Decimal(str(qard_chk["outstanding_amount"])) == Decimal("3000.00")
    assert Decimal(str(qard_chk["total_repaid"])) == Decimal("2000.00")

    # Reverse repayment transaction
    rev_rep_resp = client.post(f"/api/v1/transactions/{repay_txn_id}/reverse", json={
        "reversal_reason": "Duplicate bank receipt entered"
    }, headers=auth_headers)
    assert rev_rep_resp.status_code == 200

    # Verify: Outstanding loan restored to 5000, total_repaid restored to 0!
    qard_chk2 = client.get(f"/api/v1/qard-hasan/{qard_id}", headers=auth_headers).json()
    assert Decimal(str(qard_chk2["outstanding_amount"])) == Decimal("5000.00")
    assert Decimal(str(qard_chk2["total_repaid"])) == Decimal("0.00")
    assert qard_chk2["status"] == "ACTIVE"

    # Verify: Group balance is restored back to 15000
    grp_chk = client.get(f"/api/v1/groups/{group_id}", headers=auth_headers).json()
    assert Decimal(str(grp_chk["current_balance"])) == Decimal("15000.00")

    # 4. Final verification: Group ledger reconciles accurately despite reversals
    ledger_chk = client.get(f"/api/v1/ledgers/group/{group_id}", headers=auth_headers).json()
    assert Decimal(str(ledger_chk["group"]["authoritative_current_balance"])) == Decimal("15000.00")
    assert Decimal(str(ledger_chk["period"]["period_closing_balance"])) == Decimal("15000.00")

