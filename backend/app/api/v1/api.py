from fastapi import APIRouter
from backend.app.api.v1.endpoints import (
    auth,
    users,
    roles,
    groups,
    members,
    member_applications,
    contributions,
    expense_categories,
    expenses,
    donors,
    donations,
    beneficiaries,
    qard_hasan,
    sadakah,
    transactions,
    ledgers,
    dashboard,
    reports,
    organization,
    public_content,
    audit_logs,
    monthly_contribution_settings,
    system_settings
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(roles.router, prefix="/roles", tags=["roles"])
api_router.include_router(groups.router, prefix="/groups", tags=["groups"])
api_router.include_router(members.router, prefix="/members", tags=["members"])
api_router.include_router(member_applications.router, prefix="/member-applications", tags=["member-applications"])
api_router.include_router(contributions.router, prefix="/contributions", tags=["contributions"])
api_router.include_router(expense_categories.router, prefix="/expense-categories", tags=["expense-categories"])
api_router.include_router(expenses.router, prefix="/expenses", tags=["expenses"])
api_router.include_router(donors.router, prefix="/donors", tags=["donors"])
api_router.include_router(donations.router, prefix="/donations", tags=["donations"])
api_router.include_router(beneficiaries.router, prefix="/beneficiaries", tags=["beneficiaries"])
api_router.include_router(qard_hasan.router, prefix="/qard-hasan", tags=["qard-hasan"])
api_router.include_router(sadakah.router, prefix="/sadakah", tags=["sadakah"])
api_router.include_router(sadakah.router, prefix="/sadaqah", tags=["sadaqah"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
api_router.include_router(ledgers.router, prefix="/ledgers", tags=["ledgers"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(organization.router, prefix="/organization", tags=["organization"])
api_router.include_router(public_content.router, prefix="/public", tags=["public"])
api_router.include_router(audit_logs.router, prefix="/audit-logs", tags=["audit-logs"])
api_router.include_router(monthly_contribution_settings.router, prefix="/settings/monthly-contribution", tags=["settings"])
api_router.include_router(monthly_contribution_settings.router, prefix="/monthly-contribution-settings", tags=["settings"])
api_router.include_router(system_settings.router, prefix="/settings/system", tags=["settings"])
api_router.include_router(system_settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(system_settings.router, prefix="/system-settings", tags=["settings"])

