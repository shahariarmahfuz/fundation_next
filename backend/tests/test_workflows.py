import uuid
from decimal import Decimal
import pytest


def test_member_application_workflow(client, auth_headers):
    unique_id = uuid.uuid4().hex[:6].upper()
    
    # 1. Public visitor submits application (no auth header needed)
    app_payload = {
        "applicant_name": f"Hasan Ali {unique_id}",
        "email": f"hasan_{unique_id}@example.com",
        "phone": f"+880 191{unique_id}",
        "address": "Gulshan, Dhaka",
        "proposed_contribution": "1000.00",
        "reason_for_joining": "I want to support interest-free social welfare."
    }
    submit_resp = client.post("/api/v1/member-applications", json=app_payload)
    assert submit_resp.status_code == 200
    app_data = submit_resp.json()
    assert app_data["status"] == "PENDING"
    app_id = app_data["id"]

    # 2. Management reviews: Attempt approve without group -> fails
    invalid_review = {
        "action": "APPROVE",
        "review_notes": "Looks good"
    }
    rev_fail = client.post(f"/api/v1/member-applications/{app_id}/review", json=invalid_review, headers=auth_headers)
    assert rev_fail.status_code == 400
    assert "Assigned group is required" in rev_fail.json()["error"]["message"]

    # 3. Management reviews with valid group assignment (e.g. Group 1: General Group)
    groups = client.get("/api/v1/groups", headers=auth_headers).json()
    general_group = groups[0]

    valid_review = {
        "action": "APPROVE",
        "assigned_group_id": general_group["id"],
        "review_notes": "Application verified and approved."
    }
    approve_resp = client.post(f"/api/v1/member-applications/{app_id}/review", json=valid_review, headers=auth_headers)
    assert approve_resp.status_code == 200
    approved_data = approve_resp.json()
    assert approved_data["status"] == "APPROVED"
    assert approved_data["created_member_id"] is not None

    # Verify newly created member exists and belongs to the assigned group
    new_mem_id = approved_data["created_member_id"]
    mem_resp = client.get(f"/api/v1/members/{new_mem_id}", headers=auth_headers)
    assert mem_resp.status_code == 200
    new_member = mem_resp.json()
    assert new_member["full_name"] == app_payload["applicant_name"]
    assert new_member["group_id"] == general_group["id"]
    assert Decimal(str(new_member["monthly_contribution_amount"])) == Decimal("1000.00")


def test_donation_and_transaction_reversal(client, auth_headers):
    unique_id = uuid.uuid4().hex[:6].upper()

    # 1. Create a donor
    donor_payload = {
        "name": f"Haji Abdul {unique_id}",
        "phone": f"+880 151{unique_id}",
        "email": f"haji_{unique_id}@example.com",
        "status": "ACTIVE"
    }
    donor_resp = client.post("/api/v1/donors", json=donor_payload, headers=auth_headers)
    assert donor_resp.status_code == 200
    donor_id = donor_resp.json()["id"]

    # 2. Get Education Group
    groups = client.get("/api/v1/groups", headers=auth_headers).json()
    edu_group = next(g for g in groups if g["code"] == "EDU")
    initial_balance = Decimal(str(edu_group["current_balance"]))

    # 3. Record Donation of ৳5,000 to Education Group
    donation_payload = {
        "donor_id": donor_id,
        "group_id": edu_group["id"],
        "amount": "5000.00",
        "payment_method": "BANK_TRANSFER",
        "reference": "BANK-DEP-9988"
    }
    don_resp = client.post("/api/v1/donations", json=donation_payload, headers=auth_headers)
    assert don_resp.status_code == 200
    don_data = don_resp.json()
    txn_id = don_data["transaction_id"]

    # Verify Education Group balance increased by 5000
    edu_check = client.get(f"/api/v1/groups/{edu_group['id']}", headers=auth_headers).json()
    assert Decimal(str(edu_check["current_balance"])) == initial_balance + Decimal("5000.00")

    # 4. Reverse this transaction
    reversal_payload = {
        "reversal_reason": "Mistaken duplicate deposit entry"
    }
    rev_resp = client.post(f"/api/v1/transactions/{txn_id}/reverse", json=reversal_payload, headers=auth_headers)
    assert rev_resp.status_code == 200
    assert rev_resp.json()["transaction_type"] == "REVERSAL"
    assert rev_resp.json()["flow_type"] == "OUTFLOW"

    # Verify Education Group balance is restored back to initial_balance
    edu_check_after = client.get(f"/api/v1/groups/{edu_group['id']}", headers=auth_headers).json()
    assert Decimal(str(edu_check_after["current_balance"])) == initial_balance


def test_dashboard_and_reports(client, auth_headers):
    # Dashboard check
    dash_resp = client.get("/api/v1/dashboard", headers=auth_headers)
    assert dash_resp.status_code == 200
    dash_data = dash_resp.json()
    assert "total_members" in dash_data
    assert "total_foundation_balance" in dash_data
    assert len(dash_data["groups"]) > 0

    # Financial report check
    rep_resp = client.get("/api/v1/reports/financial", headers=auth_headers)
    assert rep_resp.status_code == 200
    rep_data = rep_resp.json()
    assert "total_inflow" in rep_data
    assert "total_outflow" in rep_data
    assert "net_change" in rep_data

    # Group balances report check
    grp_rep = client.get("/api/v1/reports/group-balances", headers=auth_headers)
    assert grp_rep.status_code == 200
    assert "groups" in grp_rep.json()
