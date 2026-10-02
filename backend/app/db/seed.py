from decimal import Decimal
from sqlalchemy.orm import Session

from backend.app.core.database import SessionLocal
from backend.app.core.security import get_password_hash
from backend.app.models.role import Role, Permission
from backend.app.models.user import User
from backend.app.models.group import Group
from backend.app.models.expense import ExpenseCategory
from backend.app.models.organization import Organization, PublicPage


def seed_database(db: Session):
    # 1. Seed Permissions
    permissions_data = [
        # Members
        ("members.view", "View Members", "members", "Can view member list and profile"),
        ("members.create", "Create Member", "members", "Can register new members"),
        ("members.update", "Update Member", "members", "Can update member details"),
        ("members.delete", "Delete Member", "members", "Can remove or deactivate members"),
        
        # Groups
        ("groups.view", "View Groups", "groups", "Can view financial groups and balances"),
        ("groups.create", "Create Group", "groups", "Can create accounting groups"),
        ("groups.update", "Update Group", "groups", "Can update group info"),
        ("groups.delete", "Delete Group", "groups", "Can archive or delete groups"),

        # Contributions
        ("contributions.view", "View Contributions", "contributions", "Can view monthly contributions"),
        ("contributions.create", "Record Contribution", "contributions", "Can record member contribution payments"),
        ("contributions.update", "Update Contribution", "contributions", "Can edit contribution details"),

        # Expenses
        ("expenses.view", "View Expenses", "expenses", "Can view expenses and categories"),
        ("expenses.create", "Record Expense", "expenses", "Can disburse and record expenses"),
        ("expenses.update", "Update Expense", "expenses", "Can update expense details"),

        # Donors & Donations
        ("donors.view", "View Donors", "donors", "Can view donor records"),
        ("donors.create", "Create Donor", "donors", "Can add new donors"),
        ("donations.view", "View Donations", "donations", "Can view donation records"),
        ("donations.create", "Record Donation", "donations", "Can record incoming donations"),

        # Beneficiaries
        ("beneficiaries.view", "View Beneficiaries", "beneficiaries", "Can view beneficiary profiles"),
        ("beneficiaries.create", "Create Beneficiary", "beneficiaries", "Can register new beneficiaries"),
        ("beneficiaries.update", "Update Beneficiary", "beneficiaries", "Can update beneficiary profiles"),
        ("beneficiaries.delete", "Delete Beneficiary", "beneficiaries", "Can archive or delete beneficiaries"),

        # Qard Hasan
        ("qard_hasan.view", "View Qard Hasan", "qard_hasan", "Can view loan ledgers and statuses"),
        ("qard_hasan.create", "Disburse Qard Hasan", "qard_hasan", "Can disburse interest-free loans"),
        ("qard_hasan.repayment", "Record Qard Repayment", "qard_hasan", "Can record loan repayments"),

        # Sadakah
        ("sadakah.view", "View Sadakah", "sadakah", "Can view sadakah grants"),
        ("sadakah.create", "Disburse Sadakah", "sadakah", "Can record non-repayable sadakah aid"),

        # Accounting / Ledgers / Transactions
        ("transactions.view", "View Transactions", "transactions", "Can view financial journal transactions"),
        ("transactions.reverse", "Reverse Transaction", "transactions", "Can reverse financial transactions"),
        ("ledgers.view", "View Group Ledgers", "ledgers", "Can view complete group accounting ledgers"),

        # Reports & Dashboard
        ("reports.view", "View Reports", "reports", "Can view financial and member analytics"),
        ("dashboard.view", "View Dashboard", "dashboard", "Can view executive dashboard"),

        # Management
        ("users.manage", "Manage Users", "users", "Can manage system users"),
        ("roles.manage", "Manage Roles", "roles", "Can manage roles and permissions"),
        ("settings.manage", "Manage Settings", "settings", "Can manage organization settings and CMS"),
        ("audit.view", "View Audit Logs", "audit", "Can view historical audit trails"),
    ]

    code_to_perm = {}
    for code, name, module, desc in permissions_data:
        perm = db.query(Permission).filter(Permission.code == code).first()
        if not perm:
            perm = Permission(code=code, name=name, module=module, description=desc)
            db.add(perm)
            db.flush()
        code_to_perm[code] = perm

    # 2. Seed Roles
    roles_def = {
        "Super Admin": {
            "desc": "Full access to all foundation modules and financial operations",
            "is_system": True,
            "perms": list(code_to_perm.values())
        },
        "Admin": {
            "desc": "Administrative access to members, finances, and reporting",
            "is_system": True,
            "perms": [p for code, p in code_to_perm.items() if code not in ("transactions.reverse",)]
        },
        "Accountant": {
            "desc": "Handles financial transactions, contributions, expenses, and accounting ledgers",
            "is_system": True,
            "perms": [
                p for code, p in code_to_perm.items()
                if p.module in ("contributions", "expenses", "donations", "donors", "qard_hasan", "sadakah", "transactions", "ledgers", "reports", "dashboard", "groups", "beneficiaries")
                and code not in ("transactions.reverse",)
            ]
        },
        "Manager": {
            "desc": "Manages members, applications, approvals, and general operations",
            "is_system": True,
            "perms": [
                p for code, p in code_to_perm.items()
                if p.module in ("members", "groups", "beneficiaries", "reports", "dashboard")
            ]
        },
        "Staff": {
            "desc": "View only and basic record entry access",
            "is_system": True,
            "perms": [
                p for code, p in code_to_perm.items()
                if code.endswith(".view")
            ]
        }
    }

    role_objs = {}
    for r_name, r_data in roles_def.items():
        role = db.query(Role).filter(Role.name == r_name).first()
        if not role:
            role = Role(name=r_name, description=r_data["desc"], is_system=r_data["is_system"])
            role.permissions = r_data["perms"]
            db.add(role)
            db.flush()
        else:
            # ensure permissions are up to date
            role.permissions = r_data["perms"]
        role_objs[r_name] = role

    # 3. Seed Super Admin User
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        admin_user = User(
            username="admin",
            email="admin@foundation.org",
            full_name="Foundation Super Administrator",
            hashed_password=get_password_hash("AdminPassword123!"),
            role_id=role_objs["Super Admin"].id,
            is_active=True,
            is_superuser=True
        )
        db.add(admin_user)
        db.flush()

    # 4. Seed Accounting Groups
    default_groups = [
        ("GEN", "General Group", "Primary foundation fund for operational and general community welfare", Decimal("50000.00")),
        ("EDU", "Education Group", "Fund dedicated to scholarships, student support, and school supplies", Decimal("25000.00")),
        ("MED", "Medical Group", "Fund dedicated to patient treatment, medicines, and medical relief", Decimal("30000.00")),
        ("EMG", "Emergency Relief Group", "Emergency crisis, disaster response, and winter clothing aid", Decimal("40000.00")),
    ]

    for code, name, desc, open_bal in default_groups:
        grp = db.query(Group).filter(Group.code == code).first()
        if not grp:
            grp = Group(code=code, name=name, description=desc, opening_balance=open_bal, status="ACTIVE")
            db.add(grp)
            db.flush()

    # 5. Seed Expense Categories
    default_categories = [
        ("Medicine & Healthcare", "Prescriptions, clinical tests, and medical supplies"),
        ("Educational Aid", "Tuition, textbooks, exam fees, and stationery"),
        ("Food & Ration Distribution", "Staple food baskets and nutrition packages"),
        ("Emergency Assistance", "Disaster relief, house fire recovery, urgent aid"),
        ("Office Operations", "Printing, utilities, office equipment, communications"),
        ("Logistics & Transport", "Travel, goods transportation, distribution events"),
        ("Maintenance & Repairs", "Facility upkeep and equipment repairs"),
        ("Other Expenses", "Miscellaneous operational and program expenses"),
    ]

    for cat_name, cat_desc in default_categories:
        cat = db.query(ExpenseCategory).filter(ExpenseCategory.name == cat_name).first()
        if not cat:
            cat = ExpenseCategory(name=cat_name, description=cat_desc, is_active=True)
            db.add(cat)
            db.flush()

    # 6. Seed Organization Settings
    org = db.query(Organization).first()
    if not org:
        org = Organization(
            name="Al-Birr Foundation",
            tagline="Empowering Communities Through Islamic Finance, Qard Hasan & Charity",
            description="Al-Birr Foundation is dedicated to poverty alleviation, interest-free micro-financing, and community empowerment through organized member contributions and transparent group-based accounting.",
            address="Level 4, House 12, Road 7, Dhanmondi, Dhaka 1205, Bangladesh",
            phone="+880 1711-000000",
            email="info@albirrfoundation.org",
            website="https://albirrfoundation.org",
            currency_symbol="৳",
            currency_code="BDT",
            social_links={
                "facebook": "https://facebook.com/albirrfoundation",
                "twitter": "https://twitter.com/albirr_fdn",
                "linkedin": "https://linkedin.com/company/albirr-foundation",
                "youtube": "https://youtube.com/@albirrfoundation"
            }
        )
        db.add(org)
        db.flush()

    # 7. Seed Public Pages CMS
    pages = [
        (
            "home",
            "Welcome to Al-Birr Foundation",
            "Transparent, Group-Based Islamic Community Development & Qard Hasan",
            "### Empowering Lives with Dignity\n\nAl-Birr Foundation brings together conscious citizens to pool resources through structured monthly contributions, interest-free Qard Hasan loans, and targeted Sadakah assistance.\n\n- **100% Shariah Compliant**: Strictly zero interest on all micro-loans.\n- **Transparent Accounting**: Every Taka is tracked per financial group.\n- **Direct Impact**: Transforming education, healthcare, and livelihood.",
            None,
            "Al-Birr Foundation — Community Welfare & Qard Hasan",
            "Official portal of Al-Birr Foundation, facilitating transparent charity and interest-free loans."
        ),
        (
            "about",
            "About Our Foundation",
            "A movement founded on collective responsibility and transparent stewardship",
            "### Who We Are\n\nEstablished with the mission to eliminate poverty and usurious lending in our communities, Al-Birr Foundation operates on a unique Group-based accounting model. Every member belongs to an accounting group whose funds are audited and utilized for high-impact social programs.\n\nOur governing board consists of community elders, Islamic finance scholars, and experienced accounting professionals who ensure absolute fiduciary integrity.",
            None,
            "About Us — Al-Birr Foundation",
            "Learn about the history, structure, and leadership of Al-Birr Foundation."
        ),
        (
            "goals",
            "Our Strategic Goals",
            "Sustainable socio-economic development through mutual assistance",
            "### What We Aim to Achieve\n\n1. **Zero Exploitation**: Provide accessible, interest-free micro-credit (Qard Hasan) to small entrepreneurs and families in acute need.\n2. **Quality Education**: Ensure no deserving student drops out due to lack of tuition or study materials.\n3. **Emergency Medical Safety Net**: Support low-income families faced with catastrophic healthcare expenses.\n4. **Self-Sustaining Communities**: Foster a culture of regular monthly giving where recipients transition into active contributors.",
            None,
            "Strategic Goals — Al-Birr Foundation",
            "Discover the strategic roadmap and objectives of Al-Birr Foundation."
        ),
        (
            "mission",
            "Our Vision & Mission",
            "Guided by faith, driven by compassion, governed by transparency",
            "### Mission Statement\n\nTo build a cohesive, dignified society where financial vulnerability is met with immediate brotherhood, ethical Islamic finance, and structured mutual aid.\n\n### Core Values\n- **Amanah (Trust & Accountability)**: Rigorous ledger transparency for all funds.\n- **Ihsan (Excellence)**: Serving beneficiaries with utmost respect and empathy.\n- **Adl (Justice)**: Fair, zero-interest terms for every individual in need.",
            None,
            "Mission & Values — Al-Birr Foundation",
            "Read our mission statement and foundational values."
        ),
        (
            "activities",
            "Our Ongoing Activities",
            "Fieldwork and social programs across Bangladesh",
            "### Our Key Programs\n\n- **Qard Hasan Micro-Enterprise Program**: Seed capital for rickshaw pullers, small grocery owners, and home artisans, repaid interest-free in manageable monthly installments.\n- **Healthcare Relief Fund**: Providing free medicines, hospital admission assistance, and surgical support.\n- **Student Scholarship Scheme**: Monthly stipends for bright students from impoverished backgrounds.\n- **Winter Aid & Emergency Relief**: Distributing food packs and blankets during flash floods, cold waves, and emergencies.",
            None,
            "Our Activities & Programs — Al-Birr Foundation",
            "Explore our social development projects and community aid activities."
        ),
        (
            "contact",
            "Contact & Support",
            "We are here to answer your questions and welcome your partnership",
            "### Get In Touch\n\n**Office Address**:\nLevel 4, House 12, Road 7, Dhanmondi, Dhaka 1205, Bangladesh\n\n**Phone**:\n+880 1711-000000 / +880 2-9876543\n\n**Email**:\ninfo@albirrfoundation.org / support@albirrfoundation.org\n\n**Visiting Hours**:\nSaturday to Thursday, 9:00 AM – 5:00 PM",
            None,
            "Contact Us — Al-Birr Foundation",
            "Get in touch with the team at Al-Birr Foundation."
        ),
    ]

    for slug, title, subtitle, content, banner, meta_t, meta_d in pages:
        p = db.query(PublicPage).filter(PublicPage.slug == slug).first()
        if not p:
            p = PublicPage(
                slug=slug,
                title=title,
                subtitle=subtitle,
                content=content,
                banner_image_url=banner,
                is_published=True,
                meta_title=meta_t,
                meta_description=meta_d
            )
            db.add(p)
            db.flush()

    db.commit()
    print("Database seeding completed successfully.")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
